import { useEffect, useRef, useState } from 'react'

const TRACK_START = 110
const TRACK_END = 890
const TRAIN_WIDTH = 86
const REVEAL_INTERVAL = 90
const BUILDING_SETTLE_DURATION = 480
const QUEUE_TICK_INTERVAL = 30
const BUILDING_ANCHORS = [132, 210, 294, 380, 474, 566, 654, 728, 790]

type LoadingCityProps = {
  progress: number
  reducedMotion: boolean
  onRevealStateChange: (state: RevealState) => void
}

export type RevealState = {
  isIdle: boolean
  observedProgress: number
}

export function LoadingCity({
  progress,
  reducedMotion,
  onRevealStateChange,
}: LoadingCityProps) {
  const [revealedCount, setRevealedCount] = useState(0)
  const revealedCountRef = useRef(0)
  const queueTargetRef = useRef(0)
  const nextRevealAtRef = useRef(0)
  const settleAfterRef = useRef(0)
  const idleNotifiedRef = useRef(true)
  const observedProgressRef = useRef(progress)
  const reducedMotionRef = useRef(reducedMotion)
  const onRevealStateChangeRef = useRef(onRevealStateChange)

  useEffect(() => {
    onRevealStateChangeRef.current = onRevealStateChange
  }, [onRevealStateChange])

  useEffect(() => {
    reducedMotionRef.current = reducedMotion
    observedProgressRef.current = progress

    if (reducedMotion) {
      queueTargetRef.current = BUILDING_ANCHORS.length
      revealedCountRef.current = BUILDING_ANCHORS.length
      idleNotifiedRef.current = true
      onRevealStateChangeRef.current({
        isIdle: true,
        observedProgress: progress,
      })
      return
    }

    const trainFront = TRACK_START + (TRACK_END - TRACK_START) * (progress / 100)
    const trainTail = trainFront - TRAIN_WIDTH
    const nextTarget = BUILDING_ANCHORS.filter((anchor) => trainTail >= anchor).length

    if (nextTarget > queueTargetRef.current) {
      queueTargetRef.current = nextTarget
      idleNotifiedRef.current = false
      onRevealStateChangeRef.current({
        isIdle: false,
        observedProgress: progress,
      })
    } else if (idleNotifiedRef.current) {
      onRevealStateChangeRef.current({
        isIdle: true,
        observedProgress: progress,
      })
    }
  }, [progress, reducedMotion])

  useEffect(() => {
    const queueTimer = window.setInterval(() => {
      if (reducedMotionRef.current) return

      const now = performance.now()

      if (
        revealedCountRef.current < queueTargetRef.current &&
        now >= nextRevealAtRef.current
      ) {
        revealedCountRef.current += 1
        setRevealedCount(revealedCountRef.current)
        nextRevealAtRef.current = now + REVEAL_INTERVAL
        settleAfterRef.current = now + BUILDING_SETTLE_DURATION
        return
      }

      if (
        !idleNotifiedRef.current &&
        revealedCountRef.current >= queueTargetRef.current &&
        now >= settleAfterRef.current
      ) {
        idleNotifiedRef.current = true
        onRevealStateChangeRef.current({
          isIdle: true,
          observedProgress: observedProgressRef.current,
        })
      }
    }, QUEUE_TICK_INTERVAL)

    return () => window.clearInterval(queueTimer)
  }, [])

  const trainFront = TRACK_START + (TRACK_END - TRACK_START) * (progress / 100)
  const trainX = reducedMotion
    ? progress >= 100
      ? TRACK_END - TRAIN_WIDTH
      : TRACK_START - TRAIN_WIDTH
    : trainFront - TRAIN_WIDTH
  const progressLength = ((TRACK_END - TRACK_START) * progress) / 100
  const effectiveRevealedCount = reducedMotion ? BUILDING_ANCHORS.length : revealedCount
  const buildingClass = (index: number, extraClass = '') =>
    `loading-building ${index < effectiveRevealedCount ? 'loading-building--visible' : ''} ${extraClass}`

  return (
    <svg
      className="loading-city"
      viewBox="0 0 1000 410"
      role="img"
      aria-label="列车驶过，城市建筑依次出现"
    >
      <g className={buildingClass(0, 'loading-building--edge')}>
        <path d="M116 350V297h54v53" className="building-fill building-fill--blush" />
        <path d="M124 297l19-22 19 22M132 312h22M132 325h22" className="building-line" />
      </g>

      <g className={buildingClass(1)}>
        <rect x="183" y="266" width="62" height="84" rx="2" className="building-fill" />
        <path d="M196 350v-63h36v63M203 298h22M203 310h22M203 322h22" className="building-line" />
        <path d="M205 266v-17h18v17M214 249v-13" className="building-line" />
      </g>

      <g className={buildingClass(2)}>
        <path d="M258 350V226h62v124" className="building-fill building-fill--blue" />
        <path d="M268 350V242h42v108M278 252v87M290 252v87M302 252v87" className="building-line building-line--light" />
        <path d="M273 226l16-24 16 24" className="building-line" />
      </g>

      <g className={buildingClass(3)}>
        <path d="M337 350V286h34v64M371 350V247h55v103" className="building-fill building-fill--blush" />
        <path d="M381 350v-88h35v88M389 275h19M389 288h19M389 301h19M389 314h19" className="building-line" />
        <path d="M346 286v-18h15v18M353 268v-19" className="building-line" />
      </g>

      <g className={buildingClass(4)}>
        <path d="M440 350V208h74v142" className="building-fill building-fill--blue" />
        <path d="M452 350V224h50v126M462 238h30M462 253h30M462 268h30M462 283h30M462 298h30" className="building-line building-line--light" />
        <path d="M465 208l12-30 13 30M477 178v-18" className="building-line" />
      </g>

      <g className={buildingClass(5)}>
        <path d="M530 350V272h75v78" className="building-fill building-fill--ivory" />
        <path d="M541 350v-65h53v65M551 298h33M551 312h33M551 326h33" className="building-line" />
        <path d="M545 272l22-25 23 25M567 247v-30" className="building-line" />
      </g>

      <g className={buildingClass(6)}>
        <path d="M620 350V238h66v112" className="building-fill building-fill--green" />
        <path d="M632 350v-98h42v98M642 264h22M642 279h22M642 294h22M642 309h22" className="building-line building-line--light" />
        <path d="M641 238l12-23 12 23M653 215v-20" className="building-line" />
      </g>

      <g className={buildingClass(7)}>
        <path d="M704 350V291h48v59M752 350V258h38v92" className="building-fill building-fill--blush" />
        <path d="M713 350v-46h30v46M761 350v-78h20v78M766 284h10M766 297h10M766 310h10" className="building-line" />
      </g>

      <g className={buildingClass(8, 'loading-building--edge')}>
        <path d="M808 350V303h67v47" className="building-fill" />
        <path d="M818 350v-33h47v33M827 326h29M827 337h29" className="building-line" />
        <path d="M826 303c2-18 30-18 32 0" className="building-line" />
      </g>

      <g className="loading-trees" aria-hidden="true">
        <path d="M160 350v-20M154 332c0-10 12-16 18-7 7 10-2 18-12 15" />
        <path d="M600 350v-18M593 333c0-11 14-17 20-7 6 11-5 18-13 14" />
        <path d="M886 350v-17M879 334c0-10 13-16 19-7 6 10-4 17-12 14" />
      </g>

      <line x1="66" y1="350" x2="934" y2="350" className="loading-ground" />
      <line x1={TRACK_START} y1="369" x2={TRACK_END} y2="369" className="loading-rail" />
      <line
        x1={TRACK_START}
        y1="369"
        x2={TRACK_START + progressLength}
        y2="369"
        className="loading-rail-progress"
      />
      <g className="loading-sleepers" aria-hidden="true">
        {Array.from({ length: 25 }, (_, index) => (
          <line key={index} x1={118 + index * 32} y1="363" x2={108 + index * 32} y2="377" />
        ))}
      </g>

      <g className="loading-train" transform={`translate(${trainX} 0)`} aria-hidden="true">
        <path d="M8 316h57c12 0 21 9 21 21v22H8z" className="train-body" />
        <path d="M65 316c12 1 20 9 21 21H65z" className="train-cab" />
        <path d="M18 326h36v13H18zM59 326h10v13H59z" className="train-window" />
        <path d="M12 349h70" className="train-detail" />
        <circle cx="24" cy="359" r="6" className="train-wheel" />
        <circle cx="68" cy="359" r="6" className="train-wheel" />
      </g>
    </svg>
  )
}
