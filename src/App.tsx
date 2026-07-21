import { useCallback, useEffect, useState } from 'react'
import { AppLoading, type LoadingPhase } from './components/AppLoading'
import { ScrollChronicle } from './components/ScrollChronicle'
import { Scene4MaskEditor } from './components/Scene4MaskEditor'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { useSimulatedProgress } from './hooks/useSimulatedProgress'

function App() {
  const params = new URLSearchParams(window.location.search)
  const isScene4MaskEditor = params.get('annotate') === 'scene4'
  const isStaticPreview = params.get('static') === '1'
  const bypassLoading = isStaticPreview
    || (import.meta.env.DEV && params.get('skipLoading') === '1')
  const progress = useSimulatedProgress()
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<LoadingPhase>(bypassLoading ? 'content' : 'loading')
  const [revealQueueIdle, setRevealQueueIdle] = useState(false)

  const handleRevealQueueChange = useCallback((isIdle: boolean) => {
    setRevealQueueIdle(isIdle)
  }, [])

  useEffect(() => {
    if (phase !== 'loading' || progress < 100 || !revealQueueIdle) return

    const transitionTimer = window.setTimeout(() => setPhase('settling'), 0)

    return () => window.clearTimeout(transitionTimer)
  }, [phase, progress, revealQueueIdle])

  useEffect(() => {
    if (phase !== 'settling') return

    const settleTimer = window.setTimeout(
      () => setPhase('exiting'),
      reducedMotion ? 100 : 350,
    )

    return () => window.clearTimeout(settleTimer)
  }, [phase, reducedMotion])

  useEffect(() => {
    if (phase !== 'exiting') return

    const exitTimer = window.setTimeout(
      () => setPhase('content'),
      reducedMotion ? 150 : 420,
    )

    return () => window.clearTimeout(exitTimer)
  }, [phase, reducedMotion])

  const contentIsVisible = phase === 'exiting' || phase === 'content'
  const contentIsInteractive = phase === 'content'

  if (isScene4MaskEditor) return <Scene4MaskEditor />

  return (
    <>
      {phase !== 'content' && (
        <AppLoading
          phase={phase}
          progress={progress}
          reducedMotion={reducedMotion}
          onRevealQueueChange={handleRevealQueueChange}
        />
      )}

      <main
        className={`app-shell ${contentIsVisible ? 'app-shell--visible' : ''}`}
        aria-hidden={!contentIsInteractive}
        inert={!contentIsInteractive}
      >
        <ScrollChronicle reducedMotion={reducedMotion} />
      </main>
    </>
  )
}

export default App
