import { Info, Plus } from 'lucide-react'
import { useState } from 'react'
import { AvatarStack } from './Hero'

const TABS = ['Overview', 'Team', 'Tags'] as const
const TAGS = ['Workshops', 'Hackathons', 'Talks', 'Socials', 'Competitions']

const EVENTS = [
  { name: 'Intro to PCB design', date: '21 Oct', seats: '64 / 80', status: 'Confirmed' },
  { name: 'Startup pitch night', date: '24 Oct', seats: '120 / 120', status: 'Waitlist' },
  { name: 'Campus treasure hunt', date: '29 Oct', seats: '18 / 200', status: 'Cancelled' },
  { name: 'Design systems 101', date: '2 Nov', seats: '41 / 60', status: 'Confirmed' },
]
const STATUS_CLASS: Record<string, string> = { Confirmed: 'pv-status-success', Waitlist: 'pv-status-warning', Cancelled: 'pv-status-danger' }

function TabsCard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  const [active, setActive] = useState<string[]>(['Workshops', 'Talks'])
  return (
    <div className="pv-card p-5">
      <div role="tablist" aria-label="Club dashboard" className="pv-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className="pv-tab" onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" aria-label={tab} className="pt-5">
        {tab === 'Overview' && (
          <div className="space-y-5">
            <div className="pv-alert" role="note">
              <Info aria-hidden className="mt-0.5 size-5 shrink-0" style={{ color: 'var(--accent)' }} />
              <div>
                <p className="font-semibold">Budget review due Friday</p>
                <p className="pv-muted text-sm">Submit receipts for Hack Night before the treasury closes the books.</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Semester budget used</span>
                <span className="pv-mono">64%</span>
              </div>
              <div className="pv-progress mt-2" role="progressbar" aria-label="Semester budget used" aria-valuenow={64} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: '64%' }} />
              </div>
            </div>
          </div>
        )}
        {tab === 'Team' && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AvatarStack names={['NS', 'VK', 'MA', 'PD']} />
              <p className="pv-muted text-sm">4 core members · 23 volunteers</p>
            </div>
            <span className="pv-tooltip-wrap">
              <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm" aria-describedby="pv-invite-tip">
                <Plus aria-hidden className="size-4" /> Invite
              </button>
              <span id="pv-invite-tip" role="tooltip" className="pv-tooltip">Send a join link to your team</span>
            </span>
          </div>
        )}
        {tab === 'Tags' && (
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className="pv-chip"
                aria-pressed={active.includes(t)}
                onClick={() => setActive(active.includes(t) ? active.filter((a) => a !== t) : [...active, t])}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventsTable() {
  return (
    <div className="pv-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="pv-h text-lg font-semibold">Upcoming events</h3>
        <span className="pv-tooltip-wrap">
          <button type="button" className="pv-badge" aria-describedby="pv-sync-tip">Live</button>
          <span id="pv-sync-tip" role="tooltip" className="pv-tooltip">Synced 2 minutes ago</span>
        </span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="pv-table">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Date</th>
              <th scope="col" className="max-[420px]:hidden">Seats</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((e) => (
              <tr key={e.name}>
                <td className="font-medium">{e.name}</td>
                <td className="pv-muted whitespace-nowrap">{e.date}</td>
                <td className="pv-mono pv-muted whitespace-nowrap max-[420px]:hidden">{e.seats}</td>
                <td>
                  <span className={`pv-status ${STATUS_CLASS[e.status]}`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Showcase() {
  return (
    <div className="grid content-start gap-5">
      <TabsCard />
      <EventsTable />
    </div>
  )
}
