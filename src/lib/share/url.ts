import { parseToOklch } from '../theme/oklch'
import { isPresetId, type PresetId } from '../theme/presets'
import { ROLES, type Adjustments, type Mode, type RoleOverrides, type Swatch, type SwatchSource } from '../types'
import { uid } from '../extract/pixels'

/** Compact payload stored in the URL hash. The wallpaper itself is not included. */
interface SharePayload {
  v: 1
  c: [hex: string, population: number, source: SwatchSource][]
  s: number[] // selected swatch indices
  r: Partial<Record<string, number | null>> // role overrides as swatch indices
  p: PresetId
  a: Adjustments
  m: Mode
}

export interface ShareState {
  swatches: Swatch[]
  selected: string[]
  overrides: RoleOverrides
  presetId: PresetId
  adjustments: Adjustments
  mode: Mode
}

const toBase64Url = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromBase64Url = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0)))

export function encodeShare(state: ShareState): string {
  const index = new Map(state.swatches.map((s, i) => [s.id, i]))
  const payload: SharePayload = {
    v: 1,
    c: state.swatches.map((s) => [s.hex.slice(1), Math.round(s.population * 1000) / 1000, s.source]),
    s: state.selected.map((id) => index.get(id)).filter((i): i is number => i !== undefined),
    r: Object.fromEntries(Object.entries(state.overrides).map(([role, id]) => [role, id === null ? null : (index.get(id ?? '') ?? null)])),
    p: state.presetId,
    a: state.adjustments,
    m: state.mode,
  }
  return toBase64Url(JSON.stringify(payload))
}

export function shareUrl(state: ShareState): string {
  return `${location.origin}${location.pathname}#theme=${encodeShare(state)}`
}

/** Parse a shared hash. Returns null for anything malformed rather than throwing. */
export function decodeShare(hash: string): ShareState | null {
  const match = /theme=([\w-]+)/.exec(hash)
  if (!match) return null
  try {
    const p = JSON.parse(fromBase64Url(match[1])) as SharePayload
    if (p.v !== 1 || !Array.isArray(p.c) || !isPresetId(p.p)) return null
    const swatches: Swatch[] = p.c.map(([hex, population, source]) => ({
      id: uid('shared'),
      hex: `#${hex}`,
      oklch: parseToOklch(`#${hex}`),
      population: Number(population) || 0,
      source: source ?? 'custom',
    }))
    const overrides: RoleOverrides = {}
    for (const role of ROLES) {
      const i = p.r?.[role]
      if (i === null) overrides[role] = null
      else if (typeof i === 'number' && swatches[i]) overrides[role] = swatches[i].id
    }
    return {
      swatches,
      selected: (p.s ?? []).filter((i) => swatches[i]).map((i) => swatches[i].id),
      overrides,
      presetId: p.p,
      adjustments: p.a,
      mode: p.m === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return null
  }
}
