import { Check, TriangleAlert, Wrench } from 'lucide-react'
import { grade } from '../../lib/a11y/contrast'
import { useTheme, useThemeStore } from '../../store/useThemeStore'
import { Switch } from '../ui'

export function useContrastSummary() {
  const { checks } = useTheme()
  return { passing: checks.filter((c) => c.pass).length, total: checks.length }
}

/** Header chip for the Accessibility section, e.g. "✓ 14/14 readable". */
export function A11yChip() {
  const { passing, total } = useContrastSummary()
  const ok = passing === total
  return (
    <span
      role="status"
      data-testid="a11y-chip"
      title="How many text colours are easy to read"
      className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 font-mono text-[11.5px] ${ok ? 'border-good/40 text-good' : 'border-bad/40 text-bad'}`}
    >
      {ok ? <Check aria-hidden className="size-3" strokeWidth={3} /> : <TriangleAlert aria-hidden className="size-3" />}
      <span>{passing}/{total} readable</span>
    </span>
  )
}

const GRADE_LABEL = { AAA: 'Great', AA: 'Good', Fail: 'Hard to read' } as const

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
        label="Fix hard-to-read colours"
        description="Makes a colour a little lighter or darker until the words on it are easy to read. It stays the same colour, just a different shade."
      />
      <p className="text-[12.5px] text-ink-muted">
        Words need to stand out from what’s behind them, so everyone can read them: people with weaker eyesight, or anyone on a phone in
        bright sunlight. <strong className="font-semibold text-ink">{passing === total ? `All ${total}` : `${passing} of ${total}`}</strong> are easy to read.
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
                <p className="truncate text-[11px] text-ink-subtle" title={`${c.fg} on ${c.bg}`}>
                  Contrast {c.ratio.toFixed(1)}, needs {c.target}
                </p>
              </div>
              {c.fixed && (
                <span title="We changed the shade so it’s easier to read" className="text-ink-subtle">
                  <Wrench aria-label="fixed for you" className="size-3.5" />
                </span>
              )}
              <span
                title={g === 'Fail' ? 'Below the AA rule' : `Meets the ${g} rule`}
                className={`w-[4.5rem] shrink-0 rounded px-1 py-0.5 text-center text-[11px] font-medium ${
                  g === 'Fail' ? 'bg-bad/15 text-bad' : g === 'AAA' ? 'bg-good/20 text-good' : 'bg-good/10 text-good'
                }`}
              >
                {GRADE_LABEL[g]}
              </span>
            </li>
          )
        })}
      </ul>
      <dl className="space-y-1.5 text-[12px] text-ink-subtle">
        <div>
          <dt className="inline font-medium text-ink-muted">Contrast</dt>{' '}
          <dd className="inline">compares how light the words are with how light the background is. 1 means you can’t see the words at all; 21 is black on white.</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-muted">Good (AA)</dt>{' '}
          <dd className="inline">meets the rule most websites follow: contrast of at least 4.5 for words, 3 for outlines.</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-muted">Great (AAA)</dt>{' '}
          <dd className="inline">meets the strictest level: at least 7 for words.</dd>
        </div>
        <div>
          <dt className="inline font-medium text-ink-muted">Wrench</dt>{' '}
          <dd className="inline">means we changed that shade for you.</dd>
        </div>
      </dl>
    </div>
  )
}
