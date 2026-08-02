# Scene 20 Ending Revision

## Goal

Replace the original Scene 20 artwork and camera movement with the approved
ending layout. The ending enters directly from Scene 19 and remains the only
visual content of Scene 20.

## Approved layout

- Keep the 40/60 split between gallery and story.
- Remove the original `Scene_20/foreground.png` asset and its manifest usage.
- Fill the entire 40% left panel with the film strip, matching Figma node
  `3183:2139`: black film stock, two fixed perforation rails with rounded grey
  holes, and photos moving continuously inside the center channel. There are
  no gallery gutters outside the film stock. Perforations keep a compact,
  fixed aspect ratio, use wider, evenly distributed vertical spacing, and
  render at twice the original corrected width and height.
- Duplicate the photo sequence once and translate the combined track by half
  its height for a seamless loop.
- Use the supplied title composition as one compressed, transparent WebP layer
  containing the letter, main title, and subtitle. The conclusion uses the
  supplied copy in one continuous text column, with the final quotation as a
  separate closing block.
- Place the supplied grain texture as a compressed, cover-fit top layer inside
  the right story panel only. Screen blending keeps its black field from
  obscuring the content, and the layer never extends over the left film strip.
- Use `rgb(18, 78, 132)` as the Scene 20 base color. Preserve the story texture
  beneath a 90% blue overlay so its lightness cannot wash out the intended
  color.
- The conclusion is fully visible with no internal scrolling. Reduced-motion
  mode keeps the film strip static.

## Transition and verification

Scene 19 and the new ending use one direct horizontal translation: Scene 19
moves left while Scene 20 enters from the right, with no opacity fade.
Scene 20 has no background camera movement and only supplies the reading hold.
Verify the result at 1440x810, 1920x1080, and a narrow mobile viewport; confirm
the old Scene 20 asset is not requested, the 40/60 split remains exact, the
film moves without a seam, and all conclusion text fits without overflow.
