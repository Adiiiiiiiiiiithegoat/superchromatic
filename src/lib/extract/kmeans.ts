import { type Cluster, deltaE, dist2 } from './pixels'

/** mulberry32: a tiny seeded PRNG. Same seed → same k-means++ picks → same palette for an image. */
export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface KMeansOptions {
  seed?: number
  maxIter?: number
  /** Clusters closer than this ΔE_ok are merged: they'd read as the same colour. */
  mergeBelow?: number
}

/** K-means in OKLab with k-means++ seeding. `px` is packed [L, a, b, …]. Sorted by population. */
export function kmeans(px: Float32Array, k = 8, { seed = 1337, maxIter = 20, mergeBelow = 0.04 }: KMeansOptions = {}): Cluster[] {
  const n = px.length / 3
  if (n === 0) return []
  const rand = mulberry32(seed)

  // k-means++: the first centre is a random pixel; each next centre is picked with probability
  // proportional to its squared distance from the nearest existing centre (spreads seeds out).
  const centres: number[] = []
  const first = Math.floor(rand() * n)
  centres.push(px[first * 3], px[first * 3 + 1], px[first * 3 + 2])
  const nearest = new Float64Array(n).fill(Infinity)
  while (centres.length / 3 < k) {
    const last = centres.length / 3 - 1
    let total = 0
    for (let i = 0; i < n; i++) {
      const d = dist2(px, i, centres, last)
      if (d < nearest[i]) nearest[i] = d
      total += nearest[i]
    }
    if (total === 0) break // every pixel already sits on a centre (e.g. a flat image)
    let r = rand() * total
    let pick = n - 1
    for (let i = 0; i < n; i++) {
      r -= nearest[i]
      if (r <= 0) {
        pick = i
        break
      }
    }
    centres.push(px[pick * 3], px[pick * 3 + 1], px[pick * 3 + 2])
  }

  // Lloyd iterations: assign each pixel to its nearest centre, move centres to their means.
  const kk = centres.length / 3
  const assignment = new Int32Array(n).fill(-1)
  const sums = new Float64Array(kk * 3)
  const counts = new Float64Array(kk)
  for (let iter = 0; iter < maxIter; iter++) {
    sums.fill(0)
    counts.fill(0)
    let changed = 0
    for (let i = 0; i < n; i++) {
      let best = 0
      let bestD = Infinity
      for (let j = 0; j < kk; j++) {
        const d = dist2(px, i, centres, j)
        if (d < bestD) {
          bestD = d
          best = j
        }
      }
      if (assignment[i] !== best) {
        assignment[i] = best
        changed++
      }
      sums[best * 3] += px[i * 3]
      sums[best * 3 + 1] += px[i * 3 + 1]
      sums[best * 3 + 2] += px[i * 3 + 2]
      counts[best]++
    }
    for (let j = 0; j < kk; j++) {
      if (counts[j] === 0) continue // an empty cluster keeps its old centre
      centres[j * 3] = sums[j * 3] / counts[j]
      centres[j * 3 + 1] = sums[j * 3 + 1] / counts[j]
      centres[j * 3 + 2] = sums[j * 3 + 2] / counts[j]
    }
    if (changed === 0) break // converged
  }

  const clusters: Cluster[] = []
  for (let j = 0; j < kk; j++) {
    if (counts[j] > 0) clusters.push({ l: centres[j * 3], a: centres[j * 3 + 1], b: centres[j * 3 + 2], count: counts[j] })
  }
  return mergeClose(clusters, mergeBelow).sort((p, q) => q.count - p.count)
}

/** Repeatedly merge the closest pair (population-weighted mean) while it's under the threshold. */
export function mergeClose(input: Cluster[], threshold: number): Cluster[] {
  const clusters = input.map((c) => ({ ...c }))
  for (;;) {
    let bi = -1
    let bj = -1
    let bestD = threshold
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = deltaE(clusters[i], clusters[j])
        if (d < bestD) {
          bestD = d
          bi = i
          bj = j
        }
      }
    }
    if (bi < 0) return clusters
    const p = clusters[bi]
    const q = clusters[bj]
    const n = p.count + q.count
    clusters[bi] = {
      l: (p.l * p.count + q.l * q.count) / n,
      a: (p.a * p.count + q.a * q.count) / n,
      b: (p.b * p.count + q.b * q.count) / n,
      count: n,
    }
    clusters.splice(bj, 1)
  }
}
