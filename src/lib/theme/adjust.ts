import type { Adjustments } from '../types'
import { type Oklch, clamp } from './oklch'

/** Brightness slider unit: ±50 → ±0.15 OKLCH lightness. */
const BRIGHTNESS_STEP = 0.003
/** Contrast slider strength: 0% → lightness 60% closer to mid-grey, 200% → 60% further away. */
const CONTRAST_STRENGTH = 0.6

/** Saturation multiplies chroma; brightness shifts lightness. Applied to every colour. */
export function adjustColor(c: Oklch, adj: Adjustments): Oklch {
  return { ...c, c: Math.max(0, c.c * (adj.saturation / 100)), l: clamp(c.l + adj.brightness * BRIGHTNESS_STEP) }
}

/**
 * Surfaces and text also get the contrast slider: lightness is pushed away from (or pulled
 * toward) the 0.5 midpoint, so backgrounds and text separate or converge together.
 */
export function adjustSurface(c: Oklch, adj: Adjustments): Oklch {
  const base = adjustColor(c, adj)
  const k = 1 + ((adj.contrast - 100) / 100) * CONTRAST_STRENGTH
  return { ...base, l: clamp(0.5 + (base.l - 0.5) * k) }
}
