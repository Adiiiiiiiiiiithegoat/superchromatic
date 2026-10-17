# NOTES: decisions & progress log

## Final report (17 Oct 2026)

- **GitHub:** https://github.com/Adiiiiiiiiiiithegoat/superchromatic
- **Vercel production:** https://superchromatic.vercel.app
- **Verification:** `npm run typecheck` ✓ · `npm run test` 35/35 ✓ · `npm run build` ✓ · Playwright smoke 7/7 ✓ locally *and* against production (no console errors, no horizontal scroll at 390/768/1024/1440px) · screenshots in `screenshots/`.

### Brief checklist

| Requirement / bonus | | Where |
|---|---|---|
| Image upload (drop, browse, paste; PNG/JPG/WebP ≤ 15 MB; friendly error) | ✅ | `src/components/controls/UploadZone.tsx`, `uploadFile` in `src/store/useThemeStore.ts`, paste in `src/App.tsx` |
| Colour extraction off the main thread | ✅ | `src/lib/extract/extract.worker.ts`, `client.ts`, `pixels.ts` |
| Display + select colours | ✅ | `src/components/controls/Palette.tsx` |
| Theme presets (Minimal, Vibrant, Warm, Cool, Glass + Neon, Pastel, Mono) | ✅ | `src/lib/theme/presets.ts`, `PresetPicker.tsx` (live thumbnails) |
| Saturation, brightness, contrast, blur, overlay (+ radius), real time | ✅ | `src/lib/theme/adjust.ts`, `generate.ts`, `Adjustments.tsx`, `Slider.tsx` |
| Live preview next to controls | ✅ | `src/preview/Preview.tsx`, `src/App.tsx` |
| Heading/secondary text, bg/card bg, card text, primary/secondary buttons, inputs, badges, layout | ✅ | `src/preview/sections/*` |
| Theme consistency (single token source) | ✅ | `generateTheme()` in `src/lib/theme/generate.ts`; guard test in `tests/theme.test.ts` |
| Responsive (desktop / drawer / bottom sheet) | ✅ | `src/App.tsx` (`Drawer`), `BottomSheet.tsx`, container queries in the preview |
| Bonus: multiple strategies | ✅ | `kmeans.ts`, `medianCut.ts`, `vibrant.ts` |
| Bonus: pick colours from the image | ✅ | `ImageInspector` in `UploadZone.tsx` (5×5 average, loupe, keyboard) |
| Bonus: accessibility-aware colours | ✅ | `src/lib/a11y/contrast.ts`, auto-fix in `generate.ts`, `ContrastReport.tsx`, chip in the Accessibility section header |
| Bonus: transitions & micro-animations | ✅ | `@property` in `src/index.css`, root transition in `Preview.tsx`, Motion in Palette/RoleSlots/PresetPicker/TopBar/BottomSheet |
| Export (CSS / JSON / Tailwind v4, copy + download) | ✅ | `src/lib/share/export.ts`, `ExportModal.tsx` |
| Share URL + localStorage persistence | ✅ | `src/lib/share/url.ts`, `persist` in the store |
| Uploads survive reloads (IndexedDB, last 5) | ✅ | `src/lib/storage/imageStore.ts`, `openUpload`/`refreshRecent` in the store, recent row in `UploadZone.tsx` |
| 5 original sample wallpapers, first loads on first visit | ✅ | `scripts/render-samples.mjs` → `public/samples/` |
| README | ✅ | `README.md` |
| Video script | ✅ | `docs/VIDEO_SCRIPT.md` |

### Not done / caveats
- `vercel git connect` failed ("Failed to connect … make sure you have access"), probably because the Vercel GitHub app isn't installed on the GitHub account. The kickoff allows skipping this; CLI deploys work. To enable auto-deploy, install the Vercel GitHub app or connect the repo in the Vercel dashboard (Project → Settings → Git).
- The walkthrough video itself is yours to record (script ready).
- The `frontend-design` skill wasn't available in this environment, so the chrome follows the kickoff's §12 direction directly.

## Decisions
- Scaffolded by hand (no interactive `npm create`), per kickoff §0. The installed toolchain resolved to Vite 8, TypeScript 7, Vitest 5, Tailwind 4.3, Motion 14, lucide-react 1.x.
- Extra `tsconfig.test.json` so tests get Node types without leaking them into `src/`.
- **Contrast pairs: 14, not 10.** Besides the 10 in the kickoff, I added input border (3:1), error/danger text, success and warning status text. All of them appear in the preview, so they should be checked. The status pairs include their own 14% tint background and are re-fixed until stable (small 0.05 margin).
- **One `--text` token** is fixed against the page, cards and inputs together (it's used on all three); fixing each pair separately would need three different text colours.
- **Page "background" for contrast** includes alternate section surfaces and the peaks of the hero's colour wash, so text on any of them passes.
- **Glass:** when no text lightness can pass over the translucent layers, auto-fix raises overlay opacity / card alpha / input alpha in 5% steps. The emitted `--overlay-opacity` reflects this, and the report marks the pair as fixed.
- Gradients (`--bg-gradient`, grid pattern) reference registered colour vars via `color-mix`, so they animate with the theme.
- Selecting a preset applies its default slider values and its preferred mode (Neon → dark, Pastel → light), per the kickoff ("default slider values" per preset). Users can toggle mode back.
- Tablet drawer pushes the preview aside (in-flow, resizable 280–520px, keyboard-resizable separator) rather than overlaying it, so you can still see the theme while editing.
- "Compare" shows the theme from before the latest burst of changes (a theme counts as settled after 700ms of no changes).
- Sample wallpapers: procedurally built SVGs (seeded RNG for stars/buildings/bubbles/bokeh) rasterised to JPEG with headless Chromium, because `createImageBitmap` can't decode SVG blobs inside a worker, and uploads only accept PNG/JPG/WebP.
- **Upload persistence (17 Oct 2026):** uploads go to IndexedDB (original Blob + id, name, upload time, extracted palette), newest 5 kept. localStorage stores the upload's id with an empty `src`, because the old blob: URL is dead after a reload. On load, `openUpload(id, keepPalette)` reads the Blob back and makes a new object URL without re-extracting. If the record is missing or IndexedDB is unavailable, the first sample loads instead. The palette saved with an upload is refreshed after every successful extraction (including a strategy or k change), so "Recent uploads" restores the latest extraction. Picked or custom colours stay in the session only. Thumbnails use their own object URLs, separate from the main image's, so removing a recent item never breaks the wallpaper on screen. Removing the upload that's currently showing leaves it on screen, but it won't come back after a reload.
- **Plain-language pass (17 Oct 2026):** strategies are labelled Natural / Varied / Vibrant (internal ids unchanged). Contrast rows use everyday names, and badges read Great (AAA) / Good (AA) / Hard to read, with a short glossary under the list. The summary chip moved from the top bar into the Accessibility section header (in the mobile sheet too). The hero card sits on a palette mesh gradient (`.pv-mesh`, built only from tokens) instead of a blurred copy of the wallpaper. Exports leave out `--wallpaper-fallback`, which only matters inside this app.
- Preview `color-scheme` follows the theme mode, so native radios/checkboxes/selects match the theme instead of the dark app chrome (caught in screenshot review).
- Screenshot review fixes: Export button label was invisible (class conflict); contrast rows wrapped onto 3 lines.
