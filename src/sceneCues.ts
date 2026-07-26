import s02ChartSvg from './assets/charts/s02-chart.svg?url'
import s06ChartSvg from './assets/charts/s06-chart.svg?url'
import s10ChartSvg from './assets/charts/s10-chart.svg?url'
import s11ChartSvg from './assets/charts/s11-chart.svg?url'
import s13ChartSvg from './assets/charts/s13-chart.svg?url'
import s14ChartSvg from './assets/charts/s14-chart.svg?url'
import s16ChartSvg from './assets/charts/s16-chart.svg?url'
import s17ChartSvg from './assets/charts/s17-chart.svg?url'
import s19ChartSvg from './assets/charts/s19-chart.svg?url'

export type CueKind = 'title' | 'copy' | 'chart' | 'illustration' | 'source'
export type CueMode = 'initial' | 'scroll'

export type CueCrop = {
  x: number
  y: number
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
}

export type SceneCue = {
  id: string
  figmaNodeId: string
  kind: CueKind
  asset: string
  x: number
  y: number
  width: number
  height: number
  mode: CueMode
  svgAsset?: string
  crop?: CueCrop
  text?: readonly string[]
}

type SceneCueManifest = {
  figmaFrameId: string
  frameHeight: number
  cues: readonly SceneCue[]
}

const cueAsset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/cues/${name}.png`

const illustrationAsset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/illustrations/${name}.png`

const chartSvgs: Record<string, string> = {
  's02-chart': s02ChartSvg,
  's06-chart': s06ChartSvg,
  's10-chart': s10ChartSvg,
  's11-chart': s11ChartSvg,
  's13-chart': s13ChartSvg,
  's14-chart': s14ChartSvg,
  's16-chart': s16ChartSvg,
  's17-chart': s17ChartSvg,
  's19-chart': s19ChartSvg,
}

const cue = (
  id: string,
  figmaNodeId: string,
  kind: CueKind,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    asset?: string
    assetId?: string
    mode?: CueMode
    crop?: CueCrop
    text?: readonly string[]
  } = {},
): SceneCue => ({
  id,
  figmaNodeId,
  kind,
  asset: options.asset ?? cueAsset(options.assetId ?? id),
  x,
  y,
  width,
  height,
  mode: options.mode ?? 'scroll',
  svgAsset: kind === 'chart' ? chartSvgs[id] : undefined,
  crop: options.crop,
  text: options.text,
})

