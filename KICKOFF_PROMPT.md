# Kickoff: SuperChromatic — Image-Based Theming Engine (E-Cell NITK Task 3)

You are building my submission for the E-Cell NITK Technical Team recruitment, Task 3. The official brief is in `docs/TASK_BRIEF.md` — read it first; every requirement and every bonus there must be met. Deadline is 20 Oct 2026, 11:59 PM IST, so aim to finish everything in this one session, from scaffold to a live Vercel URL.

Work autonomously. Do not stop to ask me questions unless you hit one of the **"Stop and ask me"** points listed below. Make sensible decisions, note them in `NOTES.md`, and keep going.

I'm on Windows, running you inside VS Code in `D:\Projects\ECELL`. The folder already contains `docs/TASK_BRIEF.md`, `CLAUDE.md`, `.gitignore` and this file. Don't delete them.

---

## 0. Ground rules

- **Originality matters** (plagiarism = disqualification). Write the extraction and theme-generation logic yourself. Don't copy code from Realtime Colors, Material Theme Builder, node-vibrant, color-thief, etc. Using `culori` for colour-space conversions is fine.
- **No AI APIs, no backend, no env vars.** Everything runs in the browser.
- **Don't use interactive scaffolders** (`npm create vite` prompts in a non-empty folder). Write `package.json`, `vite.config.ts`, `tsconfig*.json`, and `index.html` by hand, then `npm install`.
- Commit in small, logical steps with clear messages as you go. Don't wait until the end.
- Every preview component must take its colours **only** from CSS custom properties (`var(--…)`). No hard-coded colours anywhere inside the preview. This is how we satisfy "theme consistency", and the README must say so.
- Keep the code readable and well-named. I need to explain it in a video and an interview, so prefer clarity over cleverness, and add short comments on the colour maths.

## 1. Stack

- React 18 + Vite + TypeScript (strict).
- Tailwind CSS v4 (via `@tailwindcss/vite`) for the app chrome only. Inside the preview, use CSS variables (Tailwind arbitrary values like `bg-[var(--card)]` are fine).
- `culori` for OKLCH/OKLab/sRGB conversions.
- `zustand` for app state.
- `motion` (Framer Motion) for micro-animations.
- `lucide-react` for icons.
- `vitest` for unit tests of the colour maths.
- `@playwright/test` (Chromium only) for a smoke test plus screenshots.
- Fonts from Google Fonts via `<link>` in `index.html`: Geist, Geist Mono, plus the preset fonts listed in §5.

## 2. Product overview

The app is called **SuperChromatic**, tagline: *"Drop a wallpaper. Get a whole design system."*

It's a single page with two panes:
- **Left:** controls panel, about 380px wide, scrollable.
- **Right:** the live preview, which fills the rest of the screen.

**The core loop:**
1. Upload or pick a wallpaper.
2. A palette is extracted.
3. Pick which colours to use and assign their roles.
4. Choose a preset.
5. Tweak the sliders.
6. Watch the whole preview site restyle smoothly, in real time.
7. Export the theme.

## 3. Colour extraction (`src/lib/extract/`)

All extraction runs in a **Web Worker** (`extract.worker.ts`), so the UI never freezes. Show a short shimmer/skeleton while it works.

**Pipeline:**
1. Decode the file with `createImageBitmap`.
2. Downscale on an `OffscreenCanvas` so the longest side is 200px.
3. Read the pixels and skip any with alpha < 125.
4. Convert each pixel to **OKLab**, a perceptually uniform space, so clustering matches what the eye sees.

**Three strategies**, selectable with a segmented control (this covers the bonus):

1. **K-means (default).**
   - k-means++ initialisation with a *seeded* PRNG, so the same image always gives the same palette.
   - k defaults to 8, adjustable from 5 to 10.
   - Maximum 20 iterations, or stop at convergence.
   - Distance is Euclidean in OKLab.
   - Merge clusters that are closer than ΔE_ok 0.04.
   - Return colours sorted by population.
2. **Median cut.**
   - Split the box along the channel with the widest range, repeatedly, until there are k boxes.
   - Average each box.
3. **Vibrant.**
   - Bucket pixels by hue (12 buckets) and lightness band.
   - Score each bucket by `chroma × sqrt(population)`.
   - Return the most vivid, distinct colours. This works well for photos with small pops of colour.

