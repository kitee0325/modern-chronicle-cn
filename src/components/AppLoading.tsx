import { useEffect, useRef, useState } from 'react'
import { LoadingCity } from './LoadingCity'

export type LoadingPhase = 'loading' | 'settling' | 'exiting' | 'content'

type AppLoadingProps = {
  phase: LoadingPhase
  progress: number
  reducedMotion: boolean
  onRevealQueueChange: (isIdle: boolean) => void
}

export function AppLoading({
  phase,
  progress,
  reducedMotion,
  onRevealQueueChange,
}: AppLoadingProps) {
  const visualProgress = Math.min(100, Math.max(0, progress))
  const displayedProgress = Math.round(visualProgress)
  const [accessibleProgress, setAccessibleProgress] = useState(0)
  const displayedProgressRef = useRef(displayedProgress)

  useEffect(() => {
    displayedProgressRef.current = displayedProgress
  }, [displayedProgress])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAccessibleProgress(displayedProgressRef.current)
    }, 250)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      className={`app-loading ${phase === 'exiting' ? 'app-loading--exiting' : ''}`}
      data-phase={phase}
      role="progressbar"
      aria-label="页面加载进度"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={accessibleProgress}
    >
      <div className="app-loading__scene">
        <LoadingCity
          progress={visualProgress}
          reducedMotion={reducedMotion}
          onRevealQueueChange={onRevealQueueChange}
        />

        <p className="app-loading__status" aria-hidden="true">加载中</p>
      </div>

      <p className="app-loading__fullscreen-hint">
        强烈推荐全屏访问，按 <kbd>F11</kbd> 开启全屏
      </p>
    </div>
  )
}
