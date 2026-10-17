import { TrendingDown, TrendingUp } from 'lucide-react'

const STATS = [
  { label: 'Events hosted this term', value: '2,481', delta: '+12%', up: true, good: true },
  { label: 'Average turnout', value: '86%', delta: '+4.2%', up: true, good: true },
  { label: 'No-show rate', value: '3.1%', delta: '−1.2%', up: false, good: true },
]

export function Stats() {
  return (
    <section aria-label="Key numbers" className="mx-auto max-w-6xl px-5 pb-14">
      <ul className="grid gap-4 @2xl:grid-cols-3">
        {STATS.map((s) => (
          <li key={s.label} className="pv-card p-5">
            <p className="pv-muted text-sm">{s.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="pv-h text-3xl font-bold @5xl:text-4xl">{s.value}</p>
              <span className={`pv-status ${s.good ? 'pv-status-success' : 'pv-status-danger'}`}>
                {s.up ? <TrendingUp aria-hidden className="size-3.5" /> : <TrendingDown aria-hidden className="size-3.5" />}
                {s.delta}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
