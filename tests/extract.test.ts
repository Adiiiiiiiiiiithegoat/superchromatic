import { describe, expect, it } from 'vitest'
import { kmeans, mulberry32 } from '../src/lib/extract/kmeans'
import { medianCut } from '../src/lib/extract/medianCut'
import { rgbaToOklab } from '../src/lib/extract/pixels'
import { vibrant } from '../src/lib/extract/vibrant'
import { ensureHues, matching, rainbow, soft } from '../src/lib/extract/moods'

/** A synthetic "photo": random noisy pixels around a few base colours. */
function noisyImage(n = 4000, seed = 7): Uint8ClampedArray {
  const rand = mulberry32(seed)
  const bases = [[230, 80, 40], [20, 40, 120], [240, 220, 200], [40, 160, 90], [250, 200, 30]]
  const data = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    const b = bases[Math.floor(rand() * bases.length)]
    for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] = b[ch] + (rand() - 0.5) * 60
    data[i * 4 + 3] = 255
  }
  return data
}

const flat = (n: number) => {
  const data = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) data.set([120, 60, 200, 255], i * 4)
  return data
}

describe('pixels', () => {
  it('skips pixels with alpha < 125', () => {
    const px = rgbaToOklab(new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 10, 0, 0, 255, 125]))
    expect(px.length).toBe(6)
  })
  it('converts white to L≈1 with no chroma', () => {
    const [l, a, b] = rgbaToOklab(new Uint8ClampedArray([255, 255, 255, 255]))
    expect(l).toBeCloseTo(1, 3)
    expect(Math.hypot(a, b)).toBeLessThan(1e-3)
  })
})

describe('k-means', () => {
  it('is deterministic for the same pixels', () => {
    const px = rgbaToOklab(noisyImage())
    expect(kmeans(px, 8)).toEqual(kmeans(px, 8))
  })
  it('returns clusters sorted by population, none closer than ΔE 0.04', () => {
    const out = kmeans(rgbaToOklab(noisyImage()), 8)
    for (let i = 1; i < out.length; i++) expect(out[i - 1].count).toBeGreaterThanOrEqual(out[i].count)
    for (const p of out) for (const q of out) if (p !== q) expect(Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b)).toBeGreaterThanOrEqual(0.04)
  })
  it('a flat single-colour image gives one colour', () => {
    expect(kmeans(rgbaToOklab(flat(500)), 8)).toHaveLength(1)
    expect(medianCut(rgbaToOklab(flat(500)), 8)).toHaveLength(1)
    expect(vibrant(rgbaToOklab(flat(500)), 8)).toHaveLength(1)
  })
})

describe('median cut', () => {
  it('returns exactly k colours', () => {
    const px = rgbaToOklab(noisyImage())
    for (const k of [5, 8, 10]) expect(medianCut(px, k)).toHaveLength(k)
  })
})

describe('vibrant', () => {
  it('returns at most k distinct colours and keeps the dominant one', () => {
    const out = vibrant(rgbaToOklab(noisyImage()), 6)
    expect(out.length).toBeGreaterThan(1)
    expect(out.length).toBeLessThanOrEqual(6)
  })
})

/** Like a dark F1 car photo: mostly near-black, a navy body, red and yellow livery, white text. */
function carImage(n = 6000, seed = 3): Uint8ClampedArray {
  const rand = mulberry32(seed)
  const bases: [number, number[]][] = [[0.44, [16, 16, 22]], [0.2, [15, 24, 55]], [0.16, [205, 25, 35]], [0.06, [240, 200, 25]], [0.06, [235, 235, 235]], [0.08, [90, 20, 25]]]
  const data = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    let r = rand()
    const base = bases.find(([share]) => (r -= share) < 0)?.[1] ?? bases[0][1]
    const shade = 0.6 + rand() * 0.8 // light and shadow across the bodywork
    for (let ch = 0; ch < 3; ch++) data[i * 4 + ch] = base[ch] * shade + (rand() - 0.5) * 16
    data[i * 4 + 3] = 255
  }
  return data
}
const hue = (c: { a: number; b: number }) => ((Math.atan2(c.b, c.a) * 180) / Math.PI + 360) % 360
const isBlue = (c: { a: number; b: number }) => Math.hypot(c.a, c.b) >= 0.04 && hue(c) > 230 && hue(c) < 300

describe('colour families', () => {
  const px = rgbaToOklab(carImage())
  it('reproduces the bug: median cut alone loses the navy', () => {
    expect(medianCut(px, 7).some(isBlue)).toBe(false)
  })
  it('a navy that covers a fifth of the picture always gets a swatch', () => {
    for (const [name, run] of [['kmeans', kmeans], ['median', medianCut], ['vibrant', vibrant]] as const) {
      for (const k of [5, 7, 10]) expect(ensureHues(px, run(px, k), k).some(isBlue), `${name} k=${k}`).toBe(true)
    }
  })
  it('keeps the palette at k colours', () => {
    expect(ensureHues(px, kmeans(px, 5), 5).length).toBeLessThanOrEqual(5)
  })
  it('rainbow spreads across every family present', () => {
    const out = rainbow(px, 8)
    expect(out.some(isBlue)).toBe(true)
    const hues = out.filter((c) => Math.hypot(c.a, c.b) >= 0.04).map(hue)
    expect(new Set(hues.map((h) => Math.floor(h / 30))).size).toBeGreaterThanOrEqual(3)
  })
  it('matching stays within one colour family', () => {
    const out = matching(px, 8)
    const main = hue(out.reduce((a, c) => (Math.hypot(c.a, c.b) > Math.hypot(a.a, a.b) ? c : a)))
    for (const c of out) expect(Math.abs(((hue(c) - main + 540) % 360) - 180)).toBeLessThanOrEqual(50)
  })
  it('soft is calmer than vibrant', () => {
    const avg = (cs: { a: number; b: number }[]) => cs.reduce((s, c) => s + Math.hypot(c.a, c.b), 0) / cs.length
    expect(avg(soft(px, 8))).toBeLessThan(avg(vibrant(px, 8)) * 0.7)
  })
})
