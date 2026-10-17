import { BarChart3, CalendarDays, Megaphone, ShieldCheck, Ticket, Users } from 'lucide-react'

const FEATURES = [
  { icon: CalendarDays, title: 'Smart scheduling', body: 'Find a slot that clashes with no exams, rooms or rival fests, in one click.' },
  { icon: Ticket, title: 'RSVPs & tickets', body: 'Free or paid passes, waitlists and QR check-in that works offline at the door.' },
  { icon: Users, title: 'Member CRM', body: 'Know who shows up, who volunteers and who’s ready to lead next year.' },
  { icon: Megaphone, title: 'Announcements', body: 'One post goes out to email, WhatsApp and your club page together.' },
  { icon: BarChart3, title: 'Live insights', body: 'Turnout, budget and engagement, updated while the event is still running.' },
  { icon: ShieldCheck, title: 'Roles & permissions', body: 'Core team, coordinators and volunteers each see exactly what they need.' },
]

export function Features() {
  return (
    <section aria-labelledby="pv-features" className="pv-surface">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="pv-badge">Features</p>
        <h2 id="pv-features" className="pv-h mt-3 max-w-2xl text-3xl font-bold @xl:text-4xl">Everything a club needs, nothing it doesn’t</h2>
        <p className="pv-muted mt-3 max-w-2xl">From the first poster to the last feedback form, Orbit keeps the whole event in one place.</p>
        <ul className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="pv-card p-5">
              <span className="pv-icon-tile">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="pv-h mt-4 text-lg font-semibold">{title}</h3>
              <p className="pv-muted mt-1.5 text-[0.92rem]">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
