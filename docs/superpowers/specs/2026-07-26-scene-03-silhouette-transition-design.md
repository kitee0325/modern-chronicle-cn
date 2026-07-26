# Scene 03 战士剪影裁剪与过渡设计

## 1. 目标

修复 Scene 03 战士剪影状态转换时的画面闪烁，同时保持与 Figma 原稿一致的构图、数据来源文字和响应式位置。修改只覆盖 Scene 03 的第二状态层及其动画，不改变整条长卷的镜头路径、其他场景资源或叙事节奏。

## 2. 已确认原因

当前 `foreground-01.png` 使用与场景一致的 `8588 × 1620` 透明画布。状态层透明度变化时，它没有独立合成层，浏览器会重绘约 `21356 × 798` 的整条室内前景轨道；轨道同时还在水平位移，因此可能发生大贴图分块重绘与上传，表现为闪屏。

浏览器诊断已排除以下原因：

- `state-00` 在切换期间始终保持可见；
- `state-01` 的透明度从 `0` 连续变化到 `1`；
- 两张图片在进入 Scene 03 前均已加载并完成解码。

## 3. Figma 坐标

设计文件：`cxUHkI5OuXTwVRbOIuzev5`

- Scene 03 图表节点：`285:946`
- 战士人物节点：`265:13893`
- 原始逻辑画布：`4294 × 810`
- `Front`：`x=583, y=-3, width=3711, height=810`
- 人物/词云主锚点：约 `x=2248, y=225`
- 人物区域：约 `827 × 607`
- 数据来源文字延伸至约 `x=3468, y=807`

当前 PNG 为 2× 导出，原始像素画布为 `8588 × 1620`。浏览器逐像素读取确认，`alpha > 0` 的实际边界为：

```text
x=4525, y=452, width=2448, height=1163
```

裁剪规则固定为：以 `alpha > 0` 为内容像素，四边各扩展 `4px`，再 clamp 到原画布。最终裁剪矩形及输出文件固定为：

```text
source: foreground-01.png       8588 × 1620
crop:   x=4521, y=448           2456 × 1171
output: foreground-01-crop.png  2456 × 1171
```

## 4. 方案选择

### 方案 A：裁剪后纯淡入

性能稳定、改动最小，但视觉表现与当前基本相同。

### 方案 B：裁剪后“词云凝聚”（采用）

将 Scene 03 的 `state-01` 裁剪为最小透明素材，使用轻微缩放与透明度完成状态转换：

- `opacity: 0 → 1`
- `scale: 0.985 → 1`
- 变换原点落在人物胸部附近
- 时长约 `0.32–0.36s`
- `power2.out`

动画只使用合成属性，裁剪层拥有独立的合成边界。视觉上表现为词语在原人物轮廓内凝聚，不引入扫光、弹性或夸张位移。

### 方案 C：遮罩扫入

表现更强，但 `clip-path` 或 mask 会重新引入逐帧绘制压力，不采用。

## 5. 资源与数据模型

Scene 03 的 `state-00` 仍使用完整前景图。只裁剪 `state-01`，并为状态资源增加可选裁剪元数据：

```ts
type SceneAssetCrop = {
  canvasWidth: number
  canvasHeight: number
  x: number
  y: number
  width: number
  height: number
}
```

`SceneAssetState` 增加 `foregroundCrop?: SceneAssetCrop`。裁剪元数据与具体前景资源绑定，不作为背景和前景共享的模糊状态字段。构建和运行时均应满足：

```text
croppedImage.naturalWidth  === foregroundCrop.width
croppedImage.naturalHeight === foregroundCrop.height
```

字段均使用资源原始像素坐标。渲染时以完整 Scene 03 slot 为 containing block，并换算为百分比：

```text
left   = x / canvasWidth  × 100%
top    = y / canvasHeight × 100%
width  = width / canvasWidth  × 100%
height = height / canvasHeight × 100%
```

带 crop 的状态图必须覆盖通用 `.chronicle-track-state { inset: 0 }`，显式设置 `right: auto; bottom: auto`。这样定位只依赖原画布坐标，不依赖当前视口尺寸、设备像素比或场景在轨道中的绝对位置。

## 6. 渲染与合成

- 未裁剪状态仍保持现有铺满场景的渲染方式。
- 带 crop 的状态图按上述比例绝对定位。
- Scene 03 的动画状态层单独声明 `will-change: transform, opacity`，避免整条室内前景轨道随透明度逐帧重绘。
- 不给所有状态图或所有场景长期创建合成层。
- 图片仍在 Scene 03 进入活动半径前预加载，避免动画开始时才解码。

缩放锚点使用完整 2× 画布坐标 `x=5324, y=1120`，对应人物胸部。相对裁剪图的 transform origin 为：

```text
originX = (5324 - 4521) / 2456 × 100% = 32.6954%
originY = (1120 - 448) / 1171 × 100% = 57.3868%
```

## 7. 动画与无障碍

正常模式使用可逆的 GSAP `fromTo`，由现有主滚动时间轴控制。正向滚动凝聚，反向滚动自然还原，不增加独立定时器或一次性播放标记。

各路径的确定状态如下：

```text
normal hidden:  autoAlpha=0, scale=0.985
normal visible: autoAlpha=1, scale=1
reduced hidden: autoAlpha=0, scale=1
reduced visible:autoAlpha=1, scale=1
```

时间轴 `fromTo` 使用 `immediateRender: false`，或采用等价的显式初始化，避免刷新或时间轴重建时覆盖当前 scrub 状态。静态预览在 Scene 03 local progress `0.60` 显示 hidden 状态，在 `0.64` 显示 visible 状态；reduced-motion 静态预览始终保持 `scale=1`。

## 8. 验收标准

1. Scene 03 状态转换期间没有可见闪屏或空白帧。
2. 战士词云轮廓与 Figma `285:946` 对齐，数据来源文字完整。
3. `foreground-01-crop.png` 的自然尺寸严格为 `2456 × 1171`，并与 `foregroundCrop` 一致。
4. 在 `360 × 800`、`1440 × 810`、`2560 × 1080` 下，裁剪层 CSS bounds 与 crop 元数据归一化后的期望位置误差不超过 `1 CSS px`；before/mid/after 截图均包含完整数据来源文字。
5. 动态检查点固定为 `foregroundRevealAt - 0.01s`、`foregroundRevealAt + duration / 2`、`foregroundRevealAt + duration + 0.01s`；三点分别验证 hidden、中间插值和 visible 状态。
6. 正向、反向和快速来回 scrub 后回到同一进度时，状态层 bounds、opacity 和 scale 一致。
7. reduced-motion 模式不执行缩放且内容完整；静态预览 `progress=0.60/0.64` 分别验证切换前后状态。
8. Chrome Performance/Layers 检查中，状态过渡期间不得出现 damage rect 覆盖约 `21356 × 798` 整条室内前景轨道的 Paint；独立提升图层及 raster bounds 应限制在裁剪状态素材范围内。
9. `npm run build` 与 `npm run lint` 通过。

## 9. 非目标

- 不重导或重绘 Scene 03 的其他前景内容。
- 不修改其他场景的状态切换。
- 不改变 Scene 03 的镜头移动范围、文案节奏或小船行为。
