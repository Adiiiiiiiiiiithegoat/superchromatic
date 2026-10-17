import { converter, formatHex, parse } from 'culori'
import { type Oklch, toHex } from '../theme/oklch'

/** Gamma-encoded sRGB, channels 0–1 (what the screen shows). */
export interface Rgb {
  r: number
  g: number
  b: number
}

const toRgbMode = converter('rgb')

export function hexToRgb(hex: string): Rgb {
  const c = toRgbMode(parse(hex))
  if (!c) throw new Error(`Not a colour: ${hex}`)
  return { r: c.r, g: c.g, b: c.b }
}

export const rgbToHex = (c: Rgb) => formatHex({ mode: 'rgb', ...c })

/** The exact colour that will be rendered: OKLCH → gamut-mapped → rounded to hex → back to RGB. */
export const rendered = (c: Oklch): Rgb => hexToRgb(toHex({ ...c, alpha: undefined }))

/** WCAG 2.x relative luminance: linearise each channel, then weight by the eye's sensitivity. */
export function luminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio, 1–21: (lighter + 0.05) / (darker + 0.05). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Composite `top` at `alpha` over `under`, the way the browser does (in gamma-encoded sRGB). */
export function blend(top: Rgb, alpha: number, under: Rgb): Rgb {
  return {
    r: top.r * alpha + under.r * (1 - alpha),
    g: top.g * alpha + under.g * (1 - alpha),
    b: top.b * alpha + under.b * (1 - alpha),
  }
}

/** Contrast against several possible backgrounds; the lowest one is what counts. */
export function worstContrast(fg: Rgb, bgs: Rgb[]): { ratio: number; bg: Rgb } {
  let worst = { ratio: Infinity, bg: bgs[0] }
  for (const bg of bgs) {
    const ratio = contrastRatio(fg, bg)
    if (ratio < worst.ratio) worst = { ratio, bg }
  }
  return worst
}

export function grade(ratio: number, target: number): 'AAA' | 'AA' | 'Fail' {
  if (ratio < target) return 'Fail'
  return ratio >= (target >= 4.5 ? 7 : 4.5) ? 'AAA' : 'AA'
}

export interface FixResult {
  color: Oklch
  ratio: number
  ok: boolean
  fixed: boolean
}

/**
 * Auto-fix: keep the foreground's hue and chroma, move only its OKLCH lightness until it passes
 * against every background in `bgs`. We try walking toward black and toward white; in each
 * direction a coarse scan brackets the first passing lightness, then a binary search narrows it
 * to the smallest change. The direction needing the smaller change wins.
 */
export function fixLightness(fg: Oklch, bgs: Rgb[], target: number): FixResult {
  const score = (l: number) => worstContrast(rendered({ ...fg, l }), bgs).ratio
  const start = score(fg.l)
  if (start >= target) return { color: fg, ratio: start, ok: true, fixed: false }

  const STEPS = 20
  let best: { l: number; ratio: number } | null = null
  for (const end of [0, 1]) {
    let prev = fg.l
    let found: number | null = null
    for (let s = 1; s <= STEPS; s++) {
      const l = fg.l + ((end - fg.l) * s) / STEPS
      if (score(l) >= target) {
        found = l
        break
      }
      prev = l
    }
    if (found === null) continue
    let lo = prev
    let hi = found // invariant: `hi` always passes
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (score(mid) >= target) hi = mid
      else lo = mid
    }
    if (!best || Math.abs(hi - fg.l) < Math.abs(best.l - fg.l)) best = { l: hi, ratio: score(hi) }
  }

  if (!best) {
    const l = score(0) >= score(1) ? 0 : 1
    return { color: { ...fg, l }, ratio: score(l), ok: false, fixed: true }
  }
  return { color: { ...fg, l: best.l }, ratio: best.ratio, ok: true, fixed: true }
}
