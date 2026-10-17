# SuperChromatic

**Drop a wallpaper. Get a whole design system.** SuperChromatic extracts a palette from any image, turns it into a complete, accessible theme (about 40 design tokens), and restyles a realistic product site live while you tweak it.

**Live demo:** https://superchromatic.vercel.app · **Repo:** https://github.com/Adiiiiiiiiiiithegoat/superchromatic

![Glass preset on the Sunset dunes sample](screenshots/glass-desktop.png)

| Neon | Minimal | Pastel (mobile) |
|---|---|---|
| ![Neon](screenshots/neon-desktop.png) | ![Minimal](screenshots/minimal-desktop.png) | ![Pastel mobile](screenshots/pastel-mobile.png) |

## Features (mapped to the brief)

**Requirements**
- ✅ **Image upload & colour extraction**: drag-and-drop, click to browse or paste (Ctrl+V); PNG/JPG/WebP up to 15 MB, with a friendly error for anything else. Extraction runs in a Web Worker. Click a swatch to choose whether it goes into the theme.
- ✅ **Theme presets**: 8 presets (Minimal, Vibrant, Warm, Cool, Glass, Neon, Pastel, Monochrome). Each one is a *rule set* applied to your palette, not a fixed set of colours, and each card shows a live thumbnail of the result.
- ✅ **Visual adjustments**: saturation, brightness, contrast, background blur, overlay opacity and corner radius. They update in real time, have dial visuals, and reset on double-click or Delete.
- ✅ **Live theme preview**: "Orbit", a fictional event-OS site with a navbar, hero, stats, feature grid, sign-up form, tabs, alert, progress, avatars, chips, tooltip, data table, pricing and footer. Every element is interactive.
- ✅ **Themed UI components**: H1 and secondary text, page and card backgrounds, card title and secondary text, primary and secondary buttons, inputs, select, textarea, checkbox, radio, switch and badges.
- ✅ **Theme consistency**: one pure function, `generateTheme()`, writes CSS variables. The preview contains no colour literals, and a unit test enforces this.
- ✅ **Responsive**: side-by-side panes at ≥1024px; a resizable left drawer from 640 to 1023px; under 640px the preview fills the screen and the controls live in a draggable bottom sheet (peek, half or full) with 44px touch targets. There is no horizontal scroll at any width (tested at 390, 768, 1024 and 1440px).

**Bonuses**
- ✅ **Multiple extraction strategies**: Six colour styles: K-means, Median cut and Vibrant (shown as **Natural**, **Varied** and **Vibrant**) plus **Rainbow**, **Matching** and **Soft**, each with a one-line plain-words explanation. No colour family covering 3% or more of the picture can go missing. Plus an **eyedropper** on the image. It averages 5×5 pixels, shows a magnifier loupe on hover, and is keyboard-operable (arrow keys + Enter).
- ✅ **Accessibility-aware colours**: a WCAG 2.x contrast engine with auto-fix (on by default) and a 14-pair report written for non-experts ("Main text on the page", "Great"/"Good"/"Hard to read", a short glossary of contrast, AA and AAA) with "fixed" markers. The Accessibility section header shows e.g. "✓ 14/14 readable". Glass surfaces are checked against the worst case behind them.
- ✅ **Smooth transitions & micro-animations**: colour tokens are registered with `@property`, so the whole theme interpolates. Swatches stagger in and spring when selected. Role chips glide between slots (shared layout), the preset outline slides from card to card, slider thumbs grow while dragged, a scan line sweeps the image during extraction, and "Copy CSS" gives a sparkle burst. All of it switches off under `prefers-reduced-motion`.

