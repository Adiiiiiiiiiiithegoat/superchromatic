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
- **Jargon sweep (17 Oct 2026):** every on-screen label was rewritten in plain words (table in README, "Plain language"). Section and tab names, role names, slider names, preset taglines, toasts, empty states, aria-labels and the Save dialog (with a one-line hint per format) all changed. Ids, test ids and code names are unchanged. Hex codes and the format names (CSS, JSON, Tailwind) stay because people need them to use the output.
- **Tooltips (17 Oct 2026):** the browser's native `title` box (grey, square, system font) is replaced app-wide by `src/components/Tooltip.tsx`. One set of document listeners moves any `title` into `data-tip` (and `aria-description`, so screen readers keep it), then shows a rounded tooltip in the app's own font and colours after 350ms. It shows on mouse hover or keyboard focus, never on touch, and hides on scroll, click or Esc. No per-component changes were needed.
- **Six colour styles + no missing families (18 Oct 2026):** a user's Red Bull F1 picture produced no blue. Clustering folded the shaded navy bodywork into the near-blacks, because they're close in OKLab. Fix: `ensureHues()` runs after Natural, Varied and Vibrant and guarantees every hue family covering ≥3% of the picture a swatch, replacing the most redundant one. A unit test reproduces the bug with a synthetic shaded-navy car (median cut alone loses the blue) and checks the fix at k = 5, 7 and 10. Added Rainbow (hue spread), Matching (one family) and Soft (muted half). They're deliberately different in *hue and chroma*, because the theme engine re-bands lightness per style anyway, so lightness-only differences would vanish on the website. The style picker became a 3×2 grid.
- **Working preview links (18 Oct 2026):** Orbit's links used to cancel their own click, so nothing happened. Now Features, Pricing and Customers (top menu, phone menu, footer) smooth-scroll the preview's own scroller, never the app, and move focus to the section. Get started, Sign in, Start free and Try Club free land in the sign-up form's first field, and Book a demo goes to the dashboard card. Pages Orbit doesn’t have (Roadmap, Careers, Talk to us…) show a toast saying it's a pretend site. Links still never change the URL hash, so share links are safe. Reduced motion jumps instead of scrolling. `goTo()` in `Navbar.tsx`; e2e test "preview links and buttons go somewhere".
- **New mark (18 Oct 2026):** the gradient-blob favicon looked generic. It's now a flat 2×2 grid of swatches (one per colour role) on a dark tile, with no gradients, and it reads at 16px on light and dark tab bars. The top-bar logo uses the same grid, filled live with the theme's Main, Second, Highlight and Background colours.
- **Lag fix (18 Oct 2026), measured with Chrome metrics on the production build:** style recalculation was the cost, not JavaScript (21 slider steps: style 5.0s vs script 0.3s, with only 360 preview nodes). Causes and fixes:
  1. Colours animated twice. The registered tokens interpolate on the root, and every element also had its own colour transitions, which restarted on every frame of the root's animation. Now only elements with their own hover or pressed colours (buttons, chips, inputs, switches, tabs, links, table rows) keep colour transitions, and cards keep a shadow fade. Style time went from 5.0s to 1.3s.
  2. During a drag the preview no longer starts 350ms fades on every step. `data-instant` turns transitions off while a range input is held, or while changes arrive less than 300ms apart, which covers keyboard arrows. Timing alone missed drags on slow CPUs, because each step took longer than the gap. A single change (a style click, light/dark, a new picture) still fades.
  3. Roles and theme are computed once per change (`memoLast`) instead of once per component (~14×), and the Orbit page body is `memo`ised, so a colour change only re-renders the root.
  Results at 4× CPU throttle: slider-drag median frame went from 367ms to 33ms (p95 from 1,050ms to 267ms), and style-switch p95 from 717ms to 433ms. The palette mesh behind the hero card still costs about 20ms per drag step to repaint, because it's a big soft gradient whose colours change. Pausing its drift, shrinking it or removing its blur didn't measurably help, so it stays.
- **Dark by default (18 Oct 2026):** new visitors start in dark mode. The persisted store moved to version 1 with a one-off migration that flips saved sessions to dark once; after that, the toggle is remembered as before.
- Preview `color-scheme` follows the theme mode, so native radios/checkboxes/selects match the theme instead of the dark app chrome (caught in screenshot review).
- Screenshot review fixes: Export button label was invisible (class conflict); contrast rows wrapped onto 3 lines.
