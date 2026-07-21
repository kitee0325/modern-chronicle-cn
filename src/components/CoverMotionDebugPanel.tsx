import { useState } from 'react'
import {
  coverMotionStorageKey,
  defaultCoverMotion,
  type CoverMotionConfig,
} from '../coverMotion'

type NumericKey = keyof CoverMotionConfig

type MotionControl = {
  key: NumericKey
  label: string
  min: number
  max: number
  step: number
}

const controls: MotionControl[] = [
  { key: 'panDuration', label: '横移到前言', min: 0.4, max: 3, step: 0.02 },
  { key: 'prefaceDuration', label: '前言滚动', min: 0.8, max: 4, step: 0.02 },
  { key: 'holdDuration', label: '阅读停顿', min: 0, max: 1.2, step: 0.02 },
  { key: 'windowPanDuration', label: '平移到新增窗户', min: 0.3, max: 2.5, step: 0.02 },
  { key: 'mixDuration', label: '拉近与混合', min: 0.8, max: 4, step: 0.02 },
  { key: 'blurPx', label: 'Scene 01 模糊', min: 0, max: 28, step: 0.5 },
  { key: 'coverAnchorX', label: '前言锚点', min: 0.45, max: 0.65, step: 0.001 },
  { key: 'windowAnchorX', label: '新增窗户锚点', min: 0.68, max: 0.86, step: 0.001 },
  { key: 'sceneMatchX', label: 'Scene 匹配 X%', min: -100, max: 100, step: 0.01 },
  { key: 'sceneMatchY', label: 'Scene 匹配 Y%', min: -100, max: 100, step: 0.01 },
  { key: 'sceneMatchScale', label: 'Scene 匹配缩放', min: 0.2, max: 1.5, step: 0.005 },
  { key: 'scene1CameraEndProgress', label: 'S1 窗口位置', min: 0.45, max: 0.6, step: 0.001 },
  { key: 'scene1DiveScale', label: 'S1 下钻倍率', min: 1.5, max: 5, step: 0.05 },
  { key: 'scene1DiveDurationRatio', label: 'S1 下钻时长', min: 0.18, max: 0.5, step: 0.01 },
  { key: 'cueEntryViewportX', label: '全局入屏触发点', min: 0.65, max: 1, step: 0.01 },
]

export function CoverMotionDebugPanel({
  value,
  onChange,
}: {
  value: CoverMotionConfig
  onChange: (value: CoverMotionConfig) => void
}) {
  const [copied, setCopied] = useState(false)

  const update = (key: NumericKey, nextValue: number) => {
    const next = { ...value, [key]: nextValue }
    window.localStorage.setItem(coverMotionStorageKey, JSON.stringify(next))
    onChange(next)
  }

  const reset = () => {
    window.localStorage.removeItem(coverMotionStorageKey)
    onChange(defaultCoverMotion)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1000)
  }

  return (
    <aside className="motion-debug" aria-label="Cover 动画调参">
      <div className="motion-debug__header">
        <strong>Cover Motion</strong>
        <span>仅开发环境</span>
      </div>
      <div className="motion-debug__controls">
        {controls.map((control) => (
          <label key={control.key} className="motion-debug__control">
            <span>{control.label}</span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={value[control.key]}
              onChange={(event) => update(control.key, Number(event.currentTarget.value))}
            />
            <output>{value[control.key].toFixed(3)}</output>
          </label>
        ))}
      </div>
      <div className="motion-debug__actions">
        <button type="button" onClick={copy}>{copied ? '已复制' : '复制参数'}</button>
        <button type="button" onClick={reset}>恢复默认</button>
      </div>
    </aside>
  )
}
