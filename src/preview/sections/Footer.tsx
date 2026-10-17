import { Logo, PvLink } from './Navbar'

const COLUMNS = [
  { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
  { title: 'Clubs', links: ['Case studies', 'Templates', 'Community'] },
  { title: 'Company', links: ['About', 'Careers', 'Privacy'] },
]

export function Footer() {
  return (
    <footer className="pv-divider border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 @2xl:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="pv-muted mt-3 max-w-xs text-sm">The event OS for student clubs. A fictional product made to preview themes.</p>
        </div>
        {COLUMNS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h3 className="text-sm font-semibold">{c.title}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l}>
                  <PvLink>{l}</PvLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="pv-muted mx-auto max-w-6xl px-5 pb-8 text-xs">© 2026 Orbit Labs (fictional). Built with SuperChromatic tokens.</p>
    </footer>
  )
}
