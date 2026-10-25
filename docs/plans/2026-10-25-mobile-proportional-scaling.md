# 手机端改为 PC 等比缩放 · 2026-10-25

用户最新决定：文字先等比例缩放，让画面看起来像 PC 端横置。本次取消先前 10px 下限与移动端重排方案，未改动 PC 场景数据。本文记录提交前的实现与验证结果。

## 实现

- 手机和 PC 共用原始 cue 坐标、文本块尺寸、字号比例、行距、对齐与 SVG 图形。移除移动端重排表、SVG 路径字形分组和独立放大逻辑，也移除对应旧检查脚本。
- 场景 DOM 文字按 `designFont × frameHeight / 810` 显示；SVG 与场景原尺寸一起缩放，因此图内字形与外部文字遵循同一比例。保留图表的辅助技术描述。
- 前言恢复原位置与行距，结尾恢复 40/60 左右布局、原始标题图片与单栏正文。消除移动浏览器自动放大文字；与视口相关的字号改用逻辑横屏画框高度换算。
- 保留竖屏 CSS 顺时针旋转 90°、横屏恢复、物理坐标原生滚动、左滑推进/右滑回退、进度恢复、触摸注释及原时间线。没有添加旋转或手势提示。

## 验证

| 验收项 | 结果 |
| --- | --- |
| PC 1440×810 对比手机 844×390、390×844、568×260 | 65 个文字块和 62 个内容块的原位布局、字号、行距按画框高度归一化后通过；允许 1 个设计像素的浏览器取整误差 |
| 图表 | 8 张图表源路径与内联 path 数量一致，无移动端标签变换 |
| 前言、结尾 | 单独比较位置、尺寸、字体；短屏与 PC 最大偏差约 0.447 个设计像素。结尾标题原画可见，正文没有移动端分栏 |
| 时间线 | PC、横屏、旋转态均为 68.81 |
| Chrome 合成触摸 | 横屏前进 offset 0→301.5，回退至 150.5；旋转至纵向物理滚动后 offset 为 151，继续前进至 302.5 |
| 构建、lint、diff whitespace | 通过；没有新增依赖 |

[缩放审查数据](evidence/2026-10-25-proportional-mobile/scaling-audit.json) · [触摸审查数据](evidence/2026-10-25-proportional-mobile/touch-audit.json)

## 画面对比

- [PC 第 10 幕](evidence/2026-10-25-proportional-mobile/pc-scene-10.png)
- [手机横屏第 10 幕](evidence/2026-10-25-proportional-mobile/mobile-scene-10.png)
- [手机竖屏旋转第 10 幕](evidence/2026-10-25-proportional-mobile/portrait-scene-10.png)
- [PC 结尾](evidence/2026-10-25-proportional-mobile/pc-ending.png)
- [568×260 手机结尾](evidence/2026-10-25-proportional-mobile/mobile-ending-568.png)

这些结果来自桌面 Chrome 设备模拟和合成触摸，不是 iPhone Safari、Android 或微信真机通过。未做所有时间点的逐像素回归或低端手机性能测量。等比缩放意味着小屏文字会低于 10px，这是本次明确接受的取舍。
