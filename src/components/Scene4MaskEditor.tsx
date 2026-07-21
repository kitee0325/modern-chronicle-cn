import { useMemo, useRef, useState, type PointerEvent } from 'react'
import {
  defaultScene4Mask,
  readScene4Mask,
  scene4MaskStorageKey,
  type MaskPoint,
  type Scene4Mask,
} from '../scene4Mask'

const background = `${import.meta.env.BASE_URL}assets/scenes/Scene_04/background.png`
const foreground = `${import.meta.env.BASE_URL}assets/scenes/Scene_04/foreground.png`

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toSourcePoint(event: PointerEvent<SVGSVGElement>, svg: SVGSVGElement): MaskPoint {
  const matrix = svg.getScreenCTM()
  if (!matrix) return { x: 0, y: 0 }
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
  return {
    x: Math.round(clamp(point.x, 0, defaultScene4Mask.sourceWidth)),
    y: Math.round(clamp(point.y, 0, defaultScene4Mask.sourceHeight)),
  }
}

function serializeMask(points: MaskPoint[]): Scene4Mask {
  return { ...defaultScene4Mask, points }
}

export function Scene4MaskEditor() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [points, setPoints] = useState(() => readScene4Mask().points)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [showForeground, setShowForeground] = useState(true)
  const [notice, setNotice] = useState('依次标记黑板的左、右边界；只使用横坐标。')
  const polygon = useMemo(() => points.map(({ x, y }) => `${x},${y}`).join(' '), [points])

  const updateDraggedPoint = (event: PointerEvent<SVGSVGElement>) => {
    if (dragIndex === null || !svgRef.current) return
    const nextPoint = toSourcePoint(event, svgRef.current)
    setPoints((current) => current.map((point, index) => (
      index === dragIndex ? nextPoint : point
    )))
  }

  const save = () => {
    if (points.length < 2) {
      setNotice('需要左、右两个边界点。')
      return
    }
    window.localStorage.setItem(scene4MaskStorageKey, JSON.stringify(serializeMask(points)))
    setNotice('已保存到当前浏览器。')
  }

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(serializeMask(points), null, 2))
    setNotice('JSON 坐标已复制。')
  }

  const download = () => {
    const blob = new Blob([JSON.stringify(serializeMask(points), null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'scene4-blackboard-mask.json'
    link.click()
    URL.revokeObjectURL(link.href)
    setNotice('已下载 scene4-blackboard-mask.json。')
  }

  return (
    <main className="mask-editor">
      <header className="mask-editor__header">
        <div>
          <p className="mask-editor__eyebrow">Scene 04 · Blackboard mask</p>
          <h1>圈定小船可见的黑板边界</h1>
          <p>{notice}</p>
        </div>
        <a href={`${import.meta.env.BASE_URL}?skipLoading=1`}>返回长卷</a>
      </header>

      <section className="mask-editor__workspace">
        <div className="mask-editor__canvas">
          <img src={background} alt="Scene 04 黑板背景" draggable={false} />
          {showForeground && <img className="mask-editor__foreground" src={foreground} alt="" draggable={false} />}
          <svg
            ref={svgRef}
            viewBox="0 0 7306 1620"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={(event) => {
              if (event.target !== event.currentTarget || !svgRef.current) return
              setPoints((current) => [...current, toSourcePoint(event, svgRef.current!)])
            }}
            onPointerMove={updateDraggedPoint}
            onPointerUp={() => setDragIndex(null)}
            onPointerCancel={() => setDragIndex(null)}
          >
            {points.length >= 2 && <polyline className="mask-editor__line" points={polygon} />}
            {points.map((point, index) => (
              <g key={`${index}-${point.x}-${point.y}`}>
                <circle
                  className="mask-editor__handle"
                  cx={point.x}
                  cy={point.y}
                  r="28"
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    event.currentTarget.setPointerCapture(event.pointerId)
                    setDragIndex(index)
                  }}
                />
                <text x={point.x + 34} y={point.y - 34}>{index + 1}</text>
              </g>
            ))}
          </svg>
        </div>

        <aside className="mask-editor__panel">
          <label>
            <input type="checkbox" checked={showForeground} onChange={(event) => setShowForeground(event.currentTarget.checked)} />
            显示板书前景
          </label>
          <div className="mask-editor__actions">
            <button type="button" onClick={() => setPoints((current) => current.slice(0, -1))}>撤销一点</button>
            <button type="button" onClick={() => setPoints([])}>清空</button>
            <button type="button" className="mask-editor__primary" onClick={save}>保存边界</button>
            <button type="button" onClick={copy}>复制 JSON</button>
            <button type="button" onClick={download}>下载 JSON</button>
          </div>
          <p>源图坐标：7306 × 1620</p>
          <ol>
            {points.map((point, index) => <li key={index}>{index + 1}. ({point.x}, {point.y})</li>)}
          </ol>
        </aside>
      </section>
    </main>
  )
}
