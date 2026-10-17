import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { extractPalette } from '../lib/extract/client'
import { uid } from '../lib/extract/pixels'
import { generateTheme } from '../lib/theme/generate'
import { parseToOklch } from '../lib/theme/oklch'
import { PRESETS_BY_ID, type PresetId } from '../lib/theme/presets'
import { resolveRoles } from '../lib/theme/roles'
import type { ShareState } from '../lib/share/url'
import { deleteUpload, getUpload, listUploads, saveUpload } from '../lib/storage/imageStore'
import { ROLES, type A11yOptions, type Adjustments, type Mode, type Role, type RoleColors, type RoleOverrides, type Strategy, type Swatch, type SwatchSource } from '../lib/types'

export interface ImageRef {
  src: string
  name: string
  kind: 'sample' | 'upload'
  /** Uploads only: the IndexedDB key and upload time. */
  id?: string
  uploadedAt?: number
}

export interface RecentUpload {
  id: string
  name: string
  /** Object URL of the stored blob, revoked when the item leaves the list. */
  thumb: string
}

interface ThemeState {
  image: ImageRef | null
  status: 'idle' | 'extracting' | 'error'
  error: string | null
  strategy: Strategy
  k: number
  swatches: Swatch[]
  selected: string[]
  overrides: RoleOverrides
  presetId: PresetId
  adjustments: Adjustments
  mode: Mode
  a11y: A11yOptions
  hintDismissed: boolean
  toast: { id: number; message: string } | null
  recent: RecentUpload[]

  loadImage: (blob: Blob, image: ImageRef) => Promise<void>
  uploadFile: (file: File) => void
  reextract: () => Promise<void>
  openUpload: (id: string, keepPalette?: boolean) => Promise<boolean>
  removeUpload: (id: string) => Promise<void>
  refreshRecent: () => Promise<void>
  setStrategy: (s: Strategy) => void
  setK: (k: number) => void
  toggleSelected: (id: string) => void
  setRole: (role: Role, id: string | null) => void
  clearRoleFor: (id: string) => void
  shuffleRoles: () => void
  resetRoles: () => void
  addColor: (hex: string, source: SwatchSource) => void
  removeColor: (id: string) => void
  setPreset: (id: PresetId) => void
  setAdjustment: (key: keyof Adjustments, value: number) => void
  setMode: (mode: Mode) => void
  setAutoFix: (on: boolean) => void
  applyShare: (s: ShareState) => void
  dismissHint: () => void
  notify: (message: string) => void
}

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
export const MAX_BYTES = 15 * 1024 * 1024

// The current image's bytes live outside the store: not serialisable, only needed for re-extraction.
let currentBlob: Blob | null = null
let currentObjectUrl: string | null = null
let latestRequest = 0

