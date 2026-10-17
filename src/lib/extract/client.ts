import type { Strategy, Swatch } from '../types'
import type { ExtractRequest, ExtractResponse } from './extract.worker'

let worker: Worker | null = null
let nextId = 0
const pending = new Map<number, { resolve: (s: Swatch[]) => void; reject: (e: Error) => void }>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./extract.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (e: MessageEvent<ExtractResponse>) => {
    const job = pending.get(e.data.id)
    if (!job) return
    pending.delete(e.data.id)
    if (e.data.ok) job.resolve(e.data.swatches)
    else job.reject(new Error(e.data.error))
  }
  return worker
}

/** Run palette extraction off the main thread. */
export function extractPalette(blob: Blob, strategy: Strategy, k: number): Promise<Swatch[]> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    const request: ExtractRequest = { id, blob, strategy, k }
    getWorker().postMessage(request)
  })
}
