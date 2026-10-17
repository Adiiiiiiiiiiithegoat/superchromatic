import { Copy, Download, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { type ExportFormat, copyText, download, exportTheme } from '../../lib/share/export'
import { toHex } from '../../lib/theme/oklch'
import { PRESETS_BY_ID } from '../../lib/theme/presets'
import { useRoles, useTheme, useThemeStore } from '../../store/useThemeStore'
import { btn, iconBtn } from '../ui'

const TABS: { id: ExportFormat; label: string }[] = [
  { id: 'css', label: 'CSS variables' },
  { id: 'json', label: 'JSON tokens' },
  { id: 'tailwind', label: 'Tailwind v4' },
]

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<ExportFormat>('css')
  const theme = useTheme()
  const { colors } = useRoles()
  const presetId = useThemeStore((s) => s.presetId)
  const mode = useThemeStore((s) => s.mode)
  const notify = useThemeStore((s) => s.notify)

  // Native <dialog>: focus trapping, Esc to close and the backdrop come from the browser.
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const out = useMemo(() => {
    const palette = { primary: toHex(colors.primary), secondary: toHex(colors.secondary), accent: toHex(colors.accent), background: toHex(colors.background) }
    return exportTheme(tab, theme.vars, { generator: 'SuperChromatic', preset: PRESETS_BY_ID[presetId].name, mode, palette })
  }, [tab, theme.vars, colors, presetId, mode])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="export-title"
      className="m-auto w-[min(760px,calc(100vw-24px))] rounded-xl border border-line bg-panel p-0 text-ink shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <h2 id="export-title" className="text-[14px] font-semibold">Export theme</h2>
        <button type="button" onClick={onClose} aria-label="Close" className={`${iconBtn} ml-auto`}>
          <X className="size-4" />
        </button>
      </div>
      <div className="p-4">
        <div role="tablist" aria-label="Export format" className="mb-3 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`export-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls="export-panel"
              onClick={() => setTab(t.id)}
              className={`h-8 shrink-0 rounded-md px-3 text-[12.5px] max-sm:h-11 ${tab === t.id ? 'bg-raised text-ink ring-1 ring-line-strong' : 'text-ink-muted hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <pre
          id="export-panel"
          role="tabpanel"
          aria-labelledby={`export-tab-${tab}`}
          tabIndex={0}
          className="max-h-[50vh] overflow-auto rounded-lg border border-line bg-app p-3 font-mono text-[11.5px] leading-relaxed whitespace-pre text-ink-muted"
        >
          {out.text}
        </pre>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={async () => notify((await copyText(out.text)) ? 'Copied to clipboard' : 'Copy failed. Select the text instead.')}>
            <Copy aria-hidden className="size-3.5" /> Copy
          </button>
          <button type="button" className={btn} onClick={() => download(out.text, out.filename, out.mime)}>
            <Download aria-hidden className="size-3.5" /> Download {out.filename.split('.').slice(1).join('.')}
          </button>
        </div>
      </div>
    </dialog>
  )
}
