import { useEffect, useState } from 'react'
import { sceneCueManifests } from '../sceneCues'
import { coverAssets, sceneAssets, type SceneAsset } from '../sceneAssets'

const CRITICAL_SCENE_COUNT = 3
const CRITICAL_PROGRESS_LIMIT = 95
const LOAD_TIMEOUT = 12_000
const COMPLETION_DURATION = 800
const FONT_TASK_KEY = 'font:FZ Da Biao Song'
const FONT_URL = `${import.meta.env.BASE_URL}assets/fonts/FZDaBiaoSong-subset.woff2`

export type AssetPreloadStatus = 'loading' | 'complete' | 'degraded'

type AssetLoadResult = {
  key: string
  url: string
  ok: boolean
}

type AssetTask = {
  key: string
  url: string
  promise: Promise<AssetLoadResult>
}

const preloadRegistry = new Map<string, Promise<AssetLoadResult>>()

function unique<T>(values: readonly T[]) {
  return [...new Set(values)]
}

function sceneImageUrls(scene: SceneAsset) {
  return [
    scene.background,
    scene.foreground,
    ...(
      scene.states?.flatMap((state) => [state.background, state.foreground])
      ?? []
    ),
  ].filter((url): url is string => Boolean(url))
}

export const criticalImageUrls = unique([
  coverAssets.foreground,
  coverAssets.title,
  ...sceneAssets
    .slice(0, CRITICAL_SCENE_COUNT)
    .flatMap(sceneImageUrls),
  ...sceneCueManifests
    .slice(0, CRITICAL_SCENE_COUNT)
    .flatMap((manifest) => manifest.cues)
    .filter((cue) => cue.kind !== 'source')
    .map((cue) => cue.svgAsset ?? cue.asset),
])

function preloadImageOnce(url: string) {
  const key = `image:${url}`
  const existingTask = preloadRegistry.get(key)
  if (existingTask) return existingTask

  const task = new Promise<AssetLoadResult>((resolve) => {
    const image = new Image()
    let settled = false

    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      image.onload = null
      image.onerror = null
      resolve({ key, url, ok })
    }

    image.onload = () => {
      if (typeof image.decode !== 'function') {
        finish(true)
        return
      }

      void image.decode().then(
        () => finish(true),
        () => finish(false),
      )
    }
    image.onerror = () => finish(false)
    image.src = url
  })

  preloadRegistry.set(key, task)
  return task
}

function preloadFontOnce() {
  const existingTask = preloadRegistry.get(FONT_TASK_KEY)
  if (existingTask) return existingTask

  const task = (async (): Promise<AssetLoadResult> => {
    try {
      if (document.fonts) {
        const loadedFonts = await document.fonts.load(
          '16px "FZ Da Biao Song"',
          '城市记忆',
        )
        return {
          key: FONT_TASK_KEY,
          url: FONT_URL,
          ok: loadedFonts.length > 0,
        }
      }

      const response = await fetch(FONT_URL)
      if (!response.ok) throw new Error(`Font request failed: ${response.status}`)
      await response.arrayBuffer()
      return { key: FONT_TASK_KEY, url: FONT_URL, ok: true }
    } catch {
      return { key: FONT_TASK_KEY, url: FONT_URL, ok: false }
    }
  })()

  preloadRegistry.set(FONT_TASK_KEY, task)
  return task
}

function createCriticalTasks(): AssetTask[] {
  return [
    ...criticalImageUrls.map((url) => {
      const key = `image:${url}`
      return { key, url, promise: preloadImageOnce(url) }
    }),
    {
      key: FONT_TASK_KEY,
      url: FONT_URL,
      promise: preloadFontOnce(),
    },
  ]
}

const easeOutQuart = (value: number) => 1 - (1 - value) ** 4

export function useAssetPreloader(enabled = true) {
  const [progress, setProgress] = useState(enabled ? 0 : 100)
  const [status, setStatus] = useState<AssetPreloadStatus>(
    enabled ? 'loading' : 'complete',
  )
  const [failedAssets, setFailedAssets] = useState<string[]>([])

  useEffect(() => {
    if (!enabled) return

    const tasks = createCriticalTasks()
    const settledTaskKeys = new Set<string>()
    const failedTaskUrls = new Set<string>()
    let active = true
    let terminal = false
    let animationFrame = 0
    let previousFrameTime: number | null = null
    let renderedProgress = 0
    let targetProgress = 0
    let completionStartedAt: number | null = null
    let completionStartedFrom = 0

    const finishLoading = () => {
      if (terminal) return
      terminal = true
      completionStartedAt = null
      completionStartedFrom = renderedProgress
      setFailedAssets([...failedTaskUrls])
      setStatus(failedTaskUrls.size > 0 ? 'degraded' : 'complete')
    }

    const settleTask = (result: AssetLoadResult) => {
      if (!active || terminal || settledTaskKeys.has(result.key)) return

      settledTaskKeys.add(result.key)
      if (!result.ok) failedTaskUrls.add(result.url)

      targetProgress = (
        settledTaskKeys.size / tasks.length
      ) * CRITICAL_PROGRESS_LIMIT

      if (settledTaskKeys.size === tasks.length) finishLoading()
    }

    for (const task of tasks) {
      void task.promise.then(settleTask)
    }

    const timeout = window.setTimeout(() => {
      if (!active || terminal) return

      for (const task of tasks) {
        if (settledTaskKeys.has(task.key)) continue
        settledTaskKeys.add(task.key)
        failedTaskUrls.add(task.url)
      }

      targetProgress = CRITICAL_PROGRESS_LIMIT
      finishLoading()
    }, LOAD_TIMEOUT)

    const tick = (now: number) => {
      if (!active) return

      const elapsed = previousFrameTime === null
        ? 0
        : Math.min(100, now - previousFrameTime)
      previousFrameTime = now

      if (terminal) {
        if (completionStartedAt === null) {
          completionStartedAt = now
          completionStartedFrom = renderedProgress
        }

        const completionProgress = Math.min(
          1,
          (now - completionStartedAt) / COMPLETION_DURATION,
        )
        renderedProgress = completionStartedFrom
          + (100 - completionStartedFrom) * easeOutQuart(completionProgress)
      } else if (renderedProgress < targetProgress) {
        const chaseRatio = Math.min(1, elapsed / 180)
        renderedProgress += (targetProgress - renderedProgress) * chaseRatio
      }

      if (terminal && renderedProgress >= 99.99) {
        renderedProgress = 100
        setProgress(100)
        window.clearTimeout(timeout)
        return
      }

      setProgress(renderedProgress)
      animationFrame = window.requestAnimationFrame(tick)
    }

    animationFrame = window.requestAnimationFrame(tick)

    return () => {
      active = false
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timeout)
    }
  }, [enabled])

  return { progress, status, failedAssets }
}
