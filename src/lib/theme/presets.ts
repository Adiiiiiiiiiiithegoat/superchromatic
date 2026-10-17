import type { Adjustments, Mode } from '../types'

/** How a preset reshapes one role colour: clamp lightness per mode, scale then clamp chroma. */
export interface ToneRule {
  l: Record<Mode, [number, number]>
  cScale: number
  c: [number, number]
}

export type CardStyle = 'flat' | 'elevated' | 'outline' | 'glass'
export type ShadowStyle = 'none' | 'soft' | 'crisp' | 'deep' | 'glass' | 'glow'
export type BorderStyle = 'hairline' | 'none' | 'light' | 'glow' | 'bold'

export type PresetId = 'minimal' | 'vibrant' | 'warm' | 'cool' | 'glass' | 'neon' | 'pastel' | 'mono'

/**
 * A preset is a *rule set*, not a list of colours: the same palette goes in, and the rules
 * decide how loud, light, tinted, rounded and shadowed the result is.
 */
export interface Preset {
  id: PresetId
  name: string
  tagline: string
  preferredMode?: Mode
  /** Background treatment. 'wallpaper' = the image is the page; 'grid' adds a line pattern. */
  background: 'solid' | 'tinted' | 'gradient' | 'wallpaper' | 'grid'
  bg: { l: Record<Mode, number>; cScale: number; cMax: number; hueFrom: 'background' | 'primary' }
  /** Strength (0–1) of the soft primary/accent wash behind the hero. */
  wash: number
  /** Pull every hue toward this range (Warm/Cool). */
  hueRange?: { range: [number, number]; weight: number }
  /** Monochrome: every role uses Primary's hue on a 10-step tonal scale. */
  monochrome?: boolean
  textHue: 'background' | 'primary'
  primary: ToneRule
  secondary: ToneRule
  accent: ToneRule
  card: CardStyle
  shadow: ShadowStyle
  border: BorderStyle
  buttonShadow: 'none' | 'lift' | 'glow'
  fonts: { heading: string; body: string; mono: string }
  defaults: Adjustments
}

const font = (name: string, fallback = 'system-ui, sans-serif') => `"${name}", ${fallback}`
const MONO = font('Geist Mono', 'ui-monospace, monospace')
const both = (lo: number, hi: number): Record<Mode, [number, number]> => ({ light: [lo, hi], dark: [lo, hi] })
const adj = (radius: number, rest: Partial<Adjustments> = {}): Adjustments => ({
  saturation: 100, brightness: 0, contrast: 100, blur: 10, overlay: 35, radius, ...rest,
})

