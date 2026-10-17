import { hueDistance } from '../theme/oklch'
import { kmeans } from './kmeans'
import { type Cluster, deltaE } from './pixels'

const FAMILIES = 12 // 30° slices of the hue wheel
const GREY = 0.04 // chroma below this reads as grey (same cut-off as vibrant)
const COVER = 0.03 // a colour family covering 3% of the picture must show up in the palette

const hueOf = (c: { a: number; b: number }) => ((Math.atan2(c.b, c.a) * 180) / Math.PI + 360) % 360
const chromaOf = (c: { a: number; b: number }) => Math.hypot(c.a, c.b)

/** Keep only the pixels that pass `test`, still packed [L, a, b, …]. */
function only(px: Float32Array, test: (l: number, a: number, b: number) => boolean): Float32Array {
  const out = new Float32Array(px.length)
  let o = 0
  for (let i = 0; i < px.length; i += 3) {
    if (!test(px[i], px[i + 1], px[i + 2])) continue
    out[o++] = px[i]
    out[o++] = px[i + 1]
    out[o++] = px[i + 2]
  }
  return out.subarray(0, o)
}

/**
 * Colourful pixels grouped into 12 hue families. Each family's colour is a chroma²-weighted
 * OKLab mean, so it leans towards the family's vivid pixels instead of averaging into mud.
 */
export function hueFamilies(px: Float32Array): Cluster[] {
  const sums = new Float64Array(FAMILIES * 5) // l, a, b, weight, count
  for (let i = 0; i < px.length; i += 3) {
    const a = px[i + 1], b = px[i + 2]
    const c = Math.hypot(a, b)
    if (c < GREY) continue
    const f = (Math.floor(hueOf({ a, b }) / (360 / FAMILIES)) % FAMILIES) * 5
    const w = c * c
    sums[f] += px[i] * w
    sums[f + 1] += a * w
    sums[f + 2] += b * w
    sums[f + 3] += w
    sums[f + 4]++
  }
  const out: Cluster[] = []
  for (let f = 0; f < FAMILIES * 5; f += 5) {
    const w = sums[f + 3]
    if (w) out.push({ l: sums[f] / w, a: sums[f + 1] / w, b: sums[f + 2] / w, count: sums[f + 4] })
  }
  return out
}

/**
 * No colour family that covers a real part of the picture may go missing. Clustering can fold a
 * dark navy into black (they're close in OKLab), which is how a blue car ended up with no blue.
 * Each missing family replaces the most redundant swatch: the one closest to another swatch.
 */
export function ensureHues(px: Float32Array, clusters: Cluster[], k: number): Cluster[] {
  const n = px.length / 3
  const out = [...clusters]
  const added = new Set<Cluster>()
  const covered = (f: Cluster) => out.some((c) => chromaOf(c) >= GREY && hueDistance(hueOf(c), hueOf(f)) < 360 / FAMILIES)

  for (const family of hueFamilies(px).filter((f) => f.count / n >= COVER).sort((p, q) => q.count - p.count)) {
    if (covered(family)) continue
    if (out.length >= k) {
      const biggest = out.reduce((a, c) => (c.count > a.count ? c : a))
      let worst = -1
      let worstD = Infinity
      out.forEach((c, i) => {
        if (c === biggest || added.has(c)) return // keep the background anchor and anything just rescued
        const d = Math.min(...out.filter((o) => o !== c).map((o) => deltaE(c, o)))
        if (d < worstD) {
          worstD = d
          worst = i
        }
      })
      if (worst < 0) break
      out.splice(worst, 1)
    }
    out.push(family)
    added.add(family)
  }
  return out.sort((p, q) => q.count - p.count)
}

/** Fill up to k with k-means colours that look different enough from what's already picked. */
function backfill(px: Float32Array, picked: Cluster[], k: number): Cluster[] {
  for (const c of kmeans(px, k)) {
    if (picked.length >= k) break
    if (picked.every((p) => deltaE(p, c) >= 0.08)) picked.push(c)
  }
  return picked
}

/** Rainbow: one colour from every family in the picture, spread as far round the wheel as possible. */
export function rainbow(px: Float32Array, k = 8): Cluster[] {
  const n = px.length / 3
  if (n === 0) return []
  const pool = hueFamilies(px).filter((f) => f.count / n >= 0.005)
  const picked: Cluster[] = []
  // Farthest-point order on the hue wheel, starting from the biggest family.
  while (pool.length && picked.length < k) {
    const gap = (f: Cluster) => (picked.length ? Math.min(...picked.map((p) => hueDistance(hueOf(p), hueOf(f)))) : f.count)
    const next = pool.reduce((a, f) => (gap(f) > gap(a) || (gap(f) === gap(a) && f.count > a.count) ? f : a))
    picked.push(pool.splice(pool.indexOf(next), 1)[0])
  }
  return backfill(px, picked, k).sort((p, q) => q.count - p.count)
}

/** Matching: light-to-dark shades of the picture's main colour family (±45°), which always go together. */
export function matching(px: Float32Array, k = 8): Cluster[] {
  const n = px.length / 3
  const families = hueFamilies(px)
  if (families.length === 0) return kmeans(px, k) // a grey picture has no main colour
  const main = families.reduce((a, f) => (f.count * chromaOf(f) > a.count * chromaOf(a) ? f : a))
  const h = hueOf(main)
  const shades = only(px, (_, a, b) => Math.hypot(a, b) >= 0.02 && hueDistance(hueOf({ a, b }), h) <= 45)
  return shades.length / 3 >= n * 0.01 ? kmeans(shades, k, { mergeBelow: 0.03 }) : kmeans(px, k)
}

/** Soft: the quiet, dusty colours, taken from the less colourful half of the picture's colourful pixels. */
export function soft(px: Float32Array, k = 8): Cluster[] {
  const n = px.length / 3
  const chromas: number[] = []
  for (let i = 0; i < px.length; i += 3) {
    const c = Math.hypot(px[i + 1], px[i + 2])
    if (c >= 0.015) chromas.push(c)
  }
  if (chromas.length < n * 0.01) return kmeans(px, k)
  chromas.sort((p, q) => p - q)
  const limit = Math.max(chromas[chromas.length >> 1], 0.03)
  const muted = only(px, (_, a, b) => {
    const c = Math.hypot(a, b)
    return c >= 0.015 && c <= limit
  })
  return kmeans(muted, k)
}
