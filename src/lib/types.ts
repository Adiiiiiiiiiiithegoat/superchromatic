import type { Oklch } from './theme/oklch'

export type Strategy = 'kmeans' | 'median' | 'vibrant' | 'rainbow' | 'matching' | 'soft'
export type SwatchSource = Strategy | 'picked' | 'custom'

export interface Swatch {
  id: string
  hex: string
  oklch: Oklch
  /** Share of the (downscaled) image's opaque pixels, 0–1. Picked/custom colours are 0. */
  population: number
  source: SwatchSource
}

export type Role = 'primary' | 'secondary' | 'accent' | 'background'
export const ROLES: Role[] = ['primary', 'secondary', 'accent', 'background']

/** Swatch id per role, or null when the role is derived from Primary. */
export type RoleAssignment = Record<Role, string | null>
/** User overrides: a swatch id, or null to force "derive this role". */
export type RoleOverrides = Partial<Record<Role, string | null>>

export interface RoleColors extends Record<Role, Oklch> {
  /** Darkest/lightest extracted colours: the worst cases a translucent surface can sit on. */
  darkest: Oklch
  lightest: Oklch
}

export type Mode = 'light' | 'dark'

export interface Adjustments {
  saturation: number // 0–200 (%)
  brightness: number // −50…+50
  contrast: number // 0–200 (%)
  blur: number // 0–40 px
  overlay: number // 0–100 (%)
  radius: number // 0–28 px
}

export interface A11yOptions {
  autoFix: boolean
}

export interface ContrastCheck {
  id: string
  label: string
  fg: string
  /** The worst-case background the foreground was measured against. */
  bg: string
  ratio: number
  target: number
  pass: boolean
  fixed: boolean
}

export interface ThemeTokens {
  /** Flat map of CSS custom properties. The only source of colour for the preview. */
  vars: Record<string, string>
  checks: ContrastCheck[]
}
