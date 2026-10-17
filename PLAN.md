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

## Plain-language polish
- [x] Hero card on a palette mesh gradient instead of blurred wallpaper
- [x] Strategy names in plain words (Natural / Varied / Vibrant)
- [x] Kid-friendly accessibility copy (Great / Good / Hard to read + glossary)
- [x] Move readability chip from top bar to Accessibility header
- [x] Drop app-only --wallpaper-fallback from exports
- [x] Deploy + live smoke test

## Jargon sweep
- [x] Plain-word labels across controls, toasts and Save dialog
- [x] Tests, README, NOTES and video script updated
- [x] Commit, push, deploy + live smoke test

## Tooltips
- [x] Styled app-wide tooltip replacing native title boxes
- [x] Deploy + live smoke test

## Colour styles
- [x] Guarantee every sizeable colour family a swatch (blue fix)
- [x] Rainbow, Matching and Soft styles + tests
- [x] Deploy + live smoke test

## Preview links
- [x] Nav, footer and CTA buttons scroll to sections; pretend pages explain themselves
- [x] Remove Changelog link from nav and footer
- [x] Deploy + live smoke test

## Brand mark
- [x] Flat 2×2 swatch favicon + matching live top-bar mark
- [x] Deploy + live smoke test

## Performance & defaults
- [x] Measure lag (style recalc dominated)
- [x] Single colour animation, follow-the-drag mode, theme computed once
- [x] Dark mode by default (+ one-time migration)
- [x] Deploy + live smoke test
