import type { Cluster } from './pixels'

interface Box {
  start: number
  end: number
  channel: number
  range: number
}

/**
 * Median cut in OKLab: start with one box holding every pixel; repeatedly take the box whose
 * widest channel is widest overall, sort it along that channel and split at the median,
 * until there are k boxes. Each box's mean is a palette colour.
 */
export function medianCut(px: Float32Array, k = 8): Cluster[] {
  const n = px.length / 3
  if (n === 0) return []
  const idx = new Uint32Array(n)
  for (let i = 0; i < n; i++) idx[i] = i

  const measure = (start: number, end: number): Box => {
    const lo = [Infinity, Infinity, Infinity]
    const hi = [-Infinity, -Infinity, -Infinity]
    for (let i = start; i < end; i++) {
      for (let ch = 0; ch < 3; ch++) {
        const v = px[idx[i] * 3 + ch]
        if (v < lo[ch]) lo[ch] = v
        if (v > hi[ch]) hi[ch] = v
      }
    }
    const ranges = hi.map((h, ch) => h - lo[ch])
    const channel = ranges.indexOf(Math.max(...ranges))
    return { start, end, channel, range: ranges[channel] }
  }

  const boxes = [measure(0, n)]
  while (boxes.length < k) {
    let pick = -1
    for (let b = 0; b < boxes.length; b++) {
      const box = boxes[b]
      if (box.end - box.start >= 2 && box.range > 0 && (pick < 0 || box.range > boxes[pick].range)) pick = b
    }
    if (pick < 0) break // nothing left to split (fewer distinct colours than k)
    const { start, end, channel } = boxes[pick]
    idx.subarray(start, end).sort((x, y) => px[x * 3 + channel] - px[y * 3 + channel])
    const mid = (start + end) >> 1
    boxes.splice(pick, 1, measure(start, mid), measure(mid, end))
  }

  return boxes
    .map(({ start, end }) => {
      let l = 0, a = 0, b = 0
      for (let i = start; i < end; i++) {
        l += px[idx[i] * 3]
        a += px[idx[i] * 3 + 1]
        b += px[idx[i] * 3 + 2]
      }
      const count = end - start
      return { l: l / count, a: a / count, b: b / count, count }
    })
    .sort((p, q) => q.count - p.count)
}
