import { useEffect, useMemo, useRef, useState } from 'react'
import { coverWindowPanorama } from '../sceneAssets'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const MOUNTED_TILE_COUNT = 2
const MAX_FRAME_DELTA_MS = 64

function getTileIndex(position: number) {
  for (let index = coverWindowPanorama.tiles.length - 1; index > 0; index -= 1) {
    if (coverWindowPanorama.tiles[index].start <= position) return index
  }
  return 0
}

export function CoverWindowLoop() {
  const trackRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(0)
  const currentTileRef = useRef(0)
  const activeRef = useRef(true)
  const [currentTile, setCurrentTile] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const renderedCurrentTile = reducedMotion ? 0 : currentTile

  const mountedTiles = useMemo(() => (
    Array.from({ length: MOUNTED_TILE_COUNT }, (_, offset) => {
      const index = (renderedCurrentTile + offset) % coverWindowPanorama.tiles.length
      return { ...coverWindowPanorama.tiles[index], index }
    })
  ), [renderedCurrentTile])

  useEffect(() => {
    const track = trackRef.current
    const cover = track?.closest<HTMLElement>('[data-cover-layer]')
    if (!track || !cover) return

    let animationFrame = 0
    let lastTimestamp: number | null = null

    const updateActivity = () => {
      activeRef.current = document.visibilityState === 'visible'
        && cover.style.visibility !== 'hidden'
    }

    const coverObserver = new MutationObserver(updateActivity)
    coverObserver.observe(cover, { attributes: true, attributeFilter: ['style'] })
    document.addEventListener('visibilitychange', updateActivity)
    updateActivity()

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp
      const elapsed = Math.min(MAX_FRAME_DELTA_MS, timestamp - lastTimestamp)
      lastTimestamp = timestamp

      if (activeRef.current && !reducedMotion) {
        positionRef.current = (
          positionRef.current + elapsed * coverWindowPanorama.speed / 1000
        ) % coverWindowPanorama.width
      }

      const safeTile = getTileIndex(positionRef.current)
      const offset = positionRef.current - coverWindowPanorama.tiles[safeTile].start

      if (safeTile !== currentTileRef.current) {
        currentTileRef.current = safeTile
        setCurrentTile(safeTile)
      }

      track.style.transform = `translate3d(${-offset}px, 0, 0)`
      animationFrame = window.requestAnimationFrame(tick)
    }

    if (reducedMotion) {
      positionRef.current = 0
      currentTileRef.current = 0
      track.style.transform = 'translate3d(0, 0, 0)'
    }

    animationFrame = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      coverObserver.disconnect()
      document.removeEventListener('visibilitychange', updateActivity)
    }
  }, [reducedMotion])

  return (
    <div className="chronicle-cover__window-loop" aria-hidden="true">
      <div className="chronicle-cover__window-track" ref={trackRef}>
        {mountedTiles.map((tile) => (
          <img
            className="chronicle-cover__window-tile"
            key={tile.index}
            style={{ width: `${tile.width}px` }}
            src={tile.src}
            alt=""
            draggable={false}
            decoding="async"
            loading="eager"
          />
        ))}
      </div>
    </div>
  )
}
