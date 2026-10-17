import { COLOR_TOKENS } from '../theme/tokens'

export type ExportFormat = 'css' | 'json' | 'tailwind'

const isColor = (name: string) => (COLOR_TOKENS as readonly string[]).includes(name)

export function toCss(vars: Record<string, string>): string {
  return `:root {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}\n`
}

export function toJson(vars: Record<string, string>, meta: Record<string, unknown>): string {
  const colors: Record<string, string> = {}
  const effects: Record<string, string> = {}
  for (const [k, v] of Object.entries(vars)) (isColor(k) ? colors : effects)[k.slice(2)] = v
  return JSON.stringify({ meta, colors, effects }, null, 2) + '\n'
}

/** Tailwind v4: colours become --color-*, so `bg-primary`, `text-text-muted` etc. just work. */
export function toTailwind(vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([k, v]) => {
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
