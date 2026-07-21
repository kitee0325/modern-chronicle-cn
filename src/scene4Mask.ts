export type MaskPoint = {
  x: number
  y: number
}

export type Scene4Mask = {
  scene: 4
  sourceWidth: 7306
  sourceHeight: 1620
  points: MaskPoint[]
}

export const scene4MaskStorageKey = 'modern-chronicle-scene4-mask-v1'

export const defaultScene4Mask: Scene4Mask = {
  scene: 4,
  sourceWidth: 7306,
  sourceHeight: 1620,
  points: [
    { x: 290, y: 209 },
    { x: 6670, y: 197 },
  ],
}

export function readScene4Mask(): Scene4Mask {
  try {
    const value = window.localStorage.getItem(scene4MaskStorageKey)
    if (!value) return defaultScene4Mask

    const parsed = JSON.parse(value) as Partial<Scene4Mask>
    if (!Array.isArray(parsed.points)) return defaultScene4Mask

    return {
      ...defaultScene4Mask,
      points: parsed.points.filter(
        (point): point is MaskPoint =>
          typeof point?.x === 'number' && typeof point?.y === 'number',
      ),
    }
  } catch {
    return defaultScene4Mask
  }
}
