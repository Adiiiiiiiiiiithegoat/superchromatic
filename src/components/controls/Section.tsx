import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

/** Collapsible, numbered control section. Native <details> gives keyboard + screen-reader support for free. */
export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <details open className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none hover:bg-hover">
        <span className="font-mono text-[11px] text-ink-subtle">{String(n).padStart(2, '0')}</span>
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        <ChevronDown aria-hidden className="ml-auto size-4 text-ink-subtle transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pt-1 pb-5">{children}</div>
    </details>
  )
}
