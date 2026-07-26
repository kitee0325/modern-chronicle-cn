export type SceneAsset = {
  id: number
  background?: string
  foreground?: string
  states?: readonly SceneAssetState[]
}

export type SceneAssetState = {
  id: '00' | '01'
  background?: string
  foreground?: string
  foregroundCrop?: SceneAssetCrop
}

export type SceneAssetCrop = {
  canvasWidth: number
  canvasHeight: number
  x: number
  y: number
  width: number
  height: number
}

const sceneAssetUrl = (
  scene: number,
  file: 'background' | 'foreground',
  state?: string,
  extension: 'png' | 'svg' = 'png',
) => {
  const sceneDirectory = `Scene_${String(scene).padStart(2, '0')}`
  const stateSuffix = state ? `-${state}` : ''

  return `${import.meta.env.BASE_URL}assets/scenes/${sceneDirectory}/${file}${stateSuffix}.${extension}`
}

export const coverAssets = {
  foreground: `${import.meta.env.BASE_URL}assets/cover/foreground.png`,
  title: `${import.meta.env.BASE_URL}assets/cover/title.png`,
} as const

export const sceneAssets = [
  {
    id: 1,
    foreground: sceneAssetUrl(1, 'foreground'),
  },
  {
    id: 2,
    background: sceneAssetUrl(2, 'background'),
    foreground: sceneAssetUrl(2, 'foreground'),
  },
  {
    id: 3,
    foreground: sceneAssetUrl(3, 'foreground', '00'),
    states: [
      { id: '00', foreground: sceneAssetUrl(3, 'foreground', '00') },
      {
        id: '01',
        foreground: sceneAssetUrl(3, 'foreground', '01-crop'),
        foregroundCrop: {
          canvasWidth: 8588,
          canvasHeight: 1620,
          x: 4521,
          y: 448,
          width: 2456,
          height: 1171,
        },
      },
    ],
  },
  {
    id: 4,
    background: sceneAssetUrl(4, 'background'),
    foreground: sceneAssetUrl(4, 'foreground'),
  },
  { id: 5, foreground: sceneAssetUrl(5, 'foreground') },
  { id: 6, background: sceneAssetUrl(6, 'background') },
  {
    id: 7,
    background: sceneAssetUrl(7, 'background', '00'),
    foreground: sceneAssetUrl(7, 'foreground', '00'),
    states: [
      {
        id: '00',
        background: sceneAssetUrl(7, 'background', '00'),
        foreground: sceneAssetUrl(7, 'foreground', '00'),
      },
      {
        id: '01',
        background: sceneAssetUrl(7, 'background', '01'),
        foreground: sceneAssetUrl(7, 'foreground', '01'),
      },
    ],
  },
  {
    id: 8,
    background: sceneAssetUrl(8, 'background'),
    foreground: sceneAssetUrl(8, 'foreground'),
  },
  { id: 9, foreground: sceneAssetUrl(9, 'foreground') },
  {
    id: 10,
    background: sceneAssetUrl(10, 'background'),
    foreground: sceneAssetUrl(10, 'foreground'),
  },
  {
    id: 11,
    background: sceneAssetUrl(11, 'background'),
    foreground: sceneAssetUrl(11, 'foreground'),
  },
  { id: 12, foreground: sceneAssetUrl(12, 'foreground') },
  {
    id: 13,
    background: sceneAssetUrl(13, 'background'),
    foreground: sceneAssetUrl(13, 'foreground'),
  },
  {
    id: 14,
    background: sceneAssetUrl(14, 'background'),
    foreground: sceneAssetUrl(14, 'foreground'),
  },
  {
    id: 15,
    background: sceneAssetUrl(15, 'background'),
    foreground: sceneAssetUrl(15, 'foreground'),
  },
  { id: 16, foreground: sceneAssetUrl(16, 'foreground') },
  { id: 17, background: sceneAssetUrl(17, 'background') },
  { id: 18, foreground: sceneAssetUrl(18, 'foreground') },
  {
    id: 19,
    background: sceneAssetUrl(19, 'background'),
    foreground: sceneAssetUrl(19, 'foreground'),
  },
] as const satisfies readonly SceneAsset[]
