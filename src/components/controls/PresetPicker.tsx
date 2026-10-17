import { motion } from 'motion/react'
import { type CSSProperties, useDeferredValue, useMemo } from 'react'
import { generateTheme } from '../../lib/theme/generate'
import { PRESETS } from '../../lib/theme/presets'
import { useRoles, useThemeStore, useWallpaper } from '../../store/useThemeStore'

/** A tiny live mock of the preview, painted only with the preset's generated tokens. */
function PresetThumb({ vars, wallpaper, glass }: { vars: Record<string, string>; wallpaper: string; glass: boolean }) {
  const style = { ...vars, '--wallpaper': wallpaper } as CSSProperties
  return (
    <div aria-hidden style={style} className="relative h-[72px] overflow-hidden rounded-md" >
      <div className="absolute inset-0" style={{ background: 'var(--bg)', backgroundImage: 'var(--bg-gradient)' }} />
      {glass && (
        <>
          <div className="absolute -inset-2" style={{ backgroundImage: 'var(--wallpaper)', backgroundSize: 'cover', filter: 'blur(3px)' }} />
          <div className="absolute inset-0" style={{ background: 'var(--overlay)', opacity: 'var(--overlay-opacity)' }} />
        </>
      )}
      <div className="absolute inset-0" style={{ backgroundImage: 'var(--bg-pattern)', backgroundSize: '8px 8px' }} />
      <div className="relative flex h-full flex-col gap-1 p-2">
        <div className="h-1.5 w-2/3 rounded-full" style={{ background: 'var(--text)' }} />
        <div className="h-1 w-1/2 rounded-full" style={{ background: 'var(--text-muted)' }} />
        <div className="mt-0.5 flex gap-1">
          <div className="h-2.5 w-7 rounded-[3px]" style={{ background: 'var(--primary)', boxShadow: 'var(--button-shadow)' }} />
          <div className="h-2.5 w-6 rounded-[3px]" style={{ background: 'var(--secondary)' }} />
          <div className="h-2.5 w-3 rounded-[3px]" style={{ background: 'var(--accent)' }} />
        </div>
        <div
          className="mt-auto h-4 w-4/5 rounded-[4px]"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)', backdropFilter: glass ? 'blur(4px)' : undefined }}
        />
      </div>
    </div>
  )
}

export function PresetSection() {
  const { colors } = useRoles()
  const mode = useThemeStore((s) => s.mode)
  const a11y = useThemeStore((s) => s.a11y)
  const presetId = useThemeStore((s) => s.presetId)
  const setPreset = useThemeStore((s) => s.setPreset)
  const wallpaper = useWallpaper()
  // Thumbnails are a nice-to-have: let them lag a frame behind rather than slow the main preview.
  const deferredColors = useDeferredValue(colors)
  const thumbs = useMemo(
    () => PRESETS.map((p) => ({ p, vars: generateTheme(deferredColors, p, p.defaults, p.preferredMode ?? mode, a11y).vars })),
    [deferredColors, mode, a11y],
  )

  return (
    <ul className="grid grid-cols-2 gap-2">
      {thumbs.map(({ p, vars }) => {
        const active = p.id === presetId
        return (
          <li key={p.id}>
            <button
              type="button"
              data-testid={`preset-${p.id}`}
              aria-pressed={active}
              onClick={() => setPreset(p.id)}
              className="relative w-full rounded-lg border border-line p-1.5 text-left transition-colors hover:bg-hover"
            >
              {active && (
                <motion.span
                  layoutId="preset-outline"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="pointer-events-none absolute -inset-px rounded-lg border-2 border-ink"
                />
              )}
              <PresetThumb vars={vars} wallpaper={wallpaper} glass={p.background === 'wallpaper'} />
              <span className="mt-1.5 block px-0.5 text-[12.5px] font-medium">{p.name}</span>
              <span className="block px-0.5 text-[11px] leading-tight text-ink-subtle">{p.tagline}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