export const sceneCueManifests: readonly SceneCueManifest[] = [
  { figmaFrameId: '15:7', frameHeight: 822, cues: [
    cue('s01-title', '15:61', 'title', 104, 79, 290, 40, {
      assetId: 's01-copy',
      crop: { x: 0, y: 0, width: 290, height: 40, sourceWidth: 290, sourceHeight: 367 },
    }),
    cue('s01-copy', '15:61', 'copy', 104, 153, 290, 293, {
      crop: { x: 0, y: 74, width: 290, height: 293, sourceWidth: 290, sourceHeight: 367 },
    }),
  ] },
  { figmaFrameId: '15:65', frameHeight: 810, cues: [
    cue('s02-copy-opening', '15:691', 'copy', 93, 80, 450, 178, {
      assetId: 's02-copy',
      crop: { x: 0, y: 0, width: 450, height: 178, sourceWidth: 3016, sourceHeight: 178 },
    }),
    cue('s02-copy-gdp', '15:691', 'copy', 2793, 80, 316, 178, {
      assetId: 's02-copy',
      crop: { x: 2700, y: 0, width: 316, height: 178, sourceWidth: 3016, sourceHeight: 178 },
    }),
    cue('s02-chart', '15:688', 'chart', 2853.040039, 309.827637, 567.959961, 403.172363),
    cue('s02-source', '15:682', 'source', 0, 741, 4517, 70, {
      text: ['数据来源：CountryEconomy 网站。'],
    }),
  ] },
  { figmaFrameId: '30:962', frameHeight: 810, cues: [
    cue('s03-copy-opening', '26:120', 'copy', 104, 117, 350, 210, {
      assetId: 's03-copy',
      crop: { x: 0, y: 0, width: 350, height: 210, sourceWidth: 2300, sourceHeight: 210 },
    }),
    cue('s03-copy-later', '26:120', 'copy', 2054, 117, 350, 210, {
      assetId: 's03-copy',
      crop: { x: 1950, y: 0, width: 350, height: 210, sourceWidth: 2300, sourceHeight: 210 },
    }),
  ] },
  { figmaFrameId: '70:10', frameHeight: 810, cues: [
    cue('s04-title', '70:30', 'title', 182, 114, 280, 40),
    cue('s04-copy', '70:29', 'copy', 182, 212, 290, 48),
    cue('s04-source', '70:35', 'source', 0, 740, 3653, 70, {
      text: [
        '注释：据《人民日报》1951 年 4 月 30 日：抗美援朝时期，报刊、广播、海报和文艺作品成为重要宣传载体。1951 年东北 14 个城市共组织 1600 余名报告员，开展 2800 余场报告会，听众超过 120 万人；同时有 25600 余名宣传员参与基层宣传工作。',
        '板报上的语录节选自《人民日报》1950 年 11 月 5 日：《坚决抗美援朝保家卫国——本报各地读者来信》。',
      ],
    }),
  ] },
  { figmaFrameId: '76:9743', frameHeight: 810, cues: [cue('s05-copy', '76:9783', 'copy', 268, 92, 307, 164)] },
  { figmaFrameId: '76:9890', frameHeight: 810, cues: [
    cue('s06-title', '76:9936', 'title', 140, 103, 307, 40),
    cue('s06-copy', '76:9975', 'copy', 147, 190, 551, 100),
    cue('s06-chart', '76:9937', 'chart', 146, 343, 520.000061, 349.386414),
    cue('s06-source', '76:9971', 'source', 0, 740, 1440, 70, {
      text: ['数据来源：国家统计局国民经济综合统计司编，《新中国五十年统计资料汇编》，北京：中国统计出版社（1999 年）。'],
    }),
  ] },
  { figmaFrameId: '76:10136', frameHeight: 810, cues: [
    cue('s07-title', '76:10297', 'title', 128, 82, 307, 40),
    cue('s07-copy', '76:10296', 'copy', 128, 181, 290, 120),
  ] },
  { figmaFrameId: '76:10299', frameHeight: 810, cues: [cue('s08-copy', '76:10411', 'copy', 203, 50, 802, 384)] },
  { figmaFrameId: '76:10543', frameHeight: 810, cues: [
    cue('s09-title', '76:10739', 'title', 73, 69, 280, 40),
    cue('s09-copy', '76:10738', 'copy', 73, 166, 354, 127),
  ] },
  { figmaFrameId: '265:4689', frameHeight: 810, cues: [
    cue('s10-copy', '76:11710', 'copy', 102, 77, 566, 235),
    cue('s10-chart', '265:4833', 'chart', 1150.5, 103, 1685, 707),
    cue('s10-source', '76:11717', 'source', 0, 740, 2834, 70, {
      text: ['数据来源：[1] 国家统计局国民经济综合统计司编，《新中国五十年统计资料汇编》，北京：中国统计出版社（1999 年）。[2] 徐安琪（2000），《择偶标准：五十年变迁及其原因分析》，载《社会学研究》，第 6 期，第 18—30 页。'],
    }),
  ] },
  { figmaFrameId: '265:7684', frameHeight: 810, cues: [
    cue('s11-chart', '265:7694', 'chart', 538, 71, 950, 396),
    cue('s11-handwritten-letter', '76:11933', 'illustration', 1632, 189, 820, 522, {
      asset: illustrationAsset('handwritten-letter'),
    }),
    cue('s11-copy-1', '76:11960', 'copy', 130, 53, 400, 629, {
      assetId: 's11-copy',
      crop: { x: 0, y: 0, width: 400, height: 629, sourceWidth: 4963, sourceHeight: 629 },
    }),
    cue('s11-copy-2', '76:11960', 'copy', 1530, 53, 430, 629, {
      assetId: 's11-copy',
      crop: { x: 1400, y: 0, width: 430, height: 629, sourceWidth: 4963, sourceHeight: 629 },
    }),
    cue('s11-copy-3', '76:11960', 'copy', 1960, 53, 750, 629, {
      assetId: 's11-copy',
      crop: { x: 1830, y: 0, width: 750, height: 629, sourceWidth: 4963, sourceHeight: 629 },
    }),
    cue('s11-copy-4', '76:11960', 'copy', 3380, 53, 880, 629, {
      assetId: 's11-copy',
      crop: { x: 3250, y: 0, width: 880, height: 629, sourceWidth: 4963, sourceHeight: 629 },
    }),
    cue('s11-copy-5', '76:11960', 'copy', 4350, 53, 500, 629, {
      assetId: 's11-copy',
      crop: { x: 4220, y: 0, width: 500, height: 629, sourceWidth: 4963, sourceHeight: 629 },
    }),
    cue('s11-copy2', '76:11970', 'copy', 2018, 157, 587, 70),
    cue('s11-source', '76:11999', 'source', 0, 740, 2054, 70, {
      crop: { x: 0, y: 0, width: 1440, height: 74, sourceWidth: 2054, sourceHeight: 74 },
      text: ['数据来源：[1] 国家统计局国民经济综合统计司（1999）；[2]《新中国五十年统计年鉴》，北京：中国统计出版社。'],
    }),
  ] },
  { figmaFrameId: '76:12737', frameHeight: 810, cues: [cue('s12-copy', '76:13342', 'copy', 1164, 216, 415, 72)] },
  { figmaFrameId: '76:12035', frameHeight: 809, cues: [
    cue('s13-title', '76:12724', 'title', 471, 36, 439, 96),
    cue('s13-copy-1', '76:12721', 'copy', 473, 73, 350, 196, {
      assetId: 's13-copy',
      crop: { x: 0, y: 0, width: 350, height: 196, sourceWidth: 3540, sourceHeight: 196 },
    }),
    cue('s13-copy-2', '76:12721', 'copy', 1923, 73, 850, 196, {
      assetId: 's13-copy',
      crop: { x: 1450, y: 0, width: 850, height: 196, sourceWidth: 3540, sourceHeight: 196 },
    }),
    cue('s13-copy-3', '76:12721', 'copy', 3253, 73, 760, 196, {
      assetId: 's13-copy',
      crop: { x: 2780, y: 0, width: 760, height: 196, sourceWidth: 3540, sourceHeight: 196 },
    }),
    cue('s13-chart', '265:6426', 'chart', 983, 67, 830.06897, 281),
    cue('s13-source', '76:12733', 'source', 0, 740, 3630, 70, {
      text: ['数据来源：[1] 中国国家统计局《全国人口普查主要数据公报》（1957 年、1964 年、1982 年、1990 年、2000 年）；[2] 中国国家统计局：1995 年全国 1% 人口抽样调查。'],
    }),
  ] },
  { figmaFrameId: '76:13394', frameHeight: 810, cues: [
    cue('s14-copy', '76:13919', 'copy', 110, 42, 559, 256),
    cue('s14-chart', '265:10821', 'chart', 873, 56, 1990, 450.125244),
    cue('s14-source', '76:13927', 'source', 828, 743, 1585, 67, {
      crop: { x: 0, y: 0, width: 1439, height: 71, sourceWidth: 1585, sourceHeight: 71 },
      text: ['数据来源：中华人民共和国教育部（历年）、中国教育统计年鉴（1949—1981）。'],
    }),
  ] },
  { figmaFrameId: '76:13931', frameHeight: 810, cues: [cue('s15-copy', '76:14915', 'copy', 215, 75, 518, 160)] },
  { figmaFrameId: '76:14958', frameHeight: 810, cues: [
    cue('s16-title', '76:15098', 'title', 338, 41, 439, 96),
    cue('s16-copy', '76:15099', 'copy', 344, 152, 421, 72),
    cue('s16-chart', '76:15101', 'chart', 956, 136.040039, 625.600098, 323.959961),
  ] },
  { figmaFrameId: '76:16088', frameHeight: 810, cues: [
    cue('s17-title', '76:16656', 'title', 156, 41, 439, 96),
    cue('s17-copy', '76:16657', 'copy', 162, 152, 423, 96),
    cue('s17-chart', '76:16509', 'chart', 841, 69, 918.649719, 433),
    cue('s17-source-copy', '76:20779', 'copy', 0, 570, 1922, 160, {
      assetId: 's17-source',
      crop: { x: 0, y: 0, width: 1922, height: 160, sourceWidth: 1922, sourceHeight: 240 },
    }),
    cue('s17-source', '76:20779', 'source', 0, 730, 1922, 80, {
      crop: { x: 0, y: 160, width: 1922, height: 80, sourceWidth: 1922, sourceHeight: 240 },
      text: ['数据来源：《中国乡镇企业年鉴（1997）》；国家统计局《之六：乡镇企业异军突起》。'],
    }),
  ] },
  { figmaFrameId: '76:16659', frameHeight: 810, cues: [
    cue('s18-copy1', '76:17514', 'copy', 1125, 228, 404, 32),
    cue('s18-copy2', '76:17526', 'copy', 1125, 269, 384, 72),
    cue('s18-copy3', '76:17527', 'copy', 2709, 225, 247, 110),
  ] },
  { figmaFrameId: '76:17556', frameHeight: 810, cues: [
    cue('s19-title', '76:20650', 'title', 162, 41, 439, 96),
    cue('s19-copy1', '76:20648', 'copy', 162, 137, 663, 72),
    cue('s19-chart', '76:20654', 'chart', 924, 47, 1702, 334),
    cue('s19-copy2', '76:20649', 'copy', 1627, 48, 726, 48),
    cue('s19-copy3', '76:20651', 'copy', 5199, 89, 726, 94),
    cue('s19-copy4', '76:20652', 'copy', 6587, 659, 438, 147),
    cue('s19-source', '76:20755', 'source', 0, 740, 3589, 70, {
      text: ['数据来源：国家统计局历年《中国统计年鉴》“职工平均工资及指数”表，历年城镇单位就业人员平均工资统计公报。'],
    }),
  ] },
] as const

export const normalizeCueValue = (value: number, frameHeight: number) =>
  value * (810 / frameHeight)
