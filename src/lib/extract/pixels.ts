import { oklabToOklch, toHex } from '../theme/oklch'
import type { Swatch, SwatchSource } from '../types'

export interface Cluster {
  l: number
  a: number
  b: number
  count: number
}

// 8-bit sRGB → linear light, precomputed (the sRGB transfer curve, IEC 61966-2-1).
const LINEAR = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const v = i / 255
  LINEAR[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

/**
 * RGBA bytes → packed OKLab triplets [L, a, b, L, a, b, …].
 * OKLab (Björn Ottosson, 2020): linear sRGB → LMS cone response → cube root → opponent axes.
 * It is perceptually uniform, so Euclidean distance ≈ visible difference, which is exactly
 * what clustering needs. Pixels with alpha below `minAlpha` are skipped.
 */
export function rgbaToOklab(data: ArrayLike<number>, minAlpha = 125): Float32Array {
  const out = new Float32Array((data.length / 4) * 3)
  let o = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < minAlpha) continue
    const r = LINEAR[data[i]], g = LINEAR[data[i + 1]], b = LINEAR[data[i + 2]]
    const lms0 = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    const lms1 = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    const lms2 = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    out[o++] = 0.2104542553 * lms0 + 0.793617785 * lms1 - 0.0040720468 * lms2
    out[o++] = 1.9779984951 * lms0 - 2.428592205 * lms1 + 0.4505937099 * lms2
    out[o++] = 0.0259040371 * lms0 + 0.7827717662 * lms1 - 0.808675766 * lms2
  }
  return out.subarray(0, o)
}

/** Squared Euclidean distance in OKLab between pixel i of `px` and centre j of `centres`. */
export function dist2(px: ArrayLike<number>, i: number, centres: ArrayLike<number>, j: number): number {
  const dl = px[i * 3] - centres[j * 3]
  const da = px[i * 3 + 1] - centres[j * 3 + 1]
  const db = px[i * 3 + 2] - centres[j * 3 + 2]
  return dl * dl + da * da + db * db
}

/** ΔE_ok: plain Euclidean distance in OKLab. */
export const deltaE = (p: Cluster, q: Cluster) => Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b)

let uidCounter = 0
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(uidCounter++).toString(36)}`

export function clustersToSwatches(clusters: Cluster[], source: SwatchSource): Swatch[] {
  const total = clusters.reduce((s, c) => s + c.count, 0) || 1
  return clusters.map((c) => {
    const oklch = oklabToOklch(c.l, c.a, c.b)
    return { id: uid(source), hex: toHex(oklch), oklch, population: c.count / total, source }
  })
}

/** Average OKLab of a pixel buffer, used by the eyedropper's 5×5 sample. */
export function averageOklab(px: Float32Array): Cluster {
  const n = px.length / 3
  let l = 0, a = 0, b = 0
  for (let i = 0; i < px.length; i += 3) {
    l += px[i]
    a += px[i + 1]
    b += px[i + 2]
  }
  return n ? { l: l / n, a: a / n, b: b / n, count: n } : { l: 0, a: 0, b: 0, count: 0 }
}
