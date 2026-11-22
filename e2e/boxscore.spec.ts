import { test, expect } from '@playwright/test'

function trackErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

async function open(page: import('@playwright/test').Page, url: string) {
  const errors = trackErrors(page)
  await page.goto(url, { waitUntil: 'load' })
  await expect(page.locator('[data-station]')).toHaveCount(24)
  await page.waitForLoadState('networkidle')
  return errors
}

test('loads with h1, 24 cards, no console errors', async ({ page }) => {
  const errors = await open(page, '/')
  await expect(page.getByRole('heading', { level: 1, name: 'Brayden Uglione' })).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

test('deep link scrolls card into viewport', async ({ page }) => {
  const errors = await open(page, '/#tranquility-base')
  await expect(page.locator('#tranquility-base')).toBeInViewport()
  expect(errors, errors.join('\n')).toEqual([])
})

test('unknown hash stays at top without errors', async ({ page }) => {
  const errors = await open(page, '/#nope')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect(errors, errors.join('\n')).toEqual([])
})

test('hashchange to unknown hash from scrolled state returns to top', async ({ page }) => {
  const errors = await open(page, '/#tranquility-base')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.evaluate(() => {
    location.hash = '#nope'
  })
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect(errors, errors.join('\n')).toEqual([])
})

test('no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/')
  await expect(page.locator('[data-station]')).toHaveCount(24)
  const o = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
  expect(o).toBe(true)
})

test('raw HTML has noscript fallback and social meta', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const ns = html.match(/<noscript>([\s\S]*?)<\/noscript>/)
  expect(ns).not.toBeNull()
  expect(ns![1]).toContain('uglionebrayden@gmail.com')
  expect(html).toContain('og:image')
  expect(html).toContain('og:title')
})
