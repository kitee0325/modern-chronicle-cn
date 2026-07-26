import { useCallback, useEffect, useState } from 'react'
import { AppLoading, type LoadingPhase } from './components/AppLoading'
import { ScrollChronicle } from './components/ScrollChronicle'
import { Scene4MaskEditor } from './components/Scene4MaskEditor'
import type { RevealState } from './components/LoadingCity'
import { useAssetPreloader } from './hooks/useAssetPreloader'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'

function App() {
  const params = new URLSearchParams(window.location.search)
  const isScene4MaskEditor = params.get('annotate') === 'scene4'
  const isStaticPreview = params.get('static') === '1'
  const bypassLoading = isStaticPreview
    || (import.meta.env.DEV && params.get('skipLoading') === '1')
  const { progress } = useAssetPreloader(!bypassLoading && !isScene4MaskEditor)
  const reducedMotion = usePrefersReducedMotion()
  const [phase, setPhase] = useState<LoadingPhase>(bypassLoading ? 'content' : 'loading')
  const [revealState, setRevealState] = useState<RevealState>({
    isIdle: false,
    observedProgress: 0,
  })

  const handleRevealStateChange = useCallback((state: RevealState) => {
    setRevealState(state)
  }, [])

  useEffect(() => {
    if (
      phase !== 'loading'
      || progress < 100
      || !revealState.isIdle
      || revealState.observedProgress < 100
    ) return

    const transitionTimer = window.setTimeout(() => setPhase('settling'), 0)

    return () => window.clearTimeout(transitionTimer)
  }, [phase, progress, revealState])

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
          onRevealStateChange={handleRevealStateChange}
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
