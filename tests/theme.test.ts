import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, fixLightness, hexToRgb, rendered } from '../src/lib/a11y/contrast'
import { mulberry32 } from '../src/lib/extract/kmeans'
import { generateTheme } from '../src/lib/theme/generate'
import { parseToOklch } from '../src/lib/theme/oklch'
import { PRESETS } from '../src/lib/theme/presets'
import { autoAssign, resolveRoles } from '../src/lib/theme/roles'
import { ALL_TOKENS, COLOR_TOKENS } from '../src/lib/theme/tokens'
import { decodeShare, encodeShare } from '../src/lib/share/url'
import type { Swatch } from '../src/lib/types'

const sw = (id: string, hex: string, population: number): Swatch => ({ id, hex, oklch: parseToOklch(hex), population, source: 'kmeans' })
const SWATCHES = [sw('navy', '#14213d', 0.4), sw('orange', '#fca311', 0.2), sw('teal', '#2a9d8f', 0.15), sw('cream', '#e9e4d8', 0.15), sw('rose', '#e76f51', 0.1)]
const ids = SWATCHES.map((s) => s.id)

describe('contrast maths', () => {
  it('matches known WCAG ratios', () => {
    expect(contrastRatio(hexToRgb('#000'), hexToRgb('#fff'))).toBeCloseTo(21, 5)
    expect(contrastRatio(hexToRgb('#777'), hexToRgb('#fff'))).toBeCloseTo(4.48, 2)
  })
  it('auto-fix always ends at or above the target', () => {
    const rand = mulberry32(99)
    for (let i = 0; i < 300; i++) {
      const fg = { l: rand(), c: rand() * 0.3, h: rand() * 360 }
      const bg = rendered({ l: rand(), c: rand() * 0.3, h: rand() * 360 })
      const target = rand() > 0.5 ? 4.5 : 3
      const r = fixLightness(fg, [bg], target)
      expect(r.ok).toBe(true)
      expect(contrastRatio(rendered(r.color), bg)).toBeGreaterThanOrEqual(target)
      expect(r.color.h).toBe(fg.h) // hue is preserved
    }
  })
})

describe('roles', () => {
  it('auto-assigns background = most populous, primary = best chroma×√pop', () => {
    const a = autoAssign(SWATCHES)
    expect(a.background).toBe('navy')
    expect(a.primary).toBe('orange')
    expect(new Set(Object.values(a)).size).toBe(4)
  })
  it('derives missing roles from primary', () => {
    const { assignment, colors } = resolveRoles(SWATCHES, ['orange'], {})
    expect(assignment.primary).toBe('orange')
    expect(assignment.accent).toBeNull()
    expect(colors.accent.h).not.toBeCloseTo(colors.primary.h, 0)
  })
  it('respects overrides', () => {
    expect(resolveRoles(SWATCHES, ids, { primary: 'teal' }).assignment.primary).toBe('teal')
  })
})

describe('generateTheme', () => {
  const { colors } = resolveRoles(SWATCHES, ids, {})
  for (const preset of PRESETS) {
    for (const mode of ['light', 'dark'] as const) {
      it(`${preset.name}/${mode}: emits every token and passes all checks with auto-fix`, () => {
        const theme = generateTheme(colors, preset, preset.defaults, mode, { autoFix: true })
        for (const t of ALL_TOKENS) expect(theme.vars[t], t).toBeTruthy()
        for (const c of theme.checks) expect(c.pass, `${c.label} ${c.ratio.toFixed(2)}`).toBe(true)
      })
    }
  }
  it('auto-fix still passes at extreme slider values', () => {
    for (const preset of PRESETS) {
      for (const adj of [{ contrast: 0, brightness: 50 }, { contrast: 200, saturation: 200, brightness: -50 }, { overlay: 0, blur: 40 }]) {
        const theme = generateTheme(colors, preset, { ...preset.defaults, ...adj }, 'light', { autoFix: true })
        for (const c of theme.checks) expect(c.pass, `${preset.name} ${c.label}`).toBe(true)
      }
    }
  })
  it('saturation slider changes --primary', () => {
    const p = PRESETS[0]
    const a = generateTheme(colors, p, p.defaults, 'light', { autoFix: true }).vars['--primary']
    const b = generateTheme(colors, p, { ...p.defaults, saturation: 30 }, 'light', { autoFix: true }).vars['--primary']
    expect(a).not.toBe(b)
  })
  it('presets produce different themes from the same palette', () => {
    const bgs = new Set(PRESETS.map((p) => JSON.stringify(generateTheme(colors, p, p.defaults, 'light', { autoFix: true }).vars)))
    expect(bgs.size).toBe(PRESETS.length)
  })
})

describe('share URL', () => {
  it('round-trips palette, roles, preset and adjustments', () => {
    const state = { swatches: SWATCHES, selected: ['navy', 'teal'], overrides: { primary: 'teal' }, presetId: 'neon' as const, adjustments: PRESETS[5].defaults, mode: 'dark' as const }
    const back = decodeShare(`#theme=${encodeShare(state)}`)!
    expect(back.swatches.map((s) => s.hex)).toEqual(SWATCHES.map((s) => s.hex))
    expect(back.selected.map((id) => back.swatches.find((s) => s.id === id)!.hex)).toEqual(['#14213d', '#2a9d8f'])
    expect(back.swatches.find((s) => s.id === back.overrides.primary)!.hex).toBe('#2a9d8f')
    expect(back.presetId).toBe('neon')
    expect(back.mode).toBe('dark')
  })
  it('rejects garbage', () => expect(decodeShare('#theme=nope')).toBeNull())
})

/** The "theme consistency" guarantee: the preview never hard-codes a colour. */
describe('preview uses tokens only', () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]))
  it('has no colour literals in src/preview', () => {
    const banned = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklch\(|\b(white|black|red|blue|green|gray|grey)\b(?![-\w])|\b(bg|text|border|from|to|via|fill|stroke|ring|shadow)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/i
    for (const f of files('src/preview')) {
      const src = readFileSync(f, 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      expect(banned.exec(src)?.[0], f).toBeUndefined()
    }
  })
  it('registers every colour token with @property', () => {
    const css = readFileSync('src/index.css', 'utf8')
    for (const t of COLOR_TOKENS) expect(css, t).toContain(`@property ${t} `)
  })
})