**Extras**: export as CSS variables, JSON tokens or a Tailwind v4 `@theme` block (copy or download); a shareable URL that stores the palette, roles, preset, sliders and mode in the hash; the last session saved in localStorage, with uploaded wallpapers kept in IndexedDB (see [Persistence](#persistence)); light/dark preview; desktop/tablet/mobile preview frames using container queries; hold-to-compare with the previous theme; 5 original sample wallpapers.

## Run it

```bash
npm i
npm run dev            # http://localhost:5173
npm run typecheck
npm run test           # vitest: colour maths, extraction, roles, generator, share URL, "no colour literals" guard
npm run build
npx playwright install chromium
npx playwright test    # smoke test + screenshots against `npm run preview`
```

## How it works

```mermaid
flowchart LR
  A[Upload / sample / paste] --> B[Web Worker<br/>decode → 200px → OKLab]
  B --> C{Strategy}
  C -->|K-means| D[Palette swatches]
  C -->|Median cut| D
  C -->|Vibrant| D
  E[Eyedropper 5×5] --> D
  D --> F[Selection + roles<br/>auto or manual]
  F --> G["generateTheme(palette, preset, adjustments, mode, a11y)"]
  H[Preset rule set] --> G
  I[Sliders] --> G
  G --> J[Contrast auto-fix]
  J --> K[~40 CSS variables]
  K --> L[Live preview · thumbnails · export · share]
```

| Path | What lives there |
|---|---|
| `src/lib/extract/` | `pixels.ts` (sRGB→OKLab), `kmeans.ts`, `medianCut.ts`, `vibrant.ts`, `extract.worker.ts`, `client.ts` |
| `src/lib/theme/` | `oklch.ts` (colour helpers, gamut mapping), `roles.ts`, `presets.ts`, `adjust.ts`, `generate.ts`, `tokens.ts` |
| `src/lib/a11y/contrast.ts` | WCAG luminance/contrast, alpha blending, lightness auto-fix |
| `src/lib/share/` | URL hash encode/decode, CSS/JSON/Tailwind export |
| `src/store/useThemeStore.ts` | zustand store (persisted), `useTheme()` |
| `src/lib/storage/imageStore.ts` | IndexedDB wrapper for recent uploads |
| `src/components/controls/` | Upload + eyedropper, palette, roles, presets, sliders, contrast report, export modal, bottom sheet |
| `src/preview/` | The Orbit site; `preview.css` uses only `var(--…)` |

## Colour extraction

**Why OKLab?** OKLab is perceptually uniform: equal distances look like equal differences. Clustering in RGB (or HSL) groups colours the eye sees as different and splits colours it sees as the same. In OKLab, plain Euclidean distance (ΔE_ok) is a good stand-in for "how different do these look", so every strategy works there.

**Pipeline** (inside a Web Worker, so the UI never blocks): `createImageBitmap` → draw onto an `OffscreenCanvas` with the longest side at 200px (≤ 40k pixels, which is plenty for a palette) → skip pixels with alpha < 125 → convert each pixel to OKLab with a precomputed sRGB-linearisation table and Ottosson's matrices.

1. **K-means (default, "Natural").** k-means++ seeding with a seeded PRNG (mulberry32), so the same image always gives the same palette. Lloyd iterations (max 20 or until no pixel changes cluster). Clusters closer than ΔE_ok 0.04 are merged (they'd read as one colour), and results are sorted by population. k is adjustable from 5 to 10.
2. **Median cut ("Varied").** Start with one box of all pixels. Repeatedly pick the box whose widest OKLab channel is widest overall, sort it along that channel and split at the median until there are k boxes. Each box's mean is a colour.
3. **Vibrant ("Vibrant").** Bucket pixels by hue (12 × 30°) × lightness band (dark/mid/light), with greys in their own buckets. Score each colourful bucket by `chroma × √population`, so a small but vivid accent can beat a large dull area. Greedily keep the best buckets that are ≥ 0.08 apart, and always keep the dominant colour as an anchor for the background.

Three more "mood" strategies (`src/lib/extract/moods.ts`) change *which* colours are picked, so the finished website really looks different:

- **Rainbow**: every colourful pixel goes into one of 12 hue families. Each family is represented by its chroma²-weighted OKLab mean, which leans towards its vivid pixels. Families are then taken in farthest-point order round the hue wheel.
- **Matching**: finds the main family (count × chroma), keeps only pixels within ±45° of it and runs k-means on those. The result is light-to-dark shades that always go together.
- **Soft**: keeps the less colourful half of the colourful pixels (chroma between 0.015 and the median) and runs k-means on them, giving the quiet, dusty colours.

**No missing colour families.** After Natural, Varied and Vibrant run, any hue family (12 slices of 30°) that covers at least 3% of the picture but has no swatch gets one. It replaces the most redundant swatch, the one closest to another. Without this, a dark navy that sits close to black in OKLab could be folded into the blacks (a dark blue F1 car came out with no blue at all). `ensureHues()` in `src/lib/extract/moods.ts`.

**Eyedropper.** The image is copied once into a ≤1024px canvas; a click averages a 5×5 block in OKLab (the same maths as extraction) and adds it as a `picked` swatch. Hovering shows a 6× loupe drawn with CSS `background-position`, with no extra canvas.

**Determinism.** A fixed seed plus deterministic iteration gives identical output for identical pixels. A unit test checks this.

## Theme generation

**Roles** (`roles.ts`). From the *selected* swatches: Background = most populous; Primary = highest `chroma × √population`; Accent = the colour whose hue is furthest from Primary (with chroma ≥ 0.05); Secondary = the next best score. Missing roles are derived from Primary by hue rotation in OKLCH (Secondary +30°, analogous; Accent +150°, split-complementary). Users can drag a swatch onto a role (pointer-based, so it works on touch) or use the role menu under each swatch. Shuffle and Reset are animated.

**Presets are rule sets** (`presets.ts`). Each preset sets, per light/dark mode: background lightness and maximum tint chroma, a lightness band and chroma scale/clamp for each role, an optional hue pull (Warm pulls hues toward 30–70°, Cool toward 200–260°, both at 65% weight so the image stays recognisable), card style, shadow, border, radius, fonts and default slider values. Monochrome snaps every role onto a 10-step tonal scale of Primary's hue. Glass makes the wallpaper itself the page. Neon adds a grid and glows. The same palette produces 8 visibly different themes.

**Adjustments** (`adjust.ts`) are applied *inside* the generator, so every token follows: saturation multiplies chroma; brightness shifts L (±0.15); contrast pushes surface and text lightness away from (or toward) the 0.5 midpoint; blur and overlay drive the wallpaper layer and glass cards; radius sets `--radius`.

**OKLCH all the way.** All decisions are made in OKLCH (lightness, chroma, hue), and only at the end is each colour gamut-mapped to sRGB with culori's `clampChroma`. That lowers chroma while keeping hue and lightness, so out-of-gamut colours keep their character instead of clipping.

**Tokens.** Surfaces `--bg --bg-gradient --surface --card --card-border --overlay` · text `--text --text-muted --text-subtle` · `--primary --primary-hover --primary-text` · `--secondary --secondary-hover --secondary-text` · `--accent --accent-text` · form `--border --input-bg --input-border --ring` · `--badge-bg --badge-text` · status `--success --warning --danger` (fixed semantic hues nudged 12% toward Primary) · effects `--shadow --button-shadow --glow --radius --blur --card-blur --overlay-opacity --card-alpha --border-width --bg-pattern` · fonts `--font-heading --font-body --font-mono`.

**Why one token source means consistency.** The preview never decides a colour. Every component reads `var(--…)` written by `generateTheme()`, so changing one swatch, preset or slider changes every button, card, input and badge together, and nothing can drift out of sync. `tests/theme.test.ts` fails the build if a colour literal (hex, `rgb()`, `oklch()`, a named colour or a Tailwind colour class) appears anywhere in `src/preview/`.

**Smooth changes.** All 26 colour tokens are registered with CSS `@property { syntax: '<color>' }`, so the browser can interpolate them. The preview root transitions them over 350ms, and gradients built from `var(--primary)` animate too.

## Accessibility

- **WCAG maths** (`contrast.ts`): relative luminance from linearised sRGB (0.2126 R + 0.7152 G + 0.0722 B) and the ratio `(L1 + 0.05) / (L2 + 0.05)`. Tests check #000/#fff = 21 and #777/#fff ≈ 4.48.
- **Auto-fix** (on by default): for each failing foreground, keep its hue and chroma and move only its OKLCH lightness. Both directions (toward black and toward white) are tried: a coarse scan brackets the first passing lightness, then a binary search narrows to the smallest change, and the direction needing the least change wins. Contrast is always measured on the *rendered* colour (gamut-mapped and rounded to hex), so a "pass" is real. A fuzz test checks the fix always ends ≥ target.
- **Targets**: 4.5:1 for text (body, muted, button labels, badges, input text, error/success/warning text) and 3:1 for input borders and focus rings. One `--text` token is fixed against the page, cards *and* inputs at once, because it is used on all of them.
- **Glass worst case**: translucent layers are composited (in sRGB, like the browser) over the overlay-tinted wallpaper's **darkest and lightest** extracted colours, and the worse result counts. If no text lightness can pass, the fixer raises the overlay opacity / card alpha in 5% steps until one can, and the report marks that pair "fixed".
- **Report panel**: every pair with its ratio, a Great (AAA) / Good (AA) / Hard to read badge, an "Aa" sample and a wrench marker if auto-fix changed it. The summary chip sits in the section header.
- **The app itself**: native `<details>`, `<dialog>`, range inputs and selects for free keyboard support; visible focus rings; labels and ARIA on every control; an eyedropper that works by keyboard; the preview's native controls follow the theme's `color-scheme`; `prefers-reduced-motion` turns off every animation.

## Plain language

The controls avoid design and maths jargon so anyone, kids included, can use them. Internal names stay technical in the code.

| In the code | On screen |
|---|---|
| Wallpaper / Palette / Roles / Preset / Adjustments / Accessibility | Picture / Colours / Where each colour goes / Style / Fine-tune / Easy to read |
| Primary / Secondary / Accent / Background | Main / Second / Highlight / Background |
| K-means / Median cut / Vibrant / hue spread / one hue family / low chroma | Natural / Varied / Vibrant / Rainbow / Matching / Soft |
| Saturation / Overlay opacity / Corner radius | Colour strength / Background tint / Corner roundness |
| AAA / AA / Fail | Great / Good / Hard to read (with a short glossary) |
| Export | Save (each format says where it's used) |

## Persistence

- **Settings**: the palette, roles, preset, sliders, mode and which wallpaper is showing are saved to localStorage (zustand `persist`).
- **Uploaded wallpapers**: the original image Blob goes into IndexedDB (`src/lib/storage/imageStore.ts`, no dependencies) with its id, filename, upload time and extracted palette. The 5 newest are kept; a 6th upload deletes the oldest.
- **Reload**: if the last wallpaper was an upload, its Blob is read back and shown through a fresh object URL. Extraction does not run again, so the saved palette, roles, preset and sliders come back exactly as you left them.
- **Recent uploads**: a row of thumbnails under the samples. Click one to restore that image and its palette; × removes it. The row is hidden when it's empty. Switching to a sample or opening a share link leaves the history alone.
- **No storage?** Every IndexedDB call is wrapped in try/catch. In private browsing, with storage blocked or with the quota full, uploads just aren't remembered and a reload shows the first sample wallpaper. Object URLs are revoked as soon as nothing uses them.

## Design decisions

- **Neutral studio chrome** (#0B0B0C, 1px hairlines, Geist + Geist Mono) so the user's theme is the star. The only themed pixel in the chrome is the wordmark dot (Primary → Accent). The chrome follows the system light/dark preference.
- **Fonts per preset**: Inter (Minimal: neutral), Space Grotesk (Vibrant: punchy), Fraunces (Warm: soft serif), Manrope (Cool: engineered), Sora (Glass: airy geometric), Unbounded + JetBrains Mono (Neon: loud display + techy labels), DM Sans (Pastel: friendly), IBM Plex Sans (Monochrome: sober).
- **Palette mesh**: every non-Glass preset puts a slowly drifting mesh gradient of the palette (primary, accent, secondary and a blend, over the page colour) behind the hero's event card, instead of a blurred copy of the wallpaper. Blur and overlay still apply to it, and the drift stops under reduced motion. Glass shows the real wallpaper behind the whole page.
- **Mobile bottom sheet** with tabs instead of a long scrolling panel, so the preview stays visible while you tweak it.
- **Performance**: extraction in a Worker on a 200px copy; the eyedropper samples a cached canvas; preset thumbnails use `useDeferredValue` so they never slow the main preview.
- **Determinism**: the same image always gives the same palette, which matters for share links and demos.

## Limitations & future work

- Share links don't include the wallpaper (URLs can't hold images); a palette gradient stands in for it.
- Glass contrast uses the extracted extremes, not every pixel. A blurred wallpaper usually sits within that range, but a tiny very bright highlight could fall outside it.
- Contrast uses WCAG 2.x. APCA (WCAG 3 draft) would judge thin and large text better.
- Future: export to Figma variables, more preview templates (dashboard, mobile app), a palette history.

## Credits

Libraries: React, Vite, TypeScript, Tailwind CSS v4, culori (colour-space conversions and gamut mapping), zustand, Motion, lucide-react, Vitest, Playwright. Fonts from Google Fonts. **The 5 sample wallpapers were generated procedurally for this project** (`scripts/render-samples.mjs`, SVG sources in `scripts/samples/`). "Orbit" is a fictional product.