/** localStorage that fails silently (private mode, quota, disabled storage). */
const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  setItem: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
  removeItem: (k: string) => { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      image: null,
      status: 'idle',
      error: null,
      strategy: 'kmeans',
      k: 8,
      swatches: [],
      selected: [],
      overrides: {},
      presetId: 'minimal',
      adjustments: PRESETS_BY_ID.minimal.defaults,
      mode: 'dark',
      a11y: { autoFix: true },
      hintDismissed: false,
      toast: null,
      recent: [],

      async loadImage(blob, image) {
        currentBlob = blob
        if (currentObjectUrl && currentObjectUrl !== image.src) URL.revokeObjectURL(currentObjectUrl)
        currentObjectUrl = image.kind === 'upload' ? image.src : null
        set({ image })
        await get().reextract()
      },

      uploadFile(file) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          set({ status: 'error', error: `“${file.name || 'That file'}” isn’t a PNG, JPG or WebP image. Try another one.` })
          return
        }
        if (file.size > MAX_BYTES) {
          set({ status: 'error', error: `That image is ${(file.size / 1048576).toFixed(1)} MB. The limit is 15 MB.` })
          return
        }
        void get().loadImage(file, { src: URL.createObjectURL(file), name: file.name || 'Pasted image', kind: 'upload', id: uid('upload'), uploadedAt: Date.now() })
      },

      async reextract() {
        const { image, strategy, k } = get()
        if (!image) return
        const id = ++latestRequest
        set({ status: 'extracting', error: null })
        try {
          currentBlob ??= await (await fetch(image.src)).blob()
          const blob = currentBlob
          const swatches = await extractPalette(blob, strategy, k)
          if (id !== latestRequest) return // a newer request superseded this one
          set({ swatches, selected: swatches.map((s) => s.id), overrides: {}, status: 'idle' })
          if (image.kind === 'upload' && image.id) {
            await saveUpload({ id: image.id, name: image.name, uploadedAt: image.uploadedAt ?? Date.now(), blob, swatches })
            await get().refreshRecent()
          }
        } catch (err) {
          if (id !== latestRequest) return
          set({ status: 'error', error: err instanceof Error ? err.message : 'Could not read that image.' })
        }
      },

      async openUpload(id, keepPalette = false) {
        const upload = await getUpload(id)
        if (!upload) return false
        latestRequest++ // cancel any extraction still running for the previous image
        currentBlob = upload.blob
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
        currentObjectUrl = URL.createObjectURL(upload.blob)
        const image: ImageRef = { src: currentObjectUrl, name: upload.name, kind: 'upload', id: upload.id, uploadedAt: upload.uploadedAt }
        const palette = { swatches: upload.swatches, selected: upload.swatches.map((s) => s.id), overrides: {} }
        set({ image, status: 'idle', error: null, ...(keepPalette ? {} : palette) })
        return true
      },

      async removeUpload(id) {
        await deleteUpload(id)
        await get().refreshRecent()
      },

      async refreshRecent() {
        const old = get().recent
        const uploads = await listUploads()
        const recent = uploads.map((u) => old.find((r) => r.id === u.id) ?? { id: u.id, name: u.name, thumb: URL.createObjectURL(u.blob) })
        for (const r of old) if (!recent.includes(r)) URL.revokeObjectURL(r.thumb)
        set({ recent })
      },

      setStrategy(strategy) {
        set({ strategy })
        void get().reextract()
      },
      setK(k) {
        set({ k })
        void get().reextract()
      },

      toggleSelected(id) {
        const { selected } = get()
        set({ selected: selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id] })
      },

      setRole(role, id) {
        const { selected } = get()
        set({ overrides: { ...get().overrides, [role]: id }, selected: id && !selected.includes(id) ? [...selected, id] : selected })
      },

      clearRoleFor(id) {
        const { assignment } = resolveRoles(get().swatches, get().selected, get().overrides)
        const overrides = { ...get().overrides }
        for (const role of ROLES) if (assignment[role] === id) overrides[role] = null
        set({ overrides })
      },

      shuffleRoles() {
        const { swatches, selected, overrides } = get()
        const { assignment } = resolveRoles(swatches, selected, overrides)
        const ids = ROLES.map((r) => assignment[r])
        // Fisher–Yates, retried until the order actually changes (when that's possible).
        let next = ids
        for (let tries = 0; tries < 8 && next.every((v, i) => v === ids[i]); tries++) {
          next = [...ids]
          for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[next[i], next[j]] = [next[j], next[i]]
          }
        }
        set({ overrides: Object.fromEntries(ROLES.map((r, i) => [r, next[i]])) })
      },

      resetRoles: () => set({ overrides: {} }),

      addColor(hex, source) {
        const swatch: Swatch = { id: uid(source), hex, oklch: parseToOklch(hex), population: 0, source }
        set({ swatches: [...get().swatches, swatch], selected: [...get().selected, swatch.id] })
      },

      removeColor(id) {
        const overrides = Object.fromEntries(Object.entries(get().overrides).filter(([, v]) => v !== id))
        set({ swatches: get().swatches.filter((s) => s.id !== id), selected: get().selected.filter((s) => s !== id), overrides })
      },

      setPreset(id) {
        const preset = PRESETS_BY_ID[id]
        set({ presetId: id, adjustments: preset.defaults, mode: preset.preferredMode ?? get().mode })
      },

      setAdjustment: (key, value) => set({ adjustments: { ...get().adjustments, [key]: value } }),
      setMode: (mode) => set({ mode }),
      setAutoFix: (autoFix) => set({ a11y: { autoFix } }),

      applyShare(s) {
        latestRequest++
        currentBlob = null
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
        currentObjectUrl = null
        set({ ...s, image: null, status: 'idle', error: null })
      },

      dismissHint: () => set({ hintDismissed: true }),
      notify: (message) => set({ toast: { id: Date.now(), message } }),
    }),
    {
      name: 'superchromatic:v1',
      // v1: dark became the default; existing sessions switch to it once, then the toggle is remembered again.
      version: 1,
      migrate: (saved, version) => (version < 1 ? { ...(saved as object), mode: 'dark' } : saved) as ThemeState,
      storage: createJSONStorage(() => safeStorage),
      // An upload's blob: URL dies with the tab; its bytes live in IndexedDB and get a fresh URL on load.
      partialize: (s) => ({
        image: s.image?.kind === 'upload' ? { ...s.image, src: '' } : s.image,
        strategy: s.strategy,
        k: s.k,
        swatches: s.swatches,
        selected: s.selected,
        overrides: s.overrides,
        presetId: s.presetId,
        adjustments: s.adjustments,
        mode: s.mode,
        a11y: s.a11y,
        hintDismissed: s.hintDismissed,
      }),
    },
  ),
)

/**
 * Remember the last call. Every component asking with the same inputs gets the same object back,
 * so one change computes roles and the theme once instead of once per component (~14 before).
 */
function memoLast<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | null = null
  let last: R
  return (...args) => {
    if (lastArgs?.every((a, i) => a === args[i])) return last
    lastArgs = args
    return (last = fn(...args))
  }
}
const resolveRolesOnce = memoLast(resolveRoles)
const generateThemeOnce = memoLast((colors: RoleColors, presetId: PresetId, adjustments: Adjustments, mode: Mode, a11y: A11yOptions) =>
  generateTheme(colors, PRESETS_BY_ID[presetId], adjustments, mode, a11y),
)

export function useRoles() {
  const swatches = useThemeStore((s) => s.swatches)
  const selected = useThemeStore((s) => s.selected)
  const overrides = useThemeStore((s) => s.overrides)
  return useMemo(() => resolveRolesOnce(swatches, selected, overrides), [swatches, selected, overrides])
}

/** The live theme: roles → generateTheme → CSS variables. */
export function useTheme() {
  const { colors } = useRoles()
  const presetId = useThemeStore((s) => s.presetId)
  const adjustments = useThemeStore((s) => s.adjustments)
  const mode = useThemeStore((s) => s.mode)
  const a11y = useThemeStore((s) => s.a11y)
  return useMemo(() => generateThemeOnce(colors, presetId, adjustments, mode, a11y), [colors, presetId, adjustments, mode, a11y])
}

/** CSS value for the wallpaper layer: the image, or a palette gradient when there is none (shared links). */
export function useWallpaper(): string {
  const src = useThemeStore((s) => s.image?.src)
  return src ? `url("${src}")` : 'var(--wallpaper-fallback)'
}
