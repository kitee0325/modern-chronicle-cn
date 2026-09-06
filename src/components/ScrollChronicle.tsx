import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  chronicleScenes,
  type ChronicleScene,
  type NarrativeTrack,
} from '../chronicleScenes'
import {
  readCoverMotionConfig,
  type CoverMotionConfig,
} from '../coverMotion'
import {
  isTextCue,
  normalizeCueValue,
  sceneCueManifests,
  type ChartSceneCue,
  type CueTextAnnotation,
  type CueTextBlock,
  type TextSceneCue,
} from '../sceneCues'
import { endingAssets } from '../endingAssets'
import { readScene4Mask, type Scene4Mask } from '../scene4Mask'
import { ChronicleBoat } from './ChronicleBoat'
import { ChronicleCover } from './ChronicleCover'
import { CoverMotionDebugPanel } from './CoverMotionDebugPanel'

gsap.registerPlugin(ScrollTrigger)

const ASSET_WINDOW_RADIUS = 2
const DELAYED_CUE_REVEAL_CAMERA_RATIO = 0.36
const SCROLL_DISTANCE_PER_TIMELINE_SECOND = 1.05
const TARGET_CAMERA_SCROLL_GAIN = 1
const MIN_CAMERA_SCROLL_DISTANCE_VH = 0.35
const MAX_CHART_ANIMATION_LAYERS = 24
const LAYER_ANIMATED_CHART_IDS = new Set([
  's02-chart',
  's11-chart',
  's13-chart',
  's14-chart',
])
const BACKGROUND_BOUND_CUE_IDS = new Set(['s17-chart', 's19-chart'])
const RAIN_SCENE_ID = 7
const CROSSFADE_SCENE_ID = 7
const DELAYED_FOREGROUND_SCENE_ID = 3
const SCENE_03_SOURCE_WIDTH = 8588
const SCENE_03_LATER_COPY_LEFT_X = 2054 * 2
const SCENE_03_CHANGED_CONTENT_RIGHT_X = 6973
const SCENE_03_GROUP_CENTER_X = (
  SCENE_03_LATER_COPY_LEFT_X + SCENE_03_CHANGED_CONTENT_RIGHT_X
) / 2 / SCENE_03_SOURCE_WIDTH
const SCENE_03_CAMERA_DURATION = 3.12
const SCENE_03_PAN_IN_DURATION = 0.8
const SCENE_03_ORIGINAL_HOLD_DURATION = 0.35
const SCENE_03_MORPH_DURATION = 0.36
const SCENE_03_CHANGED_HOLD_DURATION = 0.75
const SCENE_03_PAN_OUT_DURATION = 0.86
const WINDOW_PORTAL_SCENE_ID = 16
const WINDOW_SCENE_CAMERA_END_PROGRESS = 0
const FILM_PERFORATION_COUNT = 18
const RAIN_DROP_COUNT = 84
const STRONG_BOAT_BOB_SCENE_INDEX = 6
const BOAT_BOB_ROTATION = 4.5
const BOAT_BOB_Y = -9
const STRONG_BOAT_BOB_MULTIPLIER = 1.65
const BOAT_Y_PERCENT = 80
const ELEVATED_BOAT_START_SCENE_ID = 17
const ELEVATED_BOAT_Y_PERCENT = 70
const BLACKBOARD_SCENE_INDEX = 3
const HOSPITAL_SCENE_INDEX = 4

type TrackSurfaceKind = 'background' | 'foreground' | 'content'

type SceneSlotProps = {
  scene: ChronicleScene
  index: number
  layer: 'background' | 'foreground'
  activeScene: number
}

function isSceneInAssetWindow(sceneIndex: number, activeScene: number) {
  return Math.abs(sceneIndex - activeScene) <= ASSET_WINDOW_RADIUS
}

function ChronicleRain() {
  return (
    <div className="chronicle-rain" data-rain aria-hidden="true">
      {Array.from({ length: RAIN_DROP_COUNT }, (_, index) => {
        const style = {
          left: `${(index * 37 + 11) % 104 - 2}%`,
          top: `${(index * 53 + 7) % 118 - 18}%`,
          '--rain-duration': `${0.48 + (index % 7) * 0.06}s`,
          '--rain-delay': `${-((index * 0.137) % 1.1)}s`,
          '--rain-length': `${28 + (index % 8) * 6}px`,
          '--rain-opacity': `${0.45 + (index % 5) * 0.09}`,
        } as CSSProperties

        return <i className="chronicle-rain__drop" style={style} key={index} />
      })}
    </div>
  )
}

