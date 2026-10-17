import { MotionConfig } from 'motion/react'
import { type PointerEvent, useEffect, useState, useSyncExternalStore } from 'react'
import { BottomSheet } from './components/controls/BottomSheet'
import { ControlsPanel } from './components/controls/ControlsPanel'
import { loadSample } from './components/controls/UploadZone'
import { Toast } from './components/Toast'
import { TopBar } from './components/TopBar'
import { SAMPLES } from './lib/samples'
import { decodeShare } from './lib/share/url'
import { clamp } from './lib/theme/oklch'
import { Preview } from './preview/Preview'
import { useThemeStore } from './store/useThemeStore'

type Layout = 'desktop' | 'tablet' | 'mobile'

function useLayout(): Layout {
  const query = (q: string) => window.matchMedia(q).matches
  const get = (): Layout => (query('(min-width: 1024px)') ? 'desktop' : query('(min-width: 640px)') ? 'tablet' : 'mobile')
  return useSyncExternalStore((onChange) => {
    window.addEventListener('resize', onChange)
    return () => window.removeEventListener('resize', onChange)
  }, get)
}

/** First load: a shared link wins, then the last session (persisted), then the first sample. */
function useStartup() {
  useEffect(() => {
    const store = useThemeStore.getState()
    const shared = decodeShare(location.hash)
    if (shared) {
      store.applyShare(shared)
      history.replaceState(null, '', location.pathname + location.search)
      store.notify('Theme loaded from link. Wallpaper not included, showing a palette gradient.')
    } else if (store.swatches.length === 0) {
      void loadSample(SAMPLES[0])
    }
  }, [])
}

/** Ctrl+V anywhere pastes an image from the clipboard. */
function usePasteUpload() {
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) {
        e.preventDefault()
        useThemeStore.getState().uploadFile(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])
}

/** Tablet: the controls live in a resizable drawer that pushes the preview aside. */
function Drawer() {
  const [width, setWidth] = useState(340)
  const max = () => Math.min(520, window.innerWidth - 300)
  const onMove = (e: PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setWidth(clamp(e.clientX, 280, max()))
  }
  return (
    <aside id="controls-drawer" aria-label="Theme controls" className="relative shrink-0 border-r border-line bg-panel" style={{ width }}>
      <div className="h-full overflow-y-auto">
        <ControlsPanel />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize controls"
        aria-valuenow={width}
        aria-valuemin={280}
        aria-valuemax={520}
        tabIndex={0}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={onMove}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setWidth((w) => clamp(w - 20, 280, max()))
          if (e.key === 'ArrowRight') setWidth((w) => clamp(w + 20, 280, max()))
        }}
        className="absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize touch-none after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-ink-subtle focus-visible:after:bg-focus"
      />
    </aside>
  )
}

export default function App() {
  const layout = useLayout()
  const [drawerOpen, setDrawerOpen] = useState(true)
  useStartup()
  usePasteUpload()

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-dvh flex-col overflow-hidden">
        <TopBar onToggleControls={layout === 'tablet' ? () => setDrawerOpen((o) => !o) : undefined} controlsOpen={drawerOpen} />
        <div className="flex min-h-0 flex-1">
          {layout === 'desktop' && (
            <aside aria-label="Theme controls" className="w-[380px] shrink-0 overflow-y-auto border-r border-line bg-panel">
              <ControlsPanel />
            </aside>
          )}
          {layout === 'tablet' && drawerOpen && <Drawer />}
          <div className="flex min-w-0 flex-1 flex-col">
            <Preview compact={layout === 'mobile'} />
          </div>
        </div>
        {layout === 'mobile' && <BottomSheet />}
        <Toast />
      </div>
    </MotionConfig>
  )
}
