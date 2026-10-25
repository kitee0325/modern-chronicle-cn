export type ChronicleScrollAxis = 'x' | 'y'
export type ChronicleRotation = 0 | 90

export type ChronicleViewportInput = {
  width: number
  height: number
  coarsePointer: boolean
}

export type ChronicleViewport = {
  mobile: boolean
  rotation: ChronicleRotation
  scrollAxis: ChronicleScrollAxis
}

export const MOBILE_SHORT_SIDE_MAX = 600

export function resolveChronicleViewport({
  width,
  height,
  coarsePointer,
}: ChronicleViewportInput): ChronicleViewport {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const minSide = Math.min(safeWidth, safeHeight)
  const mobile = coarsePointer && minSide <= MOBILE_SHORT_SIDE_MAX
  const rotation: ChronicleRotation = mobile && safeHeight > safeWidth ? 90 : 0

  return {
    mobile,
    rotation,
    scrollAxis: rotation === 90 ? 'y' : 'x',
  }
}

export function getScrollProgress(offset: number, distance: number) {
  if (!Number.isFinite(offset) || distance <= 0) return 0
  if (offset >= distance - 1) return 1
  return Math.min(1, Math.max(0, offset / distance))
}
