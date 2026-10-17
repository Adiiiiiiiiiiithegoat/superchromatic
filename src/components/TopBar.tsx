import { Clipboard, Download, Link2, PanelLeft } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { copyText, toCss } from '../lib/share/export'
import { shareUrl } from '../lib/share/url'
import { useTheme, useThemeStore } from '../store/useThemeStore'
import { A11yChip } from './controls/ContrastReport'
import { ExportModal } from './controls/ExportModal'
import { btn, iconBtn } from './ui'

/** A little burst of themed sparks for "Copy CSS". */
function Sparkles({ colors }: { colors: string[] }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{ background: colors[i % colors.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 26, y: Math.sin(angle) * 20, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          />
        )
      })}
    </span>
  )
}

export function TopBar({ onToggleControls, controlsOpen }: { onToggleControls?: () => void; controlsOpen?: boolean }) {
  const theme = useTheme()
  const notify = useThemeStore((s) => s.notify)
  const [exportOpen, setExportOpen] = useState(false)
  const [burst, setBurst] = useState(0)
  const reduceMotion = useReducedMotion()
  const primary = theme.vars['--primary']
  const accent = theme.vars['--accent']

  const share = async () => {
    const s = useThemeStore.getState()
    const url = shareUrl(s)
    notify((await copyText(url)) ? 'Share link copied. The wallpaper itself isn’t included.' : 'Could not copy the link.')
  }

  const copyCss = async () => {
    const ok = await copyText(toCss(theme.vars))
    notify(ok ? 'CSS variables copied' : 'Could not copy. Use Export instead.')
    if (ok && !reduceMotion) setBurst((b) => b + 1)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-panel px-2 max-sm:h-14 sm:px-4">
      {onToggleControls && (
        <button type="button" onClick={onToggleControls} aria-expanded={controlsOpen} aria-controls="controls-drawer" aria-label="Toggle controls" className={iconBtn}>
          <PanelLeft className="size-4" />
        </button>
      )}
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden className="size-3.5 shrink-0 rounded-full transition-[background] duration-300" style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }} />
        <h1 className="text-[14px] font-semibold tracking-tight">SuperChromatic</h1>
        <span className="hidden truncate text-[12.5px] text-ink-subtle xl:inline">Drop a wallpaper. Get a whole design system.</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <A11yChip />
        <button type="button" className={btn} onClick={share} aria-label="Copy share link">
          <Link2 aria-hidden className="size-3.5" /> <span className="max-md:hidden">Share</span>
        </button>
        <button type="button" className={`${btn} relative`} onClick={copyCss} aria-label="Copy CSS variables">
          <Clipboard aria-hidden className="size-3.5" /> <span className="max-md:hidden">Copy CSS</span>
          <AnimatePresence>{burst > 0 && <Sparkles key={burst} colors={[primary, accent, theme.vars['--secondary']]} />}</AnimatePresence>
        </button>
        <button type="button" className={`${btn} border-ink bg-ink text-app hover:bg-ink hover:opacity-90`} onClick={() => setExportOpen(true)} aria-label="Export theme">
          <Download aria-hidden className="size-3.5" /> <span className="max-md:hidden">Export</span>
        </button>
      </div>
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </header>
  )
}
