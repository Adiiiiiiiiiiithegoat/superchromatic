import { History, Monitor, Moon, Smartphone, Sun, Tablet } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'

export type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICES: { id: Device; label: string; Icon: typeof Monitor }[] = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'tablet', label: 'Tablet', Icon: Tablet },
  { id: 'mobile', label: 'Mobile', Icon: Smartphone },
]

const tool = 'inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12.5px] max-sm:h-11 max-sm:px-3 transition-colors'

export function PreviewToolbar({ device, onDevice, compact, comparing, onCompare }: {
  device: Device
  onDevice: (d: Device) => void
  compact: boolean
  comparing: boolean
  onCompare: (on: boolean) => void
}) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const dark = mode === 'dark'

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-panel px-2 max-sm:h-14 sm:px-3">
      {!compact && (
        <div role="group" aria-label="Preview width" className="flex gap-0.5 rounded-lg border border-line bg-raised p-0.5">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              aria-label={`${label} width`}
              title={label}
              onClick={() => onDevice(id)}
              className={`${tool} h-7 ${device === id ? 'bg-panel text-ink ring-1 ring-line-strong' : 'text-ink-muted hover:text-ink'}`}
            >
              <Icon aria-hidden className="size-3.5" />
            </button>
          ))}
        </div>
      )}
      <span className="truncate text-[12px] text-ink-subtle max-sm:hidden">Orbit · live preview{!compact && device !== 'desktop' ? ' · drag the corner to resize' : ''}</span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          data-testid="mode-toggle"
          aria-pressed={dark}
          onClick={() => setMode(dark ? 'light' : 'dark')}
          className={`${tool} text-ink-muted hover:bg-hover hover:text-ink`}
        >
          {dark ? <Moon aria-hidden className="size-3.5" /> : <Sun aria-hidden className="size-3.5" />}
          {dark ? 'Dark' : 'Light'}
        </button>
        <button
          type="button"
          aria-pressed={comparing}
          title="Hold to see your colours from before the last change"
          onPointerDown={() => onCompare(true)}
          onPointerUp={() => onCompare(false)}
          onPointerLeave={() => onCompare(false)}
          onPointerCancel={() => onCompare(false)}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault()
              onCompare(true)
            }
          }}
          onKeyUp={() => onCompare(false)}
          onBlur={() => onCompare(false)}
          onContextMenu={(e) => e.preventDefault()}
          className={`${tool} touch-none select-none ${comparing ? 'bg-ink text-app' : 'text-ink-muted hover:bg-hover hover:text-ink'}`}
        >
          <History aria-hidden className="size-3.5" /> {comparing ? 'Previous' : 'Compare'}
        </button>
      </div>
    </div>
  )
}
