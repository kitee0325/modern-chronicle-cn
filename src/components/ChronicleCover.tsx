const coverForeground = `${import.meta.env.BASE_URL}assets/cover/foreground.png`
const coverTitle = `${import.meta.env.BASE_URL}assets/cover/title.png`

export function ChronicleCover() {
  return (
    <div className="chronicle-cover" data-cover-layer>
      <div className="chronicle-cover__panorama" data-cover-panorama>
        <img
          className="chronicle-cover__art"
          src={coverForeground}
          alt=""
          draggable={false}
          decoding="sync"
          fetchPriority="high"
        />

        <header>
          <h1 className="chronicle-cover__title" id="chronicle-cover-title">
            <img
              className="chronicle-cover__title-art"
              src={coverTitle}
              alt="何公的手稿：一名基层老党员与共和国同行的七十年"
              draggable={false}
              decoding="sync"
            />
          </h1>
        </header>

        <section className="chronicle-cover__preface" aria-labelledby="chronicle-cover-preface-title">
          <h2 id="chronicle-cover-preface-title">前言：</h2>
          <div className="chronicle-cover__preface-mask" data-cover-preface-mask>
            <div className="chronicle-cover__preface-copy" data-cover-preface-copy>
              <p>他出生在风雨飘摇的年代，却始终选择站在光里。</p>
              <p>14岁，秘密入团、奔走宣传，稚嫩肩膀扛起信仰；</p>
              <p>25岁，人生低谷中沉浮，却未曾动摇初心；</p>
              <p>40岁，乱世当前，冒死救人、拒绝同流合污，在改革浪潮中辞官经商、实干兴业；</p>
              <p>70岁，回望一生，修谱立碑，只为把善良与忠诚留给后人。</p>
              <p>
                时代在变，身份在变，从革命青年到国家干部，从会计到企业家，唯有“以真情待人、以正直立身”的信念始终未变。
              </p>
              <p>他的故事，是一个普通中国人与国家同频前行的缩影。</p>
              <p>他用一生，写下个人与国家的交响曲。</p>
              <p>
                我们项目组与老先生的结缘，始于为他整理手写回忆录、誊录为电子版的时光。我们既为字里行间流淌的赤诚坚守所动容，亦读懂他的人生轨迹，本就是一代人的命运写照。由此，我们萌生了打造这一可视化作品的构想，惟愿将这份穿越风雨的温情与力量传递给更多人。
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
