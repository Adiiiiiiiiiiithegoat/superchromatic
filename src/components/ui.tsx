import { type ReactNode, useId } from 'react'

/** Shared chrome button style. Touch targets grow to 44px on small screens. */
export const btn =
  'inline-flex items-center justify-center gap-1.5 h-8 max-sm:h-11 px-2.5 max-sm:px-3 rounded-md border border-line text-[13px] text-ink ' +
  'hover:bg-hover disabled:opacity-40 transition-colors'

export const iconBtn = 'inline-flex items-center justify-center size-8 max-sm:size-11 rounded-md text-ink-muted hover:text-ink hover:bg-hover transition-colors'

export function Segmented<T extends string>({ label, value, options, onChange, disabled }: {
  label: string
  value: T
  options: { id: T; label: string; title?: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-0.5 rounded-lg border border-line bg-raised p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          title={o.title}
          aria-pressed={value === o.id}
          disabled={disabled}
          onClick={() => onChange(o.id)}
          className={`h-7 max-sm:h-10 rounded-md px-2 text-[12.5px] transition-colors disabled:opacity-40 ${
            value === o.id ? 'bg-panel text-ink shadow-sm ring-1 ring-line-strong' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <label htmlFor={id} className="text-[13px] font-medium">{label}</label>
        {description && <p className="mt-0.5 text-[12px] text-ink-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors max-sm:my-3 ${checked ? 'bg-ink' : 'bg-line-strong'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-panel transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  )
}
