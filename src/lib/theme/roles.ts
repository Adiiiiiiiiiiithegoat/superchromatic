import { ROLES, type Role, type RoleAssignment, type RoleColors, type RoleOverrides, type Swatch } from '../types'
import { type Oklch, hueDistance, wrapHue } from './oklch'

/** How "brandable" a colour is: colourful and present. Picked colours get a small floor. */
export const score = (s: Swatch) => s.oklch.c * Math.sqrt(Math.max(s.population, 0.02))

const DECENT_CHROMA = 0.05

/**
 * Auto-assign roles from the selected swatches:
 * Background = most populous · Primary = best score · Accent = furthest hue from Primary with
 * decent chroma · Secondary = next best score. Anything missing stays null and is derived.
 */
export function autoAssign(selected: Swatch[]): RoleAssignment {
  const out: RoleAssignment = { primary: null, secondary: null, accent: null, background: null }
  if (selected.length === 0) return out
  if (selected.length === 1) return { ...out, primary: selected[0].id }

  const pool = [...selected]
  const take = (s: Swatch) => pool.splice(pool.indexOf(s), 1)[0].id

  out.background = take(pool.reduce((a, b) => (b.population > a.population ? b : a)))
  const primary = pool.reduce((a, b) => (score(b) > score(a) ? b : a))
  out.primary = take(primary)

  const accentPool = pool.filter((s) => s.oklch.c >= DECENT_CHROMA)
  if (accentPool.length) {
    out.accent = take(accentPool.reduce((a, b) => (hueDistance(b.oklch.h, primary.oklch.h) > hueDistance(a.oklch.h, primary.oklch.h) ? b : a)))
  }
  if (pool.length) out.secondary = take(pool.reduce((a, b) => (score(b) > score(a) ? b : a)))
  return out
}

const FALLBACK_PRIMARY: Oklch = { l: 0.55, c: 0.15, h: 265 }

/** Fill roles nobody picked by rotating Primary's hue in OKLCH. */
export function deriveRole(role: Role, primary: Oklch): Oklch {
  switch (role) {
    case 'primary':
      return primary
    case 'secondary': // analogous: a close neighbour on the wheel, a bit calmer
      return { l: primary.l, c: primary.c * 0.7, h: wrapHue(primary.h + 30) }
    case 'accent': // split-complementary: far enough to pop, not a clashing opposite
      return { l: Math.min(0.75, primary.l + 0.05), c: Math.max(primary.c, 0.1), h: wrapHue(primary.h + 150) }
    case 'background':
      return { l: 0.95, c: Math.min(primary.c, 0.02), h: primary.h }
  }
}

export interface ResolvedRoles {
  assignment: RoleAssignment
  colors: RoleColors
}

/** Combine auto-assignment with user overrides and turn the result into colours. */
export function resolveRoles(swatches: Swatch[], selectedIds: string[], overrides: RoleOverrides): ResolvedRoles {
  const byId = new Map(swatches.map((s) => [s.id, s]))
  const selected = selectedIds.map((id) => byId.get(id)).filter((s): s is Swatch => !!s)
  const assignment = autoAssign(selected)
  for (const role of ROLES) {
    const o = overrides[role]
    if (o === null || (o !== undefined && byId.has(o))) assignment[role] = o
  }

  const colorOf = (role: Role) => {
    const id = assignment[role]
    return id ? byId.get(id)!.oklch : null
  }
  const anyColour = swatches.length ? swatches.reduce((a, b) => (score(b) > score(a) ? b : a)).oklch : FALLBACK_PRIMARY
  const primary = colorOf('primary') ?? anyColour
  const pick = (role: Role) => colorOf(role) ?? deriveRole(role, primary)

  const all = swatches.length ? swatches.map((s) => s.oklch) : [pick('background'), primary]
  const darkest = all.reduce((a, b) => (b.l < a.l ? b : a))
  const lightest = all.reduce((a, b) => (b.l > a.l ? b : a))

  return {
    assignment,
    colors: { primary, secondary: pick('secondary'), accent: pick('accent'), background: pick('background'), darkest, lightest },
  }
}
