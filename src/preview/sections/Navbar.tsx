import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useThemeStore } from '../../store/useThemeStore'

export type PvSection = 'features' | 'pricing' | 'numbers' | 'signup' | 'dashboard'

/** Links that have a matching section on the page; every other link is a page Orbit doesn't have. */
const SECTION_FOR: Record<string, PvSection> = { Features: 'features', Pricing: 'pricing', Customers: 'numbers' }

/**
 * Scroll the preview (never the app around it) to one of its sections and move focus there.
 * The sign-up form focuses its first field, so "Get started" lands you ready to type.
 */
export function goTo(from: Element, section: PvSection) {
  const scroller = from.closest('.pv-scroll')
  const el = scroller?.querySelector<HTMLElement>(`[data-pv-section="${section}"]`)
  if (!scroller || !el) return
  const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
  scroller.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  const focusTarget = (section === 'signup' && el.querySelector<HTMLElement>('input')) || el
  if (focusTarget === el) el.tabIndex = -1
  focusTarget.focus({ preventScroll: true })
}

/** Orbit is pretend, so links to pages it doesn't have say so instead of silently doing nothing. */
export function notReal(name: string) {
  useThemeStore.getState().notify(`“${name}” isn’t a real page. Orbit is a pretend website for trying out your colours.`)
}

/** In-preview link: scrolls to its section, or explains it's pretend. Never navigates or touches the share hash. */
export function PvLink({ children, className = '', onNavigate }: { children: string; className?: string; onNavigate?: () => void }) {
  const section = SECTION_FOR[children]
  return (
    <a
      href={section ? `#${section}` : '#'}
      onClick={(e) => {
        e.preventDefault()
        if (section) goTo(e.currentTarget, section)
        else notReal(children)
        onNavigate?.()
      }}
      className={`pv-link ${className}`}
    >
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
          <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm hidden @md:inline-flex" onClick={(e) => goTo(e.currentTarget, 'signup')}>Sign in</button>
          <button type="button" className="pv-btn pv-btn-primary pv-btn-sm" onClick={(e) => goTo(e.currentTarget, 'signup')}>Get started</button>
          <button type="button" className="pv-btn pv-btn-ghost pv-btn-sm @3xl:hidden" aria-expanded={open} aria-label="Open menu" onClick={() => setOpen(!open)}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="pv-card mx-5 mb-2 grid gap-1 p-2 @3xl:hidden">
          {LINKS.map((l) => (
            <li key={l}>
              <PvLink className="block rounded px-3 py-2" onNavigate={() => setOpen(false)}>{l}</PvLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
