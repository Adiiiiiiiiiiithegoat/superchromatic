import { type Cluster, deltaE } from './pixels'

const HUE_BUCKETS = 12 // 30° each
const NEUTRAL_CHROMA = 0.04 // below this a pixel is effectively grey
const DISTINCT = 0.08 // picked colours must differ by at least this ΔE_ok

const band = (l: number) => (l < 0.4 ? 0 : l < 0.7 ? 1 : 2) // dark / mid / light

/**
 * Vibrant: bucket pixels by hue (12) × lightness band (3), plus 3 grey buckets.
 * Score each colourful bucket by chroma × √population, so a small but vivid pop of colour
 * can beat a large dull area. Greedily take the best distinct buckets, and always keep the
 * dominant colour so the Background role has an anchor.
 */
export function vibrant(px: Float32Array, k = 8): Cluster[] {
  const n = px.length / 3
  if (n === 0) return []
  const size = HUE_BUCKETS * 3 + 3
  const sums = new Float64Array(size * 4)

  for (let i = 0; i < n; i++) {
    const l = px[i * 3], a = px[i * 3 + 1], b = px[i * 3 + 2]
    let bucket: number
    if (Math.hypot(a, b) < NEUTRAL_CHROMA) bucket = HUE_BUCKETS * 3 + band(l)
    else {
      const h = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
      bucket = Math.floor(h / (360 / HUE_BUCKETS)) * 3 + band(l)
    }
    sums[bucket * 4] += l
    sums[bucket * 4 + 1] += a
    sums[bucket * 4 + 2] += b
    sums[bucket * 4 + 3]++
  }

  const buckets: (Cluster & { score: number; neutral: boolean })[] = []
  for (let i = 0; i < size; i++) {
    const count = sums[i * 4 + 3]
    if (!count) continue
    // Average in OKLab (not hue angles), so the mean colour is never a muddy wrap-around.
    const l = sums[i * 4] / count, a = sums[i * 4 + 1] / count, b = sums[i * 4 + 2] / count
    const neutral = i >= HUE_BUCKETS * 3
    buckets.push({ l, a, b, count, neutral, score: neutral ? 0 : Math.hypot(a, b) * Math.sqrt(count / n) })
  }

  const picked: Cluster[] = []
  const isDistinct = (c: Cluster, min = DISTINCT) => picked.every((p) => deltaE(p, c) >= min)
  for (const c of buckets.filter((b) => !b.neutral).sort((p, q) => q.score - p.score)) {
    if (picked.length >= k - 1) break
    if (isDistinct(c)) picked.push(c)
  }

  const dominant = buckets.reduce((best, c) => (c.count > best.count ? c : best))
  if (isDistinct(dominant, 0.04)) picked.push(dominant)

  // Few colourful buckets (e.g. a greyscale photo)? Backfill with the most populous remaining ones.
  for (const c of [...buckets].sort((p, q) => q.count - p.count)) {
    if (picked.length >= k) break
    if (isDistinct(c, 0.04)) picked.push(c)
  }
  return picked.slice(0, k).map(({ l, a, b, count }) => ({ l, a, b, count }))
}
