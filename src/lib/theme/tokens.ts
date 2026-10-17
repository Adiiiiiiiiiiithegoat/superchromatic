/**
 * Every colour token the generator emits. Each one is registered with CSS @property
 * (syntax <color>) in index.css so the browser can interpolate it when the theme changes.
 */
export const COLOR_TOKENS = [
  '--bg', '--surface', '--card', '--card-border', '--overlay',
  '--text', '--text-muted', '--text-subtle',
  '--primary', '--primary-hover', '--primary-text',
  '--secondary', '--secondary-hover', '--secondary-text',
  '--accent', '--accent-text',
  '--border', '--input-bg', '--input-border', '--ring',
  '--badge-bg', '--badge-text',
  '--success', '--warning', '--danger',
  '--grid-line',
] as const

/** Non-colour tokens: gradients, shadows, sizes and fonts. */
export const EFFECT_TOKENS = [
  '--bg-gradient', '--bg-pattern', '--bg-pattern-size', '--wallpaper-fallback',
  '--shadow', '--button-shadow', '--glow',
  '--radius', '--blur', '--card-blur', '--overlay-opacity', '--card-alpha', '--border-width',
  '--font-heading', '--font-body', '--font-mono',
] as const

export const ALL_TOKENS = [...COLOR_TOKENS, ...EFFECT_TOKENS]
