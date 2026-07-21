export type CoverMotionConfig = {
  panDuration: number
  prefaceDuration: number
  holdDuration: number
  windowPanDuration: number
  mixDuration: number
  blurPx: number
  coverAnchorX: number
  windowAnchorX: number
  sceneMatchX: number
  sceneMatchY: number
  sceneMatchScale: number
  scene1CameraEndProgress: number
  scene1DiveScale: number
  scene1DiveDurationRatio: number
  cueEntryViewportX: number
}

export const defaultCoverMotion: CoverMotionConfig = {
  panDuration: 1.32,
  prefaceDuration: 1.35,
  holdDuration: 0.36,
  windowPanDuration: 0.9,
  mixDuration: 2.16,
  blurPx: 12,
  coverAnchorX: 0.5333601910618244,
  windowAnchorX: 0.7735878391219037,
  sceneMatchX: -1.7682963387727981,
  sceneMatchY: 11.59891268102134,
  sceneMatchScale: 0.527,
  scene1CameraEndProgress: 0.512,
  scene1DiveScale: 3.2,
  scene1DiveDurationRatio: 0.32,
  cueEntryViewportX: 0.9,
}

export const coverMotionStorageKey = 'modern-chronicle-cover-motion-v10'

export function readCoverMotionConfig() {
  if (typeof window === 'undefined') return defaultCoverMotion

  try {
    const saved = window.localStorage.getItem(coverMotionStorageKey)
    if (!saved) return defaultCoverMotion
    return { ...defaultCoverMotion, ...JSON.parse(saved) } as CoverMotionConfig
  } catch {
    return defaultCoverMotion
  }
}
