# Cover → Scene 01 Scroll Transition Design

Date: 2026-07-20  
Status: Approved for first implementation

## Goal

Replace the static Cover section and hard handoff into Scene 01 with one reversible, scroll-driven interior-camera sequence. The Cover title remains an independent one-shot entrance animation; all camera, preface, pause, zoom, blur, and crossfade behavior belongs to the main scroll axis.

## Confirmed interaction model

1. Render the Cover from the existing no-text panorama asset.
2. Animate the two-line DOM title once, in no more than one second. Scrolling is never locked while this entrance plays.
3. Scroll horizontally from the title composition to the preface composition.
4. Stop the camera. Keep the `前言：` heading fixed while the body scrolls continuously inside a mask no taller than four lines.
5. After the final body line reaches its readable position, hold briefly.
6. Resume the rightward camera move and zoom in.
7. During that move, overlap Scene 01 at its current default first-frame composition. Fade it from transparent to opaque and reduce its blur to zero.
8. End at exactly the current Scene 01 first frame, then let the existing Scene 01 timeline take over.
9. Everything except the title entrance reverses exactly when the user scrolls upward.

## Timeline

The first implementation uses one normalized progress value with adjustable phase ratios:

| Progress | Phase | Behavior |
| --- | --- | --- |
| independent | Title entrance | Two-line stagger, upward movement, vertical clip reveal; approximately 820 ms; plays once |
| 0.00–0.22 | Pan to preface | Cover camera moves horizontally; no preface body scroll yet |
| 0.22–0.58 | Preface scroll | Camera remains fixed; body `translateY` maps continuously to scroll progress |
| 0.58–0.64 | Reading beat | Camera and text remain still for a short scroll interval |
| 0.64–1.00 | Zoom and mix | Cover continues right and zooms; Scene 01 fades/sharpens into its default first frame |

The ratios are configuration values, not hard-coded animation assumptions. They will be tuned after the first browser review.

## Layer model

The Cover and Scene 01 are part of the same pinned interior stage and master timeline.

- Cover panorama: `public/assets/cover/foreground.png`
- Cover content: real DOM title and preface text
- Scene 01: the real existing Scene 01 track surfaces are used during the mix; no duplicate proxy layer is allowed
- Existing Scene 01 timeline: begins only after the Cover segment and therefore needs no proxy-to-track swap

The missing `public/assets/cover/original.png` must no longer be referenced at runtime.

## Text content

Title:

> 风雨同舟、家国天下：  
> 一名基层老党员与共和国同行的七十年

Preface heading:

> 前言：

Preface body is reconstructed from the approved Figma Original raster for the first pass:

> 他出生在风雨飘摇的年代，却始终选择站在光里。  
> 14岁，秘密入团，奔走宣传，稚嫩肩膀扛起信仰；  
> 25岁，人生低谷中沉浮，却未曾动摇初心；  
> 40岁，乱世当前，冒死救人，拒绝同流合污，在改革浪潮中经营经商、实干兴业；

Copy remains easy to edit as DOM text if the raster transcription needs correction.

## Anchor geometry

The two transition landmarks are intentionally different structures:

- Cover: the user-selected vertical landmark to the left of the rightmost window, fixed at `25%` in the right-aligned Storyboard preview.
- Scene 01: the left outer frame of the two-pane window.

The Storyboard geometry maps approximately to these source-normalized x values:

- Cover landmark: `70.2%` of the full Cover panorama width.
- Scene 01 landmark: `26.1%` of the full Scene 01 width.

Implementation must derive screen transforms from the rendered asset dimensions and viewport rather than embedding desktop pixel offsets. The Cover landmark converges on the Scene 01 landmark's first-frame screen position during the final phase.

A single x landmark does not uniquely determine scale, y position, or transform origin. The first pass therefore keeps `zoomScale`, `mixY`, and `transformOrigin` as explicit, adjustable Cover-transition configuration values. The x landmarks determine horizontal convergence only.

## Animation details

### Title

- Real selectable DOM text, not raster text.
- Two lines reveal through vertical clipping.
- Second line starts about 120 ms after the first.
- Light upward movement; total approximately 820 ms.
- Not attached to scroll and not replayed on reverse scroll.

### Preface

- Heading is fixed during the preface phase.
- Body viewport is capped at four text lines.
- Body movement is continuous and directly reversible, with no line snapping.
- Its final offset is `-max(0, scrollHeight - mask.clientHeight)` and is recomputed on ScrollTrigger refresh.
- The final readable state is held for the short 0.58–0.64 interval.

### Mix

- The mix animates the real Scene 01 surfaces rather than a duplicate render.
- Scene 01 uses its exact default first-frame transform throughout the handoff endpoint.
- Scene 01 opacity: `0 → 1`.
- Scene 01 blur: approximately `12px → 0`.
- Cover opacity eases down late in the mix so the window alignment is established before Scene 01 becomes visually dominant.
- The Cover camera transform and Scene 01 filter/opacity are driven by the same normalized progress and reverse deterministically.

At the exact handoff endpoint, all of these invariants must hold:

- Cover: `opacity: 0`, `visibility: hidden`.
- Real Scene 01 surfaces: default first-frame x, `scale: 1`, default transform origin, `opacity: 1`, `visibility: visible`, `filter: none`.
- Scene 01 scroll cues: still at progress zero and hidden.
- The next timeline sample changes only Scene 01's own cue/camera progress; it does not swap rendered layers.

## Responsive behavior

- Compute panorama scale from the actual pinned viewport and source aspect ratio.
- Keep title and preface positions proportional to the panorama coordinate system so they remain attached to the train interior.
- Recompute camera and anchor transforms on refresh/resize.
- Preserve the maximum four-line preface mask; use responsive font sizes rather than showing extra lines.

## Reduced motion

When reduced motion is requested:

- Keep the title readable immediately or use a minimal fade.
- Remove blur and large zoom motion.
- Preserve the narrative order and reversible content states with short opacity changes.

## Acceptance criteria

- No missing Cover asset request.
- Cover title is DOM text and finishes its entrance within one second.
- Scrolling during title entrance is allowed and produces no deferred jump.
- Camera does not move during the preface body scroll or short hold.
- Preface body is continuously scroll-linked and reverses correctly.
- Final mix begins only after the preface and short hold.
- Scene 01 sharpens and fades in while the Cover camera moves and zooms.
- The transition ends on the existing Scene 01 default first frame with no visible jump.
- Reverse scrolling reconstructs all Cover states except replaying the title entrance.
- Production build and lint pass.
