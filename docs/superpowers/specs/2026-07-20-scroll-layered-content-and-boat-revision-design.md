# Scroll Chronicle 分层内容与小船修订设计

## 1. 修订目标

本轮修订解决当前预览中的五类问题：

1. 补齐 Figma 中独立存在、但未进入网页的文字、图表和数据来源层；
2. 按设计稿切换普通纸船、黑板报线稿船、后段大型轮船和最终纸船；
3. 修正船的完整贴图、朝向、水线与晃动方式；
4. 逐 scene 进行静态截图验收，先保证稳定态与设计稿一致；
5. 重分配 scene 的稳定展示和转场区间，避免整段都停留在过渡态。

本设计是对 `2026-07-20-scroll-animation-first-principles.md` 的实现修订，不改变 21 个 scene 的顺序和已确认的空间关系。

## 2. 方案选择

### 方案 A：Figma 分层资产 + 声明式 cue manifest（采用）

从 Figma 原节点导出透明的文字、图表阶段和船素材。代码保存每个 cue 的逻辑坐标、出现区间和层级，GSAP 只负责 scroll 映射。

优点：静态还原最稳定；复杂字体、手写字和图表视觉不会被浏览器重排；每个 cue 仍能独立、可逆地动画。缺点：需要维护分层资源和 manifest。

### 方案 B：全部重建为 DOM / SVG

文字用 DOM，图表用 SVG 数据重画。语义与无障碍最好，但需要人工复刻大量字体、描边、手写字和图表，静态误差与工期最高。

### 方案 C：每个 scene 使用一张完整叠加图

实现最快、静态最接近，但文字和图表只能整张淡入，无法满足坐标轴、数据、注释分阶段动画的要求。

采用方案 A。只有无法从现有 Figma 层级安全拆分的极小元素，才并入相邻 cue，不回退为整 scene 叠加图。

## 3. Scene 静态尺寸与坐标

Figma frame 是源坐标，网页舞台统一归一化到高度 `810`。frame 高度不是 810 时按以下公式换算：

```text
normalizedWidth = frameWidth × 810 / frameHeight
normalizedX = figmaX × 810 / frameHeight
normalizedY = figmaY × 810 / frameHeight
```

这解释了两个看似不一致但实际等价的导出：

- Scene 01：Figma `2887×822`，归一化后约 `2845×810`，对应 PNG `5690×1620`；
- Scene 15：Figma `4639×809`，归一化后约 `4645×810`，对应 PNG `9290×1620`。

其余 scene 的 Figma 宽度与 PNG 的 0.5× 逻辑宽度一致。实现不得把 transition 中的 scale 当作 scene 的稳定尺度。

每个 scene manifest 至少包含：

```ts
type SceneManifest = {
  id: number
  figmaNodeId: string
  worldSize: { width: number; height: 810 }
  camera: { startX: number; endX: number }
  layers: RasterLayer[]
  contentCues: ContentCue[]
  boat: BoatCue[]
  timing: SceneTiming
}
```

## 4. 文字与图表分层

### 4.1 文字

文字按 Figma 的语义容器导出，而不是逐字切图：

- 年代标题；
- 正文段落；
- 图表标题或说明；
- 数据来源；
- 黑板报中的单块板书。

每个文字 cue 使用 Figma 原始 bounds 定位。默认动画为小幅 `y` 位移、`opacity` 和垂直 clip；位移不超过逻辑舞台的 2%。年代标题先于正文，数据来源最后进入。

### 4.2 图表

图表按可辨识结构拆为三类 cue：

1. `chart-foundation`：坐标轴、基线、容器、网格；
2. `chart-data`：柱、线、点、气泡、地图或数据山；
3. `chart-annotation`：数值、图例、注释与来源。

同一图表的三个 cue 依次进入，并保留稳定停留区间。若 Figma 子层不能无损拆分，则以最小可独立导出的父组为 cue，并在验收记录中标注，不擅自重画。

所有 cue 都属于主 scroll timeline：正向为 `concealed → entering → held → leaving`，
反向自然倒放。Cover 也已并入同一 pinned timeline；只有 DOM 标题的 820ms 入场是
一次性动画，Cover 运镜、前言和 Scene 01 混合均可逆。Scene 01 的年代标题与正文
拆成两个滚动 cue。详细交接规则见 `2026-07-20-cover-scene1-scroll-transition-design.md`。