**Eyedropper (also covers the bonus):**
- Clicking or tapping the uploaded image preview picks a colour.
- Average a 5×5 pixel area around the point.
- Show a magnifier loupe while hovering on desktop.
- Add the picked colour to the palette.

Each swatch carries: `hex`, `oklch`, `population %`, and `source` (`kmeans`, `median`, `vibrant`, or `picked`).

**Tests:**
- Running k-means twice on the same pixels gives the same result.
- Median cut returns k colours.
- A flat single-colour image returns one colour.

## 4. Palette UI and colour roles

**Swatch display:**
- Each swatch is a large chip showing the hex value in Geist Mono and a thin population bar.
- Clicking a swatch selects or deselects it. This is the "select the colours you want to use" requirement.

**Roles:**
- There are four roles: **Primary, Secondary, Accent, Background**.
- **Auto-assignment** (in `src/lib/theme/roles.ts`):
  - **Background:** the most populous colour.
  - **Primary:** the highest `chroma × sqrt(pop)` among the selected colours.
  - **Accent:** the selected colour whose hue is furthest from Primary and has decent chroma.
  - **Secondary:** the next best by score.
- If fewer colours are selected, derive the missing roles from Primary using hue rotation in OKLCH.
- Users can override any role: drag a swatch onto a role slot, or use a role dropdown on each swatch. Both must work on touch.

**Palette actions:**
- **Shuffle roles:** animated.
- **Reset to auto.**
- **Add custom colour:** a native colour input.
- **Remove colour.**

## 5. Presets (`src/lib/theme/presets.ts`)

There are 8 presets. Each one is a pure config object: a **rule set** applied to the same chosen palette, not a fixed set of colours. Each rule set controls:
- background treatment
- saturation and lightness targets for each role
- card style
- radius
- shadow
- border style
- heading and body font
- default slider values

**The 8 presets:**

1. **Minimal**
   - Near-neutral background: L 0.98 in light mode / 0.16 in dark mode, with background chroma at most 0.01.
   - Primary saturation reduced.
   - Hairline borders, no shadows, radius 8.
   - Fonts: Inter for both headings and body.
2. **Vibrant**
   - Saturated primary and accent (chroma pushed toward the gamut limit).
   - Bold tinted background.
   - Gradient hero, chunky radius 16.
   - Fonts: Space Grotesk headings, Inter body.
3. **Warm**
   - Every hue is pulled toward 30–70° (ambers and terracottas) with weighted interpolation, so it stays recognisably from the image.
   - Creamy background.
   - Fonts: Fraunces headings, Inter body.
4. **Cool**
   - Hues pulled toward 200–260°.
   - Slate-tinted background, crisp shadows.
   - Fonts: Manrope.
5. **Glass**
   - The wallpaper itself is the page background, with a backdrop-filter blur and a tinted overlay.
   - Cards are frosted: translucent card colour, `backdrop-filter: blur()`, a 1px light border, and an inner highlight.
   - This preset makes the **blur** and **overlay opacity** sliders most visible.
   - Fonts: Sora.
6. **Neon**
   - Very dark background (L ≈ 0.13) tinted with the background hue.
   - Primary and accent at max chroma and high L.
   - Glowing box-shadows using the primary colour.
   - Subtle grid pattern background.
   - Fonts: Unbounded headings, JetBrains Mono for badges and labels.
7. **Pastel**
   - Every role at high L (0.85–0.93) and low chroma (0.05–0.09).
   - Soft, large radius of 24.
   - Dark text derived from Primary's hue.
   - Fonts: DM Sans.
8. **Monochrome**
   - Only Primary's hue, as a 10-step tonal scale.
   - Contrast comes from lightness alone.
   - Fonts: IBM Plex Sans.

**Preset picker:**
- Display presets as cards. Each card shows a mini live thumbnail rendered with that preset applied to the current palette, so you see the result before clicking.
- Selecting a preset animates the change.

## 6. Theme engine (`src/lib/theme/generate.ts`) — the heart of the app

Write one pure function:

```ts
generateTheme(palette: RoleColors, preset: Preset, adj: Adjustments, mode: 'light' | 'dark', a11y: A11yOptions): ThemeTokens
```

It outputs a flat map of tokens, which are written onto the preview root element as CSS custom properties. Nothing else decides colours. Do all maths in OKLCH, and gamut-map to sRGB at the end using culori's `clampChroma`.

