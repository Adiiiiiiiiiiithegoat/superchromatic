import { type Page, expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const PRESETS = ['minimal', 'vibrant', 'warm', 'cool', 'glass', 'neon', 'pastel', 'mono']

/** Exact token value as written by generateTheme (inline style, not the mid-transition computed value). */
const token = (page: Page, name: string) => page.getByTestId('preview-root').evaluate((el, n) => (el as HTMLElement).style.getPropertyValue(n), name)
const allTokens = (page: Page) => page.getByTestId('preview-root').evaluate((el) => (el as HTMLElement).getAttribute('style'))

async function ready(page: Page) {
  await page.goto('/')
  await expect(page.getByTestId('swatches').locator('li').first()).toBeVisible({ timeout: 15_000 })
}

test('loads, extracts, restyles, stays accessible', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))

  // 1. First visit loads the first sample palette.
  await ready(page)
  expect(await page.getByTestId('swatches').locator('li').count()).toBeGreaterThanOrEqual(3)
  expect(await token(page, '--primary')).toMatch(/^#[0-9a-f]{6}$/)

  // 2. Uploading aurora changes --primary.
  const before = await token(page, '--primary')
  await page.getByTestId('file-input').setInputFiles('public/samples/aurora.jpg')
  await expect.poll(() => token(page, '--primary'), { timeout: 15_000 }).not.toBe(before)

  // 3. Every preset changes the tokens.
  const seen = new Set<string | null>()
  for (const id of PRESETS) {
    await page.getByTestId(`preset-${id}`).click()
    await expect(page.getByTestId(`preset-${id}`)).toHaveAttribute('aria-pressed', 'true')
    seen.add(await allTokens(page))
  }
  expect(seen.size).toBe(PRESETS.length)

  // 4. Saturation slider changes --primary.
  await page.getByTestId('preset-vibrant').click()
  const sat = await token(page, '--primary')
  await page.getByTestId('slider-saturation').fill('20')
  await expect.poll(() => token(page, '--primary')).not.toBe(sat)

  // 5. Auto-fix on → every contrast pair passes, in every preset.
  for (const id of PRESETS) {
    await page.getByTestId(`preset-${id}`).click()
    const chip = await page.getByTestId('a11y-chip').innerText()
    const [pass, total] = chip.match(/(\d+)\/(\d+)/)!.slice(1).map(Number)
    expect(pass, `${id}: ${chip}`).toBe(total)
  }

  // 6. Light/dark toggle works.
  const bg = await token(page, '--bg')
  await page.getByTestId('mode-toggle').click()
  await expect.poll(() => token(page, '--bg')).not.toBe(bg)

  expect(errors).toEqual([])
})

test('rejects unsupported files with a friendly error', async ({ page }) => {
  await ready(page)
  await page.getByTestId('file-input').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') })
  await expect(page.getByRole('alert')).toContainText('isn’t a PNG, JPG or WebP')
})

test('share link restores the theme', async ({ page }) => {
  await ready(page)
  await page.getByTestId('preset-neon').click()
  const primary = await token(page, '--primary')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: 'Copy share link' }).click()
  const link = await page.evaluate(() => navigator.clipboard.readText())
  expect(link).toContain('#theme=')
  const fresh = await page.context().newPage()
  await fresh.goto(link)
  await expect.poll(() => token(fresh, '--primary')).toBe(primary)
})

for (const width of [390, 768, 1024, 1440]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    // On mobile the palette lives in the bottom sheet's Palette tab.
    if (width < 640) await page.getByRole('tab', { name: 'Colours' }).click()
    await expect(page.getByTestId('swatches').locator('li').first()).toBeVisible({ timeout: 15_000 })
    const overflow = await page.evaluate(() => {
      const offenders = [...document.querySelectorAll<HTMLElement>('body *')].filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.right > window.innerWidth + 1 && getComputedStyle(el).position !== 'fixed'
      })
      return { scroll: document.documentElement.scrollWidth - window.innerWidth, offenders: offenders.slice(0, 3).map((e) => e.className.toString().slice(0, 60)) }
    })
    expect(overflow.scroll).toBeLessThanOrEqual(0)
  })
}

test('uploaded wallpaper survives a reload', async ({ page }) => {
  await ready(page)
  await page.getByTestId('file-input').setInputFiles('public/samples/aurora.jpg')
  const recent = page.getByTestId('recent-uploads').locator('li')
  await expect(recent).toHaveCount(1, { timeout: 15_000 })
  const primary = await token(page, '--primary')
  const wallpaper = page.getByRole('img', { name: 'Picture: aurora.jpg' })
  await expect(wallpaper).toBeVisible()

  await page.reload()
  await expect(wallpaper).toBeVisible({ timeout: 15_000 })
  expect(await wallpaper.evaluate((img: HTMLImageElement) => img.src.startsWith('blob:') && img.naturalWidth > 0)).toBe(true)
  await expect.poll(() => token(page, '--primary')).toBe(primary)
  await expect(recent).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Use recent upload: aurora.jpg' })).toHaveAttribute('aria-pressed', 'true')

  // Samples don't clear the history; the × does.
  await page.getByTestId('sample-deep-ocean').click()
  await expect(recent).toHaveCount(1)
  await page.getByRole('button', { name: 'Remove aurora.jpg from recent uploads' }).click()
  await expect(page.getByTestId('recent-uploads')).toHaveCount(0)
})

test('recent uploads keep only the last five', async ({ page }) => {
  await ready(page)
  const buffer = readFileSync('public/samples/aurora.jpg')
  const recent = page.getByTestId('recent-uploads').locator('li')
  for (let i = 1; i <= 6; i++) {
    await page.getByTestId('file-input').setInputFiles({ name: `wall-${i}.jpg`, mimeType: 'image/jpeg', buffer })
    await expect(page.getByRole('button', { name: `Use recent upload: wall-${i}.jpg` })).toBeVisible({ timeout: 15_000 })
  }
  await expect(recent).toHaveCount(5)
  await expect(page.getByRole('button', { name: 'Use recent upload: wall-1.jpg' })).toHaveCount(0)
})

test('without IndexedDB an upload falls back to the first sample on reload', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { get: () => { throw new Error('blocked') } }))
  await ready(page)
  await page.getByTestId('file-input').setInputFiles('public/samples/aurora.jpg')
  await expect(page.getByRole('img', { name: 'Picture: aurora.jpg' })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('sample-sunset-dunes')).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(page.getByTestId('sample-sunset-dunes')).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 })
  await expect(page.getByTestId('recent-uploads')).toHaveCount(0)
})

test('hover shows the styled tooltip instead of the native one', async ({ page }) => {
  await ready(page)
  const natural = page.getByRole('button', { name: 'Natural' })
  await natural.hover()
  await expect(page.getByTestId('tooltip')).toHaveText(/colours you notice first/)
  await expect(natural).not.toHaveAttribute('title')
  await page.mouse.move(0, 0)
  await expect(page.getByTestId('tooltip')).toHaveCount(0)
})