## 5. 小船状态机

### 5.1 素材族

- `paper-boat`：Scene 02、03 等早期场景中的纸船；船身和倒影分别导出，避免把整个 X 形组合一起旋转；
- `chalk-boat`：Scene 05 黑板报中的 `70:28` 线稿船，使用设计稿现成的压扁、线性形态；
- `ship`：Scene 18、19 及最终长卷前段中的大型轮船，使用对应 scene 的真实节点，不放大纸船代替；
- `final-paper-boat`：Scene 21 后段的小纸船及其倒影。

形态切换发生在明确的滚动区间内，通过短交叉淡化、尺度和锚点插值完成。黑板报阶段允许附加 `scaleX / scaleY / skewX`，但最终形态必须与 `70:28` 静态截图一致。

### 5.2 朝向

船的朝向由 Figma 资产决定，不根据用户瞬时滚动方向翻转。反向滚动只是时间轴倒放，避免触控板方向抖动造成左右闪烁。

### 5.3 晃动

路径容器和晃动容器分离：

```text
boat-route：scroll 控制 x / y / scale / skin
└─ boat-body-bob：循环 rotation 与轻微 y
└─ boat-reflection：低透明度、相反或更弱的相位
```

纸船默认以船底中点为 pivot，约 `±1.2°`、`±2px`，周期约 2.4 秒。大型轮船只允许极弱的纵向起伏，不做明显旋转；黑板线稿船不循环晃动。倒影不能与船身作为一张图同步旋转。

## 6. Scene 时间结构

每个 scene 必须先存在稳定态，再进入转场。默认局部区间：

```text
0%–12%   进入并稳定
12%–38%  文字与图表分阶段进入
38%–82%  稳定阅读与横向摄影机移动
82%–100% 短转场到下一 scene
```

转场默认不超过 scene 区间的 18%；内容多的 scene 可把稳定阅读扩大到 55% 以上。禁止继续使用固定 `0.82` 时间单位套在所有 scene 上。

进入下一个 scene 后，前一 scene 的 portal scale、clip 和位移必须已经结束。稳定态开始前统一归一化：`scale: 1`、`yPercent: 0`、完整 clip，避免 transition 初值泄漏到整段 scene。

## 7. 静态截图验收

动画调试前先完成 21 个 scene 的静态验收。每个 scene 生成两类截图：

1. **全景稳定态**：浏览器逻辑视口宽度等于该 scene 的归一化 world width，高度 810；与 Figma frame 全景截图对照；
2. **1440×810 摄影机检查点**：在 scene 的 start、middle、end 三个稳定摄影机位置截图，检查关键文字、图表、人物、窗框和船是否处于正确比例与层级。

验收条件：

- 背景、前景、内容和船的相对坐标一致；
- 稳定态没有 transition scale、clip 或偏移残留；
- 不露透明边缘，不拉伸素材；
- 文字与图表完整，无裁切或重复；
- 船身、倒影、水线、朝向和形态与对应 Figma scene 一致。

截图结果汇总为 contact sheet，并在 `docs/superpowers/reviews/` 记录每个 scene 的通过状态和已知差异。

## 8. 动态验收

- 任意 scene 停在稳定区间时，至少 44% 的局部进度不属于 scene-to-scene 转场；
- 快速前滚、后滚并回到同一进度，除循环晃动相位外画面一致；
- 文字与图表在反向滚动时按相反顺序收回；
- 普通纸船、黑板线稿船、大型轮船和最终纸船均能在正确 scene 出现；
- Scene 05 黑板报船保持线稿变形，不显示普通纸船；
- Scene 18/19 使用大型轮船，不显示被放大的纸船；
- 最终纸船从右侧驶出，倒影和船身不发生同步刚性旋转；
- `prefers-reduced-motion` 停止循环晃动，并将大幅 portal 缩放降级为淡化，但保留全部内容。

## 9. 性能与资源

- 透明 cue 资产按 scene 邻近范围加载；
- 相同 cue 不重复导出，复用 URL 与 bounds；
- 超长全景保持现有邻近 scene 解码策略；
- 只对当前参与动画的 cue 和船节点使用 `will-change`；
- resize 后按同一语义进度重建 camera 和 cue 关键帧并执行 `ScrollTrigger.refresh()`。

## 10. 完成定义

本轮完成必须同时满足：

