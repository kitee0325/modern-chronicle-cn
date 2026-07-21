import { useEffect, useState } from 'react'

const TOTAL_DURATION = 3600
const FALLBACK_DURATION = 5000

const easeOutQuart = (value: number) => 1 - (1 - value) ** 4

export function progressForElapsedTime(elapsed: number) {
  const safeElapsed = Math.max(0, elapsed)

  if (safeElapsed <= 1300) {
    return (safeElapsed / 1300) * 55
  }

  if (safeElapsed <= 2800) {
    return 55 + ((safeElapsed - 1300) / 1500) * 35
  }

  if (safeElapsed < TOTAL_DURATION) {
    return 90 + easeOutQuart((safeElapsed - 2800) / 800) * 10
  }

  return 100
}

export function useSimulatedProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let animationFrame = 0
    let startedAt: number | null = null
    let finished = false

    const finish = () => {
      if (finished) return
      finished = true
      window.cancelAnimationFrame(animationFrame)
      setProgress(100)
    }

    const tick = (now: number) => {
      if (startedAt === null) startedAt = now

      const nextProgress = progressForElapsedTime(now - startedAt)
      setProgress((currentProgress) => Math.max(currentProgress, nextProgress))

      if (nextProgress >= 100) {
        finish()
        return
      }

      animationFrame = window.requestAnimationFrame(tick)
    }

    animationFrame = window.requestAnimationFrame(tick)
    const fallbackTimer = window.setTimeout(finish, FALLBACK_DURATION)

    return () => {
      finished = true
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(fallbackTimer)
    }
  }, [])

  return progress
}
