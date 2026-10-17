import { ImagePlus, Pipette, Upload, X } from 'lucide-react'
import { type KeyboardEvent, useRef, useState } from 'react'
import { averageOklab, rgbaToOklab } from '../../lib/extract/pixels'
import { SAMPLES } from '../../lib/samples'
import { clamp, oklabToOklch, toHex } from '../../lib/theme/oklch'
import { useThemeStore } from '../../store/useThemeStore'
import { btn } from '../ui'

export async function loadSample(sample: (typeof SAMPLES)[number]) {
  const blob = await (await fetch(sample.src)).blob()
  await useThemeStore.getState().loadImage(blob, { src: sample.src, name: sample.name, kind: 'sample' })
}

export function WallpaperSection() {
  const image = useThemeStore((s) => s.image)
  const status = useThemeStore((s) => s.status)
  const error = useThemeStore((s) => s.error)
  const uploadFile = useThemeStore((s) => s.uploadFile)
  const hintDismissed = useThemeStore((s) => s.hintDismissed)
  const dismissHint = useThemeStore((s) => s.dismissHint)
  const [dragging, setDragging] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  return (
    <div
      className="space-y-3"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) uploadFile(file)
      }}
    >
      {!hintDismissed && (
        <div className="flex items-start gap-2 rounded-lg border border-line bg-raised px-3 py-2 text-[12.5px] text-ink-muted">
          <span className="flex-1">Try a sample or drop your own wallpaper. Then click the image to pick any colour from it.</span>
          <button type="button" onClick={dismissHint} aria-label="Dismiss hint" className="text-ink-subtle hover:text-ink max-sm:p-2">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <input
        ref={input}
        type="file"
        data-testid="file-input"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
          e.target.value = ''
        }}
      />

      <div className={`relative rounded-xl border border-dashed transition-colors ${dragging ? 'border-ink bg-hover' : 'border-line-strong'}`}>
        {image ? (
          <ImageInspector src={image.src} name={image.name} scanning={status === 'extracting'} />
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-40 w-full flex-col items-center justify-center gap-2 text-ink-muted hover:text-ink">
            <ImagePlus aria-hidden className="size-6" />
            <span className="text-[13px] font-medium">Drop a wallpaper here</span>
            <span className="text-[12px] text-ink-subtle">PNG, JPG or WebP · up to 15 MB</span>
          </button>
        )}
        {dragging && <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-app/70 text-[13px] font-medium">Drop to extract colours</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} onClick={() => input.current?.click()}>
          <Upload aria-hidden className="size-3.5" /> {image ? 'Replace image' : 'Browse'}
        </button>
        <span className="text-[12px] text-ink-subtle max-sm:hidden">or drop, or paste with Ctrl+V</span>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-[12.5px] text-bad">
          {error}
        </p>
      )}

      <div>
        <p className="mb-1.5 text-[12px] text-ink-subtle">Samples</p>
        <ul className="grid grid-cols-5 gap-1.5">
          {SAMPLES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                data-testid={`sample-${s.id}`}
                aria-pressed={image?.src === s.src}
                aria-label={`Use sample wallpaper: ${s.name}`}
                title={s.name}
                onClick={() => void loadSample(s)}
                className={`block aspect-[4/3] w-full overflow-hidden rounded-md ring-offset-2 ring-offset-panel transition ${image?.src === s.src ? 'ring-2 ring-ink' : 'opacity-80 hover:opacity-100'}`}
              >
                <img src={s.thumb} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const ZOOM = 6
const LOUPE = 88

interface Hover {
  x: number // pointer position inside the element, px
  y: number
  nx: number // normalised position on the image, 0–1
  ny: number
  w: number // rendered image size, px
  h: number
  hex: string
}

/** The uploaded image doubles as an eyedropper: click (or arrow keys + Enter) to pick a colour. */
function ImageInspector({ src, name, scanning }: { src: string; name: string; scanning: boolean }) {
  const addColor = useThemeStore((s) => s.addColor)
  const notify = useThemeStore((s) => s.notify)
  const img = useRef<HTMLImageElement>(null)
  const sampler = useRef<CanvasRenderingContext2D | null>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [cursor, setCursor] = useState<{ nx: number; ny: number } | null>(null)

  /** Copy the image into a canvas once (≤1024px) so picks are just a getImageData call. */
  const prepareSampler = () => {
    const el = img.current
    if (!el?.naturalWidth) return
    const scale = Math.min(1, 1024 / Math.max(el.naturalWidth, el.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(el.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(el.naturalHeight * scale))
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx?.drawImage(el, 0, 0, canvas.width, canvas.height)
    sampler.current = ctx
  }

  /** Average a 5×5 block (in OKLab, like the extractor) around a normalised point. */
  const sampleAt = (nx: number, ny: number): string | null => {
    const ctx = sampler.current
    if (!ctx) return null
    const { width, height } = ctx.canvas
    const size = Math.min(5, width, height)
    const x = clamp(Math.round(nx * width) - 2, 0, width - size)
    const y = clamp(Math.round(ny * height) - 2, 0, height - size)
    const avg = averageOklab(rgbaToOklab(ctx.getImageData(x, y, size, size).data, 0))
    return toHex(oklabToOklch(avg.l, avg.a, avg.b))
  }

  /** object-fit: contain leaves letterboxing; find the actual image box inside the element. */
  const imageBox = () => {
    const el = img.current!
    const r = el.getBoundingClientRect()
    const s = Math.min(r.width / el.naturalWidth, r.height / el.naturalHeight)
    const w = el.naturalWidth * s
    const h = el.naturalHeight * s
    return { rect: r, left: (r.width - w) / 2, top: (r.height - h) / 2, w, h }
  }

  const locate = (e: { clientX: number; clientY: number }) => {
    if (!img.current?.naturalWidth) return null
    const b = imageBox()
    const x = e.clientX - b.rect.left
    const y = e.clientY - b.rect.top
    const nx = (x - b.left) / b.w
    const ny = (y - b.top) / b.h
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return null
    return { x, y, nx, ny, w: b.w, h: b.h }
  }

  const pick = (nx: number, ny: number) => {
    const hex = sampleAt(nx, ny)
    if (!hex) return
    addColor(hex, 'picked')
    notify(`Picked ${hex} and added it to the palette`)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02
    const c = cursor ?? { nx: 0.5, ny: 0.5 }
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) {
      e.preventDefault()
      setCursor({ nx: clamp(c.nx + moves[e.key][0]), ny: clamp(c.ny + moves[e.key][1]) })
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(c.nx, c.ny)
    }
  }

  const box = cursor && img.current?.naturalWidth ? imageBox() : null

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Wallpaper “${name}”. Click to pick a colour. With the keyboard, use arrow keys to move the picker and Enter to add the colour.`}
      className="relative h-48 cursor-crosshair overflow-hidden rounded-xl bg-raised touch-manipulation"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const at = locate(e)
        const hex = at && sampleAt(at.nx, at.ny)
        setHover(at && hex ? { ...at, hex } : null)
      }}
      onPointerLeave={() => setHover(null)}
      onClick={(e) => {
        const at = locate(e)
        if (at) pick(at.nx, at.ny)
      }}
      onKeyDown={onKeyDown}
      onBlur={() => setCursor(null)}
    >
      <img ref={img} src={src} alt={`Wallpaper: ${name}`} onLoad={prepareSampler} className="size-full object-contain" draggable={false} />

      {scanning && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="sc-scanline" />
        </div>
      )}

      {box && cursor && (
        <span
          aria-hidden
          className="pointer-events-none absolute size-4 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_#000]"
          style={{ left: box.left + cursor.nx * box.w, top: box.top + cursor.ny * box.h, background: sampleAt(cursor.nx, cursor.ny) ?? undefined }}
        />
      )}

      {hover && (
        <div aria-hidden className="pointer-events-none absolute flex flex-col items-center" style={{ left: hover.x - LOUPE / 2, top: hover.y - LOUPE - 18 }}>
          <div
            className="relative rounded-full border-2 border-white shadow-lg"
            style={{
              width: LOUPE,
              height: LOUPE,
              backgroundImage: `url("${src}")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${hover.w * ZOOM}px ${hover.h * ZOOM}px`,
              backgroundPosition: `${-(hover.nx * hover.w * ZOOM - LOUPE / 2)}px ${-(hover.ny * hover.h * ZOOM - LOUPE / 2)}px`,
              imageRendering: 'pixelated',
            }}
          >
            <span className="absolute top-1/2 left-1/2 size-3 -translate-1/2 border border-white shadow-[0_0_0_1px_#000]" />
          </div>
          <span className="mt-1 flex items-center gap-1 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">
            <Pipette className="size-3" />
            {hover.hex}
          </span>
        </div>
      )}
    </div>
  )
}
