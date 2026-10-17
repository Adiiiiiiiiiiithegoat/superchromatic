import type { Strategy, Swatch } from '../types'
import { kmeans } from './kmeans'
import { medianCut } from './medianCut'
import { clustersToSwatches, rgbaToOklab } from './pixels'
import { vibrant } from './vibrant'

export interface ExtractRequest {
  id: number
  blob: Blob
  strategy: Strategy
  k: number
}

export type ExtractResponse = { id: number; ok: true; swatches: Swatch[] } | { id: number; ok: false; error: string }

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
    const clusters = strategy === 'median' ? medianCut(px, k) : strategy === 'vibrant' ? vibrant(px, k) : kmeans(px, k)
    reply = { id, ok: true, swatches: clustersToSwatches(clusters, strategy) }
  } catch (err) {
    reply = { id, ok: false, error: err instanceof Error ? err.message : 'Could not read this image.' }
  }
  postMessage(reply)
}
