import { Check, TriangleAlert, Wrench } from 'lucide-react'
import { grade } from '../../lib/a11y/contrast'
import { useTheme, useThemeStore } from '../../store/useThemeStore'
import { Switch } from '../ui'

export function useContrastSummary() {
  const { checks } = useTheme()
  return { passing: checks.filter((c) => c.pass).length, total: checks.length }
}

/** Top-bar chip, e.g. "✓ 12/12 AA". */
export function A11yChip() {
  const { passing, total } = useContrastSummary()
  const ok = passing === total
  return (
    <span
      role="status"
      data-testid="a11y-chip"
      title="WCAG AA contrast pairs passing"
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 font-mono text-[11.5px] ${ok ? 'border-good/40 text-good' : 'border-bad/40 text-bad'}`}
    >
      {ok ? <Check aria-hidden className="size-3" strokeWidth={3} /> : <TriangleAlert aria-hidden className="size-3" />}
      <span>{passing}/{total} AA</span>
    </span>
  )
}

export function A11ySection() {
  const { checks } = useTheme()
  const autoFix = useThemeStore((s) => s.a11y.autoFix)
  const setAutoFix = useThemeStore((s) => s.setAutoFix)
  const { passing, total } = useContrastSummary()

  return (
    <div className="space-y-3">
      <Switch
        checked={autoFix}
        onChange={setAutoFix}
        label="Auto-fix contrast"
        description="Nudges only the lightness of failing colours (hue and chroma stay) until every pair passes."
      />
      <p className="text-[12.5px] text-ink-muted">
        <strong className="font-semibold text-ink">{passing} of {total}</strong> pairs pass WCAG AA.
      </p>
      <ul className="divide-y divide-line rounded-lg border border-line" aria-label="Contrast report">
        {checks.map((c) => {
          const g = grade(c.ratio, c.target)
          return (
            <li key={c.id} className="flex items-center gap-2.5 px-2.5 py-2">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-md text-[13px] font-semibold ring-1 ring-line" style={{ background: c.bg, color: c.fg }}>
                Aa
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px]">{c.label}</p>
                <p className="truncate font-mono text-[10.5px] text-ink-subtle" title={`${c.fg} on ${c.bg}, needs ${c.target}:1`}>
                  {c.fg} / {c.bg}
                </p>
              </div>
              {c.fixed && (
                <span title="Adjusted by auto-fix" className="text-ink-subtle">
                  <Wrench aria-label="auto-fixed" className="size-3.5" />
                </span>
              )}
              <span className="w-11 text-right font-mono text-[11.5px]" title={`Needs ${c.target}:1`}>{c.ratio.toFixed(2)}</span>
              <span
                className={`w-10 rounded px-1 py-0.5 text-center font-mono text-[10.5px] font-medium ${
                  g === 'Fail' ? 'bg-bad/15 text-bad' : g === 'AAA' ? 'bg-good/20 text-good' : 'bg-good/10 text-good'
                }`}
              >
                {g}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[12px] text-ink-subtle">
        Targets: 4.5:1 for text, 3:1 for input borders and focus rings. Translucent glass surfaces are checked against the worst case of the
        wallpaper’s darkest and lightest colours.
      </p>
    </div>
  )
}
