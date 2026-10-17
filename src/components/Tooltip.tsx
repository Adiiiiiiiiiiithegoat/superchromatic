import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { clamp } from '../lib/theme/oklch'

interface Tip {
  text: string
  x: number
  y: number
  below: boolean
}

const DELAY = 350

/**
 * Replaces the browser's native `title` tooltip app-wide with one styled like the rest of the UI.
 * The first time an element with `title` is hovered (mouse) or keyboard-focused, its text moves to
 * `data-tip` (so the native box never shows) and to `aria-description` (so screen readers keep it).
 */
export function Tooltips() {
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    let current: HTMLElement | null = null
    let timer = 0

    const hide = () => {
      clearTimeout(timer)
      current = null
      setTip(null)
    }

    const show = (target: EventTarget | null) => {
      const el = (target as Element | null)?.closest?.<HTMLElement>('[title], [data-tip]')
      if (!el || el === current) return
      if (el.title) {
        el.dataset.tip = el.title
        el.removeAttribute('title')
        if (!el.getAttribute('aria-label')?.includes(el.dataset.tip)) el.setAttribute('aria-description', el.dataset.tip)
      }
      clearTimeout(timer)
      current = el
      setTip(null)
      timer = window.setTimeout(() => {
        if (current !== el || !el.isConnected || !el.dataset.tip) return
        const r = el.getBoundingClientRect()
        const below = r.top < 48
        setTip({ text: el.dataset.tip, x: clamp(r.left + r.width / 2, 136, innerWidth - 136), y: below ? r.bottom + 8 : r.top - 8, below })
      }, DELAY)
    }

    const onOver = (e: PointerEvent) => e.pointerType === 'mouse' && show(e.target)
    const onOut = (e: PointerEvent) => current && !current.contains(e.relatedTarget as Node | null) && hide()
    const onFocus = (e: FocusEvent) => (e.target as Element).matches?.(':focus-visible') && show(e.target)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide()

    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    document.addEventListener('pointerdown', hide)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', hide)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', hide, true)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerdown', hide)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', hide, true)
    }
  }, [])

  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          key={`${tip.text}${tip.x}${tip.y}`}
          role="tooltip"
          data-testid="tooltip"
          initial={{ opacity: 0, y: tip.below ? -4 : 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          className="pointer-events-none fixed z-[100] w-max max-w-[260px] rounded-lg border border-line-strong bg-raised/95 px-2.5 py-1.5 text-[12px] leading-snug text-ink shadow-[0_8px_24px_-8px_rgb(0_0_0/0.45)] backdrop-blur-md"
          style={{ left: tip.x, top: tip.y, translateX: '-50%', translateY: tip.below ? '0%' : '-100%' }}
        >
          {tip.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
