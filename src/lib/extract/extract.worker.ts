import type { Strategy, Swatch } from '../types'
import { kmeans } from './kmeans'
import { medianCut } from './medianCut'
import { ensureHues, matching, rainbow, soft } from './moods'
import { type Cluster, clustersToSwatches, rgbaToOklab } from './pixels'
import { vibrant } from './vibrant'

export interface ExtractRequest {
  id: number
  blob: Blob
  strategy: Strategy
  k: number
}

export type ExtractResponse = { id: number; ok: true; swatches: Swatch[] } | { id: number; ok: false; error: string }

// The three faithful strategies also guarantee every sizeable colour family a swatch.
const STRATEGIES: Record<Strategy, (px: Float32Array, k: number) => Cluster[]> = {
  kmeans: (px, k) => ensureHues(px, kmeans(px, k), k),
  median: (px, k) => ensureHues(px, medianCut(px, k), k),
  vibrant: (px, k) => ensureHues(px, vibrant(px, k), k),
  rainbow,
  matching,
  soft,
}

const MAX_SIDE = 200 // ≤ 40k pixels: plenty for a palette, fast to cluster

self.onmessage = async (event: MessageEvent<ExtractRequest>) => {
  const { id, blob, strategy, k } = event.data
  let reply: ExtractResponse
  try {
    const bitmap = await createImageBitmap(blob)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = new OffscreenCanvas(w, h).getContext('2d')
    if (!ctx) throw new Error('Canvas is unavailable in this browser.')
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    const px = rgbaToOklab(ctx.getImageData(0, 0, w, h).data)
    if (px.length === 0) throw new Error('This image is fully transparent.')
    const clusters = STRATEGIES[strategy](px, k)
    reply = { id, ok: true, swatches: clustersToSwatches(clusters, strategy) }
  } catch (err) {
    reply = { id, ok: false, error: err instanceof Error ? err.message : 'Could not read this image.' }
  }
  postMessage(reply)
}
