import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  chronicleScenes,
  type ChronicleScene,
  type NarrativeTrack,
} from '../chronicleScenes'
import {
  readCoverMotionConfig,
  type CoverMotionConfig,
} from '../coverMotion'
import { normalizeCueValue, sceneCueManifests, type SceneCue } from '../sceneCues'
import { readScene4Mask, type Scene4Mask } from '../scene4Mask'
import { ChronicleBoat } from './ChronicleBoat'
import { ChronicleCover } from './ChronicleCover'
import { CoverMotionDebugPanel } from './CoverMotionDebugPanel'

gsap.registerPlugin(ScrollTrigger)

const ACTIVE_ASSET_RADIUS = 3
const DELAYED_CUE_REVEAL_CAMERA_RATIO = 0.36
const SCROLL_DISTANCE_PER_TIMELINE_SECOND = 1.05
// Positive values delay the note layer relative to its chart; negative values advance it.
const BOTTOM_NOTE_LIFECYCLE_OFFSET_SECONDS = 0.5
const BOTTOM_NOTE_TRANSITION_DURATION_SECONDS = 0.32
const MAX_CHART_ANIMATION_LAYERS = 24
const LAYER_ANIMATED_CHART_IDS = new Set([
  's02-chart',
  's11-chart',
  's13-chart',
  's14-chart',
  's16-chart',
])
const RAIN_SCENE_ID = 7
const CROSSFADE_SCENE_ID = 7
const DELAYED_FOREGROUND_SCENE_ID = 3
const DELAYED_FOREGROUND_REVEAL_CAMERA_PROGRESS = 0.52
const DELAYED_FOREGROUND_REVEAL_DURATION = 0.28
const BOAT_HIDDEN_SCENE_ID = 16
const WINDOW_SCENE_CAMERA_END_PROGRESS = 0.3
const IMMEDIATE_EXTERIOR_SCENE_ID = 17
const IMMEDIATE_EXTERIOR_PREPARE_LEAD_SECONDS = 0.03
const ENDING_ENTRY_DURATION = 0.72
const ENDING_START_HOLD_DURATION = 0.42
const ENDING_SCROLL_DURATION = 3.4
const ENDING_END_HOLD_DURATION = 0.72
const RAIN_DROP_COUNT = 84
const STRONG_BOAT_BOB_SCENE_INDEX = 6
const BOAT_BOB_ROTATION = 4.5
const BOAT_BOB_Y = -9
const STRONG_BOAT_BOB_MULTIPLIER = 1.65
const BOAT_Y_PERCENT = 80
const ELEVATED_BOAT_START_SCENE_ID = 17
const ELEVATED_BOAT_Y_PERCENT = 70
const BLACKBOARD_SCENE_INDEX = 3
const HOSPITAL_SCENE_INDEX = 4

type TrackSurfaceKind = 'background' | 'foreground' | 'content'

type SceneSlotProps = {
  scene: ChronicleScene
  index: number
  layer: 'background' | 'foreground'
  activeScene: number
}

function ChronicleRain() {
  return (
    <div className="chronicle-rain" data-rain aria-hidden="true">
      {Array.from({ length: RAIN_DROP_COUNT }, (_, index) => {
        const style = {
          left: `${(index * 37 + 11) % 104 - 2}%`,
          top: `${(index * 53 + 7) % 118 - 18}%`,
          '--rain-duration': `${0.48 + (index % 7) * 0.06}s`,
          '--rain-delay': `${-((index * 0.137) % 1.1)}s`,
          '--rain-length': `${28 + (index % 8) * 6}px`,
          '--rain-opacity': `${0.45 + (index % 5) * 0.09}`,
        } as CSSProperties

        return <i className="chronicle-rain__drop" style={style} key={index} />
      })}
    </div>
  )
}

