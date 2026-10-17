import { type Rgb, blend, fixLightness, rendered, rgbToHex, worstContrast } from '../a11y/contrast'
import type { A11yOptions, Adjustments, ContrastCheck, Mode, RoleColors, ThemeTokens } from '../types'
import { adjustColor, adjustSurface } from './adjust'
import { type Oklch, clamp, lerpHue, pullHue, snapToTonalScale, toHex } from './oklch'
import type { Preset, ToneRule } from './presets'

const WHITE: Oklch = { l: 1, c: 0, h: 0 }
const TEXT_TARGET = 4.5 // WCAG AA, body text
const UI_TARGET = 3 // WCAG AA, large text, UI borders and focus rings

/** Clamp lightness into the preset's band for this mode; scale chroma, then clamp it. */
function shapeTone(color: Oklch, rule: ToneRule, mode: Mode): Oklch {
  const [lMin, lMax] = rule.l[mode]
  const scaled = color.c * rule.cScale
  // A near-grey source has no meaningful hue, so don't force colour into it.
  const c = color.c < 0.015 ? scaled : clamp(scaled, rule.c[0], rule.c[1])
  return { l: clamp(color.l, lMin, lMax), c, h: color.h }
}

/** Text on a coloured fill: near-white or near-black (whichever contrasts more), tinted with the fill's hue. */
function inkFor(fill: Oklch): Oklch {
  const light = { l: 0.99, c: Math.min(fill.c, 0.02), h: fill.h }
  const dark = { l: 0.2, c: Math.min(fill.c * 0.5, 0.05), h: fill.h }
  const bg = [rendered(fill)]
  return worstContrast(rendered(light), bg).ratio >= worstContrast(rendered(dark), bg).ratio ? light : dark
}

/** Hover: step the fill's lightness away from its label, so the label gains contrast. */
const hoverOf = (fill: Oklch, ink: Oklch): Oklch => ({ ...fill, l: clamp(fill.l + (ink.l > fill.l ? -0.06 : 0.06)) })

const round = (v: number) => String(Math.round(v * 100) / 100)

/**
 * The theme engine. Pure: palette + preset rules + slider adjustments + mode in, a flat map of
 * CSS custom properties out. Every colour in the preview comes from here, so one change here
 * restyles every component consistently. All maths is in OKLCH; gamut mapping happens in toHex.
 */