function ChronicleEnding() {
  return (
    <section
      className="chronicle-ending"
      data-ending-layer
      aria-labelledby="chronicle-ending-title"
    >
      <div className="chronicle-ending__gallery" aria-hidden="true">
        <div className="chronicle-ending__film">
          <div className="chronicle-ending__perforations chronicle-ending__perforations--left">
            {Array.from({ length: FILM_PERFORATION_COUNT }, (_, index) => <i key={index} />)}
          </div>
          <div className="chronicle-ending__perforations chronicle-ending__perforations--right">
            {Array.from({ length: FILM_PERFORATION_COUNT }, (_, index) => <i key={index} />)}
          </div>
          <div className="chronicle-ending__film-track">
            {[0, 1].map((cycle) => (
              <img
                className="chronicle-ending__film-reel"
                src={endingAssets.reel}
                alt=""
                draggable={false}
                decoding="async"
                key={cycle}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="chronicle-ending__story"
        style={{
          '--ending-background': `url(${endingAssets.background})`,
        } as CSSProperties}
      >
        <h2 className="sr-only" id="chronicle-ending-title">
          阿公的手稿：一名基层老党员与共和国同行的七十年
        </h2>
        <img
          className="chronicle-ending__heading"
          src={endingAssets.heading}
          alt=""
          draggable={false}
        />

        <div className="chronicle-ending__conclusion">
          <h3>结语</h3>
          <div className="chronicle-ending__copy">
            <p>
              时代改变了赵大春。
              <br />
              而千千万万个像赵大春一样的普通人，共同书写了中国发展的历史。
            </p>
            <p>赵大春的一生，就像是在时代长河中不断航行的一叶小舟。百年来，风雨同舟，家国天下。</p>
            <p>
              他出生于军人家庭，先后经历抗日战争、解放战争与抗美援朝，身体里至今仍留有战争的弹片。他曾在饥荒与误诊中漂浮，在婚姻与生活的选择中挣扎，也曾在时代转折的浪潮中经历停滞与重启。
            </p>
            <p>
              在来信中，他写道：“一个革命者，越是在惊涛骇浪中，越是需要钢铁意志，越是需要以一颗热忱、善良、道德的心待人。”作为一名几十年的老党员，面对时代洪流中个人有限的选择，他始终保持着面向人民的立场——在顺境与逆境之间维系责任，在个体命运与集体历史交汇的水域中，不失去人与人之间的连接。
            </p>
            <p>
              面对时代洪流，个人的自处始终与人民的需要相互缠绕。正如他回忆录的最后一句话：
            </p>
            <blockquote className="chronicle-ending__quote">
              “我们共产党人为人民服务，就是需要一颗真心真情。”
            </blockquote>
          </div>
        </div>

        <img
          className="chronicle-ending__texture"
          src={endingAssets.texture}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
        />
      </div>
    </section>
  )
}

function SceneSlot({ scene, index, layer, activeScene }: SceneSlotProps) {
  const isInAssetWindow = isSceneInAssetWindow(index, activeScene)
  const fallbackSource = layer === 'foreground' ? scene.foreground : scene.background
  const stateSources = scene.states
    ?.flatMap((state) => {
      const source = state[layer]
      if (!source) return []

      return [{
        id: state.id,
        source,
        crop: layer === 'foreground' ? state.foregroundCrop : undefined,
      }]
    })
  const sources = stateSources?.length
    ? stateSources
    : fallbackSource
      ? [{ id: undefined, source: fallbackSource, crop: undefined }]
      : []

  return (
    <div
      className={`chronicle-track-slot chronicle-track-slot--${layer}`}
      data-layer={layer}
      data-scene={index}
      data-scene-kind={scene.kind}
      style={{ '--scene-ratio': scene.sourceWidth / 1620 } as CSSProperties}
    >
      {sources.map(({ id, source, crop }) => (
        <img
          className={id ? 'chronicle-track-state' : undefined}
          src={isInAssetWindow ? source : undefined}
          data-src={source}
          data-state={id}
          data-cropped={crop ? 'true' : undefined}
          alt=""
          draggable={false}
          decoding="async"
          key={id ?? source}
          style={crop
            ? {
                inset: 'auto',
                left: `${(crop.x / crop.canvasWidth) * 100}%`,
                top: `${(crop.y / crop.canvasHeight) * 100}%`,
                width: `${(crop.width / crop.canvasWidth) * 100}%`,
                height: `${(crop.height / crop.canvasHeight) * 100}%`,
              }
            : undefined}
        />
      ))}
    </div>
  )
}

function getCueTextBlockStyle(
  cue: TextSceneCue,
  block: CueTextBlock,
): CSSProperties {
  return {
    left: `${(block.x / cue.width) * 100}%`,
    top: `${(block.y / cue.height) * 100}%`,
    width: `${(block.width / cue.width) * 100}%`,
    minHeight: `${(block.height / cue.height) * 100}%`,
    color: block.color,
    fontSize: `${(block.fontSize / 810) * 100}%`,
    lineHeight: block.lineHeight / block.fontSize,
    textAlign: block.align,
  }
}

function AnnotatedTerm({ annotation }: { annotation: CueTextAnnotation }) {
  const [isOpen, setIsOpen] = useState(false)
  const { refs: floatingRefs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [offset(10), flip(), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  })
  const hover = useHover(context, { move: false })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  return (
    <>
      <span
        className="chronicle-annotation"
        ref={(node) => floatingRefs.setReference(node)}
        tabIndex={0}
        {...getReferenceProps()}
      >
        {annotation.term}
      </span>
      <FloatingPortal>
        <span
          aria-hidden={!isOpen}
          className="chronicle-annotation__tooltip"
          ref={(node) => floatingRefs.setFloating(node)}
          style={{
            ...floatingStyles,
            visibility: isOpen ? 'visible' : 'hidden',
          }}
          {...getFloatingProps()}
        >
          {annotation.content}
        </span>
      </FloatingPortal>
    </>
  )
}

function CueBlockText({ block }: { block: CueTextBlock }) {
  if (!block.annotations?.length) return block.text

  const annotations = block.annotations
    .map((annotation) => ({
      annotation,
      index: block.text.indexOf(annotation.term),
    }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index)

  if (!annotations.length) return block.text

  const parts: React.ReactNode[] = []
  let cursor = 0

  annotations.forEach(({ annotation, index }) => {
    if (index < cursor) return
    if (index > cursor) parts.push(block.text.slice(cursor, index))
    parts.push(
      <AnnotatedTerm annotation={annotation} key={`${annotation.term}-${index}`} />,
    )
    cursor = index + annotation.term.length
  })
  if (cursor < block.text.length) parts.push(block.text.slice(cursor))

  return parts
}

function CueText({ cue }: { cue: TextSceneCue }) {
  return (
    <div className="chronicle-cue__text">
      {cue.blocks.map((block) => {
        const Tag = block.role === 'heading' ? 'h2' : 'p'

        return (
          <Tag
            className={`chronicle-cue__text-block chronicle-cue__text-block--${block.role}`}
            data-figma-text-node={block.figmaNodeId}
            key={block.figmaNodeId}
            style={getCueTextBlockStyle(cue, block)}
          >
            <CueBlockText block={block} />
          </Tag>
        )
      })}
    </div>
  )
}

function SceneContent({
  scene,
  index,
  activeScene,
  chartSvgMarkup,
  backgroundBound,
}: {
  scene: ChronicleScene
  index: number
  activeScene: number
  chartSvgMarkup: Readonly<Record<string, string>>
  backgroundBound: boolean
}) {
  const manifest = sceneCueManifests[index]
  const isInAssetWindow = isSceneInAssetWindow(index, activeScene)
  const logicalWidth = scene.sourceWidth / 2

  return (
    <div
      className="chronicle-track-slot chronicle-track-slot--content"
      data-layer="content"
      data-scene={index}
      data-motion-active={Math.abs(index - activeScene) <= 1 ? 'true' : undefined}
      style={{ '--scene-ratio': scene.sourceWidth / 1620 } as CSSProperties}
    >
      {manifest.cues.filter(
        (item) => BACKGROUND_BOUND_CUE_IDS.has(item.id) === backgroundBound,
      ).map((item) => {
        const x = normalizeCueValue(item.x, manifest.frameHeight)
        const y = normalizeCueValue(item.y, manifest.frameHeight)
        const width = normalizeCueValue(item.width, manifest.frameHeight)
        const height = normalizeCueValue(item.height, manifest.frameHeight)

        return (
          <div
            className={`chronicle-cue chronicle-cue--${item.kind} ${item.mode === 'initial' ? 'chronicle-cue--initial' : ''}`}
            data-cue={item.id}
            data-cue-kind={item.kind}
            data-cue-mode={item.mode}
            data-figma-node={item.figmaNodeId}
            key={item.id}
            style={{
              left: `${(x / logicalWidth) * 100}%`,
              top: `${(y / 810) * 100}%`,
              width: `${(width / logicalWidth) * 100}%`,
              height: `${(height / 810) * 100}%`,
            }}
          >
            {isTextCue(item) ? (
              <CueText cue={item} />
            ) : item.kind === 'chart'
              && LAYER_ANIMATED_CHART_IDS.has(item.id)
              && chartSvgMarkup[item.id] ? (
              <div
                className="chronicle-cue__svg"
                dangerouslySetInnerHTML={{ __html: chartSvgMarkup[item.id] }}
              />
            ) : item.kind === 'chart' ? (
              <img
                src={isInAssetWindow ? item.svgAsset : undefined}
                data-src={item.svgAsset}
                alt=""
                draggable={false}
                decoding="async"
              />
            ) : (
              <img
                src={isInAssetWindow ? item.asset : undefined}
                data-src={item.asset}
                alt=""
                draggable={false}
                decoding="async"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function TrackSurface({
  track,
  surface,
  activeScene,
  chartSvgMarkup,
  backgroundBound = false,
}: {
  track: NarrativeTrack
  surface: TrackSurfaceKind
  activeScene: number
  chartSvgMarkup: Readonly<Record<string, string>>
  backgroundBound?: boolean
}) {
  return (
    <div
      className={`chronicle-track-surface chronicle-track-surface--${track} chronicle-track-surface--${surface}`}
      data-track={track}
      data-surface={surface}
      data-active={chronicleScenes[activeScene]?.track === track ? 'true' : undefined}
    >
      {chronicleScenes.map((scene, index) => {
        if (scene.track !== track) return null
        if (surface === 'content') {
          return (
            <SceneContent
              key={`${track}-content-${scene.id}`}
              scene={scene}
              index={index}
              activeScene={activeScene}
              chartSvgMarkup={chartSvgMarkup}
              backgroundBound={backgroundBound}
            />
          )
        }

        return (
          <SceneSlot
            key={`${track}-${surface}-${scene.id}`}
            scene={scene}
            index={index}
            layer={surface}
            activeScene={activeScene}
          />
        )
      })}
    </div>
  )
}

function getTrackSurfaces(root: HTMLElement, track: NarrativeTrack) {
  return gsap.utils.toArray<HTMLElement>(
    `.chronicle-track-surface[data-track="${track}"]`,
    root,
  )
}

function getTrackX(
  root: HTMLElement,
  viewport: HTMLElement,
  sceneIndex: number,
  progress: number,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot[data-scene="${sceneIndex}"]`,
  )
  if (!slot) return 0

  const overflow = Math.max(0, slot.offsetWidth - viewport.clientWidth)
  const centered = Math.max(0, (viewport.clientWidth - slot.offsetWidth) / 2)
  return -slot.offsetLeft + centered - overflow * progress
}

function getScene03GroupCenterProgress(
  root: HTMLElement,
  viewport: HTMLElement,
  sceneIndex: number,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot[data-scene="${sceneIndex}"]`,
  )
  if (!slot) return 0

  const overflow = Math.max(0, slot.offsetWidth - viewport.clientWidth)
  if (overflow === 0) return 0

  const groupCenterX = slot.offsetWidth * SCENE_03_GROUP_CENTER_X
  return gsap.utils.clamp(
    0,
    1,
    (groupCenterX - viewport.clientWidth / 2) / overflow,
  )
}

function getScene03PhaseRatios() {
  return {
    panInEnd: SCENE_03_PAN_IN_DURATION / SCENE_03_CAMERA_DURATION,
    morphStart: (
      SCENE_03_PAN_IN_DURATION + SCENE_03_ORIGINAL_HOLD_DURATION
    ) / SCENE_03_CAMERA_DURATION,
    morphEnd: (
      SCENE_03_PAN_IN_DURATION
      + SCENE_03_ORIGINAL_HOLD_DURATION
      + SCENE_03_MORPH_DURATION
    ) / SCENE_03_CAMERA_DURATION,
    panOutStart: (
      SCENE_03_PAN_IN_DURATION
      + SCENE_03_ORIGINAL_HOLD_DURATION
      + SCENE_03_MORPH_DURATION
      + SCENE_03_CHANGED_HOLD_DURATION
    ) / SCENE_03_CAMERA_DURATION,
  }
}

function getScene03CameraProgress(
  cameraPhaseProgress: number,
  centerProgress: number,
  endProgress: number,
) {
  const phases = getScene03PhaseRatios()

  if (cameraPhaseProgress <= phases.panInEnd) {
    return centerProgress * (
      cameraPhaseProgress / Math.max(phases.panInEnd, Number.EPSILON)
    )
  }
  if (cameraPhaseProgress <= phases.panOutStart) return centerProgress

  const panOutProgress = (
    cameraPhaseProgress - phases.panOutStart
  ) / Math.max(1 - phases.panOutStart, Number.EPSILON)
  return centerProgress + (endProgress - centerProgress) * panOutProgress
}

function getScene03MorphProgress(cameraPhaseProgress: number) {
  const phases = getScene03PhaseRatios()
  return gsap.utils.clamp(
    0,
    1,
    (cameraPhaseProgress - phases.morphStart)
      / Math.max(phases.morphEnd - phases.morphStart, Number.EPSILON),
  )
}

function getBlackboardHorizontalClip(
  root: HTMLElement,
  viewport: HTMLElement,
  progress: number,
  mask: Scene4Mask,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot[data-scene="${BLACKBOARD_SCENE_INDEX}"]`,
  )
  if (!slot || mask.points.length < 2) return 'none'

  const sourceXs = mask.points.map(({ x }) => x)
  const sourceLeft = Math.min(...sourceXs)
  const sourceRight = Math.max(...sourceXs)
  const sourceScale = slot.offsetWidth / mask.sourceWidth
  const trackX = getTrackX(root, viewport, BLACKBOARD_SCENE_INDEX, progress)
  const screenLeft = trackX + slot.offsetLeft + sourceLeft * sourceScale
  const screenRight = trackX + slot.offsetLeft + sourceRight * sourceScale
  const leftInset = Math.min(viewport.clientWidth, Math.max(0, screenLeft))
  const rightInset = Math.min(
    viewport.clientWidth,
    Math.max(0, viewport.clientWidth - screenRight),
  )

  return `inset(0px ${rightInset}px 0px ${leftInset}px)`
}

function getCueEntryProgress(
  root: HTMLElement,
  viewport: HTMLElement,
  sceneIndex: number,
  cues: HTMLElement[],
  viewportX: number,
) {
  const slot = root.querySelector<HTMLElement>(
    `.chronicle-track-slot--content[data-scene="${sceneIndex}"]`,
  )
  if (!slot || !cues.length) return 0

  const overflow = Math.max(0, slot.offsetWidth - viewport.clientWidth)
  if (overflow === 0) return 0

  const firstCueX = Math.min(...cues.map((cue) => cue.offsetLeft))
  const triggerX = viewport.clientWidth * viewportX
  return Math.min(1, Math.max(0, (firstCueX - triggerX) / overflow))
}

function getCoverPrefaceX(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const target = viewport.clientWidth * 0.25
    - panorama.offsetWidth * motion.coverAnchorX
  const minimumX = Math.min(0, viewport.clientWidth - panorama.offsetWidth)
  return Math.min(0, Math.max(minimumX, target))
}

function getCoverWindowX(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const target = viewport.clientWidth * 0.25
    - panorama.offsetWidth * motion.windowAnchorX
  const minimumX = Math.min(0, viewport.clientWidth - panorama.offsetWidth)
  return Math.min(0, Math.max(minimumX, target))
}

function getCoverZoomEnd(
  panorama: HTMLElement,
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const windowX = getCoverWindowX(panorama, viewport, motion)
  const scale = 1 / motion.sceneMatchScale
  const { x: matchX, y: matchY } = getSceneMatchOffset(viewport, motion)
  const originX = scale * matchX / (scale - 1)
  const originY = scale * matchY / (scale - 1)

  return {
    scale,
    x: originX + scale * (windowX - originX),
    y: originY + scale * -originY,
  }
}

function getSceneMatchOffset(
  viewport: HTMLElement,
  motion: CoverMotionConfig,
) {
  const safeWidth = Math.min(viewport.clientWidth, viewport.clientHeight * (16 / 9))
  return {
    x: safeWidth * (motion.sceneMatchX / 100),
    y: viewport.clientHeight * (motion.sceneMatchY / 100),
  }
}

function getSceneCues(root: HTMLElement, index: number) {
  return gsap.utils.toArray<HTMLElement>(
    `.chronicle-track-slot--content[data-scene="${index}"] .chronicle-cue[data-cue-mode="scroll"]`,
    root,
  )
}

function findSceneOnTrack(
  startIndex: number,
  track: NarrativeTrack,
  direction: 1 | -1 = 1,
) {
  for (
    let index = startIndex;
    index >= 0 && index < chronicleScenes.length;
    index += direction
  ) {
    if (chronicleScenes[index].track === track) return index
  }
  return null
}

function getBoatYPercent(sceneId: number) {
  return sceneId >= ELEVATED_BOAT_START_SCENE_ID
    ? ELEVATED_BOAT_Y_PERCENT
    : BOAT_Y_PERCENT
}

function addCueAnimations(
  timeline: gsap.core.Timeline,
  cues: HTMLElement[],
  sceneStart: number,
  revealDuration: number,
  reducedMotion: boolean,
) {
  if (!cues.length) return

  if (revealDuration <= 0) {
    timeline.set(cues, { autoAlpha: 1, y: 0 }, sceneStart)
    const chartLayers = cues.flatMap((cue) => (
      cue.dataset.cueKind === 'chart' ? getChartAnimationLayers(cue) : []
    ))
    timeline.set(chartLayers, { autoAlpha: 1, y: 0 }, sceneStart)
    return
  }

  timeline.set(cues, {
    autoAlpha: 0,
    y: reducedMotion ? 0 : 14,
  }, sceneStart)

  const ordered = [...cues].sort((a, b) => {
    const priority = { title: 0, copy: 1, chart: 2, illustration: 3, source: 4 }
    return priority[a.dataset.cueKind as keyof typeof priority]
      - priority[b.dataset.cueKind as keyof typeof priority]
  })
  const step = ordered.length > 1 ? revealDuration * 0.48 / (ordered.length - 1) : 0
  const cueDuration = Math.max(0.06, revealDuration * 0.52)

  ordered.forEach((item, cueIndex) => {
    const at = sceneStart + cueIndex * step
    const kind = item.dataset.cueKind

    if (kind === 'illustration') {
      timeline.fromTo(item, {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 38,
        rotation: reducedMotion ? 0 : -2.4,
        scale: reducedMotion ? 1 : 0.94,
        transformOrigin: '22% 82%',
      }, {
        autoAlpha: 1,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: reducedMotion ? 0.06 : Math.max(0.24, cueDuration * 1.15),
        ease: reducedMotion ? 'none' : 'power3.out',
        immediateRender: false,
      }, at)
      return
    }

    if (kind === 'chart') {
      const layers = getChartAnimationLayers(item)

      if (!layers.length) {
        timeline.set(item, {
          autoAlpha: 1,
          y: 0,
        }, at)
        return
      }

      timeline.set(item, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        clipPath: 'none',
      }, at)

      if (reducedMotion || !layers.length) return

      const layerDuration = Math.max(0.08, cueDuration * 0.55)
      const stagger = layers.length > 1
        ? Math.max(0.008, (cueDuration - layerDuration) / (layers.length - 1))
        : 0
      timeline.fromTo(layers, {
        autoAlpha: 0,
        y: 12,
      }, {
        autoAlpha: 1,
        y: 0,
        duration: layerDuration,
        stagger,
        ease: 'power1.out',
        immediateRender: false,
      }, at)
      return
    }

    timeline.fromTo(
      item,
      {
        autoAlpha: 0,
        y: reducedMotion ? 0 : 14,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: cueDuration,
        ease: reducedMotion ? 'none' : 'power2.out',
        immediateRender: false,
      },
      at,
    )
  })
}

function getChartAnimationLayers(cue: HTMLElement) {
  const svg = cue.querySelector<SVGSVGElement>('svg')
  if (!svg) return []

  const ignoredTags = new Set(['defs', 'mask', 'clippath', 'filter'])
  const visibleChildren = (element: Element) => Array.from(element.children).filter(
    (child) => !ignoredTags.has(child.tagName.toLowerCase()),
  )
  let root = visibleChildren(svg).find(
    (child): child is SVGGElement => child.tagName.toLowerCase() === 'g',
  )
  if (!root) return []

  while (visibleChildren(root).length === 1) {
    const onlyChild = visibleChildren(root)[0]
    if (onlyChild.tagName.toLowerCase() !== 'g') break
    root = onlyChild as SVGGElement
  }

  const primaryLayers = visibleChildren(root)
  const candidates = primaryLayers.flatMap((layer) => {
    const children = visibleChildren(layer)
    if (
      primaryLayers.length <= 3
      && layer.tagName.toLowerCase() === 'g'
      && children.length > 1
      && children.length <= 10
    ) {
      return children
    }
    return [layer]
  }) as SVGGraphicsElement[]

  const safeLayers = candidates.filter((layer) => {
    const hasExpensiveEffect = layer.matches('[filter], [mask]')
      || Boolean(layer.querySelector('[filter], [mask], foreignObject'))

    return !hasExpensiveEffect
  })

  return safeLayers.length <= MAX_CHART_ANIMATION_LAYERS ? safeLayers : []
}

function addTrackTransition(
  timeline: gsap.core.Timeline,
  root: HTMLElement,
  viewport: HTMLElement,
  scene: ChronicleScene,
  nextScene: ChronicleScene,
  nextIndex: number,
  at: number,
  duration: number,
  reducedMotion: boolean,
  motion: CoverMotionConfig,
) {
  if (scene.track === nextScene.track) {
    const surfaces = getTrackSurfaces(root, scene.track)
    timeline.to(surfaces, {
      x: () => getTrackX(root, viewport, nextIndex, 0),
      duration,
      ease: 'none',
    }, at)
    return
  }

  const interiorLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground, .chronicle-world-layer--interior-content',
    root,
  )
  const interiorForegroundLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground',
    root,
  )
  const interiorContentLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--interior-content',
    root,
  )
  const exteriorContentLayers = gsap.utils.toArray<HTMLElement>(
    '.chronicle-world-layer--exterior-content',
    root,
  )

  if (
    scene.id === WINDOW_PORTAL_SCENE_ID
    && nextScene.id === WINDOW_PORTAL_SCENE_ID + 1
  ) {
    timeline.set(exteriorContentLayers, { autoAlpha: 1 }, at)
    timeline.set(interiorLayers, {
      autoAlpha: 0,
      scale: 1,
      transformOrigin: '50% 46%',
    }, at)
    return
  }

  if (scene.transition === 'horizontal') {
    const currentSurfaces = getTrackSurfaces(root, scene.track)
    const nextSurfaces = getTrackSurfaces(root, nextScene.track)
    const nextLayers = gsap.utils.toArray<HTMLElement>(
      `.chronicle-world-layer--${nextScene.track}-background, .chronicle-world-layer--${nextScene.track}-foreground, .chronicle-world-layer--${nextScene.track}-content`,
      root,
    )

    if (reducedMotion) {
      timeline.set(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0),
      }, at)
      timeline.set(nextLayers, {
        autoAlpha: 1,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
      }, at)
    } else {
      timeline.set(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0) + viewport.clientWidth,
      }, at)
      timeline.set(nextLayers, {
        autoAlpha: 1,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 100%)',
      }, at)
      timeline.to(currentSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex - 1, 1) - viewport.clientWidth,
        duration,
        ease: 'none',
      }, at)
      timeline.to(nextSurfaces, {
        x: () => getTrackX(root, viewport, nextIndex, 0),
        duration,
        ease: 'none',
      }, at)
      timeline.to(nextLayers, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration,
        ease: 'none',
      }, at)
    }

    if (nextScene.track === 'interior') {
      timeline.set(exteriorContentLayers, { autoAlpha: 0 }, at + duration)
    } else {
      timeline.set(interiorLayers, { autoAlpha: 0 }, at + duration)
    }
    return
  }

  if (reducedMotion) {
    timeline.to(interiorLayers, {
      autoAlpha: nextScene.track === 'interior' ? 1 : 0,
      scale: 1,
      duration,
      ease: 'none',
    }, at)
    timeline.to(exteriorContentLayers, {
      autoAlpha: nextScene.track === 'exterior' ? 1 : 0,
      duration,
      ease: 'none',
    }, at)
    return
  }

  if (nextScene.track === 'exterior') {
    timeline.set(exteriorContentLayers, { autoAlpha: 1 }, at)
    const isOpeningDive = scene.id === 1
    const diveScale = isOpeningDive ? motion.scene1DiveScale : 3.2
    const fadeStart = isOpeningDive ? 0 : 0.38

    timeline.to(interiorContentLayers, {
      autoAlpha: 0,
      duration: duration * 0.18,
      ease: 'none',
    }, at)
    timeline.to(interiorForegroundLayers, {
      scale: diveScale,
      transformOrigin: '50% 46%',
      duration,
      ease: 'none',
    }, at)
    timeline.to(interiorForegroundLayers, {
      autoAlpha: 0,
      duration: duration * (1 - fadeStart),
      ease: 'none',
    }, at + duration * fadeStart)
    return
  }

  timeline.to(exteriorContentLayers, {
    autoAlpha: 0,
    duration: duration * 0.2,
    ease: 'none',
  }, at)
  timeline.to(interiorLayers, {
    autoAlpha: 1,
    scale: 1,
    transformOrigin: '50% 46%',
    duration,
    ease: 'power1.inOut',
  }, at)
}

function readStaticPreview() {
  const params = new URLSearchParams(window.location.search)
  if (params.get('static') !== '1') return null

  const scene = Math.min(
    chronicleScenes.length - 1,
    Math.max(0, Number(params.get('scene') ?? 1) - 1),
  )
  const progress = Math.min(1, Math.max(0, Number(params.get('progress') ?? 0.5)))
  return { scene, progress }
}

function readTimelineProbe() {
  if (!import.meta.env.DEV) return null

  const params = new URLSearchParams(window.location.search)
  if (params.get('timelineProbe') !== '1') return null

  const scene = Math.min(
    chronicleScenes.length - 1,
    Math.max(0, Number(params.get('scene') ?? 1) - 1),
  )
  const progress = Math.min(1, Math.max(0, Number(params.get('progress') ?? 0)))
  return { scene, progress }
}

function getCameraProgress(scene: ChronicleScene, localProgress: number) {
  const cameraStart = scene.timing.contentRevealRatio + scene.timing.contentHoldRatio
  if (localProgress <= cameraStart) return 0
  if (localProgress >= cameraStart + scene.timing.cameraRatio) return 1
  return (localProgress - cameraStart) / scene.timing.cameraRatio
}

function getCameraEndProgress(
  scene: ChronicleScene,
  motion: CoverMotionConfig,
) {
  if (scene.id === 1) return motion.scene1CameraEndProgress
  if (scene.id === WINDOW_PORTAL_SCENE_ID) {
    return WINDOW_SCENE_CAMERA_END_PROGRESS
  }
  return 1
}

function getCueProgress(scene: ChronicleScene, localProgress: number) {
  if (scene.timing.contentRevealRatio === 0) return 1
  return Math.min(1, Math.max(0, localProgress / scene.timing.contentRevealRatio))
}

function roundDebugValue(value: number, digits = 4) {
  if (!Number.isFinite(value)) return null
  return Number(value.toFixed(digits))
}

function getDebugRect(element: Element, frameRect?: DOMRect) {
  const rect = element.getBoundingClientRect()

  return {
    x: roundDebugValue(rect.x, 2),
    y: roundDebugValue(rect.y, 2),
    width: roundDebugValue(rect.width, 2),
    height: roundDebugValue(rect.height, 2),
    right: roundDebugValue(rect.right, 2),
    bottom: roundDebugValue(rect.bottom, 2),
    frameX: frameRect ? roundDebugValue(rect.x - frameRect.x, 2) : null,
    frameY: frameRect ? roundDebugValue(rect.y - frameRect.y, 2) : null,
  }
}

function describeDebugElement(element: Element, frameRect?: DOMRect) {
  const htmlElement = element as HTMLElement
  const style = getComputedStyle(htmlElement)
  const slot = htmlElement.closest<HTMLElement>('[data-scene]')
  const worldLayer = htmlElement.closest<HTMLElement>('.chronicle-world-layer')

  return {
    tag: element.tagName.toLowerCase(),
    className: htmlElement.className,
    sceneIndex: slot?.dataset.scene ?? null,
    cue: htmlElement.dataset.cue ?? null,
    layer: htmlElement.dataset.layer
      ?? htmlElement.dataset.surface
      ?? worldLayer?.className
      ?? null,
    opacity: style.opacity,
    visibility: style.visibility,
    display: style.display,
    transform: style.transform,
    clipPath: style.clipPath,
    zIndex: style.zIndex,
    rect: getDebugRect(element, frameRect),
  }
}

function getSceneDebugPhase(scene: ChronicleScene, localProgress: number) {
  const revealEnd = scene.timing.contentRevealRatio
  const holdEnd = revealEnd + scene.timing.contentHoldRatio
  const cameraEnd = holdEnd + scene.timing.cameraRatio

  if (localProgress < revealEnd) return 'content-reveal'
  if (localProgress < holdEnd) return 'content-hold'
  if (localProgress < cameraEnd) return 'camera'
  return 'transition'
}

type ChronicleDebugWindow = Window & {
  __chronicleDebugSnapshot?: unknown
  __chronicleInspectPoint?: (x: number, y: number) => unknown
}

type ScrollDistanceSpec = {
  timelineStart: number
  timelineEnd: number
  sceneIndex?: number
  cameraEndProgress?: number
}

type ScrollMappingSegment = {
  timelineStart: number
  timelineEnd: number
  scrollStart: number
  scrollEnd: number
}

function buildScrollMapping(
  specs: readonly ScrollDistanceSpec[],
  root: HTMLElement,
  viewport: HTMLElement,
) {
  let scrollCursor = 0

  return specs.map((spec) => {
    const timelineDuration = spec.timelineEnd - spec.timelineStart
    const legacyDistance = (
      timelineDuration
      * viewport.clientHeight
      * SCROLL_DISTANCE_PER_TIMELINE_SECOND
    )
    const scrollDistance = spec.sceneIndex === undefined
      ? legacyDistance
      : Math.max(
          Math.abs(
            getTrackX(
              root,
              viewport,
              spec.sceneIndex,
              spec.cameraEndProgress ?? 1,
            ) - getTrackX(root, viewport, spec.sceneIndex, 0),
          ) / TARGET_CAMERA_SCROLL_GAIN,
          Math.min(
            legacyDistance,
            viewport.clientHeight * MIN_CAMERA_SCROLL_DISTANCE_VH,
          ),
        )
    const segment = {
      timelineStart: spec.timelineStart,
      timelineEnd: spec.timelineEnd,
      scrollStart: scrollCursor,
      scrollEnd: scrollCursor + scrollDistance,
    }

    scrollCursor = segment.scrollEnd
    return segment
  })
}

function mapScrollProgressToTimelineTime(
  progress: number,
  mapping: readonly ScrollMappingSegment[],
  timelineDuration: number,
) {
  const totalScrollDistance = mapping.at(-1)?.scrollEnd ?? 0
  if (totalScrollDistance <= 0) return progress * timelineDuration

  const scrollPosition = gsap.utils.clamp(0, 1, progress) * totalScrollDistance
  const segment = mapping.find(({ scrollEnd }) => scrollPosition <= scrollEnd)
  if (!segment) return timelineDuration

  const segmentScrollDistance = segment.scrollEnd - segment.scrollStart
  const segmentProgress = segmentScrollDistance > 0
    ? (scrollPosition - segment.scrollStart) / segmentScrollDistance
    : 1

  return gsap.utils.interpolate(
    segment.timelineStart,
    segment.timelineEnd,
    segmentProgress,
  )
}

function mapTimelineTimeToScrollProgress(
  time: number,
  mapping: readonly ScrollMappingSegment[],
  timelineDuration: number,
) {
  const totalScrollDistance = mapping.at(-1)?.scrollEnd ?? 0
  if (totalScrollDistance <= 0) return time / Math.max(timelineDuration, Number.EPSILON)

  const segment = mapping.find(({ timelineEnd }) => time <= timelineEnd)
  if (!segment) return 1

  const segmentTimelineDuration = segment.timelineEnd - segment.timelineStart
  const segmentProgress = segmentTimelineDuration > 0
    ? (time - segment.timelineStart) / segmentTimelineDuration
    : 1
  const scrollPosition = gsap.utils.interpolate(
    segment.scrollStart,
    segment.scrollEnd,
    segmentProgress,
  )

  return scrollPosition / totalScrollDistance
}

export function ScrollChronicle({ reducedMotion }: { reducedMotion: boolean }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null)
  const sceneStartsRef = useRef<number[]>([])
  const scrollMappingRef = useRef<ScrollMappingSegment[]>([])
  const staticPreview = useMemo(() => readStaticPreview(), [])
  const timelineProbe = useMemo(() => readTimelineProbe(), [])
  const isMotionDebug = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return import.meta.env.DEV && params.get('debugMotion') === '1'
  }, [])
  const [coverMotion, setCoverMotion] = useState(readCoverMotionConfig)
  const scene4Mask = useMemo(() => readScene4Mask(), [])
  const chartAssets = useMemo(
    () => sceneCueManifests.flatMap((manifest) => manifest.cues)
      .filter((cue): cue is ChartSceneCue => (
        cue.kind === 'chart' && LAYER_ANIMATED_CHART_IDS.has(cue.id)
      ))
      .map((cue) => ({ id: cue.id, asset: cue.svgAsset })),
    [],
  )
  const [chartSvgMarkup, setChartSvgMarkup] = useState<Readonly<Record<string, string>> | null>(null)
  const initialScene = staticPreview?.scene ?? timelineProbe?.scene ?? 0
  const activeSceneRef = useRef(initialScene)
  const [activeScene, setActiveScene] = useState(initialScene)

  useEffect(() => {
    const shell = rootRef.current?.closest<HTMLElement>('.app-shell')
    if (!shell) return

    const refreshAfterShellEntry = (event: TransitionEvent) => {
      if (event.target === shell && event.propertyName === 'transform') {
        ScrollTrigger.refresh()
      }
    }

    shell.addEventListener('transitionend', refreshAfterShellEntry)
    return () => shell.removeEventListener('transitionend', refreshAfterShellEntry)
  }, [])

  const jumpToSceneStart = (sceneNumber: number) => {
    const timeline = timelineRef.current
    const trigger = scrollTriggerRef.current
    const sceneIndex = sceneNumber - 1
    const sceneStart = sceneStartsRef.current[sceneIndex]
    if (!timeline || !trigger || sceneStart === undefined) return

    const timelineProgress = mapTimelineTimeToScrollProgress(
      sceneStart,
      scrollMappingRef.current,
      timeline.duration(),
    )
    const targetScrollY = Math.ceil(
      trigger.start + (trigger.end - trigger.start) * timelineProgress,
    )

    window.scrollTo({ top: targetScrollY, behavior: 'auto' })
    requestAnimationFrame(() => ScrollTrigger.update())
    console.info(`[Chronicle debug] 已跳转到第 ${sceneNumber} 屏`, {
      sceneId: chronicleScenes[sceneIndex].id,
      sceneStart,
      timelineProgress,
      targetScrollY,
    })
  }

  const printDebugSnapshot = () => {
    const root = rootRef.current
    const frame = frameRef.current
    const timeline = timelineRef.current
    const trigger = scrollTriggerRef.current
    if (!root || !frame) return

    const frameRect = frame.getBoundingClientRect()
    const sceneIndex = activeSceneRef.current
    const scene = chronicleScenes[sceneIndex]
    const sceneStart = sceneStartsRef.current[sceneIndex]
    const timelineTime = timeline?.time() ?? null
    const sceneLocalTime = timelineTime !== null && sceneStart !== undefined
      ? Math.min(scene.duration, Math.max(0, timelineTime - sceneStart))
      : staticPreview
        ? staticPreview.progress * scene.duration
        : 0
    const sceneLocalProgress = scene.duration > 0
      ? sceneLocalTime / scene.duration
      : 0
    const cameraPhaseProgress = getCameraProgress(scene, sceneLocalProgress)
    const sceneRange = new Set([
      Math.max(0, sceneIndex - 1),
      sceneIndex,
      Math.min(chronicleScenes.length - 1, sceneIndex + 1),
    ])

    const layers = Array.from(
      root.querySelectorAll<HTMLElement>('.chronicle-world-layer'),
      (layer) => {
        const style = getComputedStyle(layer)
        const surfaces = Array.from(
          layer.querySelectorAll<HTMLElement>('.chronicle-track-surface'),
          (surface) => ({
            track: surface.dataset.track ?? null,
            surface: surface.dataset.surface ?? null,
            x: gsap.getProperty(surface, 'x'),
            opacity: getComputedStyle(surface).opacity,
            transform: getComputedStyle(surface).transform,
            rect: getDebugRect(surface, frameRect),
          }),
        )

        return {
          className: layer.className,
          opacity: style.opacity,
          visibility: style.visibility,
          clipPath: style.clipPath,
          transform: style.transform,
          zIndex: style.zIndex,
          surfaces,
        }
      },
    )

    const cues = Array.from(root.querySelectorAll<HTMLElement>('.chronicle-cue'))
      .filter((cue) => {
        const cueScene = Number(cue.closest<HTMLElement>('[data-scene]')?.dataset.scene)
        return sceneRange.has(cueScene)
      })
      .map((cue) => describeDebugElement(cue, frameRect))

    const images = Array.from(root.querySelectorAll<HTMLImageElement>('[data-scene] img'))
      .filter((image) => {
        const imageScene = Number(image.closest<HTMLElement>('[data-scene]')?.dataset.scene)
        return sceneRange.has(imageScene)
      })
      .map((image) => ({
        ...describeDebugElement(image, frameRect),
        src: image.currentSrc || image.dataset.src || null,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      }))

    const inspectPoint = (x: number, y: number) => {
      const stack = document.elementsFromPoint(x, y)
        .map((element) => describeDebugElement(element, frameRect))
      console.groupCollapsed(`[Chronicle point] x=${x}, y=${y}`)
      console.table(stack)
      console.groupEnd()
      return stack
    }

    const snapshot = {
      capturedAt: new Date().toISOString(),
      url: window.location.href,
      environment: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        visualViewport: window.visualViewport
          ? {
              width: roundDebugValue(window.visualViewport.width, 2),
              height: roundDebugValue(window.visualViewport.height, 2),
              scale: window.visualViewport.scale,
              offsetLeft: window.visualViewport.offsetLeft,
              offsetTop: window.visualViewport.offsetTop,
            }
          : null,
        scrollY: roundDebugValue(window.scrollY, 2),
        scrollHeight: document.documentElement.scrollHeight,
        reducedMotion,
        userAgent: navigator.userAgent,
      },
      scrollTrigger: trigger
        ? {
            start: roundDebugValue(trigger.start, 2),
            end: roundDebugValue(trigger.end, 2),
            progress: roundDebugValue(trigger.progress, 6),
            direction: trigger.direction,
            velocity: roundDebugValue(trigger.getVelocity(), 2),
            isActive: trigger.isActive,
          }
        : null,
      timeline: timeline
        ? {
            time: roundDebugValue(timeline.time(), 6),
            duration: roundDebugValue(timeline.duration(), 6),
            progress: roundDebugValue(timeline.progress(), 6),
          }
        : null,
      scene: {
        index: sceneIndex,
        number: sceneIndex + 1,
        id: scene.id,
        title: scene.title,
        track: scene.track,
        transition: scene.transition,
        duration: scene.duration,
        startTime: sceneStart ?? null,
        localTime: roundDebugValue(sceneLocalTime, 6),
        localProgress: roundDebugValue(sceneLocalProgress, 6),
        phase: getSceneDebugPhase(scene, sceneLocalProgress),
        timing: scene.timing,
        cameraPhaseProgress: roundDebugValue(cameraPhaseProgress, 6),
        cameraTrackProgress: roundDebugValue(
          cameraPhaseProgress * getCameraEndProgress(scene, coverMotion),
          6,
        ),
      },
      frame: getDebugRect(frame),
      layers,
      cues,
      images,
      centerStack: inspectPoint(
        Math.round(frameRect.left + frameRect.width / 2),
        Math.round(frameRect.top + frameRect.height / 2),
      ),
    }

    const debugWindow = window as ChronicleDebugWindow
    debugWindow.__chronicleDebugSnapshot = snapshot
    debugWindow.__chronicleInspectPoint = inspectPoint

    console.group(`[Chronicle debug] Scene_${String(scene.id).padStart(2, '0')} · ${snapshot.scene.phase}`)
    console.log('完整快照', snapshot)
    console.table(layers.flatMap((layer) => (
      layer.surfaces.map((surface) => ({
        worldLayer: layer.className,
        layerOpacity: layer.opacity,
        layerVisibility: layer.visibility,
        ...surface,
      }))
    )))
    console.table(cues)
    console.table(images)
    console.info('坐标检查：__chronicleInspectPoint(x, y)')
    console.groupEnd()

    navigator.clipboard?.writeText(JSON.stringify(snapshot, null, 2)).catch(() => {
      // Console output remains available when clipboard permission is denied.
    })
  }

  useEffect(() => {
    let cancelled = false

    Promise.all(chartAssets.map(async ({ id, asset }) => {
      const response = await fetch(asset)
      if (!response.ok) throw new Error(`Unable to load ${id} SVG`)
      return [id, await response.text()] as const
    })).then((entries) => {
      if (!cancelled) setChartSvgMarkup(Object.fromEntries(entries))
    }).catch(() => {
      if (!cancelled) setChartSvgMarkup({})
    })

    return () => {
      cancelled = true
    }
  }, [chartAssets])

  useLayoutEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const viewport = frameRef.current
    if (!root || !stage || !viewport || chartSvgMarkup === null) return

    const sceneStarts: number[] = []
    const context = gsap.context(() => {
      const allSurfaces = gsap.utils.toArray<HTMLElement>('.chronicle-track-surface', root)
      const allScrollCues = gsap.utils.toArray<HTMLElement>(
        '[data-cue-mode="scroll"]',
        root,
      )
      const initialCues = gsap.utils.toArray<HTMLElement>(
        '.chronicle-cue[data-cue-mode="initial"]',
        root,
      )
      const boat = root.querySelector<HTMLElement>('.chronicle-boat')
      const boatViewport = root.querySelector<HTMLElement>('.chronicle-boat-viewport')
      const boatSkins = gsap.utils.toArray<HTMLElement>('[data-boat-skin]', root)
      const interiorSurfaces = getTrackSurfaces(root, 'interior')
      const exteriorSurfaces = getTrackSurfaces(root, 'exterior')
      const exteriorContentLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-content',
        root,
      )
      const exteriorBackdropLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-background, .chronicle-world-layer--exterior-foreground',
        root,
      )
      const exteriorWorldLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--exterior-background, .chronicle-world-layer--exterior-foreground, .chronicle-world-layer--exterior-content',
        root,
      )
      const interiorLayers = gsap.utils.toArray<HTMLElement>(
        '.chronicle-world-layer--interior-background, .chronicle-world-layer--interior-foreground, .chronicle-world-layer--interior-content',
        root,
      )
      const coverLayer = root.querySelector<HTMLElement>('[data-cover-layer]')
      const coverPanorama = root.querySelector<HTMLElement>('[data-cover-panorama]')
      const prefaceMask = root.querySelector<HTMLElement>('[data-cover-preface-mask]')
      const prefaceCopy = root.querySelector<HTMLElement>('[data-cover-preface-copy]')
      const endingLayer = root.querySelector<HTMLElement>('[data-ending-layer]')
      const rainLayer = root.querySelector<HTMLElement>('[data-rain]')
      const crossfadeSceneIndex = chronicleScenes.findIndex(
        (scene) => scene.id === CROSSFADE_SCENE_ID,
      )
      const crossfadeState00 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${crossfadeSceneIndex}"] .chronicle-track-state[data-state="00"]`,
        root,
      )
      const crossfadeState01 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${crossfadeSceneIndex}"] .chronicle-track-state[data-state="01"]`,
        root,
      )
      const delayedForegroundSceneIndex = chronicleScenes.findIndex(
        (scene) => scene.id === DELAYED_FOREGROUND_SCENE_ID,
      )
      const delayedForegroundState01 = gsap.utils.toArray<HTMLElement>(
        `.chronicle-track-slot[data-scene="${delayedForegroundSceneIndex}"] .chronicle-track-state[data-state="01"]`,
        root,
      )
      const firstInterior = findSceneOnTrack(0, 'interior') ?? 0
      const firstExterior = findSceneOnTrack(0, 'exterior') ?? 0

      gsap.set(allSurfaces, { autoAlpha: 1, scale: 1, transformOrigin: '50% 46%' })
      gsap.set(allScrollCues, { autoAlpha: 0, y: 0 })
      gsap.set(initialCues, { autoAlpha: 1, y: 0 })
      gsap.set(endingLayer, { autoAlpha: 0, xPercent: 100 })
      gsap.set(boatSkins, { autoAlpha: 0 })
      gsap.set(boatViewport, { zIndex: 3, clipPath: 'none' })
      gsap.set(rainLayer, { autoAlpha: 0 })
      gsap.set(crossfadeState00, { autoAlpha: 1 })
      gsap.set(crossfadeState01, { autoAlpha: 0 })
      gsap.set(delayedForegroundState01, {
        autoAlpha: 0,
        scale: reducedMotion ? 1 : 0.985,
      })
      gsap.set(interiorSurfaces, {
        x: () => getTrackX(root, viewport, firstInterior, 0),
      })
      gsap.set(exteriorSurfaces, {
        x: () => getTrackX(root, viewport, firstExterior, 0),
      })
      gsap.set(exteriorContentLayers, { autoAlpha: 0 })

      if (coverLayer && coverPanorama && prefaceCopy) {
        gsap.set(coverLayer, { autoAlpha: 1 })
        gsap.set(exteriorWorldLayers, { autoAlpha: 0 })
        gsap.set(coverPanorama, {
          x: 0,
          y: 0,
          scale: 1,
          transformOrigin: '0% 50%',
        })
        gsap.set(prefaceCopy, { y: 0 })
        gsap.set(interiorLayers, {
          autoAlpha: 0,
          filter: reducedMotion ? 'none' : `blur(${coverMotion.blurPx}px)`,
          x: () => getSceneMatchOffset(viewport, coverMotion).x,
          y: () => getSceneMatchOffset(viewport, coverMotion).y,
          scale: coverMotion.sceneMatchScale,
          transformOrigin: '0% 0%',
        })
      }

      if (staticPreview) {
        const scene = chronicleScenes[staticPreview.scene]
        const sceneSurfaces = getTrackSurfaces(root, scene.track)
        const contentCues = root.querySelectorAll<HTMLElement>(
          `.chronicle-track-slot--content[data-scene="${staticPreview.scene}"] .chronicle-cue[data-cue-mode="scroll"]`,
        )
        const cueProgress = getCueProgress(scene, staticPreview.progress)
        const cameraPhaseProgress = getCameraProgress(scene, staticPreview.progress)
        const cameraEndProgress = getCameraEndProgress(scene, coverMotion)
        const cameraProgress = scene.id === DELAYED_FOREGROUND_SCENE_ID
          ? getScene03CameraProgress(
              cameraPhaseProgress,
              getScene03GroupCenterProgress(root, viewport, staticPreview.scene),
              cameraEndProgress,
            )
          : cameraPhaseProgress * cameraEndProgress
        const skin = root.querySelector<HTMLElement>(
          `[data-boat-skin="${scene.boatSkin}"]`,
        )

        gsap.set(sceneSurfaces, {
          x: () => getTrackX(
            root,
            viewport,
            staticPreview.scene,
            cameraProgress,
          ),
        })
        gsap.set(contentCues, {
          autoAlpha: cueProgress,
          y: reducedMotion ? 0 : 14 * (1 - cueProgress),
        })
        gsap.set(interiorSurfaces, { autoAlpha: scene.track === 'interior' ? 1 : 0 })
        gsap.set(exteriorContentLayers, { autoAlpha: scene.track === 'exterior' ? 1 : 0 })

        if (scene.id === CROSSFADE_SCENE_ID) {
          gsap.set(crossfadeState00, { autoAlpha: 0 })
          gsap.set(crossfadeState01, { autoAlpha: 1 })
        }

        if (scene.id === DELAYED_FOREGROUND_SCENE_ID) {
          const linearMorphProgress = getScene03MorphProgress(cameraPhaseProgress)
          const morphProgress = reducedMotion
            ? Number(linearMorphProgress > 0)
            : 1 - (1 - linearMorphProgress) ** 3

          gsap.set(delayedForegroundState01, {
            autoAlpha: morphProgress,
            scale: reducedMotion ? 1 : 0.985 + 0.015 * morphProgress,
          })
        }

        if (scene.track === 'interior') {
          const exteriorScene = findSceneOnTrack(staticPreview.scene + 1, 'exterior')
            ?? findSceneOnTrack(staticPreview.scene - 1, 'exterior', -1)
          if (exteriorScene !== null) {
            gsap.set(exteriorSurfaces, {
              x: () => getTrackX(root, viewport, exteriorScene, 0),
            })
          }
        }

        if (scene.id !== WINDOW_PORTAL_SCENE_ID) {
          gsap.set(skin, { autoAlpha: 1 })
        }
        gsap.set(rainLayer, { autoAlpha: scene.id === RAIN_SCENE_ID ? 1 : 0 })
        gsap.set(boat, {
          xPercent: -50,
          yPercent: -50,
          x: viewport.clientWidth * 0.42,
          y: viewport.clientHeight * (getBoatYPercent(scene.id) / 100),
        })
        gsap.set(boatViewport, {
          zIndex: staticPreview.scene === BLACKBOARD_SCENE_INDEX ? 7 : 3,
          clipPath: staticPreview.scene === BLACKBOARD_SCENE_INDEX
            ? getBlackboardHorizontalClip(
                root,
                viewport,
                cameraProgress,
                scene4Mask,
              )
            : 'none',
        })
        return
      }

      gsap.set(`[data-boat-skin="${chronicleScenes[0].boatSkin}"]`, { autoAlpha: 1 })
      gsap.set(boat, {
        xPercent: -50,
        yPercent: -50,
        x: () => viewport.clientWidth * 0.34,
        y: () => viewport.clientHeight * (BOAT_Y_PERCENT / 100),
      })

      if (!reducedMotion) {
        const getBoatBobMultiplier = () => (
          activeSceneRef.current === STRONG_BOAT_BOB_SCENE_INDEX
            ? STRONG_BOAT_BOB_MULTIPLIER
            : 1
        )

        gsap.to([
          '.chronicle-boat__skin--paper .chronicle-boat__bob',
          '.chronicle-boat__skin--chalk .chronicle-boat__bob',
        ].join(', '), {
          rotation: () => BOAT_BOB_ROTATION * getBoatBobMultiplier(),
          y: () => BOAT_BOB_Y * getBoatBobMultiplier(),
          duration: 1,
          yoyo: true,
          repeat: -1,
          repeatRefresh: true,
          ease: 'sine.inOut',
          transformOrigin: '50% 78%',
        })
      }

      const timeline = gsap.timeline({ defaults: { ease: 'none' } })
      timelineRef.current = timeline
      const scrollDistanceSpecs: ScrollDistanceSpec[] = []
      const addLegacyScrollDistance = (timelineStart: number, duration: number) => {
        if (duration <= 0) return
        scrollDistanceSpecs.push({
          timelineStart,
          timelineEnd: timelineStart + duration,
        })
      }
      let cursor = 0

      if (coverLayer && coverPanorama && prefaceMask && prefaceCopy) {
        const panDuration = coverMotion.panDuration
        const prefaceDuration = coverMotion.prefaceDuration
        const holdDuration = coverMotion.holdDuration
        const windowPanDuration = coverMotion.windowPanDuration
        const mixDuration = coverMotion.mixDuration
        const coverDuration = panDuration + prefaceDuration + holdDuration
          + windowPanDuration + mixDuration
        const prefaceAt = panDuration
        const windowPanAt = prefaceAt + prefaceDuration + holdDuration
        const mixAt = windowPanAt + windowPanDuration
        const mixEnd = reducedMotion
          ? { x: getCoverWindowX(coverPanorama, viewport, coverMotion), y: 0, scale: 1 }
          : getCoverZoomEnd(coverPanorama, viewport, coverMotion)

        timeline.to(coverPanorama, {
          x: () => getCoverPrefaceX(coverPanorama, viewport, coverMotion),
          duration: panDuration,
          ease: 'power1.inOut',
        }, cursor)

        timeline.to(prefaceCopy, {
          y: () => -Math.max(0, prefaceCopy.scrollHeight - prefaceMask.clientHeight),
          duration: prefaceDuration,
          ease: 'none',
        }, prefaceAt)

        timeline.to(coverPanorama, {
          x: () => getCoverWindowX(coverPanorama, viewport, coverMotion),
          duration: windowPanDuration,
          ease: 'power1.inOut',
        }, windowPanAt)

        timeline.set(coverPanorama, { transformOrigin: '0% 0%' }, mixAt)

        timeline.to(coverPanorama, {
          x: () => mixEnd.x,
          y: () => mixEnd.y,
          scale: () => mixEnd.scale,
          duration: mixDuration,
          ease: 'power1.inOut',
        }, mixAt)

        timeline.to(interiorLayers, {
          x: 0,
          y: 0,
          scale: 1,
          duration: mixDuration,
          ease: 'power1.inOut',
        }, mixAt)

        timeline.to(interiorLayers, {
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: mixDuration * 0.58,
          ease: 'power1.out',
        }, mixAt + mixDuration * 0.42)

        timeline.to(coverLayer, {
          autoAlpha: 0,
          duration: mixDuration * 0.4,
          ease: 'power1.inOut',
        }, mixAt + mixDuration * 0.6)

        cursor += coverDuration
        addLegacyScrollDistance(0, coverDuration)
        timeline.set(coverLayer, { autoAlpha: 0 }, cursor)
        timeline.set(interiorLayers, {
          autoAlpha: 1,
          filter: 'none',
          x: 0,
          y: 0,
          scale: 1,
          transformOrigin: '0% 0%',
        }, cursor)
      }

      chronicleScenes.forEach((scene, index) => {
        sceneStarts.push(cursor)
        const cues = getSceneCues(root, index)
        const sceneSurfaces = getTrackSurfaces(root, scene.track)
        const revealDuration = scene.duration * scene.timing.contentRevealRatio
        const holdDuration = scene.duration * scene.timing.contentHoldRatio
        const transitionRatio = index === 0
          ? coverMotion.scene1DiveDurationRatio
          : scene.timing.transitionRatio
        const cameraRatio = index === 0
          ? Math.max(
              0.05,
              1 - scene.timing.contentRevealRatio - scene.timing.contentHoldRatio - transitionRatio,
            )
          : scene.timing.cameraRatio
        const cameraDuration = scene.duration * cameraRatio
        const transitionDuration = scene.duration * transitionRatio
        const cameraAt = cursor + revealDuration + holdDuration
        const transitionAt = cameraAt + cameraDuration
        const nextScene = chronicleScenes[index + 1]
        const cameraEndProgress = getCameraEndProgress(scene, coverMotion)
        addLegacyScrollDistance(cursor, revealDuration)
        addLegacyScrollDistance(cursor + revealDuration, holdDuration)
        if (cameraDuration > 0) {
          scrollDistanceSpecs.push({
            timelineStart: cameraAt,
            timelineEnd: transitionAt,
            sceneIndex: index,
            cameraEndProgress,
          })
        }
        addLegacyScrollDistance(transitionAt, transitionDuration)
        const scene03Timing = scene.id === DELAYED_FOREGROUND_SCENE_ID
          ? (() => {
              const durationScale = cameraDuration / SCENE_03_CAMERA_DURATION
              const panInDuration = SCENE_03_PAN_IN_DURATION * durationScale
              const originalHoldDuration = SCENE_03_ORIGINAL_HOLD_DURATION * durationScale
              const morphDuration = SCENE_03_MORPH_DURATION * durationScale
              const changedHoldDuration = SCENE_03_CHANGED_HOLD_DURATION * durationScale
              const panOutDuration = SCENE_03_PAN_OUT_DURATION * durationScale
              const centeredAt = cameraAt + panInDuration
              const morphAt = centeredAt + originalHoldDuration
              const morphCompleteAt = morphAt + morphDuration
              const resumeAt = morphCompleteAt + changedHoldDuration

              return {
                centerProgress: getScene03GroupCenterProgress(root, viewport, index),
                panInDuration,
                morphDuration,
                panOutDuration,
                centeredAt,
                morphAt,
                morphCompleteAt,
                resumeAt,
              }
            })()
          : null
        const getCameraTimelineAtProgress = (progress: number) => {
          if (!scene03Timing) return cameraAt + cameraDuration * progress

          const { centerProgress } = scene03Timing
          if (progress <= centerProgress) {
            return cameraAt + scene03Timing.panInDuration * (
              progress / Math.max(centerProgress, Number.EPSILON)
            )
          }

          return scene03Timing.resumeAt + scene03Timing.panOutDuration * (
            (progress - centerProgress)
            / Math.max(cameraEndProgress - centerProgress, Number.EPSILON)
          )
        }

        if (scene03Timing) {
          timeline.addLabel('scene03:centered', scene03Timing.centeredAt)
          timeline.addLabel('scene03:morph-start', scene03Timing.morphAt)
          timeline.addLabel('scene03:morph-complete', scene03Timing.morphCompleteAt)
          timeline.addLabel('scene03:resume', scene03Timing.resumeAt)
        }

        if (index === 0) {
          if (reducedMotion) {
            timeline.set(exteriorWorldLayers, { autoAlpha: 1 }, cursor)
          } else {
            timeline.to(exteriorWorldLayers, {
              autoAlpha: 1,
              duration: revealDuration,
              ease: 'power1.out',
            }, cursor)
          }
        }

        if (scene.id === RAIN_SCENE_ID) {
          if (reducedMotion) {
            timeline.set(rainLayer, { autoAlpha: 1 }, cursor)
            timeline.set(rainLayer, { autoAlpha: 0 }, transitionAt)
          } else {
            timeline.to(rainLayer, {
              autoAlpha: 1,
              duration: Math.min(0.42, Math.max(0.18, revealDuration * 0.42)),
              ease: 'power1.out',
            }, cursor)
            timeline.to(rainLayer, {
              autoAlpha: 0,
              duration: Math.min(0.36, Math.max(0.16, transitionDuration * 0.72)),
              ease: 'power1.in',
            }, transitionAt)
          }
        }

        const cueEntries = cues.map((cue) => ({
          cue,
          progress: getCueEntryProgress(
            root,
            viewport,
            index,
            [cue],
            coverMotion.cueEntryViewportX,
          ),
        }))
        const openingCues = cueEntries
          .filter(({ progress }) => progress <= 0.001)
          .map(({ cue }) => cue)
        const delayedSceneCues = cueEntries.filter(({ progress }) => progress > 0.001)

        addCueAnimations(
          timeline,
          openingCues,
          cursor,
          revealDuration,
          reducedMotion,
        )

        delayedSceneCues.forEach(({ cue, progress }) => {
          addCueAnimations(
            timeline,
            [cue],
            getCameraTimelineAtProgress(progress),
            Math.min(revealDuration, cameraDuration * DELAYED_CUE_REVEAL_CAMERA_RATIO),
            reducedMotion,
          )
        })

        if (scene03Timing) {
          if (reducedMotion) {
            timeline.set(delayedForegroundState01, {
              autoAlpha: 1,
              scale: 1,
            }, 'scene03:morph-start')
          } else {
            timeline.fromTo(delayedForegroundState01, {
              autoAlpha: 0,
              scale: 0.985,
            }, {
              autoAlpha: 1,
              scale: 1,
              duration: scene03Timing.morphDuration,
              ease: 'power2.out',
              immediateRender: false,
            }, 'scene03:morph-start')
          }
        }

        if (scene03Timing) {
          timeline.to(sceneSurfaces, {
            x: () => getTrackX(
              root,
              viewport,
              index,
              scene03Timing.centerProgress,
            ),
            duration: scene03Timing.panInDuration,
            ease: 'none',
          }, cameraAt)
          timeline.to(sceneSurfaces, {
            x: () => getTrackX(root, viewport, index, cameraEndProgress),
            duration: scene03Timing.panOutDuration,
            ease: 'none',
          }, 'scene03:resume')
        } else {
          timeline.to(sceneSurfaces, {
            x: () => getTrackX(root, viewport, index, cameraEndProgress),
            duration: cameraDuration,
            ease: 'none',
          }, cameraAt)
        }

        const currentSkin = root.querySelector<HTMLElement>(
          `[data-boat-skin="${scene.boatSkin}"]`,
        )
        const previousSkin = index > 0
          ? root.querySelector<HTMLElement>(`[data-boat-skin="${chronicleScenes[index - 1].boatSkin}"]`)
          : null

        timeline.set(boat, {
          y: () => viewport.clientHeight * (getBoatYPercent(scene.id) / 100),
        }, cursor)

        if (scene.id === WINDOW_PORTAL_SCENE_ID) {
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
        } else if (chronicleScenes[index - 1]?.id === WINDOW_PORTAL_SCENE_ID) {
          timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
        } else if (index === BLACKBOARD_SCENE_INDEX) {
          timeline.set(boatViewport, {
            zIndex: 7,
            clipPath: () => getBlackboardHorizontalClip(
              root,
              viewport,
              0,
              scene4Mask,
            ),
          }, cursor)
          timeline.to(boatViewport, {
            clipPath: () => getBlackboardHorizontalClip(
              root,
              viewport,
              cameraEndProgress,
              scene4Mask,
            ),
            duration: cameraDuration,
            ease: 'none',
          }, cameraAt)
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
          timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
        } else if (index === 4) {
          timeline.set(boatViewport, { zIndex: 3, clipPath: 'none' }, cursor)
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
        } else if (index === 5) {
          timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
        } else if (previousSkin !== currentSkin) {
          if (revealDuration <= 0) {
            timeline.set(previousSkin, { autoAlpha: 0 }, cursor)
            timeline.set(currentSkin, { autoAlpha: 1 }, cursor)
          } else {
            timeline.to(previousSkin, { autoAlpha: 0, duration: revealDuration * 0.3 }, cursor)
            timeline.to(currentSkin, { autoAlpha: 1, duration: revealDuration * 0.3 }, cursor)
          }
        }

        if (scene.track === 'exterior') {
          timeline.to(boat, {
            x: () => viewport.clientWidth * Math.min(0.62, 0.34 + index * 0.014),
            duration: cameraDuration,
          }, cameraAt)
        }

        if (nextScene) {
          if (nextScene.id === WINDOW_PORTAL_SCENE_ID) {
            timeline.to(currentSkin, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt)
          }

          if (nextScene.id === CROSSFADE_SCENE_ID) {
            if (reducedMotion) {
              timeline.set(crossfadeState00, { autoAlpha: 0 }, transitionAt + transitionDuration)
              timeline.set(crossfadeState01, { autoAlpha: 1 }, transitionAt + transitionDuration)
            } else {
              timeline.to(crossfadeState00, {
                autoAlpha: 0,
                duration: transitionDuration,
                ease: 'power2.in',
              }, transitionAt)
              timeline.to(crossfadeState01, {
                autoAlpha: 1,
                duration: transitionDuration,
                ease: 'power2.in',
              }, transitionAt)
            }
          }

          // Hide the exterior before repositioning it under Scene 04. It is
          // restored only while Scene 05's window enters the viewport.
          if (index === BLACKBOARD_SCENE_INDEX) {
            const hospitalExterior = chronicleScenes[HOSPITAL_SCENE_INDEX + 1]
            const hospitalExteriorSurfaces = getTrackSurfaces(
              root,
              hospitalExterior.track,
            )
            timeline.set(exteriorBackdropLayers, { autoAlpha: 0 }, cursor)
            timeline.set(hospitalExteriorSurfaces, {
              x: () => getTrackX(
                root,
                viewport,
                HOSPITAL_SCENE_INDEX + 1,
                0,
              ),
            }, cursor)

            if (reducedMotion) {
              timeline.set(
                exteriorBackdropLayers,
                { autoAlpha: 1 },
                transitionAt + transitionDuration,
              )
            } else {
              timeline.to(exteriorBackdropLayers, {
                autoAlpha: 1,
                duration: transitionDuration,
                ease: 'power1.inOut',
              }, transitionAt)
            }
          }

          const nextTrackWasPrepositioned = index === HOSPITAL_SCENE_INDEX
          if (nextScene.track !== scene.track && !nextTrackWasPrepositioned) {
            const nextSurfaces = getTrackSurfaces(root, nextScene.track)
            timeline.set(nextSurfaces, {
              x: () => getTrackX(root, viewport, index + 1, 0),
            }, cursor)

            if (nextScene.track === 'interior') {
              timeline.set(interiorLayers, {
                autoAlpha: 0,
                scale: reducedMotion ? 1 : 3.2,
                transformOrigin: '50% 46%',
              }, cursor)
            }
          }

          addTrackTransition(
            timeline,
            root,
            viewport,
            scene,
            nextScene,
            index + 1,
            transitionAt,
            transitionDuration,
            reducedMotion,
            coverMotion,
          )

          if (nextScene.id === 20 && endingLayer) {
            timeline.to(boatSkins, {
              autoAlpha: 0,
              duration: reducedMotion ? 0 : transitionDuration * 0.35,
              ease: 'none',
            }, transitionAt)

            if (reducedMotion) {
              timeline.set(endingLayer, { autoAlpha: 1, xPercent: 0 }, transitionAt)
            } else {
              timeline.set(endingLayer, { autoAlpha: 1, xPercent: 100 }, transitionAt)
              timeline.to(endingLayer, {
                xPercent: 0,
                duration: transitionDuration,
                ease: 'none',
              }, transitionAt)
            }
          }

          if (index === 2) {
            timeline.to(boatSkins, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt)
          }

          if (index === 3) {
            timeline.to(currentSkin, {
              autoAlpha: 0,
              duration: transitionDuration * 0.2,
              ease: 'none',
            }, transitionAt + transitionDuration * 0.6)
          }

        } else {
          timeline.to(boat, {
            x: () => viewport.clientWidth * 1.16,
            duration: transitionDuration,
            ease: 'power1.in',
          }, transitionAt)
        }

        if (!nextScene && endingLayer) {
          timeline.set(endingLayer, { autoAlpha: 1, xPercent: 0 }, cursor)
          timeline.set(boatSkins, { autoAlpha: 0 }, cursor)
        }

        cursor += scene.duration
      })

      sceneStartsRef.current = sceneStarts
      if (timelineProbe) {
        const probeScene = chronicleScenes[timelineProbe.scene]
        const probeTime = sceneStarts[timelineProbe.scene]
          + probeScene.duration * timelineProbe.progress

        timeline.pause(probeTime, true)
        activeSceneRef.current = timelineProbe.scene
        setActiveScene(timelineProbe.scene)

        const probeOutput = document.createElement('output')
        probeOutput.id = 'chronicle-timeline-probe'
        probeOutput.hidden = true
        const probeFrameRect = viewport.getBoundingClientRect()
        probeOutput.textContent = JSON.stringify({
          scene: probeScene.id,
          progress: timelineProbe.progress,
          probeTime,
          timelineDuration: timeline.duration(),
          layers: Array.from(
            root.querySelectorAll<HTMLElement>('.chronicle-world-layer'),
            (layer) => {
              const style = getComputedStyle(layer)
              return {
                className: layer.className,
                opacity: style.opacity,
                visibility: style.visibility,
                transform: style.transform,
              }
            },
          ),
          surfaces: Array.from(
            root.querySelectorAll<HTMLElement>('.chronicle-track-surface'),
            (surface) => ({
              track: surface.dataset.track,
              surface: surface.dataset.surface,
              x: gsap.getProperty(surface, 'x'),
              opacity: getComputedStyle(surface).opacity,
            }),
          ),
          cues: Array.from(
            root.querySelectorAll<HTMLElement>(
              `.chronicle-track-slot[data-scene="${timelineProbe.scene}"] .chronicle-cue`,
            ),
            (cue) => ({
              id: cue.dataset.cue,
              opacity: getComputedStyle(cue).opacity,
              visibility: getComputedStyle(cue).visibility,
              transform: getComputedStyle(cue).transform,
              rect: getDebugRect(cue, probeFrameRect),
            }),
          ),
          images: Array.from(
            root.querySelectorAll<HTMLImageElement>(
              `.chronicle-track-slot[data-scene="${timelineProbe.scene}"] img`,
            ),
            (image) => ({
              src: image.currentSrc || image.dataset.src,
              complete: image.complete,
              naturalWidth: image.naturalWidth,
              opacity: getComputedStyle(image).opacity,
              rect: getDebugRect(image, probeFrameRect),
            }),
          ),
        })
        root.append(probeOutput)
        return
      }

      let scrollMapping = buildScrollMapping(
        scrollDistanceSpecs,
        root,
        viewport,
      )
      scrollMappingRef.current = scrollMapping
      let hasCompletedInitialRefresh = false
      let refreshTimelineTime = 0

      const syncTimelineToScroll = (progress: number) => {
        const time = mapScrollProgressToTimelineTime(
          progress,
          scrollMapping,
          timeline.duration(),
        )
        timeline.time(time, false)

        let nextActive = sceneStarts.length - 1
        for (let index = 1; index < sceneStarts.length; index += 1) {
          if (time < sceneStarts[index]) {
            nextActive = index - 1
            break
          }
        }
        if (nextActive !== activeSceneRef.current) {
          activeSceneRef.current = nextActive
          setActiveScene(nextActive)
        }
      }

      timeline.pause(0)
      scrollTriggerRef.current = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: () => {
          scrollMapping = buildScrollMapping(
            scrollDistanceSpecs,
            root,
            viewport,
          )
          scrollMappingRef.current = scrollMapping
          return `+=${Math.round(scrollMapping.at(-1)?.scrollEnd ?? 0)}`
        },
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefreshInit: () => {
          if (hasCompletedInitialRefresh) {
            refreshTimelineTime = timeline.time()
          }
        },
        onRefresh: (trigger) => {
          timeline.invalidate()
          if (!hasCompletedInitialRefresh) {
            hasCompletedInitialRefresh = true
            syncTimelineToScroll(trigger.progress)
            return
          }

          const progress = mapTimelineTimeToScrollProgress(
            refreshTimelineTime,
            scrollMapping,
            timeline.duration(),
          )
          trigger.scroll(
            trigger.start + (trigger.end - trigger.start) * progress,
          )
          syncTimelineToScroll(progress)
        },
        onUpdate: ({ progress }) => syncTimelineToScroll(progress),
      })

    }, root)

    return () => {
      context.revert()
      timelineRef.current = null
      scrollTriggerRef.current = null
      sceneStartsRef.current = []
      scrollMappingRef.current = []
    }
  }, [
    chartSvgMarkup,
    coverMotion,
    reducedMotion,
    scene4Mask,
    staticPreview,
    timelineProbe,
  ])

  return (
    <section
      className={`chronicle ${staticPreview ? 'chronicle--static' : ''}`}
      ref={rootRef}
      aria-label="现代中国历史滚动长卷"
    >
      <div className="chronicle-stage" ref={stageRef}>
        <div className="chronicle-frame" ref={frameRef}>
          <div className="chronicle-matte" aria-hidden="true" />

          {!staticPreview && <ChronicleCover />}

          <div className="chronicle-world-layer chronicle-world-layer--exterior-background" aria-hidden="true">
            <TrackSurface track="exterior" surface="background" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-background" aria-hidden="true">
            <TrackSurface track="interior" surface="background" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--exterior-content chronicle-world-layer--background-bound-content" aria-hidden="true">
            <TrackSurface track="exterior" surface="content" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} backgroundBound />
          </div>
          <ChronicleBoat />
          <div className="chronicle-world-layer chronicle-world-layer--exterior-foreground" aria-hidden="true">
            <TrackSurface track="exterior" surface="foreground" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--exterior-content" aria-hidden="true">
            <TrackSurface track="exterior" surface="content" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-foreground" aria-hidden="true">
            <TrackSurface track="interior" surface="foreground" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>
          <div className="chronicle-world-layer chronicle-world-layer--interior-content" aria-hidden="true">
            <TrackSurface track="interior" surface="content" activeScene={activeScene} chartSvgMarkup={chartSvgMarkup ?? {}} />
          </div>

          {!staticPreview && <ChronicleEnding />}

          <ChronicleRain />

          <p className="sr-only" aria-live="polite">
            第 {activeScene + 1} 幕：{chronicleScenes[activeScene].title}
          </p>
        </div>
      </div>
      {isMotionDebug && !staticPreview && (
        <CoverMotionDebugPanel value={coverMotion} onChange={setCoverMotion} />
      )}
      {import.meta.env.DEV && (
        <div className="screen-debug" aria-label="滚动场景调试">
          第 {activeScene + 1} / {chronicleScenes.length} 屏
          <span>Scene_{String(chronicleScenes[activeScene].id).padStart(2, '0')}</span>
          <input
            className="screen-debug__jump"
            type="number"
            min={1}
            max={chronicleScenes.length}
            inputMode="numeric"
            placeholder="跳屏"
            aria-label={`跳转到指定屏，范围 1 到 ${chronicleScenes.length}`}
            onChange={(event) => event.currentTarget.setCustomValidity('')}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              event.preventDefault()

              const sceneNumber = event.currentTarget.valueAsNumber
              if (
                !Number.isInteger(sceneNumber)
                || sceneNumber < 1
                || sceneNumber > chronicleScenes.length
              ) {
                event.currentTarget.setCustomValidity(
                  `请输入 1–${chronicleScenes.length} 之间的整数`,
                )
                event.currentTarget.reportValidity()
                return
              }

              event.currentTarget.setCustomValidity('')
              jumpToSceneStart(sceneNumber)
              event.currentTarget.blur()
            }}
          />
          <button
            className="screen-debug__button"
            type="button"
            onClick={printDebugSnapshot}
          >
            打印状态
          </button>
        </div>
      )}
    </section>
  )
}
