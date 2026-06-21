# Section PNG 素材处理

页面统一使用 `1440x810` 逻辑坐标系。生成的 PNG 默认按 `2x` 输出，`layout.json` 中的
位置和尺寸仍使用逻辑像素。

复制 `scripts/section-assets.example.json`，填写素材配置后运行：

```bash
npm run assets:section -- path/to/section-assets.json
npm run assets:section -- path/to/section-assets.json --dry-run
```

## 素材模式

- `canvas`：裁剪源图，并按照配置的画布尺寸输出。可通过自定义 `bbox` 表示横向多屏画布。
- `element`：可先裁剪源图四边，默认继续清除透明留白，最后按照逻辑 `bbox` 的宽高输出。

## 裁剪单位

当 `crop.unit` 为 `px` 时，裁剪值代表源图的实际像素。

当 `crop.unit` 为 `logical` 时，工具会将裁剪值乘以 `sourceDensity`。例如素材是 Figma 的
`2x` 导出图，“左右各裁掉 4 个逻辑像素”会转换为源图左右各裁掉 8 个实际像素。

## bbox 与输出倍率

`bbox` 使用 `1440x810` 坐标系中的逻辑值：

```json
{ "x": 180, "y": 120, "width": 420, "height": 360 }
```

在默认 `density: 2` 下，上述插图会输出为 `840x720` PNG；`layout.json` 中仍记录
`x: 180, y: 120, width: 420, height: 360`，供页面按照设计坐标定位。

## 压缩策略

默认的 `auto` 模式会同时生成无损版本和调色板候选版本。只有候选版本满足以下条件时，
工具才会采用它：

- 文件体积至少减少配置要求的比例；
- Alpha 通道完全一致；
- 像素差异不超过配置的视觉阈值。

如果候选版本不满足要求，工具会自动保留无损 PNG。需要严格保持原始颜色时，可设置：

```json
{ "compression": { "mode": "lossless" } }
```

## 输出安全

工具只会覆盖配置中明确列出的输出文件，并在对应 section 目录生成 `layout.json`。它不会
删除 section 目录中的其他素材。建议正式处理前先使用 `--dry-run` 检查输出尺寸、体积和
压缩方式。

独立插图还会在同一目录生成同名定位 JSON：

```text
src/assets/section9/illustration.png
src/assets/section9/illustration.json
```

Section 组件通过 `PositionedAsset` 同时导入图片与定位配置：

```tsx
import PositionedAsset from '../components/PositionedAsset';
import illustration from '../assets/section9/illustration.png';
import position from '../assets/section9/illustration.json';

<PositionedAsset src={illustration} position={position} alt="" />
```

插图位置应只在 JSON 中维护，不再写死在 Section 的 TSX 文件中。
