import { animate, motion, useDragControls, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SECTIONS, SHEET_TABS } from './ControlsPanel'

type Snap = 'peek' | 'half' | 'full'
const SNAP_ORDER: Snap[] = ['peek', 'half', 'full']
const HEADER = 96 // handle + tab bar

function useViewportHeight() {
  const [h, setH] = useState(() => window.innerHeight)
  useEffect(() => {
    const onResize = () => setH(window.innerHeight)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return h
}

/** Mobile controls: a sheet that can be dragged between peek, half and full heights. */
export function BottomSheet() {
  const vh = useViewportHeight()
  const heights: Record<Snap, number> = { peek: 112, half: Math.round(vh * 0.5), full: Math.round(vh * 0.88) }
  const full = heights.full
  const [snap, setSnap] = useState<Snap>('half')
  const [tab, setTab] = useState<(typeof SHEET_TABS)[number]>('Image')
  const reduceMotion = useReducedMotion()
  const controls = useDragControls()
  const y = useMotionValue(full - heights[snap])

  useEffect(() => {
    const target = full - heights[snap]
    if (reduceMotion) y.set(target)
    else animate(y, target, { type: 'spring', stiffness: 380, damping: 38 })
  }, [snap, full, reduceMotion])

  const settle = (velocity: number) => {
    const visible = full - (y.get() + velocity * 0.15)
    const nearest = SNAP_ORDER.reduce((a, b) => (Math.abs(heights[b] - visible) < Math.abs(heights[a] - visible) ? b : a))
    setSnap(nearest)
    // Same snap as before? The effect won't re-run, so spring back explicitly.
    animate(y, full - heights[nearest], reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 38 })
  }

  const next = SNAP_ORDER[(SNAP_ORDER.indexOf(snap) + 1) % SNAP_ORDER.length]

  return (
    <motion.section
      aria-label="Theme controls"
      className="fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-line bg-panel shadow-[0_-12px_40px_rgba(0,0,0,0.35)]"
      style={{ height: full, y }}
      drag="y"
      dragListener={false}
      dragControls={controls}
      dragConstraints={{ top: 0, bottom: full - heights.peek }}
      dragElastic={0.08}
      onDragEnd={(_, info) => settle(info.velocity.y)}
    >
      <div className="touch-none" onPointerDown={(e) => controls.start(e)}>
        <button
          type="button"
          onClick={() => setSnap(next)}
          aria-label={`Controls sheet is ${snap === 'peek' ? 'collapsed' : snap === 'half' ? 'half open' : 'fully open'}. Activate to ${next === 'peek' ? 'collapse' : 'expand'}.`}
          className="flex h-8 w-full items-center justify-center"
        >
          <span className="h-1.5 w-10 rounded-full bg-line-strong" />
        </button>
        <div role="tablist" aria-label="Control groups" className="flex gap-1 overflow-x-auto px-2 pb-2">
          {SHEET_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`sheet-tab-${t}`}
              aria-selected={tab === t}
              aria-controls="sheet-panel"
              onClick={() => {
                setTab(t)
                if (snap === 'peek') setSnap('half')
              }}
              className={`h-11 min-w-0 flex-1 rounded-lg px-2 text-[13px] ${tab === t ? 'bg-raised font-medium text-ink ring-1 ring-line-strong' : 'text-ink-muted'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div
        id="sheet-panel"
        role="tabpanel"
        aria-labelledby={`sheet-tab-${tab}`}
        className="overflow-y-auto overscroll-contain border-t border-line px-4 pt-3 pb-8"
        style={{ height: Math.max(0, heights[snap] - HEADER) }}
      >
        {SECTIONS.filter((s) => s.tab === tab).map(({ id, title, Component }) => (
          <div key={id} className="mb-6">
            <h2 className="mb-2 text-[13px] font-semibold">{title}</h2>
            <Component />
          </div>
        ))}
      </div>
    </motion.section>
  )
}
