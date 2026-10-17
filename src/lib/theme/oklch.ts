import { clampChroma, converter, formatHex, formatHex8, parse } from 'culori'

/**
 * A colour in OKLCH, the cylindrical form of OKLab.
 * l: perceived lightness 0–1 · c: chroma (colourfulness), 0 = grey, ~0.37 max in sRGB · h: hue in degrees.
 * Every colour decision in the app is made in this space because equal steps *look* equal.
 */
export interface Oklch {
  l: number
  c: number
  h: number
  alpha?: number
}

const toOklchMode = converter('oklch')
const toRgbMode = converter('rgb')

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const wrapHue = (h: number) => ((h % 360) + 360) % 360

export function parseToOklch(input: string): Oklch {
  const c = toOklchMode(parse(input))
  if (!c) throw new Error(`Not a colour: ${input}`)
  return { l: c.l, c: c.c ?? 0, h: wrapHue(c.h ?? 0) }
}

/** OKLab → OKLCH is just cartesian → polar: chroma is the radius, hue the angle. */
export function oklabToOklch(l: number, a: number, b: number): Oklch {
  return { l, c: Math.hypot(a, b), h: wrapHue((Math.atan2(b, a) * 180) / Math.PI) }
}

/**
 * Gamut-map to sRGB. Not every OKLCH colour exists on a screen; clampChroma lowers chroma
 * (keeping lightness and hue) until it fits, so the colour keeps its character instead of clipping.
 */
export function toSrgb(color: Oklch): { r: number; g: number; b: number } {
  const mapped = clampChroma({ mode: 'oklch', l: clamp(color.l), c: Math.max(0, color.c), h: color.h }, 'oklch')
  const rgb = toRgbMode(mapped)
  return { r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) }
}

export function toHex(color: Oklch): string {
  const rgb = toSrgb(color)
  if (color.alpha !== undefined && color.alpha < 1) {
    return formatHex8({ mode: 'rgb', ...rgb, alpha: clamp(color.alpha) })
  }
  return formatHex({ mode: 'rgb', ...rgb })
}

/** Shortest angular distance between two hues, 0–180°. */
export const hueDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

/** Interpolate hue along the shorter arc of the colour wheel. */
export function lerpHue(from: number, to: number, t: number): number {
  const delta = ((to - from + 540) % 360) - 180
  return wrapHue(from + delta * t)
}

/**
 * Warm/Cool presets: if a hue sits outside the target range, move it part of the way
 * (by `weight`) toward the nearest edge of that range. A partial pull keeps the image's identity.
 */
export function pullHue(h: number, [lo, hi]: [number, number], weight: number): number {
  if (h >= lo && h <= hi) return h
  const target = hueDistance(h, lo) < hueDistance(h, hi) ? lo : hi
  return lerpHue(h, target, weight)
}

/** 10 lightness steps from near-white to near-black, used by the Monochrome preset. */
export const TONAL_STEPS = [0.97, 0.92, 0.85, 0.76, 0.66, 0.56, 0.46, 0.36, 0.26, 0.17]

/**
 * Snap a colour onto the tonal scale of `base`'s hue. Chroma follows a bell curve:
 * strongest in the mid tones, fading toward white and black where sRGB has little room for colour.
 */
export function snapToTonalScale(color: Oklch, base: Oklch): Oklch {
  const l = TONAL_STEPS.reduce((best, s) => (Math.abs(s - color.l) < Math.abs(best - color.l) ? s : best))
  const bell = 1 - Math.min(1, Math.abs(l - 0.55) * 1.6)
  return { l, c: base.c * (0.25 + 0.75 * bell), h: base.h }
}
