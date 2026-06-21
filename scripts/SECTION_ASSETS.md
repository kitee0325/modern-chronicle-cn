# Section PNG processing

The page uses a `1440x810` logical coordinate system. Generated PNGs default to `2x`, while
`layout.json` keeps all placement values in logical pixels.

Copy `scripts/section-assets.example.json`, edit the asset entries, and run:

```bash
npm run assets:section -- path/to/section-assets.json
npm run assets:section -- path/to/section-assets.json --dry-run
```

## Asset modes

- `canvas`: crops the source and outputs the configured canvas size. A custom `bbox` can represent
  a multi-screen horizontal canvas.
- `element`: crops optional source edges, trims transparent padding by default, and outputs the
  dimensions defined by its logical `bbox`.

Crop values use source pixels when `unit` is `px`. With `unit: "logical"`, values are multiplied by
`sourceDensity`. This makes spoken instructions such as “remove 4 logical pixels from each side”
unambiguous for `2x` Figma exports.

Compression mode `auto` compares a palette candidate against the lossless PNG. It accepts the
smaller candidate only when alpha is unchanged and the configured visual-difference limits pass;
otherwise it keeps the lossless output. Use `"mode": "lossless"` for exact color preservation.

The command overwrites only the output files listed in the config and writes their logical
placements to `layout.json`. It never deletes other files in the section folder.