**Required tokens (at minimum):**
- **Surfaces:** `--bg`, `--bg-gradient`, `--surface`, `--card`, `--card-border`, `--overlay`
- **Text:** `--text`, `--text-muted`, `--text-subtle`
- **Primary:** `--primary`, `--primary-hover`, `--primary-text` (text drawn on primary)
- **Secondary:** `--secondary`, `--secondary-hover`, `--secondary-text`
- **Accent:** `--accent`, `--accent-text`
- **Form controls:** `--border`, `--input-bg`, `--input-border`, `--ring`
- **Badges:** `--badge-bg`, `--badge-text`
- **Status:** `--success`, `--warning`, `--danger` (tinted toward the palette)
- **Effects:** `--shadow`, `--glow`, `--radius`, `--blur`, `--overlay-opacity`, `--card-alpha`
- **Fonts:** `--font-heading`, `--font-body`, `--font-mono`

**Light/dark toggle:** the theme generates for either mode, and it's available in the preview toolbar.

**Adjustments** — all real-time, applied inside the generator so every token follows:

| Slider | Range | What it does |
|---|---|---|
| Saturation | 0–200% | Multiplies chroma |
| Brightness | −50 to +50 | Shifts L |
| Contrast | 0–200% | Pushes text and surface L apart from the midpoint, or pulls them together |
| Background blur | 0–40px | Blur applied to the wallpaper and glass surfaces |
| Overlay opacity | 0–100% | Tint layer over the wallpaper background |
| Corner radius | 0–28px | Extra, nice to have |

**Slider design:**
- Build custom-styled range inputs: accessible, keyboard-operable, with the value shown and double-click to reset.
- Show a small "dial" knob visual for each.
- Wallpaper blur and overlay must visibly matter in **every** preset, not just Glass. Add a wallpaper backdrop band behind the hero in the other presets so these sliders always do something.

## 7. Accessibility (bonus — make it a highlight)

`src/lib/a11y/contrast.ts`:
- **WCAG 2.x relative luminance and contrast ratio.**
- **Auto-fix,** ON by default with a toggle. For each foreground/background pair, if the ratio is below target, binary-search the foreground's L in OKLCH (keeping hue and chroma) until it passes:
  - 4.5 for body text
  - 3.0 for large text, UI borders and focus rings
  - Pairs to check: text/bg, text-muted/bg, text/card, text-muted/card, primary-text/primary, secondary-text/secondary, accent-text/accent, badge-text/badge-bg, input text/input-bg, ring/bg
- **Contrast report panel:**
  - Lists every pair with its ratio, an AA / AAA / Fail badge, and a tiny "Aa" sample.
  - Shows a "fixed" marker if auto-fix adjusted the pair.
  - Shows a summary chip in the top bar, e.g. "✓ 10/10 AA".
- **Glass/blur is a special case:** for translucent surfaces, compute contrast against a conservative effective background, i.e. blend the card over the darkest and lightest extracted colours and take the worse result.
- **The app itself:**
  - Keyboard navigable, with visible focus rings.
  - Proper labels and ARIA attributes on all controls.
  - `prefers-reduced-motion` disables the animations.