export const PRESETS: Preset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    tagline: 'Quiet neutrals, hairlines',
    background: 'solid',
    bg: { l: { light: 0.98, dark: 0.16 }, cScale: 0.3, cMax: 0.01, hueFrom: 'background' },
    wash: 0.08,
    textHue: 'background',
    primary: { l: { light: [0.35, 0.55], dark: [0.68, 0.82] }, cScale: 0.7, c: [0, 0.14] },
    secondary: { l: { light: [0.92, 0.95], dark: [0.26, 0.3] }, cScale: 0.3, c: [0, 0.03] },
    accent: { l: { light: [0.5, 0.62], dark: [0.68, 0.8] }, cScale: 0.8, c: [0, 0.15] },
    card: 'flat',
    shadow: 'none',
    border: 'hairline',
    buttonShadow: 'none',
    fonts: { heading: font('Inter'), body: font('Inter'), mono: MONO },
    defaults: adj(8, { blur: 6, overlay: 20 }),
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    tagline: 'Loud colour, chunky shapes',
    background: 'gradient',
    bg: { l: { light: 0.95, dark: 0.19 }, cScale: 1, cMax: 0.06, hueFrom: 'primary' },
    wash: 0.32,
    textHue: 'primary',
    // Chroma scaled way up and floored high: clampChroma then lands it on the sRGB gamut edge.
    primary: { l: { light: [0.5, 0.62], dark: [0.62, 0.74] }, cScale: 1.8, c: [0.16, 0.4] },
    secondary: { l: { light: [0.86, 0.9], dark: [0.32, 0.38] }, cScale: 0.8, c: [0.06, 0.12] },
    accent: { l: { light: [0.62, 0.74], dark: [0.68, 0.8] }, cScale: 1.8, c: [0.16, 0.4] },
    card: 'elevated',
    shadow: 'deep',
    border: 'none',
    buttonShadow: 'lift',
    fonts: { heading: font('Space Grotesk'), body: font('Inter'), mono: MONO },
    defaults: adj(16, { saturation: 110, blur: 8, overlay: 25 }),
  },
  {
    id: 'warm',
    name: 'Warm',
    tagline: 'Ambers, terracotta, cream',
    background: 'tinted',
    bg: { l: { light: 0.965, dark: 0.19 }, cScale: 0.6, cMax: 0.03, hueFrom: 'background' },
    wash: 0.14,
    hueRange: { range: [30, 70], weight: 0.65 },
    textHue: 'background',
    primary: { l: { light: [0.48, 0.6], dark: [0.66, 0.76] }, cScale: 1.1, c: [0.08, 0.2] },
    secondary: { l: { light: [0.88, 0.92], dark: [0.3, 0.35] }, cScale: 0.6, c: [0.03, 0.07] },
    accent: { l: { light: [0.55, 0.68], dark: [0.68, 0.78] }, cScale: 1.1, c: [0.1, 0.2] },
    card: 'elevated',
    shadow: 'soft',
    border: 'hairline',
    buttonShadow: 'none',
    fonts: { heading: font('Fraunces', 'Georgia, serif'), body: font('Inter'), mono: MONO },
    defaults: adj(12, { blur: 10, overlay: 30 }),
  },
  {
    id: 'cool',
    name: 'Cool',
    tagline: 'Slate, steel, crisp edges',
    background: 'tinted',
    bg: { l: { light: 0.97, dark: 0.17 }, cScale: 0.6, cMax: 0.025, hueFrom: 'background' },
    wash: 0.12,
    hueRange: { range: [200, 260], weight: 0.65 },
    textHue: 'background',
    primary: { l: { light: [0.45, 0.58], dark: [0.66, 0.76] }, cScale: 1.1, c: [0.08, 0.2] },
    secondary: { l: { light: [0.9, 0.94], dark: [0.28, 0.33] }, cScale: 0.5, c: [0.02, 0.06] },
    accent: { l: { light: [0.55, 0.68], dark: [0.68, 0.8] }, cScale: 1.1, c: [0.1, 0.2] },
    card: 'elevated',
    shadow: 'crisp',
    border: 'hairline',
    buttonShadow: 'none',
    fonts: { heading: font('Manrope'), body: font('Manrope'), mono: MONO },
    defaults: adj(10, { blur: 10, overlay: 30 }),
  },
  {
    id: 'glass',
    name: 'Glass',
    tagline: 'Frosted cards on the wallpaper',
    background: 'wallpaper',
    bg: { l: { light: 0.92, dark: 0.2 }, cScale: 0.8, cMax: 0.05, hueFrom: 'background' },
    wash: 0,
    textHue: 'background',
    primary: { l: { light: [0.5, 0.62], dark: [0.68, 0.8] }, cScale: 1.2, c: [0.1, 0.25] },
    secondary: { l: { light: [0.95, 0.97], dark: [0.3, 0.35] }, cScale: 0.4, c: [0, 0.04] },
    accent: { l: { light: [0.6, 0.72], dark: [0.72, 0.82] }, cScale: 1.2, c: [0.1, 0.22] },
    card: 'glass',
    shadow: 'glass',
    border: 'light',
    buttonShadow: 'none',
    fonts: { heading: font('Sora'), body: font('Sora'), mono: MONO },
    defaults: adj(18, { blur: 20, overlay: 35 }),
  },
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Midnight grid, glowing edges',
    preferredMode: 'dark',
    background: 'grid',
    bg: { l: { light: 0.97, dark: 0.13 }, cScale: 0.6, cMax: 0.03, hueFrom: 'background' },
    wash: 0.16,
    textHue: 'background',
    primary: { l: { light: [0.55, 0.62], dark: [0.78, 0.86] }, cScale: 2, c: [0.2, 0.4] },
    secondary: { l: { light: [0.9, 0.93], dark: [0.22, 0.27] }, cScale: 0.6, c: [0.03, 0.07] },
    accent: { l: { light: [0.6, 0.68], dark: [0.8, 0.88] }, cScale: 2, c: [0.2, 0.4] },
    card: 'outline',
    shadow: 'glow',
    border: 'glow',
    buttonShadow: 'glow',
    fonts: { heading: font('Unbounded'), body: font('Inter'), mono: font('JetBrains Mono', 'ui-monospace, monospace') },
    defaults: adj(10, { saturation: 110, blur: 14, overlay: 45 }),
  },
  {
    id: 'pastel',
    name: 'Pastel',
    tagline: 'Soft, airy, rounded',
    preferredMode: 'light',
    background: 'tinted',
    bg: { l: { light: 0.975, dark: 0.2 }, cScale: 0.5, cMax: 0.03, hueFrom: 'primary' },
    wash: 0.25,
    textHue: 'primary',
    primary: { l: both(0.85, 0.93), cScale: 0.5, c: [0.05, 0.09] },
    secondary: { l: both(0.85, 0.93), cScale: 0.5, c: [0.05, 0.09] },
    accent: { l: both(0.85, 0.93), cScale: 0.5, c: [0.05, 0.09] },
    card: 'flat',
    shadow: 'soft',
    border: 'none',
    buttonShadow: 'none',
    fonts: { heading: font('DM Sans'), body: font('DM Sans'), mono: MONO },
    defaults: adj(24, { blur: 12, overlay: 40 }),
  },
  {
    id: 'mono',
    name: 'Monochrome',
    tagline: 'One hue, ten tones',
    background: 'solid',
    bg: { l: { light: 0.985, dark: 0.15 }, cScale: 0.5, cMax: 0.015, hueFrom: 'primary' },
    wash: 0.06,
    monochrome: true,
    textHue: 'primary',
    primary: { l: { light: [0.46, 0.46], dark: [0.76, 0.76] }, cScale: 0.9, c: [0, 0.16] },
    secondary: { l: { light: [0.85, 0.85], dark: [0.26, 0.26] }, cScale: 1, c: [0, 0.16] },
    accent: { l: { light: [0.36, 0.36], dark: [0.85, 0.85] }, cScale: 1, c: [0, 0.16] },
    card: 'outline',
    shadow: 'none',
    border: 'bold',
    buttonShadow: 'none',
    fonts: { heading: font('IBM Plex Sans'), body: font('IBM Plex Sans'), mono: MONO },
    defaults: adj(6, { blur: 8, overlay: 30 }),
  },
]

export const PRESETS_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p])) as Record<PresetId, Preset>
export const isPresetId = (v: unknown): v is PresetId => typeof v === 'string' && v in PRESETS_BY_ID
