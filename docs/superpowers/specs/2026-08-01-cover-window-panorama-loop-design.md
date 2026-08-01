# Cover Window Panorama Loop Design

## Goal

During the opening title and preface, show the panorama from Figma node
`2722:2072` moving continuously outside the train windows. The motion must be
fast, automatic, uniform, seamless, and independent of scroll progress.

## Confirmed design

- Export the referenced 39,631 x 810 Figma frame as a PNG at 2x resolution.
- Preserve the 2x pixels, but split the 79,262 x 1,620 export into ordered,
  lossless sequential tiles no wider than 16,000 px. Tile edges share no overlap
  or gap, and concatenating the manifest in order must reproduce the export
  pixel-for-pixel.
- Add one decorative window-world layer inside `ChronicleCover`, aligned to the
  existing 9,535 x 1,620 cover panorama.
- Reveal that layer only through the glass areas of the train windows. Keep the
  existing train interior, seats, dividers, and window frames visually above it.
- Render two identical tile sequences back-to-back and animate their shared
  track with a CSS `linear infinite` horizontal translation. Translate exactly
  one rendered sequence per cycle at 1,800 cover-design pixels per second; the
  duplicated sequence makes the wrap point seamless.
- Keep the loop outside the GSAP scroll timeline. Scrolling may move and zoom
  the parent cover panorama, but it must not change the loop's elapsed time or
  speed.
- Let the loop run from the initial title/preface state until the cover leaves
  during the existing zoom transition. Pause the animation when the cover is
  hidden, and resume it if the opening state is re-entered.

## Integration boundaries

- `src/sceneAssets.ts` owns the exported window panorama tile URLs.
- `src/components/ChronicleCover.tsx` owns the decorative loop markup.
- `src/index.css` owns window clipping, layer ordering, constant-speed motion,
  and the reduced-motion fallback.
- `src/hooks/useAssetPreloader.ts` preloads the new tiles with the other cover
  assets.
- Existing cover timing and `ScrollChronicle` scroll choreography remain
  unchanged.

## Coordinate and mask contract

- Use the cover artwork's 9,535 x 1,620 design space for the loop layer. The
  layer fills that coordinate space and is a child of the existing transformed
  panorama, so cover panning and zooming move the train and its outside world as
  one unit.
- Display the 2x Figma export at its 79,262 x 1,620 natural design size. The
  left edge is the sequence origin; only its animated x offset changes.
- Define the visible glass apertures in a dedicated SVG mask using coordinates
  measured from the existing cover artwork. The mask must exclude every frame,
  divider, sill, and interior object, with no color bleed at any cover scale.

## Performance and accessibility

- Tiles load as local static assets and retain the requested 2x source quality.
  A 1x derivative manifest is used on narrow/coarse-pointer devices, while the
  committed 2x export remains the desktop/high-density source. Tile elements use
  deferred loading/decoding so the browser can avoid retaining the complete
  2x sequence in decoded memory before it is needed.
- The animated element uses transform-only motion and `will-change: transform`.
- The layer is decorative (`aria-hidden`) and cannot receive pointer events.
- When `prefers-reduced-motion: reduce` is active, show the first sequence frame
  at x = 0 during the same cover interval rather than running the loop.

## Verification

- Confirm the Figma export is 2x and tile boundaries reconstruct the full frame.
- Confirm every 2x tile is at most 16,000 px wide, manifests are ordered, and the
  narrow-screen source is the exact 1x derivative of the 2x export.
- Confirm the landscape appears only inside window glass and stays aligned while
  the cover pans.
- Confirm the motion continues at the same speed while scrolling stops, moves
  forward, or moves backward.
- Confirm the duplicated sequence wraps without a visible blank frame or jump.
- Confirm the rendered displacement equals one full sequence and the effective
  speed is 1,800 cover-design pixels per second, independent of scroll state.
- Confirm the loop pauses after the cover is hidden and reduced-motion shows the
  stationary first frame.
- Run the project build and lint checks, then inspect the opening in a browser at
  desktop and narrow viewport sizes.
