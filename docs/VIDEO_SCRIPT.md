# SuperChromatic: walkthrough video script (5–7 min)

Cues for what's on screen are in [brackets]. Speak naturally; the times are rough targets.

---

## 1. Intro (0:00–0:30)

[Live site open on desktop, Sunset dunes loaded, Minimal preset]

Hi, I'm [your name]. This is SuperChromatic, my submission for Task 3. The idea is simple: drop a wallpaper, get a whole design system. It pulls the colours out of an image, turns them into a full set of design tokens, and you can see them applied live on a realistic product site, here a made-up event platform called Orbit.

Everything runs in the browser. There's no backend and no AI API. The extraction and theming logic is written by hand.

## 2. Demo (0:30–3:30)

**Samples and upload**
[Click through two or three sample thumbnails]
So you're never staring at an empty screen, there are five sample wallpapers. I generated all of them for this project. Each click re-extracts the palette, and you can see the preview restyle smoothly.

[Drag an image file onto the drop zone, then paste one with Ctrl+V]
You can drop your own image, browse for one, or just paste it. It takes PNG, JPG and WebP. [Drop a .txt file] Anything else gets a friendly error.

**Palette selection**
[Hover the swatches]
These are the extracted colours, with their hex codes and a bar for how much of the image each one covers. [Click two swatches off] Clicking a swatch toggles whether it's used in the theme, and the roles update straight away.

[Switch K-means → Median cut → Vibrant]
There are three extraction strategies. K-means is the default. Median cut splits the colour space. Vibrant hunts for small pops of colour, which is great for photos.

[Hover the image, show the loupe, click]
And this is the eyedropper. Hover to get a magnifier, click to add that exact colour. It works with the keyboard too.

**Roles**
[Scroll to Roles]
Every theme needs four roles: primary, secondary, accent and background. They're auto-assigned. Background is the most common colour, primary is the most vivid and present one, and accent is the one furthest away in hue. [Drag a swatch onto Accent] I can drag a colour onto a role, [use the dropdown under a swatch] or use this menu, which also works on touch. [Click Shuffle] Shuffle swaps them around with an animation. [Click Reset] Reset goes back to auto.

**Presets**
[Click each preset slowly: Minimal, Vibrant, Warm, Cool, Glass, Neon, Pastel, Monochrome]
There are eight presets, and each one is a set of rules, not a fixed palette. Minimal keeps things neutral with hairline borders. Vibrant pushes chroma to the edge of what the screen can show. Warm and Cool pull every hue toward ambers or slates, but only partway, so it still looks like your image. Glass uses the wallpaper as the page with frosted cards. Neon is a dark grid with glows. Pastel is soft and rounded. Monochrome uses only the primary hue on a ten-step tonal scale. And the thumbnails are live: each one is that preset applied to your current palette.

**Sliders**
[Glass preset; drag Saturation, Brightness, Contrast, then Blur and Overlay]
These are the adjustments: saturation, brightness and contrast, then background blur and overlay opacity, which you can really see on Glass. [Switch to Minimal, drag Blur] They matter in every preset, because there's always a wallpaper band behind the hero card. [Double-click a slider] Double-click resets one.

**Accessibility auto-fix**
[Open the Accessibility section; drag Contrast to 0]
Here's the part I'm proudest of. I just crushed the contrast, but the top-bar chip still says every pair passes. That's because auto-fix nudges the lightness of any failing colour until it meets WCAG AA, keeping its hue and chroma. [Turn auto-fix off] If I switch it off, you can see the real failures in red. [Turn it back on] The wrench icons show which pairs were adjusted.

**Mobile**
[DevTools device mode at 390px, or a phone]
On a phone, the preview fills the screen and the controls move into a bottom sheet. [Drag the handle between peek, half and full; tap the tabs] You can drag it between three heights, and every target is at least 44 pixels.

**Export and share**
[Click Copy CSS, show the sparkle; open Export, switch tabs, download]
Finally, Copy CSS puts the variables on your clipboard. Export gives you CSS variables, JSON tokens or a Tailwind v4 theme block. [Click Share, open the link in a new tab] And Share creates a link that rebuilds the exact theme. The wallpaper can't fit in a URL, so it shows a gradient made from your palette instead.

## 3. Code tour (3:30–5:45)

**Worker and k-means**
[Open `src/lib/extract/extract.worker.ts`, then `pixels.ts`, then `kmeans.ts`]
Extraction runs in a Web Worker so the UI never freezes. The image is shrunk to 200 pixels on its longest side and every pixel goes into OKLab. OKLab is perceptually uniform: the distance between two colours matches how different they look, so clustering there groups colours the way your eye does. K-means uses k-means++ seeding with a seeded random generator, so the same image always gives the same palette, and clusters that are closer than 0.04 get merged.

**generateTheme**
[Open `src/lib/theme/generate.ts`, scroll through the numbered sections]
This is the heart of the app: one pure function. In go the role colours, the preset, the slider values, the mode and the accessibility options. Out comes a flat map of CSS variables. Step one reshapes each role with the preset's rules. Step two applies saturation and brightness. Step three builds surfaces and text. Then the auto-fix runs, and only at the very end is everything gamut-mapped to sRGB. [Open `presets.ts`] And here you can see a preset is just data: lightness bands, chroma limits, a hue pull, fonts and shadows.

**CSS variables and @property**
[Open `src/index.css`, the `@property` block, then `src/preview/preview.css`]
The variables go onto the preview's root element. Every colour token is registered with `@property` as a colour, so the browser can animate between themes. Gradients built from these variables animate too. The preview's CSS only ever uses `var(...)`. [Open `tests/theme.test.ts`] I even have a test that fails if anyone puts a hard-coded colour in the preview folder. That's how theme consistency is guaranteed, not just hoped for.

**Contrast fixer**
[Open `src/lib/a11y/contrast.ts`, the `fixLightness` function]
The contrast fixer uses the standard WCAG formula. For a failing colour, it walks toward black and toward white, brackets the first lightness that passes, binary-searches for the smallest change, and keeps whichever direction changed the colour least. It always measures the colour exactly as it will render, after gamut mapping and rounding to hex. For glass, it checks against the darkest and lightest parts of the wallpaper and takes the worse one.

## 4. Design decisions (5:45–6:30)

[Back to the app; slowly scroll the preview]
A few decisions. The tool's own interface is a calm, near-black studio, so your theme is the only colourful thing on screen. Each preset has its own font pairing, because typography is half of a mood. On mobile I used a bottom sheet instead of a long scrolling panel, so you never lose sight of the preview. And for performance, extraction works on a small copy of the image in a worker, while the preset thumbnails are allowed to lag one frame behind the main preview.

## 5. Close (6:30–7:00)

[Glass preset, Aurora wallpaper, slowly drag Overlay]
So that's SuperChromatic: wallpaper in, accessible design system out, with every component driven by one set of tokens. The code, the README and a live link are in the GitHub repo. Thanks for watching!