export function generateTheme(palette: RoleColors, preset: Preset, adj: Adjustments, mode: Mode, a11y: A11yOptions): ThemeTokens {
  const light = mode === 'light'
  const glass = preset.card === 'glass'
  const pull = (c: Oklch): Oklch => (preset.hueRange ? { ...c, h: pullHue(c.h, preset.hueRange.range, preset.hueRange.weight) } : c)

  // ── 1. Roles, reshaped by the preset's rules ────────────────────────────────
  const shapedPrimary = shapeTone(pull(palette.primary), preset.primary, mode)
  // Monochrome: secondary/accent take Primary's hue and chroma, then every role snaps to its tonal scale.
  const asMono = (c: Oklch): Oklch => (preset.monochrome ? { l: c.l, c: palette.primary.c, h: shapedPrimary.h } : c)
  let primaryBase = shapedPrimary
  let secondaryBase = shapeTone(asMono(pull(palette.secondary)), preset.secondary, mode)
  let accentBase = shapeTone(asMono(pull(palette.accent)), preset.accent, mode)
  if (preset.monochrome) {
    primaryBase = snapToTonalScale(shapedPrimary, shapedPrimary)
    secondaryBase = snapToTonalScale(secondaryBase, shapedPrimary)
    accentBase = snapToTonalScale(accentBase, shapedPrimary)
  }

  // ── 2. Saturation and brightness sliders apply to every role ────────────────
  const primary = adjustColor(primaryBase, adj)
  const secondary = adjustColor(secondaryBase, adj)
  const accent = adjustColor(accentBase, adj)

  // ── 3. Surfaces and text: the background (or primary) hue at low chroma ─────
  const bgSource = preset.bg.hueFrom === 'primary' ? shapedPrimary : pull(palette.background)
  const bgChroma = Math.min(bgSource.c * preset.bg.cScale, preset.bg.cMax)
  const bgL = preset.bg.l[mode]
  const surfaceAt = (l: number, chromaMul = 1): Oklch => adjustSurface({ l: clamp(l), c: bgChroma * chromaMul, h: bgSource.h }, adj)
  const away = (d: number) => bgL + (light ? -d : d) // step away from the page colour, in the mode's direction

  const bg = surfaceAt(bgL)
  const surface = surfaceAt(away(0.025))
  const cardL = { flat: light ? bgL + 0.015 : bgL + 0.04, elevated: light ? 1 : bgL + 0.06, outline: bgL, glass: light ? 0.99 : 0.24 }[preset.card]
  const card = surfaceAt(cardL, glass ? 0.6 : 0.8)
  const inputBg = surfaceAt(light ? bgL + 0.02 : bgL + 0.04, 0.6)
  const border = surfaceAt(away(0.1), 1.5)
  let inputBorder = surfaceAt(away(0.36), 1.5)

  const fromPrimary = preset.textHue === 'primary'
  const textHue = fromPrimary ? shapedPrimary.h : bgSource.h
  const textChroma = fromPrimary ? Math.min(shapedPrimary.c * 0.35, 0.05) : Math.min(bgSource.c, 0.02)
  const ink = (l: number, chromaMul = 1): Oklch => adjustSurface({ l, c: textChroma * chromaMul, h: textHue }, adj)
  let text = ink(light ? 0.2 : 0.96)
  let textMuted = ink(light ? 0.45 : 0.76, 0.8)
  const textSubtle = ink(0.6, 0.6)

  let primaryText = inkFor(primary)
  let secondaryText = inkFor(secondary)
  let accentText = inkFor(accent)
  const badgeBg = adjustSurface({ l: light ? 0.93 : 0.3, c: Math.min(primaryBase.c * 0.45, 0.09), h: primary.h }, adj)
  let badgeText = adjustColor({ l: light ? 0.42 : 0.86, c: primaryBase.c, h: primary.h }, adj)
  let ring: Oklch = { ...primary, c: Math.max(primary.c, 0.08) }

  // Status colours: fixed semantic hues nudged 12% toward Primary so they belong to the palette.
  const avgChroma = (primary.c + secondary.c + accent.c) / 3
  const status = (hue: number, l: Record<Mode, number>): Oklch => ({ l: l[mode], c: clamp(avgChroma, 0.08, 0.17), h: lerpHue(hue, primary.h, 0.12) })
  const success = status(150, { light: 0.55, dark: 0.75 })
  const warning = status(75, { light: 0.68, dark: 0.8 })
  let danger = status(25, { light: 0.55, dark: 0.72 })

  // ── 4. What can actually sit behind text? ───────────────────────────────────
  // Opaque presets: the page colour. Glass: the overlay tint over the wallpaper, whose worst cases
  // are its darkest and lightest extracted colours. Translucent layers are composited over each.
  let overlayOpacity = adj.overlay / 100
  let cardAlpha = glass ? (light ? 0.55 : 0.5) : 1
  let inputAlpha = glass ? 0.75 : 1
  const surfaceAlpha = glass ? 0.2 : 1
  const extremes = [palette.darkest, palette.lightest].map(rendered)
  const basesAt = (opacity: number): Rgb[] => (glass ? extremes.map((e) => blend(rendered(bg), opacity, e)) : [rendered(bg)])
  const over = (c: Oklch, alpha: number, bases: Rgb[]) => bases.map((b) => blend(rendered(c), alpha, b))
  // The page includes alternate section surfaces and the peaks of the hero's colour wash.
  const pageSet = (bases: Rgb[]) => [...bases, ...over(surface, surfaceAlpha, bases), ...over(primary, preset.wash, bases), ...over(accent, preset.wash, bases)]

  // ── 5. Accessibility auto-fix ───────────────────────────────────────────────
  const solvable = (fgs: Oklch[], bgs: Rgb[]) => fgs.every((fg) => fixLightness(fg, bgs, TEXT_TARGET).ok)
  if (glass && a11y.autoFix) {
    // If no text lightness can pass on the see-through layers, make them more opaque in 5% steps.
    while (overlayOpacity < 1 && !solvable([text, textMuted], pageSet(basesAt(overlayOpacity)))) overlayOpacity = Math.min(1, overlayOpacity + 0.05)
    const page0 = pageSet(basesAt(overlayOpacity))
    while (cardAlpha < 1 && !solvable([text, textMuted], [...page0, ...over(card, cardAlpha, basesAt(overlayOpacity))])) cardAlpha = Math.min(1, cardAlpha + 0.05)
    while (inputAlpha < 1 && !solvable([text], [...page0, ...over(inputBg, inputAlpha, basesAt(overlayOpacity))])) inputAlpha = Math.min(1, inputAlpha + 0.05)
  }
  const overlayRaised = overlayOpacity > adj.overlay / 100 + 1e-6
  const cardRaised = glass && cardAlpha > (light ? 0.55 : 0.5) + 1e-6
  const inputRaised = glass && inputAlpha > 0.75 + 1e-6

  const bases = basesAt(overlayOpacity)
  const page = pageSet(bases)
  const onCard = over(card, cardAlpha, bases)
  const onInput = over(inputBg, inputAlpha, bases)

  const fixed = new Set<string>()
  const fix = (key: string, fg: Oklch, bgs: Rgb[], target: number): Oklch => {
    if (!a11y.autoFix) return fg
    const result = fixLightness(fg, bgs, target)
    if (result.fixed) fixed.add(key)
    return result.color
  }
  // One --text token is used on the page, cards and inputs, so it must pass on all of them at once.
  text = fix('text', text, [...page, ...onCard, ...onInput], TEXT_TARGET)
  textMuted = fix('muted', textMuted, [...page, ...onCard], TEXT_TARGET)
  primaryText = fix('primary', primaryText, [rendered(primary)], TEXT_TARGET)
  secondaryText = fix('secondary', secondaryText, [rendered(secondary)], TEXT_TARGET)
  accentText = fix('accent', accentText, [rendered(accent)], TEXT_TARGET)
  badgeText = fix('badge', badgeText, [rendered(badgeBg)], TEXT_TARGET)
  danger = fix('danger', danger, onCard, TEXT_TARGET)
  inputBorder = fix('inputBorder', inputBorder, onInput, UI_TARGET)
  ring = fix('ring', ring, page, UI_TARGET)

  const row = (id: string, label: string, fg: Oklch, bgs: Rgb[], target: number, wasFixed: boolean): ContrastCheck => {
    const worst = worstContrast(rendered(fg), bgs)
    return { id, label, fg: toHex(fg), bg: rgbToHex(worst.bg), ratio: worst.ratio, target, pass: worst.ratio >= target, fixed: wasFixed }
  }
  const checks: ContrastCheck[] = [
    row('text-bg', 'Text on background', text, page, TEXT_TARGET, fixed.has('text') || overlayRaised),
    row('muted-bg', 'Muted text on background', textMuted, page, TEXT_TARGET, fixed.has('muted') || overlayRaised),
    row('text-card', 'Text on card', text, onCard, TEXT_TARGET, fixed.has('text') || cardRaised),
    row('muted-card', 'Muted text on card', textMuted, onCard, TEXT_TARGET, fixed.has('muted') || cardRaised),
    row('primary', 'Primary button', primaryText, [rendered(primary)], TEXT_TARGET, fixed.has('primary')),
    row('secondary', 'Secondary button', secondaryText, [rendered(secondary)], TEXT_TARGET, fixed.has('secondary')),
    row('accent', 'Accent fill', accentText, [rendered(accent)], TEXT_TARGET, fixed.has('accent')),
    row('badge', 'Badge', badgeText, [rendered(badgeBg)], TEXT_TARGET, fixed.has('badge')),
    row('input-text', 'Input text', text, onInput, TEXT_TARGET, fixed.has('text') || inputRaised),
    row('error', 'Error message', danger, onCard, TEXT_TARGET, fixed.has('danger')),
    row('input-border', 'Input border', inputBorder, onInput, UI_TARGET, fixed.has('inputBorder')),
    row('ring', 'Focus ring', ring, page, UI_TARGET, fixed.has('ring')),
  ]

  // ── 6. Effects ──────────────────────────────────────────────────────────────
  const hex = (c: Oklch, alpha = 1) => toHex({ ...c, alpha })
  const shadowInk: Oklch = { l: 0.2, c: Math.min(bgSource.c, 0.03), h: bgSource.h }
  const sh = (a: number) => hex(shadowInk, clamp(a * (light ? 1 : 2.4)))
  const pa = (a: number) => hex(primary, a)
  const shadow = {
    none: 'none',
    soft: `0 1px 2px ${sh(0.05)}, 0 10px 30px -10px ${sh(0.18)}`,
    crisp: `0 1px 0 ${sh(0.06)}, 0 1px 3px ${sh(0.12)}, 0 14px 28px -14px ${sh(0.3)}`,
    deep: `0 2px 6px ${sh(0.08)}, 0 22px 44px -18px ${pa(0.55)}`,
    glass: `inset 0 1px 0 ${hex(WHITE, light ? 0.6 : 0.16)}, 0 12px 40px -12px ${sh(0.35)}`,
    glow: `0 0 0 1px ${pa(0.3)}, 0 0 32px -6px ${pa(0.55)}`,
  }[preset.shadow]
  const cardBorder = {
    hairline: hex(border),
    none: hex(card, cardAlpha),
    light: hex(WHITE, light ? 0.55 : 0.14),
    glow: pa(0.5),
    bold: hex(inputBorder),
  }[preset.border]
  const buttonShadow = { none: 'none', lift: `0 10px 24px -10px ${pa(0.7)}`, glow: `0 0 24px -2px ${pa(0.75)}` }[preset.buttonShadow]
  // Gradients reference the registered colour variables, so they animate along with them.
  const wash = Math.round(preset.wash * 100)
  const bgGradient = wash > 0
    ? `radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, var(--primary) ${wash}%, transparent) 0%, transparent 60%), ` +
      `radial-gradient(90% 80% at 100% 0%, color-mix(in oklab, var(--accent) ${wash}%, transparent) 0%, transparent 55%)`
    : 'none'
  const grid = preset.background === 'grid'

  const vars: Record<string, string> = {
    '--bg': hex(bg),
    '--bg-gradient': bgGradient,
    '--bg-pattern': grid ? 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)' : 'none',
    '--bg-pattern-size': grid ? '32px 32px' : 'auto',
    '--wallpaper-fallback': `radial-gradient(60% 80% at 80% 20%, ${toHex(palette.accent)} 0%, transparent 70%), linear-gradient(135deg, ${toHex(palette.background)} 0%, ${toHex(palette.primary)} 55%, ${toHex(palette.secondary)} 100%)`,
    '--surface': hex(surface, surfaceAlpha),
    '--card': hex(card, cardAlpha),
    '--card-border': cardBorder,
    '--overlay': hex(bg),
    '--text': hex(text),
    '--text-muted': hex(textMuted),
    '--text-subtle': hex(textSubtle),
    '--primary': hex(primary),
    '--primary-hover': hex(hoverOf(primary, primaryText)),
    '--primary-text': hex(primaryText),
    '--secondary': hex(secondary),
    '--secondary-hover': hex(hoverOf(secondary, secondaryText)),
    '--secondary-text': hex(secondaryText),
    '--accent': hex(accent),
    '--accent-text': hex(accentText),
    '--border': hex(border),
    '--input-bg': hex(inputBg, inputAlpha),
    '--input-border': hex(inputBorder),
    '--ring': hex(ring),
    '--badge-bg': hex(badgeBg),
    '--badge-text': hex(badgeText),
    '--success': hex(success),
    '--warning': hex(warning),
    '--danger': hex(danger),
    '--grid-line': pa(light ? 0.1 : 0.12),
    '--shadow': shadow,
    '--button-shadow': buttonShadow,
    '--glow': `0 0 28px -4px ${pa(0.65)}`,
    '--radius': `${adj.radius}px`,
    '--blur': `${adj.blur}px`,
    '--card-blur': glass ? `${adj.blur}px` : '0px',
    '--overlay-opacity': round(overlayOpacity),
    '--card-alpha': round(cardAlpha),
    '--border-width': preset.border === 'bold' ? '2px' : '1px',
    '--font-heading': preset.fonts.heading,
    '--font-body': preset.fonts.body,
    '--font-mono': preset.fonts.mono,
  }
  return { vars, checks }
}
