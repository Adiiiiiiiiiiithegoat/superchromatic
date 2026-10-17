import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { useState } from 'react'
import { goTo } from './Navbar'

export function AvatarStack({ names = ['AK', 'RM', 'JS', 'TP'] }: { names?: string[] }) {
  const fills = [
    ['var(--primary)', 'var(--primary-text)'],
    ['var(--secondary)', 'var(--secondary-text)'],
    ['var(--accent)', 'var(--accent-text)'],
    ['var(--badge-bg)', 'var(--badge-text)'],
  ]
  return (
    <div className="flex -space-x-2">
      {names.map((n, i) => (
        <span key={n} className="pv-avatar" style={{ background: fills[i % 4][0], color: fills[i % 4][1] }}>
          {n}
        </span>
      ))}
    </div>
  )
}

/** A mesh of the palette behind the event card (Glass shows the real wallpaper behind the whole page instead). */
function WallpaperBand({ glass }: { glass: boolean }) {
  const [going, setGoing] = useState(false)
  const rsvps = going ? 129 : 128
  return (
    <div className="relative h-72 overflow-hidden @xl:h-80" style={{ borderRadius: 'calc(var(--radius) * 1.4)' }}>
      {!glass && (
        <div aria-hidden className="pv-layer">
          <div className="pv-mesh" />
          <div className="pv-overlay" />
        </div>
      )}
      <div className="relative grid h-full place-items-center p-5">
        <article className="pv-card w-full max-w-xs p-4">
          <div className="flex items-center justify-between">
            <span className="pv-badge">Next up</span>
            <span className="pv-status pv-status-success">Open</span>
          </div>
          <h3 className="pv-h mt-3 text-lg font-bold">Hack Night: Build in 12 hours</h3>
          <p className="pv-muted mt-1 flex items-center gap-1.5 text-sm">
            <CalendarDays aria-hidden className="size-3.5" /> Fri, 7:00 PM
            <MapPin aria-hidden className="ml-2 size-3.5" /> Main auditorium
          </p>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="pv-muted">RSVPs</span>
            <span className="pv-mono">{rsvps} / 150</span>
          </div>
          <div className="pv-progress mt-1.5" role="progressbar" aria-label="RSVPs" aria-valuenow={rsvps} aria-valuemin={0} aria-valuemax={150}>
            <span style={{ width: `${(rsvps / 150) * 100}%` }} />
          </div>
          <button type="button" className={`pv-btn pv-btn-sm mt-4 w-full ${going ? 'pv-btn-secondary' : 'pv-btn-primary'}`} aria-pressed={going} onClick={() => setGoing(!going)}>
            {going ? 'You’re going ✓' : 'RSVP'}
          </button>
        </article>
      </div>
    </div>
  )
}

export function Hero({ glass }: { glass: boolean }) {
  return (
    <section className="pv-hero relative">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-8 pb-14 @3xl:pt-14 @4xl:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="pv-badge">New · v2.0</span>
          <h1 className="pv-h mt-4 text-[2.1rem] font-bold @xl:text-5xl @5xl:text-[3.4rem]">Run every club event from one calm dashboard.</h1>
          <p className="pv-muted mt-4 max-w-xl text-base @xl:text-lg">
            Orbit is the event OS for student clubs. Plan, publish, sell tickets and check people in, without juggling twelve spreadsheets.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" className="pv-btn pv-btn-primary" onClick={(e) => goTo(e.currentTarget, 'signup')}>
              Start free <ArrowRight aria-hidden className="size-4" />
            </button>
            <button type="button" className="pv-btn pv-btn-secondary" onClick={(e) => goTo(e.currentTarget, 'dashboard')}>
              Book a demo
            </button>
          </div>
          <div className="mt-7 flex items-center gap-3">
            <AvatarStack />
            <p className="pv-muted text-sm">Trusted by 1,200+ student clubs</p>
          </div>
        </div>
        <WallpaperBand glass={glass} />
      </div>
    </section>
  )
}
