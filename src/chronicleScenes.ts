import { sceneAssets, type SceneAsset } from './sceneAssets'
import type { BoatSkin } from './components/ChronicleBoat'

export type TransitionKind = 'horizontal' | 'dive' | 'surface' | 'gradient'
export type SceneKind = 'interior' | 'exterior' | 'hybrid'
export type NarrativeTrack = 'interior' | 'exterior'

export type SceneTiming = {
  contentRevealRatio: number
  contentHoldRatio: number
  cameraRatio: number
  transitionRatio: number
}

export type ChronicleScene = SceneAsset & {
  title: string
  sourceWidth: number
  kind: SceneKind
  track: NarrativeTrack
  duration: number
  transition: TransitionKind
  boatSkin: BoatSkin
  timing: SceneTiming
}

const sceneDetails = [
  ['启程', 5690, 'interior', 2.8, 'dive'],
  ['江南水乡', 9034, 'exterior', 4.4, 'surface'],
  ['列车中的岁月', 8588, 'interior', 4, 'horizontal'],
  ['建设的回声', 7306, 'interior', 3.8, 'horizontal'],
  ['医者与新生', 2880, 'interior', 2.2, 'dive'],
  ['山河初醒', 2880, 'exterior', 2.2, 'horizontal'],
  ['时代转色', 5764, 'exterior', 2.8, 'horizontal'],
  ['夜抵车站', 4586, 'hybrid', 2.8, 'horizontal'],
  ['再入车厢', 2936, 'interior', 2.2, 'dive'],
  ['向海而行', 6916, 'exterior', 3.6, 'horizontal'],
  ['土地的考验', 12390, 'exterior', 5.4, 'surface'],
  ['纸上的年代', 4136, 'interior', 2.6, 'dive'],
  ['教育与远方', 9290, 'exterior', 4.5, 'horizontal'],
  ['湖光新章', 5764, 'exterior', 3.2, 'horizontal'],
  ['城市生长', 5702, 'exterior', 3.2, 'surface'],
  ['车窗里的今天', 3844, 'interior', 2.5, 'dive'],
  ['水面之上', 3844, 'exterior', 2.6, 'surface'],
  ['驶向当下', 7968, 'interior', 3.8, 'dive'],
  ['未完的旅程', 15734, 'exterior', 6.2, 'horizontal'],
] as const satisfies readonly [
  string,
  number,
  SceneKind,
  number,
  TransitionKind,
][]

const boatSkins: readonly BoatSkin[] = [
  'paper', 'paper', 'paper', 'chalk', 'paper', 'paper',
  'paper', 'paper', 'paper', 'paper', 'paper', 'paper',
  'paper', 'paper', 'paper', 'ship', 'ship-close', 'ship-close', 'final',
]

export const chronicleScenes: readonly ChronicleScene[] = sceneAssets.map(
  (asset, index) => {
    const [title, sourceWidth, kind, duration, transition] =
      sceneDetails[index]

    return {
      ...asset,
      title,
      sourceWidth,
      kind,
      track: kind === 'interior' ? 'interior' : 'exterior',
      duration,
      transition,
      boatSkin: boatSkins[index],
      timing: index === 0
        ? {
            contentRevealRatio: 0.18,
            contentHoldRatio: 0.2,
            cameraRatio: 0.3,
            transitionRatio: 0.32,
          }
        : {
            contentRevealRatio: 0.18,
            contentHoldRatio: 0.2,
            cameraRatio: 0.46,
            transitionRatio: 0.16,
          },
    }
  },
)
