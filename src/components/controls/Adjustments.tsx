import { PRESETS_BY_ID } from '../../lib/theme/presets'
import type { Adjustments } from '../../lib/types'
import { useThemeStore } from '../../store/useThemeStore'
import { Slider } from './Slider'

const pct = (v: number) => `${v}%`
const px = (v: number) => `${v}px`

const SLIDERS: { key: keyof Adjustments; label: string; min: number; max: number; format: (v: number) => string }[] = [
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, format: pct },
  { key: 'brightness', label: 'Brightness', min: -50, max: 50, format: (v) => (v > 0 ? `+${v}` : String(v)) },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, format: pct },
  { key: 'blur', label: 'Background blur', min: 0, max: 40, format: px },
  { key: 'overlay', label: 'Overlay opacity', min: 0, max: 100, format: pct },
  { key: 'radius', label: 'Corner radius', min: 0, max: 28, format: px },
]

export function AdjustSection() {
  const adjustments = useThemeStore((s) => s.adjustments)
  const presetId = useThemeStore((s) => s.presetId)
  const setAdjustment = useThemeStore((s) => s.setAdjustment)
  const defaults = PRESETS_BY_ID[presetId].defaults
  return (
    <div className="space-y-4">
      {SLIDERS.map((s) => (
        <Slider
          key={s.key}
          testId={`slider-${s.key}`}
          label={s.label}
          min={s.min}
          max={s.max}
          value={adjustments[s.key]}
          defaultValue={defaults[s.key]}
          format={s.format}
          onChange={(v) => setAdjustment(s.key, v)}
        />
      ))}
      <p className="text-[12px] text-ink-subtle">Double-click a slider (or press Delete) to reset it to the preset’s default.</p>
    </div>
  )
}
