import { useEffect, useState } from 'react'
import {
  resolveChronicleViewport,
  type ChronicleViewport,
} from '../chronicleViewport'

function readViewport(): ChronicleViewport {
  return resolveChronicleViewport({
    width: window.innerWidth,
    height: window.innerHeight,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
  })
}

function sameViewport(left: ChronicleViewport, right: ChronicleViewport) {
  return left.mobile === right.mobile
    && left.rotation === right.rotation
    && left.scrollAxis === right.scrollAxis
}

export function useChronicleViewport() {
  const [viewport, setViewport] = useState(readViewport)

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: coarse)')
    let animationFrame = 0

    const update = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        const next = readViewport()
        setViewport((current) => (
          sameViewport(current, next) ? current : next
        ))
      })
    }

    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    pointerQuery.addEventListener('change', update)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      pointerQuery.removeEventListener('change', update)
    }
  }, [])

  return viewport
}
