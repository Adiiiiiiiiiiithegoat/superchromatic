import { Check } from 'lucide-react'
import { useState } from 'react'
import { goTo, notReal } from './Navbar'

const TIERS = [
  { name: 'Starter', monthly: 0, blurb: 'For new clubs finding their feet.', perks: ['Up to 100 members', '5 events / month', 'QR check-in'], cta: 'Start free' },
  { name: 'Club', monthly: 499, blurb: 'For active clubs running every week.', perks: ['Unlimited members', 'Paid tickets & waitlists', 'Live insights', 'Custom branding'], cta: 'Try Club free', featured: true },
  { name: 'Campus', monthly: null, blurb: 'For student councils and fests.', perks: ['Every club on campus', 'Shared venue calendar', 'SSO & audit log'], cta: 'Talk to us' },
]

export function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <section aria-labelledby="pv-pricing" data-pv-section="pricing" className="pv-surface">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="pv-pricing" className="pv-h text-3xl font-bold @xl:text-4xl">Simple pricing</h2>
            <p className="pv-muted mt-2">Fictional prices, real components.</p>
          </div>
          <div role="group" aria-label="Billing period" className="pv-card flex gap-1 p-1">
            {[false, true].map((y) => (
              <button key={String(y)} type="button" aria-pressed={yearly === y} onClick={() => setYearly(y)} className={`pv-btn pv-btn-sm ${yearly === y ? 'pv-btn-secondary' : 'pv-btn-ghost border-0'}`}>
                {y ? 'Yearly −20%' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-10 grid items-start gap-5 @4xl:grid-cols-3">
          {TIERS.map((t) => {
            const price = t.monthly === null ? 'Custom' : t.monthly === 0 ? '₹0' : `₹${Math.round(yearly ? t.monthly * 0.8 : t.monthly)}`
            return (
              <li key={t.name} className="pv-card relative p-6" style={t.featured ? { borderColor: 'var(--accent)', borderWidth: 2, boxShadow: 'var(--glow)' } : undefined}>
                {t.featured && (
                  <span className="pv-badge absolute -top-3 left-6" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
                    Most popular
                  </span>
                )}
                <h3 className="pv-h text-lg font-semibold">{t.name}</h3>
                <p className="pv-muted mt-1 text-sm">{t.blurb}</p>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className="pv-h text-4xl font-bold">{price}</span>
                  {t.monthly !== null && <span className="pv-muted text-sm">/ month</span>}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <Check aria-hidden className="size-4 shrink-0" style={{ color: t.featured ? 'var(--accent)' : 'var(--primary)' }} />
                      {p}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`pv-btn mt-6 w-full ${t.featured ? 'pv-btn-accent' : 'pv-btn-ghost'}`}
                  onClick={(e) => (t.monthly === null ? notReal(t.cta) : goTo(e.currentTarget, 'signup'))}
                >
                  {t.cta}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
