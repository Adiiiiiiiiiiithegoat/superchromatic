import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { PRESETS_BY_ID } from '../lib/theme/presets'
import type { Mode } from '../lib/types'
import { COLOR_TOKENS } from '../lib/theme/tokens'
import { useTheme, useThemeStore, useWallpaper } from '../store/useThemeStore'
import { type Device, PreviewToolbar } from './PreviewToolbar'
import './preview.css'
import { Features } from './sections/Features'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { Navbar } from './sections/Navbar'
import { Pricing } from './sections/Pricing'
import { Showcase } from './sections/Showcase'
import { SignupForm } from './sections/SignupForm'
import { Stats } from './sections/Stats'

const WIDTHS: Record<Device, string> = { desktop: '100%', tablet: '834px', mobile: '390px' }
const TRANSITION_PROPERTY = COLOR_TOKENS.join(', ')

/**
 * The value from before the latest burst of changes: a theme counts as "settled" once it has
 * been stable for `delay` ms. Powers the hold-to-compare button.
 */
function useSettledPrevious<T>(value: T, delay = 700): T {
  const settled = useRef(value)
  const [previous, setPrevious] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => {
      if (settled.current !== value) {
        setPrevious(settled.current)
        settled.current = value
      }
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return settled.current !== value ? settled.current : previous
}

/** The Orbit site. Its only styling input is the token map, set as CSS variables on the root. */
export function PreviewSite({ vars, glass, mode, wallpaper, compact }: { vars: Record<string, string>; glass: boolean; mode: Mode; wallpaper: string; compact: boolean }) {
  // color-scheme makes native controls (radios, selects, scrollbars) match the theme, not the app chrome.
  const style = { ...vars, '--wallpaper': wallpaper, colorScheme: mode, transitionProperty: TRANSITION_PROPERTY } as CSSProperties
  return (
    <div data-testid="preview-root" className="pv-root" style={style}>
      {glass && (
        <div aria-hidden className="pv-layer">
          <div className="pv-wallpaper" />
          <div className="pv-overlay" />
        </div>
      )}
      <div className="pv-scroll" tabIndex={-1}>
        <div className={`pv-page @container ${compact ? 'pb-32' : ''}`}>
          <Navbar />
          <main>
            <Hero glass={glass} />
            <Stats />
            <Features />
            <section aria-label="Sign up and dashboard" data-pv-section="signup" className="mx-auto grid max-w-6xl items-start gap-5 px-5 py-16 @4xl:grid-cols-[1fr_1.1fr]">
              <SignupForm />
              <Showcase />
            </section>
            <Pricing />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export function Preview({ compact }: { compact: boolean }) {
  const theme = useTheme()
  const presetId = useThemeStore((s) => s.presetId)
  const mode = useThemeStore((s) => s.mode)
  const wallpaper = useWallpaper()
  const [device, setDevice] = useState<Device>('desktop')
  const [comparing, setComparing] = useState(false)
  const glass = PRESETS_BY_ID[presetId].background === 'wallpaper'
  const current = useMemo(() => ({ vars: theme.vars, glass, mode }), [theme.vars, glass, mode])
  const previous = useSettledPrevious(current)
  const shown = comparing ? previous : current

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PreviewToolbar device={device} onDevice={setDevice} compact={compact} comparing={comparing} onCompare={setComparing} />
      <div className="relative min-h-0 flex-1 overflow-hidden sm:p-3" aria-label="Theme preview" role="region">
        <div
          key={device}
          className="mx-auto h-full max-w-full min-w-[320px] overflow-hidden sm:rounded-xl sm:border sm:border-line"
          style={{ width: compact ? '100%' : WIDTHS[device], resize: compact ? 'none' : 'horizontal' }}
        >
          <PreviewSite vars={shown.vars} glass={shown.glass} mode={shown.mode} wallpaper={wallpaper} compact={compact} />
        </div>
      </div>
    </div>
  )
}
