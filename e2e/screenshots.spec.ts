import { expect, test } from '@playwright/test'

// Captures README/review screenshots. Run: npx playwright test screenshots
test.use({ colorScheme: 'dark' }) // the studio chrome's default look

const PRESETS = ['minimal', 'glass', 'neon', 'pastel']
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

for (const size of SIZES) {
  for (const preset of PRESETS) {
    test(`screenshot ${preset} @ ${size.name}`, async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: size.height })
      await page.goto('/')
      const mobile = size.width < 640
      if (mobile) await page.getByRole('tab', { name: 'Style' }).click()
      await page.getByTestId(`preset-${preset}`).click()
      if (mobile) await page.getByRole('button', { name: /Controls sheet is/ }).click() // half → full
      if (mobile) await page.getByRole('button', { name: /Controls sheet is/ }).click() // full → peek
      await expect(page.getByTestId('preview-root')).toBeVisible()
      await page.waitForTimeout(900) // let colour transitions and fonts settle
      await page.screenshot({ path: `screenshots/${preset}-${size.name}.png` })
    })
  }
}
