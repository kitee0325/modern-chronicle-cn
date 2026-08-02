# Cover Window Panorama Loop Design

## Goal

During the opening title and preface, show the panorama from Figma node
`2722:2072` moving continuously outside the train windows. The motion must be
fast, automatic, uniform, seamless, and independent of scroll progress.

## Confirmed design

- Use the supplied 32,768 x 670 transparent PNG exported from the referenced
  Figma frame as the source of truth.
- Split the source into eight ordered 4,096 x 670 tiles and encode them as WebP
  at quality 88. Preserve the alpha channel losslessly; tile edges share no
  overlap or gap.
- Add one decorative window-world layer inside `ChronicleCover`, aligned to the
  existing 9,535 x 1,620 cover panorama.
- Reveal that layer only through the glass areas of the train windows. Keep the
  existing train interior, seats, dividers, and window frames visually above it.
- Render a bounded working set of the current tile and its next neighbor.
  A time-based `requestAnimationFrame` loop recycles the tiles as their leading
  edge leaves the 9,535 px cover design space. Advance at exactly 1,800
  cover-design pixels per second and wrap the sequence position modulo the
  rendered sequence width (approximately 79,230 px);
  the last and first tile therefore meet without a blank frame or jump.
  Each rendered tile is approximately 9,904 px wide, so the next tile alone
  covers the 9,535 px cover design space at a recycling boundary.
- Keep the loop outside the GSAP scroll timeline. Scrolling may move and zoom
  the parent cover panorama, but it must not change the loop's elapsed time or
  speed.
- Let the loop run from the initial title/preface state until the cover leaves
  during the existing zoom transition. Pause the animation when the cover is
  hidden, and resume it if the opening state is re-entered.

## Integration boundaries

- `src/sceneAssets.ts` owns the exported window panorama tile URLs.
- `src/components/CoverWindowLoop.tsx` owns the decorative loop, elapsed-time
  position, two-tile working set, visibility lifecycle, and reduced-motion
  fallback. `ChronicleCover.tsx` only composes it into the cover.
- `src/index.css` owns window clipping, coordinate sizing, and layer ordering.
- `src/hooks/useAssetPreloader.ts` preloads only the first working set; remaining
  tiles load when the bounded window approaches them.
- Existing cover timing and `ScrollChronicle` scroll choreography remain
  unchanged.

## Coordinate and mask contract

- Use the cover artwork's 9,535 x 1,620 design space for the loop layer. The
  layer fills that coordinate space and is a child of the existing transformed
  panorama, so cover panning and zooming move the train and its outside world as
  one unit.
- Scale the 32,768 x 670 source uniformly to 1,620 cover-design pixels high,
  giving a rendered sequence width of `32,768 * 1,620 / 670` (approximately
  79,230 px). The left edge is the sequence origin; only its animated x offset
  changes.
- Use the derived lossless `foreground-windowed.webp` as the foreground mask:
  only glass pixels are transparent, while every frame, divider, sill, and
  interior object remains above the moving panorama.

## Performance and accessibility

- Tiles load as local static WebP assets. Quality 88 must keep representative
  RGB PSNR above 40 dB and preserve the source alpha channel exactly.
- Mount no more than two 4,096 x 670 source tiles at once, keeping the decoded
  RGBA working set below 21 MiB.
- The animated element uses transform-only motion and `will-change: transform`;
  React state changes only when a tile boundary is crossed, not on every frame.
- The layer is decorative (`aria-hidden`) and cannot receive pointer events.
- When `prefers-reduced-motion: reduce` is active, show the first sequence frame
  at x = 0 during the same cover interval rather than running the loop.

## Verification

- Confirm the supplied export is 32,768 x 670 and the eight 4,096 x 670 tiles
  cover its full width in order.
- Confirm representative RGB PSNR is above 40 dB, alpha is unchanged, and total
  compressed tile size is materially below the 12.45 MB source.
- Confirm the landscape appears only inside window glass and stays aligned while
  the cover pans.
- Confirm the motion continues at the same speed while scrolling stops, moves
  forward, or moves backward.
- Confirm the recycled sequence wraps without a visible blank frame or jump.
- Confirm the rendered displacement equals one full sequence and the effective
  speed is 1,800 cover-design pixels per second, independent of scroll state.
- Confirm the loop pauses after the cover is hidden and reduced-motion shows the
  stationary first frame.
- Confirm at most two panorama images are mounted and the maximum decoded
  working set stays below 21 MiB.
- Confirm one full rendered tile is wider than the 9,535 px cover design space,
  so recycling never reveals a gap.
- Run the project build and lint checks, then inspect the opening in a browser at
  desktop and narrow viewport sizes.
