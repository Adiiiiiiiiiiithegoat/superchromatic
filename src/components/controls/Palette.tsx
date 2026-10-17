import { Check, Plus, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ROLES, type Role, type Strategy, type Swatch } from '../../lib/types'
import { useRoles, useThemeStore } from '../../store/useThemeStore'
import { Segmented, btn } from '../ui'
import { Slider } from './Slider'

export const ROLE_LABEL: Record<Role, string> = { primary: 'Primary', secondary: 'Secondary', accent: 'Accent', background: 'Background' }

const STRATEGIES: { id: Strategy; label: string; title: string }[] = [
  // Plain-word names for k-means, median cut and the vibrant picker.
  { id: 'kmeans', label: 'Natural', title: 'The colours you notice first, in the amounts they appear in the picture.' },
  { id: 'median', label: 'Varied', title: 'A wider mix that also picks up the quieter colours hiding in the picture.' },
  { id: 'vibrant', label: 'Vibrant', title: 'The boldest, brightest pops of colour, even tiny ones.' },
]

export function PaletteSection() {
  const image = useThemeStore((s) => s.image)
  const strategy = useThemeStore((s) => s.strategy)
  const k = useThemeStore((s) => s.k)
  const swatches = useThemeStore((s) => s.swatches)
  const status = useThemeStore((s) => s.status)
  const setStrategy = useThemeStore((s) => s.setStrategy)
  const setK = useThemeStore((s) => s.setK)
  const addColor = useThemeStore((s) => s.addColor)
  const colorInput = useRef<HTMLInputElement>(null)

  // Native `change` fires once when the picker closes (React's onChange fires on every drag step).
  useEffect(() => {
    const el = colorInput.current
    const onChange = () => el && addColor(el.value, 'custom')
    el?.addEventListener('change', onChange)
    return () => el?.removeEventListener('change', onChange)
  }, [addColor])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Segmented label="Colour style" value={strategy} options={STRATEGIES} onChange={setStrategy} disabled={!image} />
        <p className="text-[12px] text-ink-subtle">{STRATEGIES.find((s) => s.id === strategy)?.title}</p>
        <Slider label="Colours to extract" min={5} max={10} value={k} defaultValue={8} onChange={setK} />
        {!image && swatches.length > 0 && <p className="text-[12px] text-ink-subtle">Palette restored from a link. Add a wallpaper to re-extract.</p>}
      </div>

      {status === 'extracting' ? (
        <ul aria-label="Extracting colours" aria-busy className="grid grid-cols-3 gap-2">
          {Array.from({ length: k }, (_, i) => (
            <li key={i} className="sc-shimmer h-[106px] rounded-lg" />
          ))}
        </ul>
      ) : swatches.length === 0 ? (
        <p className="rounded-lg border border-line px-3 py-6 text-center text-[12.5px] text-ink-muted">No colours yet. Pick a sample or drop a wallpaper above.</p>
      ) : (
        <ul aria-label="Extracted colours" data-testid="swatches" className="grid grid-cols-3 gap-2">
          {swatches.map((s, i) => (
            <SwatchChip key={s.id} swatch={s} index={i} />
          ))}
        </ul>
      )}

      <label className={`${btn} relative cursor-pointer focus-within:outline-2 focus-within:outline-focus`}>
        <Plus aria-hidden className="size-3.5" /> Add custom colour
        <input ref={colorInput} type="color" defaultValue="#7c5cff" className="absolute inset-0 cursor-pointer opacity-0" aria-label="Add a custom colour" />
      </label>
    </div>
  )
}

function SwatchChip({ swatch, index }: { swatch: Swatch; index: number }) {
  const selected = useThemeStore((s) => s.selected.includes(swatch.id))
  const toggleSelected = useThemeStore((s) => s.toggleSelected)
  const setRole = useThemeStore((s) => s.setRole)
  const clearRoleFor = useThemeStore((s) => s.clearRoleFor)
  const removeColor = useThemeStore((s) => s.removeColor)
  const { assignment } = useRoles()
  const roles = ROLES.filter((r) => assignment[r] === swatch.id)
  const pop = Math.round(swatch.population * 100)
  const light = swatch.oklch.l > 0.65

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: selected ? 1 : 0.93 }}
      transition={{ opacity: { delay: index * 0.04 }, y: { delay: index * 0.04 }, scale: { type: 'spring', stiffness: 500, damping: 22 } }}
      className="min-w-0"
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${swatch.hex}, ${swatch.source === 'picked' ? 'picked' : `${pop}% of image`}. ${selected ? 'Used in theme' : 'Not used'}${roles.length ? `, ${roles.map((r) => ROLE_LABEL[r]).join(' and ')}` : ''}`}
        onClick={() => toggleSelected(swatch.id)}
        className={`relative flex h-14 w-full items-end justify-between rounded-lg p-1.5 ring-1 ring-line transition-opacity ${selected ? '' : 'opacity-45'}`}
        style={{ background: swatch.hex, color: light ? '#111' : '#fff' }}
      >
        <span className="flex gap-0.5">
          {roles.map((r) => (
            <span key={r} className="rounded bg-black/35 px-1 font-mono text-[10px] leading-4 text-white">{r[0].toUpperCase()}</span>
          ))}
        </span>
        {selected && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
      </button>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="truncate font-mono text-[11px] text-ink-muted">{swatch.hex}</span>
        <button type="button" aria-label={`Remove ${swatch.hex}`} onClick={() => removeColor(swatch.id)} className="text-ink-subtle hover:text-ink max-sm:p-2">
          <X className="size-3" />
        </button>
      </div>
      <div aria-hidden className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-ink-muted" style={{ width: `${Math.max(pop, swatch.population ? 2 : 0)}%` }} />
      </div>
      <select
        aria-label={`Role for ${swatch.hex}`}
        value={roles[0] ?? ''}
        onChange={(e) => (e.target.value ? setRole(e.target.value as Role, swatch.id) : clearRoleFor(swatch.id))}
        className="mt-1 h-7 w-full rounded-md border border-line bg-raised px-1 text-[11.5px] text-ink max-sm:h-11"
      >
        <option value="">No role</option>
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
        ))}
      </select>
    </motion.li>
  )
}
