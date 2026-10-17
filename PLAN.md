# SuperChromatic — Plan

## Setup
- [ ] Scaffold Vite + React + TS + Tailwind v4 by hand
- [ ] Install deps (culori, zustand, motion, lucide-react, vitest, playwright)

## Extraction
- [ ] Pixel decode + OKLab conversion in worker
- [ ] K-means (seeded k-means++, merge ΔE 0.04)
- [ ] Median cut
- [ ] Vibrant hue buckets
- [ ] Eyedropper with loupe
- [ ] Extraction unit tests

## Theme engine
- [ ] Role auto-assignment + hue-rotation fallback
- [ ] 8 presets as rule sets
- [ ] generateTheme with adjustments + gamut mapping
- [ ] Contrast maths + auto-fix + tests

## UI
- [ ] Store + persistence + share URL
- [ ] Controls panel (wallpaper, palette, roles, preset, adjust, a11y)
- [ ] Live preview "Orbit" site, all sections
- [ ] Preview toolbar (frames, mode, compare)
- [ ] Export modal (CSS, JSON, Tailwind)
- [ ] Responsive: drawer + mobile bottom sheet
- [ ] Animations + reduced motion
- [ ] 5 original sample wallpapers

## Verify & ship
- [ ] typecheck, test, build pass
- [ ] Playwright smoke test + screenshots
- [ ] README + docs/VIDEO_SCRIPT.md
- [ ] GitHub repo pushed
- [ ] Vercel production deploy
- [ ] Final report in NOTES.md
