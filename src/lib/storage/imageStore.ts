import type { Swatch } from '../types'

/** An uploaded wallpaper kept across reloads: the original bytes plus the palette extracted from it. */
export interface StoredUpload {
  id: string
  name: string
  uploadedAt: number
  blob: Blob
  swatches: Swatch[]
}

const STORE = 'uploads'
const KEEP = 5

// Every export swallows errors: private browsing, blocked storage and a full quota all mean "no history", never a crash.
let db: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  return (db ??= new Promise((resolve, reject) => {
    const req = indexedDB.open('superchromatic', 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB blocked'))
  }))
}

/** One request in its own transaction; resolves when the transaction commits (so quota errors surface). */
async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const tx = (await open()).transaction(STORE, mode)
  const req = fn(tx.objectStore(STORE))
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = tx.onabort = () => reject(tx.error ?? req.error)
  })
}

/** Newest first. */
export async function listUploads(): Promise<StoredUpload[]> {
  try {
    const all = await run('readonly', (s) => s.getAll() as IDBRequest<StoredUpload[]>)
    return all.sort((a, b) => b.uploadedAt - a.uploadedAt)
  } catch {
    return []
  }
}

export async function getUpload(id: string): Promise<StoredUpload | null> {
  try {
    return (await run('readonly', (s) => s.get(id) as IDBRequest<StoredUpload | undefined>)) ?? null
  } catch {
    return null
  }
}

/** Insert or update, then drop everything past the newest five. */
export async function saveUpload(upload: StoredUpload): Promise<void> {
  try {
    await run('readwrite', (s) => s.put(upload))
    for (const old of (await listUploads()).slice(KEEP)) await deleteUpload(old.id)
  } catch {
    /* storage unavailable: the upload just isn't remembered */
  }
}

export async function deleteUpload(id: string): Promise<void> {
  try {
    await run('readwrite', (s) => s.delete(id))
  } catch {
    /* ignore */
  }
}
