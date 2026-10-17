import { type CSSProperties, useId } from 'react'

/** Decorative dial: a 270° arc that fills with the value, plus a knob pointer. */
function Dial({ pct }: { pct: number }) {
  const r = 11
  const arc = 2 * Math.PI * r * 0.75
  return (
    <svg aria-hidden viewBox="0 0 28 28" className="size-7 shrink-0 -rotate-[225deg]">
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-line-strong" strokeDasharray={`${arc} 999`} />
      <circle cx="14" cy="14" r={r} fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-ink" strokeDasharray={`${arc * pct} 999`} />
      <line x1="14" y1="14" x2="14" y2="7" strokeWidth="2" strokeLinecap="round" className="stroke-ink" style={{ transformOrigin: '14px 14px', transform: `rotate(${90 + pct * 270}deg)` }} />
    </svg>
  )
}

export function Slider({ label, value, min, max, step = 1, defaultValue, onChange, format = String, testId }: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  defaultValue: number
  onChange: (v: number) => void
  format?: (v: number) => string
  testId?: string
}) {
  const id = useId()
  const pct = (value - min) / (max - min)
  const reset = () => onChange(defaultValue)
  return (
    <div onDoubleClick={reset} title="Double-click to reset" className="select-none">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] text-ink-muted">{label}</label>
        <output htmlFor={id} className={`font-mono text-[12px] ${value === defaultValue ? 'text-ink-subtle' : 'text-ink'}`}>{format(value)}</output>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <Dial pct={pct} />
        <input
          id={id}
          data-testid={testId}
          type="range"
          className="sc-range max-sm:h-11"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          aria-keyshortcuts="Delete"
          style={{ '--pct': `${pct * 100}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') reset()
          }}
        />
      </div>
    </div>
  )
}