function ChronicleEnding() {
  return (
    <section
      className="chronicle-ending"
      data-ending-layer
      aria-labelledby="chronicle-ending-title"
    >
      <div className="chronicle-ending__panel">
        <h2 id="chronicle-ending-title">结语：</h2>
        <div className="chronicle-ending__mask" data-ending-mask>
          <div className="chronicle-ending__copy" data-ending-copy>
            <p>时代改变了赵大春。而千千万万个像赵大春一样的普通人，共同书写了中国发展的历史。</p>
            <p>赵大春的一生，就像是在时代长河中不断航行的一叶小舟。百年来，风雨同舟，家国天下。</p>
            <p>
              他出生于军人家庭，先后经历抗日战争、解放战争与抗美援朝，身体里至今仍留有战争的弹片。他曾在饥荒与误诊中漂浮，在婚姻与生活的选择中挣扎，也曾在时代转折的浪潮中经历停滞与重启。
            </p>
            <p>
              在来信中，他写道：“一个革命者，越是在惊涛骇浪中，越是需要钢铁意志，越是需要以一颗热忱、善良、道德的心待人。”
            </p>
            <p>
              作为一名几十年的老党员，面对时代洪流中个人有限的选择，他始终保持着面向人民的立场——在顺境与逆境之间维系责任，在个体命运与集体历史交汇的水域中，不失去人与人之间的连接。
            </p>
            <p>
              面对时代洪流，个人的自处始终与人民的需要相互缠绕。正如他回忆录的最后一句话：“我们共产党人为人民服务，就是需要一颗真心真情。”
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function SceneSlot({ scene, index, layer, activeScene }: SceneSlotProps) {
  const isNearViewport = Math.abs(index - activeScene) <= ACTIVE_ASSET_RADIUS
  const fallbackSource = layer === 'foreground' ? scene.foreground : scene.background
  const stateSources = scene.states
    ?.map((state) => ({ id: state.id, source: state[layer] }))
    .filter((state): state is { id: '00' | '01'; source: string } => Boolean(state.source))
  const sources = stateSources?.length
    ? stateSources
    : fallbackSource
      ? [{ id: undefined, source: fallbackSource }]
      : []

  return (
    <div
      className={`chronicle-track-slot chronicle-track-slot--${layer}`}
      data-layer={layer}
      data-scene={index}
      data-scene-kind={scene.kind}
      style={{ '--scene-ratio': scene.sourceWidth / 1620 } as CSSProperties}
    >
      {sources.map(({ id, source }) => (
        <img
          className={id ? 'chronicle-track-state' : undefined}
          src={isNearViewport ? source : undefined}
          data-src={source}
          data-state={id}
          alt=""
          draggable={false}
          decoding="async"
          key={id ?? source}
        />
      ))}
    </div>
  )
}

function getCueImageStyle(cue: SceneCue): CSSProperties | undefined {
  if (!cue.crop) return undefined

  return {
    position: 'absolute',
    left: `${(-cue.crop.x / cue.crop.width) * 100}%`,
    top: `${(-cue.crop.y / cue.crop.height) * 100}%`,
    width: `${(cue.crop.sourceWidth / cue.crop.width) * 100}%`,
    height: `${(cue.crop.sourceHeight / cue.crop.height) * 100}%`,
    maxWidth: 'none',
  }
}

function SceneContent({
  scene,
  index,
  activeScene,
  chartSvgMarkup,
}: {
  scene: ChronicleScene
  index: number
  activeScene: number
  chartSvgMarkup: Readonly<Record<string, string>>
}) {
  const manifest = sceneCueManifests[index]
  const isNearViewport = Math.abs(index - activeScene) <= ACTIVE_ASSET_RADIUS
  const logicalWidth = scene.sourceWidth / 2

  return (
    <div
      className="chronicle-track-slot chronicle-track-slot--content"
      data-layer="content"
      data-scene={index}
      style={{ '--scene-ratio': scene.sourceWidth / 1620 } as CSSProperties}
    >
      {manifest.cues.filter((item) => item.kind !== 'source').map((item) => {
        const x = normalizeCueValue(item.x, manifest.frameHeight)
        const y = normalizeCueValue(item.y, manifest.frameHeight)
        const width = normalizeCueValue(item.width, manifest.frameHeight)
        const height = normalizeCueValue(item.height, manifest.frameHeight)

        return (
          <div
            className={`chronicle-cue chronicle-cue--${item.kind} ${item.mode === 'initial' ? 'chronicle-cue--initial' : ''}`}
            data-cropped={item.crop ? '' : undefined}
            data-cue={item.id}
            data-cue-kind={item.kind}
            data-cue-mode={item.mode}
            data-figma-node={item.figmaNodeId}
            key={item.id}
            style={{
              left: `${(x / logicalWidth) * 100}%`,
              top: `${(y / 810) * 100}%`,
              width: `${(width / logicalWidth) * 100}%`,
              height: `${(height / 810) * 100}%`,
            }}
          >
            {item.svgAsset
              && LAYER_ANIMATED_CHART_IDS.has(item.id)
              && chartSvgMarkup[item.id] ? (
              <div
                className="chronicle-cue__svg"
                dangerouslySetInnerHTML={{ __html: chartSvgMarkup[item.id] }}
              />
            ) : item.svgAsset ? (
              <img src={item.svgAsset} alt="" draggable={false} />
            ) : item.id === 's08-copy' ? (
              <div className="chronicle-night-copy">
                <span>在这样的境遇下，消沉的赵大春回到了家乡。</span>
                <span>最终，他接受了父母之命、媒妁之言，</span>
                <span>与一位农村姑娘结了婚。</span>
              </div>
            ) : (
              <img
                src={isNearViewport ? item.asset : undefined}
                data-src={item.asset}
                alt=""
                draggable={false}
                decoding="async"
                style={getCueImageStyle(item)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TrackSurface({
  track,
  surface,
  activeScene,
  chartSvgMarkup,
}: {
  track: NarrativeTrack
  surface: TrackSurfaceKind
  activeScene: number
  chartSvgMarkup: Readonly<Record<string, string>>
}) {
  return (
    <div
      className={`chronicle-track-surface chronicle-track-surface--${track} chronicle-track-surface--${surface}`}
      data-track={track}
      data-surface={surface}
    >
      {chronicleScenes.map((scene, index) => {
        if (scene.track !== track) return null
        if (surface === 'content') {
          return (
            <SceneContent
              key={`${track}-content-${scene.id}`}
              scene={scene}
              index={index}
              activeScene={activeScene}
              chartSvgMarkup={chartSvgMarkup}
            />
          )
        }

        return (
          <SceneSlot
            key={`${track}-${surface}-${scene.id}`}
            scene={scene}
            index={index}
            layer={surface}
            activeScene={activeScene}
          />
        )
      })}
    </div>
  )
}

function getTrackSurfaces(root: HTMLElement, track: NarrativeTrack) {
  return gsap.utils.toArray<HTMLElement>(
    `.chronicle-track-surface[data-track="${track}"]`,
    root,
  )
}

function getTrackX(
  root: HTMLElement,
  viewport: HTMLElement,
  sceneIndex: number,
  progress: number,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot[data-scene="${sceneIndex}"]`,
  )
  if (!slot) return 0

  const overflow = Math.max(0, slot.offsetWidth - viewport.clientWidth)
  const centered = Math.max(0, (viewport.clientWidth - slot.offsetWidth) / 2)
  return -slot.offsetLeft + centered - overflow * progress
}

function getBlackboardHorizontalClip(
  root: HTMLElement,
  viewport: HTMLElement,
  progress: number,
  mask: Scene4Mask,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot[data-scene="${BLACKBOARD_SCENE_INDEX}"]`,
  )
  if (!slot || mask.points.length < 2) return 'none'

  const sourceXs = mask.points.map(({ x }) => x)
  const sourceLeft = Math.min(...sourceXs)
  const sourceRight = Math.max(...sourceXs)
  const sourceScale = slot.offsetWidth / mask.sourceWidth
  const trackX = getTrackX(root, viewport, BLACKBOARD_SCENE_INDEX, progress)
  const screenLeft = trackX + slot.offsetLeft + sourceLeft * sourceScale
  const screenRight = trackX + slot.offsetLeft + sourceRight * sourceScale
  const leftInset = Math.min(viewport.clientWidth, Math.max(0, screenLeft))
  const rightInset = Math.min(
    viewport.clientWidth,
    Math.max(0, viewport.clientWidth - screenRight),
  )

  return `inset(0px ${rightInset}px 0px ${leftInset}px)`
}

function getCueEntryProgress(
  root: HTMLElement,
  viewport: HTMLElement,
  sceneIndex: number,
  cues: HTMLElement[],
  viewportX: number,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot--content[data-scene="${sceneIndex}"]`,
  )
  if (!slot || !cues.length) return 0

  const overflow = Math.max(0, slot.offsetWidth - viewport.clientWidth)
  if (overflow === 0) return 0

  const firstCueX = Math.min(...cues.map((cue) => cue.offsetLeft))
  const triggerX = viewport.clientWidth * viewportX
  return Math.min(1, Math.max(0, (firstCueX - triggerX) / overflow))
}

function getCoverPrefaceX(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const target = viewport.clientWidth * 0.25
    - panorama.offsetWidth * motion.coverAnchorX
  const minimumX = Math.min(0, viewport.clientWidth - panorama.offsetWidth)
  return Math.min(0, Math.max(minimumX, target))
}

function getCoverWindowX(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const target = viewport.clientWidth * 0.25
    - panorama.offsetWidth * motion.windowAnchorX
  const minimumX = Math.min(0, viewport.clientWidth - panorama.offsetWidth)
  return Math.min(0, Math.max(minimumX, target))
}

function getCoverZoomEnd(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const windowX = getCoverWindowX(panorama, viewport, motion)
  const scale = 1 / motion.sceneMatchScale
  const { x: matchX, y: matchY } = getSceneMatchOffset(viewport, motion)
  const originX = scale * matchX / (scale - 1)
  const originY = scale * matchY / (scale - 1)

  return {
    scale,
    x: originX + scale * (windowX - originX),
    y: originY + scale * -originY,
  }
}

function getSceneMatchOffset(
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const safeWidth = Math.min(viewport.clientWidth, viewport.clientHeight * (16 / 9))
  return {
    x: safeWidth * (motion.sceneMatchX / 100),
    y: viewport.clientHeight * (motion.sceneMatchY / 100),
  }
}

function getSceneCues(root: HTMLElement, index: number) {
  return gsap.utils.toArray<HTMLElement>(
    `.chronicle-track-slot--content[data-scene="${index}"] .chronicle-cue[data-cue-mode="scroll"]`,
    root,
  )
}

function findSceneOnTrack(
  startIndex: number,
  track: NarrativeTrack,
  direction: 1 | -1 = 1,
) {
  for (
    let index = startIndex;
    index >= 0 && index < chronicleScenes.length;
    index += direction
  ) {
    if (chronicleScenes[index].track === track) return index
  }
  return null
}

function getBoatYPercent(sceneId: number) {
  return sceneId >= ELEVATED_BOAT_START_SCENE_ID
    ? ELEVATED_BOAT_Y_PERCENT
    : BOAT_Y_PERCENT
}

function addCueAnimations(
  timeline: gsap.core.Timeline,
  cues: HTMLElement[],
  sceneStart: number,
  revealDuration: number,
  reducedMotion: boolean,
) {
  if (!cues.length) return

  if (revealDuration <= 0) {
    timeline.set(cues, { autoAlpha: 1, y: 0 }, sceneStart)
    const chartLayers = cues.flatMap((cue) => (
      cue.dataset.cueKind === 'chart' ? getChartAnimationLayers(cue) : []
    ))
    timeline.set(chartLayers, { autoAlpha: 1, y: 0 }, sceneStart)
    return
  }

  timeline.set(cues, {
    autoAlpha: 0,
    y: reducedMotion ? 0 : 14,
  }, sceneStart)

  const ordered = [...cues].sort((a, b) => {
    const priority = { title: 0, copy: 1, chart: 2, illustration: 3 }
    return priority[a.dataset.cueKind as keyof typeof priority]
      - priority[b.dataset.cueKind as keyof typeof priority]
  })
  const step = ordered.length > 1 ? revealDuration * 0.48 / (ordered.length - 1) : 0
  const cueDuration = Math.max(0.06, revealDuration * 0.52)

  ordered.forEach((item, cueIndex) => {
    const at = sceneStart + cueIndex * step
    const kind = item.dataset.cueKind

    if (kind === 'illustration') {
      timeline.fromTo(item, {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 38,
        rotation: reducedMotion ? 0 : -2.4,
        scale: reducedMotion ? 1 : 0.94,
        transformOrigin: '22% 82%',
      }, {
        autoAlpha: 1,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: reducedMotion ? 0.06 : Math.max(0.24, cueDuration * 1.15),
        ease: reducedMotion ? 'none' : 'power3.out',
        immediateRender: false,
      }, at)
      return
    }

    if (kind === 'chart') {
      const layers = getChartAnimationLayers(item)

      if (!layers.length) {
        timeline.set(item, {
          autoAlpha: 1,
          y: 0,
        }, at)
        return
      }

      timeline.set(item, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        clipPath: 'none',
      }, at)

      if (reducedMotion || !layers.length) return

      const layerDuration = Math.max(0.08, cueDuration * 0.55)
      const stagger = layers.length > 1
        ? Math.max(0.008, (cueDuration - layerDuration) / (layers.length - 1))
        : 0
      timeline.fromTo(layers, {
        autoAlpha: 0,
        y: 12,
      }, {
        autoAlpha: 1,
        y: 0,
        duration: layerDuration,
        stagger,
        ease: 'power1.out',
        immediateRender: false,
      }, at)
      return
    }

    timeline.fromTo(
      item,
      {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 14,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: cueDuration,
        ease: reducedMotion ? 'none' : 'power2.out',
        immediateRender: false,
      },
      at,
    )
  })
}

function getChartAnimationLayers(cue: HTMLElement) {
  const svg = cue.querySelector<SVGSVGElement>('svg')
  if (!svg) return []

  const ignoredTags = new Set(['defs', 'mask', 'clippath', 'filter'])
  const visibleChildren = (element: Element) => Array.from(element.children).filter(
    (child) => !ignoredTags.has(child.tagName.toLowerCase()),
  )
  let root = visibleChildren(svg).find(
    (child): child is SVGGElement => child.tagName.toLowerCase() === 'g',
  )
  if (!root) return []

  while (visibleChildren(root).length === 1) {
    const onlyChild = visibleChildren(root)[0]
    if (onlyChild.tagName.toLowerCase() !== 'g') break
    root = onlyChild as SVGGElement
  }

  const primaryLayers = visibleChildren(root)
  const candidates = primaryLayers.flatMap((layer) => {
    const children = visibleChildren(layer)
    if (
      primaryLayers.length <= 3
      && layer.tagName.toLowerCase() === 'g'
      && children.length > 1
      && children.length <= 10
    ) {
      return children
    }
    return [layer]
  }) as SVGGraphicsElement[]

  const safeLayers = candidates.filter((layer) => {
    const hasExpensiveEffect = layer.matches('[filter], [mask]')
      || Boolean(layer.querySelector('[filter], [mask], foreignObject'))

    return !hasExpensiveEffect
  })

  return safeLayers.length <= MAX_CHART_ANIMATION_LAYERS ? safeLayers : []
}

function addTrackTransition(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  viewport: HTMLElement,
  scene: ChronicleScene,
  nextScene: ChronicleScene,
  nextIndex: number,
  at: number,
  duration: number,
  reducedMotion: boolean,
  motion: CoverMotionConfig,
) {
  if (scene.track === nextScene.track) {
    const surfaces = getTrackSurfaces(root, scene.track)
    timeline.to(surfaces, {
      x: () => getTrackX(root, viewport, nextIndex, 0),
      duration,
      ease: 'none',
    }, at)
    return
  }

  const interiorLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground, .chronicle-world-layer--interior-content',
    root,
  )
  const interiorForegroundLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground',
    root,
  )
  const interiorContentLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-content',
    root,
  )
  const exteriorContentLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--exterior-content',
    root,
  )

  if (scene.transition === 'horizontal') {
    const currentSurfaces = getTrackSurfaces(root, scene.track)
    const nextSurfaces = getTrackSurfaces(root, nextScene.track)
    const nextLayers = gsap.utils.toArray<HTMLElement>(
      `.chronicle-world-layer--${nextScene.track}-background, .chronicle-world-layer--${nextScene.track}-foreground, .chronicle-world-layer--${nextScene.track}-content`,
      root,
    )

    if (reducedMotion) {
      timeline.set(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0),
      }, at)
      timeline.set(nextLayers, {
        autoAlpha: 1,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
      }, at)
    } else {
      timeline.set(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0) + viewport.clientWidth,
      }, at)
      timeline.set(nextLayers, {
        autoAlpha: 1,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 100%)',
      }, at)
      timeline.to(currentSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex - 1, 1) - viewport.clientWidth,
        duration,
        ease: 'none',
      }, at)
      timeline.to(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0),
        duration,
        ease: 'none',
      }, at)
      timeline.to(nextLayers, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration,
        ease: 'none',
      }, at)
    }

    if (nextScene.track === 'interior') {
      timeline.set(exteriorContentLayers, { autoAlpha: 0 }, at + duration)
    } else {
      timeline.set(interiorLayers, { autoAlpha: 0 }, at + duration)
    }
    return
  }

  if (reducedMotion) {
    timeline.to(interiorLayers, {
      autoAlpha: nextScene.track === 'interior' ? 1 : 0,
      scale: 1,
      duration,
      ease: 'none',
    }, at)
    timeline.to(exteriorContentLayers, {
      autoAlpha: nextScene.track === 'exterior' ? 1 : 0,
      duration,
      ease: 'none',
    }, at)
    return
  }

  if (nextScene.track === 'exterior') {
    timeline.set(exteriorContentLayers, { autoAlpha: 1 }, at)
    const isOpeningDive = scene.id === 1
    const diveScale = isOpeningDive ? motion.scene1DiveScale : 3.2
    const fadeStart = isOpeningDive ? 0 : 0.38

    timeline.to(interiorContentLayers, {
      autoAlpha: 0,
      duration: duration * 0.18,
      ease: 'none',
    }, at)
    timeline.to(interiorForegroundLayers, {
      scale: diveScale,
      transformOrigin: '50% 46%',
      duration,
      ease: 'none',
    }, at)
    timeline.to(interiorForegroundLayers, {
      autoAlpha: 0,
      duration: duration * (1 - fadeStart),
      ease: 'none',
    }, at + duration * fadeStart)
    return
  }

  timeline.to(exteriorContentLayers, {
    autoAlpha: 0,
    duration: duration * 0.2,
    ease: 'none',
  }, at)
  timeline.to(interiorLayers, {
    autoAlpha: 1,
    scale: 1,
    transformOrigin: '50% 46%',
    duration,
    ease: 'power1.inOut',
  }, at)
}

function readStaticPreview() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('static') !== '1') return null

  const scene = Math.min(
    chronicleScenes.length - 1,
    Math.max(0, Number(params.get('scene') ?? 1) - 1),
  )
  const progress = Math.min(1, Math.max(0, Number(params.get('progress') ?? 0.5)))
  return { scene, progress }
}

function getCameraProgress(scene: ChronicleScene, localProgress: number) {
  const cameraStart = scene.timing.contentRevealRatio + scene.timing.contentHoldRatio
  if (localProgress <= cameraStart) return 0
  if (localProgress >= cameraStart + scene.timing.cameraRatio) return 1
  return (localProgress - cameraStart) / scene.timing.cameraRatio
}

function getCameraEndProgress(
  scene: ChronicleScene,
  motion: CoverMotionConfig,
) {
  if (scene.id === 1) return motion.scene1CameraEndProgress
  if (scene.id === BOAT_HIDDEN_SCENE_ID) {
    return WINDOW_SCENE_CAMERA_END_PROGRESS
  }
  return 1
}

function getCueProgress(scene: ChronicleScene, localProgress: number) {
  if (scene.timing.contentRevealRatio === 0) return 1
  return Math.min(1, Math.max(0, localProgress / scene.timing.contentRevealRatio))
}

export function ScrollChronicle({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const bottomBackdropRef = useRef<HTMLDivElement>(null)
  const staticPreview = useMemo(() => readStaticPreview(), [])
  const isMotionDebug = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return import.meta.env.DEV && params.get('debugMotion') === '1'
  }, [])
  const [coverMotion, setCoverMotion] = useState(readCoverMotionConfig)
  const scene4Mask = useMemo(() => readScene4Mask(), [])
  const chartAssets = useMemo(
    () => sceneCueManifests.flatMap((manifest) => manifest.cues)
      .filter((cue) => cue.svgAsset && LAYER_ANIMATED_CHART_IDS.has(cue.id))
      .map((cue) => ({ id: cue.id, asset: cue.svgAsset! })),
    [],
  )
  const [chartSvgMarkup, setChartSvgMarkup] = useState<Readonly<Record<string, string>> | null>(null)
  const activeSceneRef = useRef(staticPreview?.scene ?? 0)
  const [activeScene, setActiveScene] = useState(staticPreview?.scene ?? 0)

  useEffect(() => {
    let cancelled = false

    Promise.all(chartAssets.map(async ({ id, asset }) => {
      const response = await fetch(asset)
      if (!response.ok) throw new Error(`Unable to load ${id} SVG`)
      return [id, await response.text()] as const
    })).then((entries) => {
      if (!cancelled) setChartSvgMarkup(Object.fromEntries(entries))
    }).catch(() => {
      if (!cancelled) setChartSvgMarkup({})
    })

    return () => {
      cancelled = true
    }
  }, [chartAssets])

  useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const viewport = frameRef.current
    const bottomBackdrop = bottomBackdropRef.current
    if (!root || !stage || !viewport || !bottomBackdrop || chartSvgMarkup === null) return

    const sceneStarts: number[] = []
    const context = gsap.context(() => {
      const allSurfaces = gsap.utils.toArray<HTMLElement>('.chronicle-track-surface', root)
      const allScrollCues = gsap.utils.toArray<HTMLElement>(
        '[data-cue-mode="scroll"]',
        root,
      )
      const initialCues = gsap.utils.toArray<HTMLElement>(
        '.chronicle-cue[data-cue-mode="initial"]',
        root,
      )
      const boat = root.querySelector<HTMLElement>('.chronicle-boat')
      const boatViewport = root.querySelector<HTMLElement>('.chronicle-boat-viewport')
      const boatSkins = gsap.utils.toArray<HTMLElement>('[data-boat-skin]', root)
      const interiorSurfaces = getTrackSurfaces(root, 'interior')
      const exteriorSurfaces = getTrackSurfaces(root, 'exterior')
      const exteriorContentLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-content',
        root,
      )
      const exteriorBackdropLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-background, .chronicle-world-layer--exterior-foreground',
        root,
      )
      const exteriorWorldLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-background, .chronicle-world-layer--exterior-foreground, .chronicle-world-layer--exterior-content',
        root,
      )
      const interiorLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground, .chronicle-world-layer--interior-content',
        root,
      )
      const coverLayer = root.querySelector<HTMLElement>('[data-cover-layer]')
      const coverPanorama = root.querySelector<HTMLElement>('[data-cover-panorama]')
      const prefaceMask = root.querySelector<HTMLElement>('[data-cover-preface-mask]')
      const prefaceCopy = root.querySelector<HTMLElement>('[data-cover-preface-copy]')
      const endingLayer = root.querySelector<HTMLElement>('[data-ending-layer]')
      const endingMask = root.querySelector<HTMLElement>('[data-ending-mask]')
      const endingCopy = root.querySelector<HTMLElement>('[data-ending-copy]')
      const rainLayer = root.querySelector<HTMLElement>('[data-rain]')
      const crossfadeSceneIndex = chronicleScenes.findIndex(
        (scene) => scene.id === CROSSFADE_SCENE_ID,
      )
      const crossfadeState00 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${crossfadeSceneIndex}"] .chronicle-track-state[data-state="00"]`,
        root,
      )
      const crossfadeState01 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${crossfadeSceneIndex}"] .chronicle-track-state[data-state="01"]`,
        root,
      )
      const delayedForegroundSceneIndex = chronicleScenes.findIndex(
        (scene) => scene.id === DELAYED_FOREGROUND_SCENE_ID,
      )
      const delayedForegroundState01 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${delayedForegroundSceneIndex}"] .chronicle-track-state[data-state="01"]`,
        root,
      )
      const firstInterior = findSceneOnTrack(0, 'interior') ?? 0
      const firstExterior = findSceneOnTrack(0, 'exterior') ?? 0

      gsap.set(allSurfaces, { autoAlpha: 1, scale: 1, transformOrigin: '50% 46%' })
      gsap.set(allScrollCues, { autoAlpha: 0, y: 0 })
      gsap.set(initialCues, { autoAlpha: 1, y: 0 })
      gsap.set(bottomBackdrop, { autoAlpha: 0, yPercent: 100 })
      gsap.set(endingLayer, { autoAlpha: 0 })
      gsap.set(endingCopy, { y: 0 })
      gsap.set(boatSkins, { autoAlpha: 0 })
      gsap.set(boatViewport, { zIndex: 3, clipPath: 'none' })
      gsap.set(rainLayer, { autoAlpha: 0 })
      gsap.set(crossfadeState00, { autoAlpha: 1 })
      gsap.set(crossfadeState01, { autoAlpha: 0 })
      gsap.set(delayedForegroundState01, { autoAlpha: 0 })
      gsap.set(interiorSurfaces, {
        x: () => getTrackX(root, viewport, firstInterior, 0),
      })
      gsap.set(exteriorSurfaces, {
        x: () => getTrackX(root, viewport, firstExterior, 0),
      })
      gsap.set(exteriorContentLayers, { autoAlpha: 0 })

      if (coverLayer && coverPanorama && prefaceCopy) {
        gsap.set(coverLayer, { autoAlpha: 1 })
        gsap.set(exteriorWorldLayers, { autoAlpha: 0 })
        gsap.set(coverPanorama, {
          x: 0,
          y: 0,
          scale: 1,
          transformOrigin: '0% 50%',
        })
        gsap.set(prefaceCopy, { y: 0 })
        gsap.set(interiorLayers, {
          autoAlpha: 0,
          filter: reducedMotion ? 'none' : `blur(${coverMotion.blurPx}px)`,
          x: () => getSceneMatchOffset(viewport, coverMotion).x,
          y: () => getSceneMatchOffset(viewport, coverMotion).y,
          scale: coverMotion.sceneMatchScale,
          transformOrigin: '0% 0%',
        })
      }

      if (staticPreview) {
        const scene = chronicleScenes[staticPreview.scene]
        const hasBottomNote = sceneCueManifests[staticPreview.scene].cues.some(
          (cue) => cue.kind === 'source',
        )
        const sceneSurfaces = getTrackSurfaces(root, scene.track)
        const contentCues = root.querySelectorAll<HTMLElement>(
          `.chronicle-track-slot--content[data-scene="${staticPreview.scene}"] .chronicle-cue[data-cue-mode="scroll"]`,
        )
        const cueProgress = getCueProgress(scene, staticPreview.progress)
        const skin = root.querySelector<HTMLElement>(
          `[data-boat-skin="${scene.boatSkin}"]`,
        )

        gsap.set(sceneSurfaces, {
          x: () => getTrackX(
            root,
            viewport,
            staticPreview.scene,
            getCameraProgress(scene, staticPreview.progress)
              * getCameraEndProgress(scene, coverMotion),
          ),
        })
        gsap.set(contentCues, {
          autoAlpha: cueProgress,
          y: reducedMotion ? 0 : 14 * (1 - cueProgress),
        })
        gsap.set(bottomBackdrop, {
          autoAlpha: hasBottomNote && cueProgress > 0 ? 1 : 0,
          yPercent: hasBottomNote && (cueProgress > 0 || reducedMotion) ? 0 : 100,
        })
        gsap.set(interiorSurfaces, { autoAlpha: scene.track === 'interior' ? 1 : 0 })
        gsap.set(exteriorContentLayers, { autoAlpha: scene.track === 'exterior' ? 1 : 0 })

        if (scene.id === CROSSFADE_SCENE_ID) {
          gsap.set(crossfadeState00, { autoAlpha: 0 })
          gsap.set(crossfadeState01, { autoAlpha: 1 })
        }

        if (scene.id === DELAYED_FOREGROUND_SCENE_ID) {
          gsap.set(delayedForegroundState01, {
            autoAlpha: getCameraProgress(scene, staticPreview.progress)
              >= DELAYED_FOREGROUND_REVEAL_CAMERA_PROGRESS
              ? 1
              : 0,
          })
        }

        if (scene.track === 'interior') {
          const exteriorScene = findSceneOnTrack(staticPreview.scene + 1, 'exterior')
            ?? findSceneOnTrack(staticPreview.scene - 1, 'exterior', -1)
          if (exteriorScene !== null) {
            gsap.set(exteriorSurfaces, {
              x: () => getTrackX(root, viewport, exteriorScene, 0),
            })
          }
        }

        if (scene.id !== BOAT_HIDDEN_SCENE_ID) {
          gsap.set(skin, { autoAlpha: 1 })
        }
        gsap.set(rainLayer, { autoAlpha: scene.id === RAIN_SCENE_ID ? 1 : 0 })
        gsap.set(boat, {
          xPercent: -50,
          yPercent: -50,
          x: viewport.clientWidth * 0.42,
          y: viewport.clientHeight * (getBoatYPercent(scene.id) / 100),
        })
        gsap.set(boatViewport, {
          zIndex: staticPreview.scene === BLACKBOARD_SCENE_INDEX ? 7 : 3,
          clipPath: staticPreview.scene === BLACKBOARD_SCENE_INDEX
            ? getBlackboardHorizontalClip(
                root,
                viewport,
                getCameraProgress(scene, staticPreview.progress),
                scene4Mask,
              )
            : 'none',
        })
        return
      }

      gsap.set(`[data-boat-skin="${chronicleScenes[0].boatSkin}"]`, { autoAlpha: 1 })
      gsap.set(boat, {
        xPercent: -50,
        yPercent: -50,
        x: () => viewport.clientWidth * 0.34,
        y: () => viewport.clientHeight * (BOAT_Y_PERCENT / 100),
      })

      if (!reducedMotion) {
        const getBoatBobMultiplier = () => (
          activeSceneRef.current === STRONG_BOAT_BOB_SCENE_INDEX
            ? STRONG_BOAT_BOB_MULTIPLIER
            : 1
        )

        gsap.to([
          '.chronicle-boat__skin--paper .chronicle-boat__bob',
          '.chronicle-boat__skin--chalk .chronicle-boat__bob',
        ].join(', '), {
          rotation: () => BOAT_BOB_ROTATION * getBoatBobMultiplier(),
          y: () => BOAT_BOB_Y * getBoatBobMultiplier(),
          duration: 1,
          yoyo: true,
          repeat: -1,
          repeatRefresh: true,
          ease: 'sine.inOut',
          transformOrigin: '50% 78%',
        })
        gsap.to('.chronicle-boat__skin--ship .chronicle-boat__bob', {
          rotation: 0.8,
          y: -4,
          duration: 1.6,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          transformOrigin: '50% 78%',
        })
      }

      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      let cursor = 0

      if (coverLayer && coverPanorama && prefaceMask && prefaceCopy) {
        const panDuration = coverMotion.panDuration
        const prefaceDuration = coverMotion.prefaceDuration
        const holdDuration = coverMotion.holdDuration
        const windowPanDuration = coverMotion.windowPanDuration
        const mixDuration = coverMotion.mixDuration
        const coverDuration = panDuration + prefaceDuration + holdDuration
          + windowPanDuration + mixDuration
        const prefaceAt = panDuration
        const windowPanAt = prefaceAt + prefaceDuration + holdDuration
        const mixAt = windowPanAt + windowPanDuration
        const mixEnd = reducedMotion
          ? { x: getCoverWindowX(coverPanorama, viewport, coverMotion), y: 0, scale: 1 }
          : getCoverZoomEnd(coverPanorama, viewport, coverMotion)

        timeline.to(coverPanorama, {
          x: () => getCoverPrefaceX(coverPanorama, viewport, coverMotion),
          duration: panDuration,
          ease: 'power1.inOut',
        }, cursor)

        timeline.to(prefaceCopy, {
          y: () => -Math.max(0, prefaceCopy.scrollHeight - prefaceMask.clientHeight),
          duration: prefaceDuration,
          ease: 'none',
        }, prefaceAt)

        timeline.to(coverPanorama, {
          x: () => getCoverWindowX(coverPanorama, viewport, coverMotion),
          duration: windowPanDuration,
          ease: 'power1.inOut',
        }, windowPanAt)

        timeline.set(coverPanorama, { transformOrigin: '0% 0%' }, mixAt)

        timeline.to(coverPanorama, {
          x: () => mixEnd.x,
          y: () => mixEnd.y,
          scale: () => mixEnd.scale,
          duration: mixDuration,
          ease: 'power1.inOut',
        }, mixAt)

        timeline.to(interiorLayers, {
          x: 0,
          y: 0,
          scale: 1,
          duration: mixDuration,
          ease: 'power1.inOut',
        }, mixAt)

        timeline.to(interiorLayers, {
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: mixDuration * 0.58,
          ease: 'power1.out',
        }, mixAt + mixDuration * 0.42)

        timeline.to(coverLayer, {
          autoAlpha: 0,
          duration: mixDuration * 0.4,
          ease: 'power1.inOut',
        }, mixAt + mixDuration * 0.6)

        cursor += coverDuration
        timeline.set(coverLayer, { autoAlpha: 0 }, cursor)
        timeline.set(interiorLayers, {
          autoAlpha: 1,
          filter: 'none',
          x: 0,
          y: 0,
          scale: 1,
          transformOrigin: '0% 0%',
        }, cursor)
      }

      chronicleScenes.forEach((scene, index) => {
        const sceneContentPrepareAt = scene.id === IMMEDIATE_EXTERIOR_SCENE_ID
          ? Math.max(0, cursor - IMMEDIATE_EXTERIOR_PREPARE_LEAD_SECONDS)
          : cursor
        sceneStarts.push(cursor)
        const cues = getSceneCues(root, index)
        const hasBottomDecoration = sceneCueManifests[index].cues.some(
          (cue) => cue.kind === 'source',
        )
        const sceneSurfaces = getTrackSurfaces(root, scene.track)
        const revealDuration = scene.duration * scene.timing.contentRevealRatio
        const holdDuration = scene.duration * scene.timing.contentHoldRatio
        const transitionRatio = index === 0
          ? coverMotion.scene1DiveDurationRatio
          : scene.timing.transitionRatio
        const cameraRatio = index === 0
          ? Math.max(
              0.05,
              1 - scene.timing.contentRevealRatio - scene.timing.contentHoldRatio - transitionRatio,
            )
          : scene.timing.cameraRatio
        const cameraDuration = scene.duration * cameraRatio
        const transitionDuration = scene.duration * transitionRatio
        const cameraAt = cursor + revealDuration + holdDuration
        const transitionAt = cameraAt + cameraDuration
        const nextScene = chronicleScenes[index + 1]
        const cameraEndProgress = getCameraEndProgress(scene, coverMotion)

        if (index === 0) {
          if (reducedMotion) {
            timeline.set(exteriorWorldLayers, { autoAlpha: 1 }, cursor)
          } else {
            timeline.to(exteriorWorldLayers, {
              autoAlpha: 1,
              duration: revealDuration,
              ease: 'power1.out',
            }, cursor)
          }
        }

        if (scene.id === RAIN_SCENE_ID) {
          if (reducedMotion) {
            timeline.set(rainLayer, { autoAlpha: 1 }, cursor)
            timeline.set(rainLayer, { autoAlpha: 0 }, transitionAt)
          } else {
            timeline.to(rainLayer, {
              autoAlpha: 1,
              duration: Math.min(0.42, Math.max(0.18, revealDuration * 0.42)),
              ease: 'power1.out',
            }, cursor)
            timeline.to(rainLayer, {
              autoAlpha: 0,
              duration: Math.min(0.36, Math.max(0.16, transitionDuration * 0.72)),
              ease: 'power1.in',
            }, transitionAt)
          }
        }

        const cueEntries = cues.map((cue) => ({
          cue,
          progress: getCueEntryProgress(
            root,
            viewport,
            index,
            [cue],
            coverMotion.cueEntryViewportX,
          ),
        }))
        const openingCues = cueEntries
          .filter(({ progress }) => progress <= 0.001)
          .map(({ cue }) => cue)
        const delayedSceneCues = cueEntries.filter(({ progress }) => progress > 0.001)

        if (hasBottomDecoration) {
          const isImmediateEntry = scene.id === IMMEDIATE_EXTERIOR_SCENE_ID
          const chartEntry = cueEntries.find(
            ({ cue }) => cue.dataset.cueKind === 'chart',
          )
          const chartLifecycleStart = chartEntry && chartEntry.progress > 0.001
            ? cameraAt + cameraDuration * chartEntry.progress
            : cursor
          const noteEnterAt = isImmediateEntry
            ? cursor
            : Math.max(
                0,
                chartLifecycleStart + BOTTOM_NOTE_LIFECYCLE_OFFSET_SECONDS,
              )
          const noteExitAt = Math.max(
            noteEnterAt + BOTTOM_NOTE_TRANSITION_DURATION_SECONDS,
            transitionAt + BOTTOM_NOTE_LIFECYCLE_OFFSET_SECONDS,
          )

          if (reducedMotion || isImmediateEntry) {
            timeline.set(bottomBackdrop, { autoAlpha: 1, yPercent: 0 }, noteEnterAt)
            timeline.set(bottomBackdrop, { autoAlpha: 0, yPercent: 0 }, noteExitAt)
          } else {
            timeline.to(bottomBackdrop, {
              autoAlpha: 1,
              yPercent: 0,
              duration: BOTTOM_NOTE_TRANSITION_DURATION_SECONDS,
              ease: 'power2.out',
            }, noteEnterAt)
            timeline.to(bottomBackdrop, {
              autoAlpha: 0,
              yPercent: 100,
              duration: BOTTOM_NOTE_TRANSITION_DURATION_SECONDS,
              ease: 'power2.in',
            }, noteExitAt)
          }
        }

        addCueAnimations(
          timeline,
          openingCues,
          sceneContentPrepareAt,
          revealDuration,
          reducedMotion,
        )

        delayedSceneCues.forEach(({ cue, progress }) => {
          addCueAnimations(
            timeline,
            [cue],
            cameraAt + cameraDuration * progress,
            Math.min(revealDuration, cameraDuration * DELAYED_CUE_REVEAL_CAMERA_RATIO),
            reducedMotion,
          )
        })

        if (scene.id === DELAYED_FOREGROUND_SCENE_ID) {
          const foregroundRevealAt = cameraAt
            + cameraDuration * DELAYED_FOREGROUND_REVEAL_CAMERA_PROGRESS

          if (reducedMotion) {
            timeline.set(delayedForegroundState01, { autoAlpha: 1 }, foregroundRevealAt)
          } else {
            timeline.to(delayedForegroundState01, {
              autoAlpha: 1,
              duration: DELAYED_FOREGROUND_REVEAL_DURATION,
              ease: 'power2.out',
            }, foregroundRevealAt)
          }
        }

        timeline.to(sceneSurfaces, {
          x: () => getTrackX(root, viewport, index, cameraEndProgress),
          duration: cameraDuration,
          ease: 'none',
        }, cameraAt)

        const currentSkin = root.querySelector<HTMLElement>(
          `[data-boat-skin="${scene.boatSkin}"]`,
        )
        const previousSkin = index > 0
          ? root.querySelector<HTMLElement>(`[data-boat-skin="${chronicleScenes[index - 1].boatSkin}"]`)
          : null

        timeline.set(boat, {
          y: () => viewport.clientHeight * (getBoatYPercent(scene.id) / 100),
        }, sceneContentPrepareAt)

        if (scene.id === BOAT_HIDDEN_SCENE_ID) {
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
        } else if (index === BLACKBOARD_SCENE_INDEX) {
          timeline.set(boatViewport, {
            zIndex: 7,
            clipPath: () => getBlackboardHorizontalClip(
              root,
              viewport,
              0,
              scene4Mask,
            ),
          }, cursor)
          timeline.to(boatViewport, {
            clipPath: () => getBlackboardHorizontalClip(
              root,
              viewport,
              cameraEndProgress,
              scene4Mask,
            ),
            duration: cameraDuration,
            ease: 'none',
          }, cameraAt)
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
          timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
        } else if (index === 4) {
          timeline.set(boatViewport, { zIndex: 3, clipPath: 'none' }, cursor)
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
        } else if (index === 5) {
          timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
        } else if (previousSkin !== currentSkin) {
          if (revealDuration <= 0) {
            timeline.set(previousSkin, { autoAlpha: 0 }, sceneContentPrepareAt)
            timeline.set(currentSkin, { autoAlpha: 1 }, sceneContentPrepareAt)
          } else {
            timeline.to(previousSkin, { autoAlpha: 0, duration: revealDuration * 0.3 }, cursor)
            timeline.to(currentSkin, { autoAlpha: 1, duration: revealDuration * 0.3 }, cursor)
          }
        }

        if (scene.track === 'exterior') {
          timeline.to(boat, {
            x: () => viewport.clientWidth * Math.min(0.62, 0.34 + index * 0.014),
            duration: cameraDuration,
          }, cameraAt)
        }

        if (nextScene) {
          if (nextScene.id === BOAT_HIDDEN_SCENE_ID) {
            timeline.to(currentSkin, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt)
          }

          if (nextScene.id === CROSSFADE_SCENE_ID) {
            if (reducedMotion) {
              timeline.set(crossfadeState00, { autoAlpha: 0 }, transitionAt + transitionDuration)
              timeline.set(crossfadeState01, { autoAlpha: 1 }, transitionAt + transitionDuration)
            } else {
              timeline.to(crossfadeState00, {
                autoAlpha: 0,
                duration: transitionDuration,
                ease: 'power2.in',
              }, transitionAt)
              timeline.to(crossfadeState01, {
                autoAlpha: 1,
                duration: transitionDuration,
                ease: 'power2.in',
              }, transitionAt)
            }
          }

          // Reposition while Scene 04's opaque blackboard fully covers the
          // exterior. Doing this when the Scene 05 transition starts can expose
          // the exterior track's instantaneous jump through the entering window.
          if (index === BLACKBOARD_SCENE_INDEX) {
            const hospitalExterior = chronicleScenes[HOSPITAL_SCENE_INDEX + 1]
            const hospitalExteriorSurfaces = getTrackSurfaces(
              root,
              hospitalExterior.track,
            )
            timeline.set(hospitalExteriorSurfaces, {
              x: () => getTrackX(
                root,
                viewport,
                HOSPITAL_SCENE_INDEX + 1,
                0,
              ),
            }, cursor)

            if (!reducedMotion) {
              timeline.fromTo(exteriorBackdropLayers, {
                autoAlpha: 0,
              }, {
                autoAlpha: 1,
                duration: transitionDuration,
                ease: 'power1.inOut',
                immediateRender: false,
              }, transitionAt)
            }
          }

          const nextTrackWasPrepositioned = index === HOSPITAL_SCENE_INDEX
          if (nextScene.track !== scene.track && !nextTrackWasPrepositioned) {
            const nextSurfaces = getTrackSurfaces(root, nextScene.track)
            timeline.set(nextSurfaces, {
              x: () => getTrackX(root, viewport, index + 1, 0),
            }, cursor)

            if (nextScene.track === 'interior') {
              timeline.set(interiorLayers, {
                autoAlpha: 0,
                scale: reducedMotion ? 1 : 3.2,
                transformOrigin: '50% 46%',
              }, cursor)
            }
          }

          addTrackTransition(
            timeline,
            root,
            viewport,
            scene,
            nextScene,
            index + 1,
            transitionAt,
            transitionDuration,
            reducedMotion,
            coverMotion,
          )

          if (index === 2) {
            timeline.to(boatSkins, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt)
          }

          if (index === 3) {
            timeline.to(currentSkin, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt + transitionDuration * 0.6)
          }

        } else {
          timeline.to(boat, {
            x: () => viewport.clientWidth * 1.16,
            duration: transitionDuration,
            ease: 'power1.in',
          }, transitionAt)

          if (endingLayer) {
            if (reducedMotion) {
              timeline.set(endingLayer, { autoAlpha: 1 }, transitionAt + transitionDuration)
            } else {
              timeline.to(endingLayer, {
                autoAlpha: 1,
                duration: Math.min(ENDING_ENTRY_DURATION, transitionDuration),
                ease: 'power1.inOut',
              }, transitionAt)
            }
          }
        }

        cursor += scene.duration
      })

      if (endingLayer && endingMask && endingCopy) {
        const endingScrollAt = cursor + ENDING_START_HOLD_DURATION
        timeline.to(endingCopy, {
          y: () => -Math.max(0, endingCopy.scrollHeight - endingMask.clientHeight),
          duration: ENDING_SCROLL_DURATION,
          ease: 'none',
        }, endingScrollAt)

        cursor = endingScrollAt + ENDING_SCROLL_DURATION + ENDING_END_HOLD_DURATION
        timeline.set(endingLayer, { autoAlpha: 1 }, cursor)
      }

      ScrollTrigger.create({
        animation: timeline,
        trigger: root,
        start: 'top top',
        end: () => `+=${Math.round(
          cursor * window.innerHeight * SCROLL_DISTANCE_PER_TIMELINE_SECOND,
        )}`,
        pin: stage,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: ({ progress }) => {
          const time = progress * timeline.duration()
          let nextActive = sceneStarts.length - 1
          for (let index = 1; index < sceneStarts.length; index += 1) {
            if (time < sceneStarts[index]) {
              nextActive = index - 1
              break
            }
          }
          if (nextActive !== activeSceneRef.current) {
            activeSceneRef.current = nextActive
            setActiveScene(nextActive)
          }
        },
      })
    }, root)

    return () => context.revert()
  }, [chartSvgMarkup, coverMotion, reducedMotion, scene4Mask, staticPreview])

  return (
    <section
      className={`chronicle ${staticPreview ? 'chronicle--static' : ''}`}
      ref={rootRef}
      aria-label="现代中国历史滚动长卷"
    >
      <div className="chronicle-stage" ref={stageRef}>
        <div className="chronicle-frame" ref={frameRef}>
          <div className="chronicle-matte" aria-hidden="true" />

          {!staticPreview && <ChronicleCover />}

          <div className="chronicle-world-layer chronicle-world-layer--exterior-background" aria-hidden="true">
            <TrackSurface track="exterior" surface="background" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-background" aria-hidden="true">
            <TrackSurface track="interior" surface="background" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <ChronicleBoat />
          <div className="chronicle-world-layer chronicle-world-layer--exterior-foreground" aria-hidden="true">
            <TrackSurface track="exterior" surface="foreground" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--exterior-content" aria-hidden="true">
            <TrackSurface track="exterior" surface="content" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-foreground" aria-hidden="true">
            <TrackSurface track="interior" surface="foreground" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-content" aria-hidden="true">
            <TrackSurface track="interior" surface="content" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>

          {!staticPreview && <ChronicleEnding />}

          <div
            className="chronicle-bottom-backdrop"
            ref={bottomBackdropRef}
            aria-hidden="true"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}assets/bottom-annotation.png)`,
            }}
          />
          <ChronicleRain />

          <p className="sr-only" aria-live="polite">
            第 {activeScene + 1} 幕：{chronicleScenes[activeScene].title}
          </p>
        </div>
      </div>
      {isMotionDebug && !staticPreview && (
        <CoverMotionDebugPanel value={coverMotion} onChange={setCoverMotion} />
      )}
      {import.meta.env.DEV && (
        <div className="screen-debug" aria-hidden="true">
          第 {activeScene + 1} / {chronicleScenes.length} 屏
          <span>Scene_{String(chronicleScenes[activeScene].id).padStart(2, '0')}</span>
        </div>
      )}
    </section>
  )
}
