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

        <div className="app-loading__meta" aria-hidden="true">
          <p className="app-loading__status">城市记忆正在展开</p>
          <p className="app-loading__percentage">
            <span>{String(displayedProgress).padStart(2, '0')}</span>
            <span className="app-loading__percent-sign">%</span>
          </p>
        </div>
      </div>
    </div>
  )
}
