import s02ChartSvg from './assets/charts/s02-chart.svg?url'
import s06ChartSvg from './assets/charts/s06-chart.svg?url'
import s10ChartSvg from './assets/charts/s10-chart.svg?url'
import s11ChartSvg from './assets/charts/s11-chart.svg?url'
import s13ChartSvg from './assets/charts/s13-chart.svg?url'
import s14ChartSvg from './assets/charts/s14-chart.svg?url'
import s17ChartSvg from './assets/charts/s17-chart.svg?url'
import s19ChartSvg from './assets/charts/s19-chart.svg?url'

export type TextCueKind = 'title' | 'copy' | 'source'
export type CueKind = TextCueKind | 'chart' | 'illustration'
export type CueMode = 'initial' | 'scroll'
export type CueTextAlign = 'left' | 'center' | 'justify'
export type CueTextRole = 'heading' | 'body' | 'source' | 'caption'

export type CueTextBlock = {
  figmaNodeId: string
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  lineHeight: number
  color: string
  align: CueTextAlign
  role: CueTextRole
}

type BaseSceneCue = {
  id: string
  figmaNodeId: string
  x: number
  y: number
  width: number
  height: number
  mode: CueMode
}

export type TextSceneCue = BaseSceneCue & {
  kind: TextCueKind
  blocks: readonly CueTextBlock[]
  asset?: never
  svgAsset?: never
}

export type ChartSceneCue = BaseSceneCue & {
  kind: 'chart'
  svgAsset: string
  asset?: never
  blocks?: never
}

export type IllustrationSceneCue = BaseSceneCue & {
  kind: 'illustration'
  asset: string
  svgAsset?: never
  blocks?: never
}

export type SceneCue = TextSceneCue | ChartSceneCue | IllustrationSceneCue

export type SceneCueManifest = {
  figmaFrameId: string
  frameHeight: number
  cues: readonly SceneCue[]
}

const WHITE = '#fff'
const BLACK = '#000'
const NIGHT_GOLD = '#cbb28e'
const MUTED_PLUM = '#804e5c'

const illustrationAsset = (name: string) =>
  `${import.meta.env.BASE_URL}assets/illustrations/${name}.png`

const chartSvgs: Record<string, string> = {
  's02-chart': s02ChartSvg,
  's06-chart': s06ChartSvg,
  's10-chart': s10ChartSvg,
  's11-chart': s11ChartSvg,
  's13-chart': s13ChartSvg,
  's14-chart': s14ChartSvg,
  's17-chart': s17ChartSvg,
  's19-chart': s19ChartSvg,
}

type TextBlockOptions = {
  fontSize?: number
  lineHeight?: number
  color?: string
  align?: CueTextAlign
  role?: CueTextRole
}

const textBlock = (
  figmaNodeId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: TextBlockOptions = {},
): CueTextBlock => ({
  figmaNodeId,
  text,
  x,
  y,
  width,
  height,
  fontSize: options.fontSize ?? 14,
  lineHeight: options.lineHeight ?? 24,
  color: options.color ?? BLACK,
  align: options.align ?? 'justify',
  role: options.role ?? 'body',
})

const headingBlock = (
  figmaNodeId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height = 40,
  color = BLACK,
) => textBlock(figmaNodeId, text, x, y, width, height, {
  fontSize: 60,
  lineHeight: 40,
  color,
  align: 'left',
  role: 'heading',
})

const textCue = (
  id: string,
  figmaNodeId: string,
  kind: TextCueKind,
  x: number,
  y: number,
  width: number,
  height: number,
  blocks: readonly CueTextBlock[],
  mode: CueMode = 'scroll',
): TextSceneCue => ({
  id,
  figmaNodeId,
  kind,
  x,
  y,
  width,
  height,
  blocks,
  mode,
})

const singleTextCue = (
  id: string,
  figmaNodeId: string,
  kind: TextCueKind,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options: TextBlockOptions = {},
): TextSceneCue => textCue(
  id,
  figmaNodeId,
  kind,
  x,
  y,
  width,
  height,
  [textBlock(figmaNodeId, text, 0, 0, width, height, options)],
)