1. 21 个 scene 的静态 contact sheet 已逐项对照 Figma；
2. 所有 Figma 可见文字和图表都进入网页，并有可逆 scroll cue；
3. 四类船素材及其正确朝向、晃动和形态切换已实现；
4. scene 稳定区间显著长于转场区间；
5. build、lint、桌面/窄屏/宽屏、快速反向和 reduced-motion 验证通过；
6. 任何因 Figma 层级无法拆分而降级的图表 cue 都明确记录，没有静默遗漏。

## 11. 已冻结的实现契约

Figma file key 固定为 `cxUHkI5OuXTwVRbOIuzev5`。逐 cue 的 `figmaNodeId / assetPath / logicalBounds / kind` 以 `src/sceneCues.ts` 为唯一机器可读来源；背景与前景路径以 `src/sceneAssets.ts` 为唯一来源。运行时不得另建第二份坐标表。

| Scene | Figma frame | cue 数 | 船形态 | 内容区间 | 稳定/摄影机区间 | 转场区间 |
|---:|---|---:|---|---|---|---|
| 01 | `15:7` | 2（标题 scroll、正文 scroll） | paper | 0–18% 依次进入，18–38% 停镜阅读 | 38–84% | 84–100% dive |
| 02 | `15:65` | 3 | paper | 10–38% | 38–84% | 84–100% surface |
| 03 | `30:962` | 1 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 04 | `27:835` | 4 | paper | 10–38% | 38–84% | 84–100% dive |
| 05 | `70:10` | 3 | chalk | 10–38% | 38–84% | 84–100% surface |
| 06 | `76:9743` | 1 | paper | 10–38% | 38–84% | 84–100% dive |
| 07 | `76:9890` | 4 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 08 | `76:9978` | 2 | paper | 10–38% | 38–84% | 84–100% gradient |
| 09 | `76:10136` | 2 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 10 | `76:10299` | 1 | paper | 10–38% | 38–84% | 84–100% surface |
| 11 | `76:10543` | 2 | paper | 10–38% | 38–84% | 84–100% dive |
| 12 | `76:11395` | 3 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 13 | `76:11721` | 3 | paper | 10–38% | 38–84% | 84–100% surface |
| 14 | `76:12737` | 1 | paper | 10–38% | 38–84% | 84–100% dive |
| 15 | `76:12035` | 4 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 16 | `76:13394` | 2 | paper | 10–38% | 38–84% | 84–100% horizontal |
| 17 | `76:13931` | 1 | paper | 10–38% | 38–84% | 84–100% surface |
| 18 | `76:14958` | 3 | ship | 10–38% | 38–84% | 84–100% dive |
| 19 | `76:16088` | 4 | ship-close | 10–38% | 38–84% | 84–100% surface |
| 20 | `76:16659` | 3 | ship-close | 10–38% | 38–84% | 84–100% dive |
| 21 | `76:17556` | 7 | final | 10–38% | 38–80% | 80–100% 驶出画面 |

所有 Scene 01–20 的 `transitionRatio` 固定为 `0.16`，机器断言必须满足 `transitionRatio <= 0.18`。每个 Scene cue 均由 master timeline 控制，没有一次性播放标记；图表以基础轮廓、主体数据、完整注释三个 reveal 阶段完成。Cover 不计入 Scene cue。船皮肤边界使用 6% scene 时长交叉淡化；纸船循环为 `±1.2° / ±2px / 2.4s`，轮船只有 `±1.5px / 3.6s`，chalk 不循环。

## 12. 固定验收矩阵

- 静态摄影机：`1440×810`，每 scene 的 local progress 固定为 `0 / 0.5 / 0.9`；共 63 张。
- 窄屏：`360×800`，16:9 画面上下 letterbox；内容按同一逻辑坐标缩放。
- 宽屏：`2560×1080`；超宽：`3440×1440`。外景展示更多连续世界，车厢内以原 scene 边界和摄影机 clamp 收束。
- 截图前等待 `networkidle`、字体加载和图片 decode；静态模式停止 bob。
- 正反向一致性在 `prefers-reduced-motion` 下对同一 document progress 做像素比较，允许阈值为平均通道差 `< 0.5`；当前实测为 `0.0`。
- 动态稳定态只允许一个 scene 的 part 超过 `opacity 0.05`；边界的双 scene 可见只存在于最后 16%。
