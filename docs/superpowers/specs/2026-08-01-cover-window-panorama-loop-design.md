# Cover Window Panorama Loop Design

## Goal

During the opening title and preface, show the panorama from Figma node
`2722:2072` moving continuously outside the train windows. The motion must be
fast, automatic, uniform, seamless, and independent of scroll progress.

## Confirmed design

- Export the referenced 39,631 x 810 Figma frame as a PNG at 2x resolution.
- Preserve the 2x pixels, but split the extremely wide export into browser-safe
  sequential tiles so no individual decoded texture exceeds common browser or
  GPU width limits.
- Add one decorative window-world layer inside `ChronicleCover`, aligned to the
  existing 9,535 x 1,620 cover panorama.
- Reveal that layer only through the glass areas of the train windows. Keep the
  existing train interior, seats, dividers, and window frames visually above it.
- Render two identical tile sequences back-to-back and animate their shared
  track with a CSS `linear infinite` horizontal translation. The duplicated
  sequence makes the wrap point seamless.
- Keep the loop outside the GSAP scroll timeline. Scrolling may move and zoom
  the parent cover panorama, but it must not change the loop's elapsed time or
  speed.
- Let the loop run from the initial title/preface state until the cover leaves
  during the existing zoom transition.

## Integration boundaries

- `src/sceneAssets.ts` owns the exported window panorama tile URLs.
- `src/components/ChronicleCover.tsx` owns the decorative loop markup.
- `src/index.css` owns window clipping, layer ordering, constant-speed motion,
  and the reduced-motion fallback.
- `src/hooks/useAssetPreloader.ts` preloads the new tiles with the other cover
  assets.
- Existing cover timing and `ScrollChronicle` scroll choreography remain
  unchanged.

## Performance and accessibility

- Tiles load as local static assets and retain the requested 2x source quality.
- The animated element uses transform-only motion and `will-change: transform`.
- The layer is decorative (`aria-hidden`) and cannot receive pointer events.
- When `prefers-reduced-motion: reduce` is active, show a stationary panorama
  rather than running the loop.

## Verification

- Confirm the Figma export is 2x and tile boundaries reconstruct the full frame.
- Confirm the landscape appears only inside window glass and stays aligned while
  the cover pans.
- Confirm the motion continues at the same speed while scrolling stops, moves
  forward, or moves backward.
- Confirm the duplicated sequence wraps without a visible blank frame or jump.
- Run the project build and lint checks, then inspect the opening in a browser at
  desktop and narrow viewport sizes.