const chartCue = (
  id: string,
  figmaNodeId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  mode: CueMode = 'scroll',
): ChartSceneCue => ({
  id,
  figmaNodeId,
  kind: 'chart',
  x,
  y,
  width,
  height,
  mode,
  svgAsset: chartSvgs[id],
})

const illustrationCue = (
  id: string,
  figmaNodeId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  asset: string,
): IllustrationSceneCue => ({
  id,
  figmaNodeId,
  kind: 'illustration',
  x,
  y,
  width,
  height,
  mode: 'scroll',
  asset,
})

export const sceneCueManifests: readonly SceneCueManifest[] = [
  {
    figmaFrameId: '15:7',
    frameHeight: 822,
    cues: [
      textCue('s01-title', '15:61', 'title', 104, 79, 290, 40, [
        headingBlock('15:63', '1949-1957', 0, 0, 280, 40, WHITE),
      ]),
      textCue('s01-copy', '15:61', 'copy', 104, 153, 290, 293, [
        textBlock(
          '15:62',
          '这是一个时代的黎明，万物静待复苏。在这样的背景下，个体的爱情、健康与婚姻，往往由不得自己抉择。',
          0,
          38,
          290,
          72,
          { color: WHITE },
        ),
        textBlock(
          '15:64',
          '1949年，中华人民共和国刚刚成立。彼时，各项制度百废待兴，资源极度匮乏，一切都在艰难中走向重建。与欧美国家相比，当时中国的人均收入、医疗资源和基础设施都处于极低的水平。城乡鸿沟如一道天堑，公共服务捉襟见肘，个体的命运与生活选择，被深深地禁锢在匮乏的生存条件与刚性的体制结构之中。',
          0,
          125,
          290,
          168,
          { color: WHITE },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '15:65',
    frameHeight: 810,
    cues: [
      textCue('s02-copy-opening', '15:691', 'copy', 93, 80, 450, 178, [
        headingBlock('15:586', '1949-1957', 0, 0, 280),
        textBlock(
          '15:584',
          '1934年，赵大春出生。像一艘小船，这个平凡的生命在时代的汪洋中沉浮、启航，驶入了波澜壮阔的历史洪流。',
          6,
          78,
          354,
          48,
        ),
      ]),
      textCue('s02-copy-gdp', '15:691', 'copy', 2793, 80, 316, 178, [
        textBlock(
          '15:585',
          '彼时，中国的GDP总量虽位居全球第五，但庞大的人口基数，使得人均GDP依然定格在世界的尾部。',
          62,
          106,
          254,
          72,
        ),
      ]),
      chartCue('s02-chart', '15:688', 2853.040039, 309.827637, 567.959961, 403.172363),
      textCue('s02-source', '15:682', 'source', 0, 741, 4517, 70, [
        textBlock('15:685', '数据来源：CountryEconomy网站。', 2869, 23, 1095.05249, 24, {
          color: WHITE,
          role: 'source',
        }),
      ]),
    ],
  },
  {
    figmaFrameId: '30:962',
    frameHeight: 810,
    cues: [
      textCue('s03-copy-opening', '26:120', 'copy', 104, 117, 350, 210, [
        headingBlock('25:115', '1949-1957', 0, 0, 280, 40, WHITE),
        textBlock(
          '25:106',
          '时代浪潮奔涌向前，少年初心扎根家国。1949年，14岁的赵大春秘密入团。攥着拳头宣誓：“要为革命奋斗。”他先后参加土改宣传队，披斗地主等革命工作，紧跟时代步伐传递革命思想。',
          0,
          90,
          280,
          120,
          { color: WHITE },
        ),
      ]),
      textCue('s03-copy-later', '26:120', 'copy', 2054, 117, 350, 210, [
        headingBlock('25:114', '1949-1957', 70, 0, 280, 40, WHITE),
        textBlock(
          '25:105',
          '1950年，鸭绿江边的战火打破了神州大地的平静。这是一场实力极不对等的较量。士兵们穿着单薄的棉衣跨过冰封的江面，用血肉之躯在冰天雪地的异国战场上，硬是凭着血性与信念，顶住了现代化的钢铁洪流。',
          70,
          90,
          280,
          120,
          { color: WHITE },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '70:10',
    frameHeight: 810,
    cues: [
      textCue('s04-title', '70:30', 'title', 182, 114, 280, 40, [
        headingBlock('70:30', '1949-1957', 0, 0, 280, 40, WHITE),
      ]),
      singleTextCue(
        's04-copy',
        '70:29',
        'copy',
        182,
        212,
        290,
        48,
        '在这场保家卫国的时代大潮下，1952年，年少赤诚的赵大春满怀热血，报名参军。',
        { color: WHITE },
      ),
      textCue('s04-source', '70:35', 'source', 0, 740, 3653, 70, [
        textBlock(
          '70:37',
          '注释：据《人民日报》1951年4月30日：抗美援朝时期，报刊、广播、海报和文艺作品成为重要宣传载体。1951年东北14个城市共组织1600余名报告员，开展2800余场报告会，听众超过120万人;同时有25600余名宣传员参与基层宣传工作。\n板报上的语录节选自《人民日报》1950年11月5日：《坚决抗美援朝保家卫国——本报各地读者来信》。',
          204,
          11,
          1722.422607,
          48,
          { color: WHITE, role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:9743',
    frameHeight: 810,
    cues: [
      textCue('s05-copy', '76:9783', 'copy', 268, 92, 307, 164, [
        headingBlock('76:9785', '1949-1957', 0, 0, 307),
        textBlock(
          '76:9784',
          '然而在体检中，他被误诊为心脏病，并被判定为身体不合格。',
          0,
          124,
          290,
          40,
          { lineHeight: 20 },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:9890',
    frameHeight: 810,
    cues: [
      textCue('s06-title', '76:9936', 'title', 140, 103, 307, 40, [
        headingBlock('76:9936', '1949-1957', 0, 0, 307),
      ]),
      singleTextCue(
        's06-copy',
        '76:9975',
        'copy',
        147,
        190,
        551,
        100,
        '新中国成立初期，全国的医疗机构凤毛麟角。1949年，中国有5.42亿人口，而全国的卫生机构却仅仅只有3670所。这意味着，平均每接近15万中国人才拥有一家卫生机构。真正具备系统诊疗能力、能做严谨复核的医院更是凤毛麟角。\n\n1952年，虽然中国基层的医疗机构正在逐步发展，但专业的医疗保障增长仍然相当有限。',
        { lineHeight: 20 },
      ),
      chartCue('s06-chart', '76:9937', 146, 343, 520.000061, 349.386414),
      textCue('s06-source', '76:9971', 'source', 0, 740, 1440, 70, [
        textBlock(
          '76:9973',
          '数据来源：国家统计局国民经济综合统计司 编，《新中国五十年统计资料汇编》，北京：中国统计出版社（1999年）。',
          138,
          23,
          733,
          24,
          { role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:10136',
    frameHeight: 810,
    cues: [
      textCue('s07-title', '76:10297', 'title', 128, 82, 307, 40, [
        headingBlock('76:10297', '1949-1957', 0, 0, 307),
      ]),
      singleTextCue(
        's07-copy',
        '76:10298',
        'copy',
        128,
        181,
        290,
        120,
        '这一纸轻飘飘却重逾千斤的诊断书，猝然改写了他的人生轨迹。参军无望，他陷入了漫长的消沉与低谷。而在那段灰暗的日子里，命运的捉弄接踵而至，他也与自己的初恋女友——芳芳，最终走到了缘分的尽头。',
      ),
    ],
  },
  {
    figmaFrameId: '76:10299',
    frameHeight: 810,
    cues: [
      singleTextCue(
        's08-copy',
        '76:10411',
        'copy',
        203,
        50,
        802,
        384,
        '在这样的境遇下，消沉的赵大春回到了家乡。\n最终，他接受了父母之命、媒妁之言，\n与一位农村姑娘结了婚。',
        {
          fontSize: 32,
          lineHeight: 70,
          color: NIGHT_GOLD,
          align: 'left',
        },
      ),
    ],
  },
  {
    figmaFrameId: '76:10543',
    frameHeight: 810,
    cues: [
      textCue('s09-title', '76:10739', 'title', 73, 69, 280, 40, [
        headingBlock('76:10739', '1949-1957', 0, 0, 280, 40, BLACK),
      ]),
      singleTextCue(
        's09-copy',
        '76:10738',
        'copy',
        73,
        166,
        354,
        127,
        '20世纪50年代初期，中国的婚姻选择深受家族结构与社会规范的裹挟。尽管《婚姻法》在法律层面上确立了婚姻自由与男女平等，但在日常生活的细节里，包办婚姻与媒妁之言依然根深蒂固。',
        { color: BLACK },
      ),
    ],
  },
  {
    figmaFrameId: '265:4689',
    frameHeight: 810,
    cues: [
      textCue('s10-copy', '76:11710', 'copy', 102, 77, 566, 235, [
        headingBlock('76:11711', '1949-1957', 0, 0, 280, 40, MUTED_PLUM),
        textBlock(
          '76:11712',
          '在当时的择偶标准中，个人的情感往往要让位于“可靠性”与“稳定性”——是否老实本分、性格温和、是否符合家庭与社会的期待，往往更具决定性意义。 “家庭成分好”、“政治上无风险”，成了人们心中秘而不宣、却决定生死的隐性硬标准。',
          4,
          108,
          562,
          127,
          { color: MUTED_PLUM },
        ),
      ]),
      chartCue('s10-chart', '265:4833', 1150.5, 103, 1685, 707),
      textCue('s10-source', '76:11717', 'source', 0, 740, 2834, 70, [
        textBlock(
          '76:11719',
          '数据来源：[1]国家统计局国民经济综合统计司 编，《新中国五十年统计资料汇编》，北京：中国统计出版社（1999年）。[2]徐安琪（2000），《择偶标准：五十年变迁及其原因分析》，载《社会学研究》，第6期，第18-30页。',
          1146,
          23,
          1485,
          24,
          { color: WHITE, role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '265:7684',
    frameHeight: 810,
    cues: [
      chartCue('s11-chart', '265:7694', 538, 71, 950, 396),
      illustrationCue(
        's11-handwritten-letter',
        '76:11933',
        1632,
        189,
        820,
        522,
        illustrationAsset('handwritten-letter'),
      ),
      textCue('s11-copy-1', '76:11960', 'copy', 130, 53, 400, 629, [
        headingBlock('76:11968', '1957-1961', 0, 2, 400),
        textBlock(
          '76:11967',
          '天灾与人祸接踵而至。\n生离死别，变得毫无预兆。',
          3,
          151,
          309,
          48,
        ),
      ]),
      textCue('s11-copy-2', '76:11960', 'copy', 1530, 53, 430, 629, [
        headingBlock('76:11969', '1957-1961', 102, 0, 328),
      ]),
      textCue('s11-copy-3', '76:11960', 'copy', 1960, 53, 750, 629, [
        textBlock(
          '76:11962',
          '50年代末，受当时政治环境的影响，“大跃进”的失误与“反右倾”运动的蔓延，为农业产值的虚报浮夸埋下了伏笔。1959至1961年间，三年困难时期骤至，加之苏联政府突然撕毁经济合同，多重不利因素交织在一起，让国民经济一度陷入了严重困难的境地。',
          58,
          20,
          587,
          169,
        ),
        textBlock(
          '76:11961',
          '• 文字选自赵大春手写回忆录',
          317,
          529,
          170,
          24,
          { fontSize: 12, align: 'center', role: 'caption' },
        ),
      ]),
      textCue('s11-copy-4', '76:11960', 'copy', 3380, 53, 880, 629, [
        textBlock(
          '76:11963',
          '这场困境也彻底改写了赵大春的家庭命运。在那段日子里，赵大春的双亲相继离世。他在以第三人称写下的回忆录中这样写道：',
          84,
          28,
          705,
          72,
        ),
        textBlock(
          '76:11964',
          '在火车站，他反复叮嘱母亲：“如果回乡后日子实在过不下去，就一定要再搬过来。”然而短短一个多月后，噩耗传来——父亲已经撒手人寰。站在坟前，他失声痛哭，无论如何也想不通为什么一切会发生得这么快……他原本以为，既然公共食堂能吃上饭，再加上自己这次带回来的物资，家里总能勉强支撑一阵子。”',
          84,
          89,
          705,
          96,
        ),
      ]),
      textCue('s11-copy-5', '76:11960', 'copy', 4350, 53, 500, 629, [
        textBlock(
          '76:11965',
          '然而，面对时代灾厄，个体的努力终究如螳臂当车。',
          84,
          605,
          416,
          24,
        ),
      ]),
      singleTextCue(
        's11-copy2',
        '76:11970',
        'copy',
        2018,
        157,
        587,
        70,
        '彼时民生凋敝，各地车站挤满面黄肌瘦的返乡群众，物资极度匮乏。粮食绝收、旱情肆虐，集体食堂的口粮极尽粗劣，窝窝头中掺杂野菜、山芋藤与碾碎的花生壳。饥荒之下，民众普遍出现身体水肿，民间更是出现诸多艰难度日的窘迫景象，有人依靠老鼠肉过活，生存举步维艰。',
      ),
      textCue('s11-source', '76:11999', 'source', 0, 740, 2054, 70, [
        textBlock(
          '76:12001',
          '数据来源：[1]国家统计局国民经济综合统计司（1999）；[2]《新中国五十年统计年鉴》，北京，中国：中国统计出版社',
          569,
          23,
          1485,
          24,
          { role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:12737',
    frameHeight: 810,
    cues: [
      textCue('s12-copy', '76:13342', 'copy', 1164, 216, 415, 72, [
        textBlock(
          '76:13342',
          '即便是身处最灰暗的岁月，人们也未曾放弃过对知识的渴求。随着三年自然灾害的阴霾渐渐散去，另一场深刻的变革正在神州大地上悄然发生——',
          13,
          0,
          415,
          72,
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:12035',
    frameHeight: 809,
    cues: [
      textCue('s13-title', '76:12724', 'title', 471, 36, 439, 96, [
        headingBlock('76:12724', '1957-1961', 0, 0, 439),
      ]),
      textCue('s13-copy-1', '76:12721', 'copy', 473, 73, 350, 196, [
        textBlock(
          '76:12732',
          '在熬过了肉体的饥饿与失去的痛苦之后，一种新的渴望开始驱动着人们，那是对知识的饥渴。1961年，识字率已经高达90.52%，这片土地逐渐被知识的微光照亮。',
          0,
          81,
          278,
          96,
        ),
      ]),
      textCue('s13-copy-2', '76:12721', 'copy', 1923, 73, 850, 196, [
        textBlock(
          '76:12722',
          '与此同时，“上山下乡”运动在全国轰轰烈烈地展开，受当时政治运动的激荡，中国社会依然处于剧烈的动荡与宏大的人口迁徙之中。\n\n数以千万计的城市青年被组织、动员起来，奔赴边疆与广阔天地。1969年，下乡人数达到历史顶峰，仅那一年便有267.38万知识青年奔赴乡村。这场政治运动导致自1961年起，全国在校大学生的数量持续下滑。尽管中国人在这段时期逐步告别了文盲，但对绝大多数人而言，接受高等教育的机会依然遥不可及。',
          97,
          0,
          651,
          144,
        ),
      ]),
      textCue('s13-copy-3', '76:12721', 'copy', 3253, 73, 760, 196, [
        textBlock(
          '76:12723',
          '但是，回到现实中，个体的去向与命运，往往并不取决于自身的志趣。家庭背景、人脉关系，乃至地方政策执行过程中的细微偏差，都在实质上决定着每一个年轻人的安置地点与人生轨迹。\n\n彼时，赵大春在卫生局革命委员会任职，负责起草医疗人员改革与下乡的具体方案。基层工作的推进并不容易，一方面老百姓确有苦衷，另一方面又要秉公办事。\n于是，面对一些不愿下乡、希望通过关系调整安排的“登门人”，赵大春先躲起来不见，待到方案讨论通过，名单下放再出面。但同时，了解到实践中的确存在问题，他联系了多位一线医疗人员，不断调整工作。\n最终，赵大春的方案得到了老干部们的高度赞誉。',
          96,
          4,
          664,
          192,
        ),
      ]),
      chartCue('s13-chart', '265:6426', 983, 67, 830.06897, 281),
      textCue('s13-source', '76:12733', 'source', 0, 740, 3630, 70, [
        textBlock(
          '76:12735',
          '数据来源：[1] 中国国家统计局《全国人口普查主要数据公报》（1957年、1964年、1982年、1990年、2000年）；[2] 中国国家统计局：1995年全国1%人口抽样调查',
          788,
          23,
          1036,
          24,
          { role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:13394',
    frameHeight: 810,
    cues: [
      textCue('s14-copy', '76:13919', 'copy', 110, 42, 559, 256, [
        headingBlock('76:13920', '1961-1977', 0, 0, 499.843872),
        textBlock(
          '76:13922',
          '1977年，中断了十载之久的全国统一高考正式恢复。那一年，全国约有272,971名学子被大学录取。这道窄窄的校门，永远改变了他们的人生，也重塑了中国的整个高等教育格局。\n\n赵大春家也不例外，高考恢复后，长子赵壮以优异成绩考入名牌大学，赵纱成为英语教师，赵燕进入国企工作。高考恢复意味着教育机会的回归，知识重新成为改变命运的力量，更为改革开放后的现代化建设培养了大批人才。',
          1,
          112,
          558,
          144,
        ),
      ]),
      chartCue('s14-chart', '265:10821', 873, 56, 1990, 450.125244),
      textCue('s14-source', '76:13927', 'source', 828, 743, 1585, 67, [
        textBlock(
          '76:13929',
          '数据来源：中华人民共和国教育部（历年）、中国教育统计年鉴（1949-1981）。',
          100,
          23,
          1485,
          24,
          { role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:13931',
    frameHeight: 810,
    cues: [
      textCue('s15-copy', '76:14915', 'copy', 215, 75, 518, 160, [
        headingBlock('76:14916', '1978-Now', 0, 0, 363),
        textBlock(
          '76:14917',
          '1978年，改革开放启动，农村改革也随之展开。原本以乡办、村办为主的社队企业逐渐恢复发展，许多地方开始“就地取材、就地加工、就地销售”，从农产品加工、建材到轻工业，乡村里出现了土地之外的新工作。',
          0,
          76,
          518,
          84,
          { lineHeight: 28 },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:14958',
    frameHeight: 810,
    cues: [
      textCue('s16-title', '76:15098', 'title', 338, 41, 439, 96, [
        headingBlock('76:15098', '1978-NOW', 0, 0, 439),
      ]),
      singleTextCue(
        's16-copy',
        '76:15099',
        'copy',
        344,
        152,
        421,
        72,
        '赵大春在这样的背景下毅然辞职回到家乡，投身乡镇企业建设。\n1984年，“社队企业”正式改称“乡镇企业”。除了乡办、村办，联户办和个体办也逐渐发展起来，农村企业开始进入更广阔的市场。',
      ),
    ],
  },
  {
    figmaFrameId: '76:16088',
    frameHeight: 810,
    cues: [
      textCue('s17-title', '76:16656', 'title', 156, 41, 439, 96, [
        headingBlock('76:16656', '1978-NOW', 0, 0, 439),
      ]),
      singleTextCue(
        's17-copy',
        '76:16657',
        'copy',
        162,
        152,
        423,
        96,
        '1978年，改革开放启动，农村改革也随之展开。原本以乡办、村办为主的社队企业逐渐恢复发展，许多地方开始“就地取材、就地加工、就地销售”，从农产品加工、建材到轻工业，乡村里出现了土地之外的新工作。',
      ),
      chartCue('s17-chart', '76:16509', 841, 69, 918.649719, 433),
      textCue('s17-source-copy', '76:20779', 'copy', 0, 570, 1922, 160, [
        textBlock(
          '76:16658',
          '①1978年，《中共中央关于加快农业发展若干问题的决定（草案）》提出发展社队企业，并强调“就地取材、就地加工、就地销售”\n\n②1984年，中共中央、国务院转发《关于开创社队企业新局面的报告》，将「社队企业」改称为「乡镇企业」，并肯定联户办、家庭办等形式的发展。此后，乡镇企业进入快速扩张期，“村村点火、户户冒烟”成为农村工业化的生动写照。',
          890,
          0,
          690,
          160,
          { lineHeight: 20 },
        ),
      ]),
      textCue('s17-source', '76:20779', 'source', 0, 730, 1922, 80, [
        textBlock(
          '76:16650',
          '数据来源：《中国乡镇企业年鉴（1997）》；国家统计局《之六：乡镇企业异军突起》',
          907,
          33,
          1015,
          24,
          { role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '76:16659',
    frameHeight: 810,
    cues: [
      singleTextCue(
        's18-copy1',
        '76:17514',
        'copy',
        1125,
        228,
        404,
        32,
        '赵大春在这样的背景下毅然辞职回到家乡，投身乡镇企业建设。',
      ),
      singleTextCue(
        's18-copy2',
        '76:17526',
        'copy',
        1125,
        269,
        384,
        72,
        '1984年，“社队企业”正式改称“乡镇企业”。除了乡办、村办，联户办和个体办也逐渐发展起来，这一年开始，农村企业开始进入更广阔的市场。',
      ),
      singleTextCue(
        's18-copy3',
        '76:17527',
        'copy',
        2709,
        225,
        247,
        110,
        '乡镇企业的发展，为更多农村人口提供了土地之外的工作，也打开了通往县城和城市的新路径。有人留在家乡的工厂和作坊，有人则沿着就业、教育和市场机会，逐渐走向更大的城镇。',
      ),
    ],
  },
  {
    figmaFrameId: '434:3',
    frameHeight: 810,
    cues: [
      textCue('s19-title', '76:20650', 'title', 162, 41, 439, 96, [
        headingBlock('76:20650', '1984-NOW', 0, 0, 439, 40, WHITE),
      ]),
      singleTextCue(
        's19-copy1',
        '76:20648',
        'copy',
        162,
        137,
        663,
        72,
        '当赵大春与儿时玩伴一同回到老家时，他由衷地惊叹于眼前的景象：脚下是宽阔平整的柏油路，街道两旁楼房一栋接着一栋，法国梧桐枝繁叶茂。记忆中低矮破旧的村庄已经寻不见踪影，眼前的大里集，已是一座热闹而整洁的小城镇。时代的车轮滚滚向前，曾经熟悉的故乡，也在岁月流转中换了新颜。',
        { color: WHITE },
      ),
      chartCue('s19-chart', '265:27047', 0, 0, 3151, 810, 'initial'),
      singleTextCue(
        's19-copy2',
        '76:20649',
        'copy',
        1627,
        48,
        726,
        48,
        '故乡的街道仍在延伸，时代也从未停下脚步。2001年，中国正式加入世界贸易组织（WTO），对外开放迈入新的阶段。伴随着出口贸易持续增长，中国制造不断走向世界，越来越多的普通人也迎来了新的机遇。',
        { color: WHITE },
      ),
      singleTextCue(
        's19-copy3',
        '76:20651',
        'copy',
        5199,
        89,
        726,
        94,
        '赵大春创办的塑料厂、预制厂越办越红火，曾经需要骑着自行车四处调货的人，如今已能开着运输车把产品送往更远的市场。几十年前那个在饥荒中为一家人生计奔波的青年，早已成为带动一方发展的企业经营者。昔日偏远的小城开始与世界建立联系，烟酒、塑料、水泥...本地企业的产品远销海外市场。',
        { color: WHITE },
      ),
      textCue('s19-source', '76:20755', 'source', 0, 740, 3589, 70, [
        textBlock(
          '76:20757',
          '数据来源：国家统计局历年《中国统计年鉴》“职工平均工资及指数”表、历年城镇单位就业人员平均工资统计公报。',
          924,
          23,
          1036,
          24,
          { color: WHITE, role: 'source' },
        ),
      ]),
    ],
  },
  {
    figmaFrameId: '434:6',
    frameHeight: 810,
    cues: [],
  },
] as const

export const isTextCue = (cue: SceneCue): cue is TextSceneCue =>
  cue.kind === 'title' || cue.kind === 'copy' || cue.kind === 'source'

export const normalizeCueValue = (value: number, frameHeight: number) =>
  value * (810 / frameHeight)
