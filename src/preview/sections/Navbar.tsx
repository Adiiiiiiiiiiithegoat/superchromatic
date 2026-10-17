import { Menu, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'

/** In-preview link: looks real, never navigates (and never touches the share hash). */
export function PvLink({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className={`pv-link ${className}`}>
      {children}
    </a>
  )
}

export function Logo() {
  return (
    <span className="pv-h flex items-center gap-2 text-[1.05rem] font-bold">
      <span aria-hidden className="pv-logo">
        <span />
      </span>
      Orbit
    </span>
  )
}

const LINKS = ['Features', 'Pricing', 'Customers', 'Changelog']

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="relative z-10">
      <nav aria-label="Orbit main" className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <Logo />
        <ul className="ml-6 hidden items-center gap-6 text-sm @3xl:flex">
          {LINKS.map((l) => (
            <li key={l}>
              <PvLink>{l}</PvLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm hidden @md:inline-flex">Sign in</button>
          <button type="button" className="pv-btn pv-btn-primary pv-btn-sm">Get started</button>
          <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm @3xl:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(!open)}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="pv-card mx-5 mb-2 grid gap-1 p-2 @3xl:hidden">
          {LINKS.map((l) => (
            <li key={l}>
              <PvLink className="block rounded px-3 py-2">{l}</PvLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