- **Tests:** check the known contrast ratios (#000 on #fff = 21, #777 on #fff ≈ 4.48) and that auto-fix always ends ≥ target.

## 8. Live preview (`src/preview/`)

A realistic fictional product site called **"Orbit — the event OS for student clubs"**. It's fictional: don't use any real organisation's name, logo, or branding.

**Sections** (together these cover every component in the brief):
1. **Navbar:** logo mark, links, a ghost button, and a primary button.
2. **Hero:**
   - Primary heading (H1) and secondary text.
   - Primary and secondary buttons.
   - A badge ("New · v2.0").
   - The wallpaper backdrop band.
3. **Stats row:** 3 cards with large numbers, labels, and an up/down trend badge.
4. **Feature grid:** 3–6 cards with icon, card title (primary card text), and description (secondary card text).
5. **Sign-up form card:**
   - Text input, email input, select, and textarea.
   - Checkbox, toggle switch, and radio group.
   - Inline validation state (error message in `--danger`) and a submit button.
6. **Misc components:**
   - Tabs, an alert/callout, a progress bar, an avatar group, tags/chips, and a tooltip on hover.
   - A small data table with a status badge on each row.
7. **Pricing:** 3 tiers, with the middle tier highlighted in accent.
8. **Footer.**

**Behaviour:**
- Everything in the preview is interactive: tabs switch, the toggle toggles, inputs accept typing, and hover/focus states use the tokens.
- **Preview toolbar:**
  - Desktop / Tablet / Mobile frame toggle. Render the preview in a resizable container, using container queries so the preview's own layout responds.
  - Light/Dark toggle.
  - A "Compare" button to hold and see the previous theme.

## 9. Transitions and micro-animations (bonus)

- **Colour tokens animate smoothly:**
  - Register the main colour variables with CSS `@property` (syntax `<color>`), so they interpolate.
  - Add `transition` on background-color, color, border-color, and box-shadow (around 350ms, ease-out).
- **Elements:**
  - Swatches stagger in after extraction.
  - The selected swatch gets a spring scale.
  - The role assignment shows a shared-layout animation (Motion `layoutId`).
  - The active preset card has an animated outline.
  - Slider thumbs scale on drag.
- **Extraction:** a scanning-line animation sweeps over the image while the worker runs.
- **Top bar:** a subtle confetti or sparkle on "Copy CSS".
- **Reduced motion:** all of the above is off when `prefers-reduced-motion` is set.

## 10. Export and share

An Export modal with tabs:
- **CSS variables:** a `:root{…}` block.
- **JSON tokens.**
- **Tailwind v4 `@theme` block.**

Each tab gets a copy button and a download button.

**Shareable URL:**
- Serialise the palette hexes, roles, preset, adjustments, and mode into the URL hash.
- Opening that URL restores the theme. The wallpaper itself isn't included, so fall back to a generated gradient from the palette.

**Persistence:** save the last session in localStorage. Wrap it in try/catch so it fails silently.

## 11. Sample wallpapers

Users must be able to demo without uploading anything:
- Create **5 original wallpapers** as SVG or procedurally generated images in `public/samples/`:
  - sunset dunes
  - deep ocean
  - aurora
  - neon city abstract
  - forest moss
- Use layered gradients, blobs, and noise. They must be your own creations, not downloads.
- Show them as thumbnails under the upload zone.
- **Load the first one on the first visit**, so the app never opens empty.

**Uploading:**
- Drag-and-drop, click to browse, or **paste from the clipboard** (Ctrl+V).
- Accept PNG, JPG, and WebP up to 15MB.
- Show a friendly error for anything else.

## 12. App UI design (the tool itself)

Before writing any UI code, read the `frontend-design` skill if you have it.

**Direction:** a calm, neutral "studio" chrome, so the user's theme is the star.
- **Background:** near-black `#0B0B0C`.
- **Panels:** slightly lighter, with 1px `#ffffff14` borders.
- **Fonts:** Geist for the UI, Geist Mono for values and hex codes.
- **Text:** 13–14px control text, generous spacing.
- **Light theme:** the app chrome also has one, matching the system preference.
- **Top bar:** SuperChromatic wordmark (a small gradient dot that uses the current theme's primary and accent colours, the only themed element in the chrome), the a11y summary chip, Share, and Export.
- **Left panel sections** are collapsible, with numbered headers:
  1. Wallpaper
  2. Palette
  3. Roles
  4. Preset
  5. Adjustments
  6. Accessibility

**Responsive:**

| Width | Layout |
|---|---|
| ≥1024px | Side-by-side panes |
| 640–1023px | Controls become a resizable left drawer |
| <640px (mobile) | The preview fills the screen and the controls live in a **bottom sheet** with tabs (Image · Palette · Preset · Adjust · A11y). The sheet is draggable between peek, half, and full heights. Every control is touch-friendly (44px targets). |

**Nothing on the page may scroll horizontally** at any width.

Add a short first-run hint ("Try a sample or drop your own wallpaper"), and empty and error states.

## 13. File structure (suggested)

```
src/
  main.tsx, App.tsx, index.css
  store/useThemeStore.ts
  lib/extract/{kmeans.ts, medianCut.ts, vibrant.ts, extract.worker.ts, pixels.ts}
  lib/theme/{generate.ts, presets.ts, roles.ts, adjust.ts, tokens.ts, oklch.ts}
  lib/a11y/contrast.ts
  lib/share/{url.ts, export.ts}
  components/controls/... (UploadZone, Palette, RoleSlots, PresetPicker, Slider, ContrastReport, ExportModal, BottomSheet)
  preview/{Preview.tsx, sections/*.tsx, PreviewToolbar.tsx}
tests/ (vitest unit tests) and e2e/ (playwright)
public/samples/*
```

## 14. Verification (do this before deploying)

Run all of the following and fix every issue they raise:

1. `npm run typecheck`
2. `npm run test` (vitest)
3. `npm run build`
4. **Playwright smoke test** against `npm run preview`:
   - Page loads with the sample palette.
   - Uploading `public/samples/aurora.*` changes the `--primary` token.
   - Clicking each preset changes the tokens.
   - Moving the saturation slider changes `--primary`.
   - The contrast summary shows all pairs passing when auto-fix is on.
   - No console errors.
   - No horizontal scroll at 390px.
5. **Screenshots:**
   - Save to `screenshots/` at 1440×900 and 390×844, for the Minimal, Glass, Neon and Pastel presets.
   - Look at them yourself and fix anything ugly: overflow, cramped spacing, unreadable text, broken glass.
   - Keep 4 good ones for the README.
6. **Lighthouse-style sanity check:** semantic HTML, labels, and alt text.

## 15. README.md

Brief but complete. Cover these points:

1. **Title and summary:** SuperChromatic plus a one-line summary.
2. **Links:** live demo link and the hero screenshot.
3. **Features:** a list mapped to the brief, with each requirement and bonus ticked off.
4. **How to run:** `npm i`, `npm run dev`, tests.
5. **Implementation overview:** an architecture diagram in Mermaid showing upload → worker → palette → roles → generateTheme → CSS variables → preview.
6. **Colour extraction approach:**
   - Why OKLab.
   - How each of the 3 strategies works.
   - The eyedropper.
   - Determinism.
7. **Theme generation logic:**
   - Roles.
   - Presets as rule sets.
   - Adjustments.
   - OKLCH and gamut mapping.
   - The token list.
   - Why one token source equals consistency.
8. **Accessibility:** WCAG maths, the auto-fix algorithm, and the glass worst-case handling.
9. **Design decisions:** neutral chrome, the font choices per preset, the mobile bottom sheet, performance (worker, downscaling).
10. **Limitations and future work.**
11. **Credits:** only libraries used. State that the sample wallpapers were generated for this project.

## 16. Also create `docs/VIDEO_SCRIPT.md`

A 5–7 minute walkthrough script, for me to record myself. Structure:

1. **Intro.**
2. **Demo:** sample → upload → palette selection → roles → each preset → sliders → a11y auto-fix → mobile view → export/share.
3. **Code tour:** the worker and k-means, `generateTheme`, CSS variables + `@property`, contrast fixer.
4. **Design decisions.**
5. **Close.**

Write it in simple first-person language I can say naturally, with on-screen cues in brackets.

## 17. GitHub

1. `git init` (if not already), `git branch -M main`, and commit everything.
2. Check `gh --version` and `gh auth status`.
   - **If gh is installed and logged in:** `gh repo create superchromatic --public --source=. --remote=origin --push --description "Image-based theming engine: wallpaper → palette → full design-system theme with live preview"`. If the name is taken, use `superchromatic-theming-engine`.
   - **If gh is missing or not logged in → Stop and ask me.** Tell me exactly what to run: `winget install GitHub.cli` then `gh auth login`. I can run it with `!` in this chat. Then continue.

## 18. Vercel deployment

1. Add a `vercel.json` only if it's needed (a Vite SPA usually needs none).
2. Run `npx vercel@latest whoami`.
   - **If I'm not logged in → Stop and ask me** to run `! npx vercel@latest login`, then continue.
3. Run `npx vercel@latest link --yes --project superchromatic`.
4. Run `npx vercel@latest deploy --prod --yes`.
5. Open the production URL with Playwright, confirm it loads with no console errors, and take a final screenshot.
6. Put the live URL at the top of the README, commit, and push.
7. Connect Git so future pushes auto-deploy (`npx vercel@latest git connect --yes` if available). If not, skip it, since the CLI deploy is enough.

## 19. Final report

End by printing:
- The **GitHub repo URL**
- The **Vercel production URL**
- A checklist of every brief requirement and bonus, each marked ✅ with where it lives in the code
- Anything you couldn't finish

Also write all of this to `NOTES.md`.

## Stop and ask me — only these

- gh or Vercel login is needed.
- A command needs admin rights or a system install.
- Something would delete files outside this folder.

Everything else: decide, log the decision in `NOTES.md`, and keep going.
