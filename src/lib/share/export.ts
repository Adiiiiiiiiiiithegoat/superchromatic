import { COLOR_TOKENS } from '../theme/tokens'

export type ExportFormat = 'css' | 'json' | 'tailwind'

const isColor = (name: string) => (COLOR_TOKENS as readonly string[]).includes(name)
/** Everything except --wallpaper-fallback, which only exists for this app's share-link view. */
const exported = (vars: Record<string, string>) => Object.entries(vars).filter(([k]) => k !== '--wallpaper-fallback')

export function toCss(vars: Record<string, string>): string {
  return `:root {\n${exported(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`
}

export function toJson(vars: Record<string, string>, meta: Record<string, unknown>): string {
  const colors: Record<string, string> = {}
  const effects: Record<string, string> = {}
  for (const [k, v] of exported(vars)) (isColor(k) ? colors : effects)[k.slice(2)] = v
  return JSON.stringify({ meta, colors, effects }, null, 2) + '\n'
}

/** Tailwind v4: colours become --color-*, so `bg-primary`, `text-text-muted` etc. just work. */
export function toTailwind(vars: Record<string, string>): string {
  const lines = exported(vars).map(([k, v]) => {
    const name = k.slice(2)
    if (isColor(k)) return `  --color-${name}: ${v};`
    if (name === 'radius') return `  --radius-theme: ${v};`
    if (name === 'shadow') return `  --shadow-theme: ${v};`
    return `  --${name}: ${v};`
  })
  return `@import "tailwindcss";\n\n@theme {\n${lines.join('\n')}\n}\n`
}

export function exportTheme(format: ExportFormat, vars: Record<string, string>, meta: Record<string, unknown>): { text: string; filename: string; mime: string } {
  if (format === 'json') return { text: toJson(vars, meta), filename: 'superchromatic-theme.json', mime: 'application/json' }
  if (format === 'tailwind') return { text: toTailwind(vars), filename: 'superchromatic-theme.tailwind.css', mime: 'text/css' }
  return { text: toCss(vars), filename: 'superchromatic-theme.css', mime: 'text/css' }
}

export function download(text: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Clipboard write with a fallback for browsers/contexts without the async Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}
