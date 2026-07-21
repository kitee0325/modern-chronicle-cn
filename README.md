# Modern Chronicle CN

基于 React、TypeScript 与 Vite 的前端项目。

```bash
npm install
npm run dev
```

可用命令：

- `npm run dev`：启动开发服务器
- `npm run build`：类型检查并构建生产版本
- `npm run lint`：运行 ESLint
- `npm run preview`：预览生产构建

## 场景素材

标题页运行时素材位于 `public/assets/cover/foreground.png`。标题和前言使用 DOM
文字，Cover 横移、前言滚动、短暂停顿以及到 Scene 01 的缩放混合都属于同一条
scroll timeline；Figma `Cover — ④ Original Panorama` 只作为视觉验收基准。

19 组场景素材位于 `public/assets/scenes/Scene_01` 至
`public/assets/scenes/Scene_19`。每组按实际交付内容包含 `background.png`、
`foreground.png` 中的一层或两层。

代码中可通过 `src/sceneAssets.ts` 导出的 `sceneAssets` 获取完整素材清单；
资源地址会自动适配 Vite 的 `base` 配置。
