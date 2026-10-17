# SuperChromatic — Plan

## Setup
- [x] Scaffold Vite + React + TS + Tailwind v4 by hand
- [x] Install deps (culori, zustand, motion, lucide-react, vitest, playwright)

## Extraction
- [x] Pixel decode + OKLab conversion in worker
- [x] K-means (seeded k-means++, merge ΔE 0.04)
- [x] Median cut
- [x] Vibrant hue buckets
- [x] Eyedropper with loupe
- [x] Extraction unit tests

## Theme engine
- [x] Role auto-assignment + hue-rotation fallback
- [x] 8 presets as rule sets
- [x] generateTheme with adjustments + gamut mapping
- [x] Contrast maths + auto-fix + tests

## UI
- [x] Store + persistence + share URL
- [x] Controls panel (wallpaper, palette, roles, preset, adjust, a11y)
- [x] Live preview "Orbit" site, all sections
- [x] Preview toolbar (frames, mode, compare)
- [x] Export modal (CSS, JSON, Tailwind)
- [x] Responsive: drawer + mobile bottom sheet
- [x] Animations + reduced motion
- [x] 5 original sample wallpapers

## Verify & ship
- [x] typecheck, test, build pass
- [x] Playwright smoke test + screenshots
- [x] README + docs/VIDEO_SCRIPT.md
- [x] GitHub repo pushed
- [x] Vercel production deploy
- [x] Final report in NOTES.md

## Upload persistence
- [x] IndexedDB wrapper for uploads (last 5)
- [x] Restore uploaded wallpaper on reload without re-extraction
- [x] Recent uploads row with remove buttons
- [x] Fallback to first sample when storage is unavailable
- [x] Playwright reload / pruning / fallback tests
- [x] README + NOTES updated
- [x] Production deploy + live smoke test
