import { test, expect, type Page } from '@playwright/test'

function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

function trackExternal(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin
  const external: string[] = []
  page.on('request', (r) => {
    const u = r.url()
    if (/^https?:/.test(u) && new URL(u).origin !== origin) external.push(u)
  })
  return external
}

async function ready(page: Page) {
  await expect(page.locator('[data-arena-ready="true"]')).toBeVisible({ timeout: 30_000 })
}

const desktopOnly = (info: { project: { name: string } }) =>
  test.skip(info.project.name !== 'desktop', 'desktop arena flows')

test.describe('arena desktop', () => {
  test('tip-off to ready, no errors, no external requests', async ({ page, baseURL }, info) => {
    desktopOnly(info)
    const errors = trackErrors(page)
    const external = trackExternal(page, baseURL!)
    await page.goto('/')
    await page.getByRole('button', { name: 'Tip-off' }).click()
    await ready(page)
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.getByText('Stations visited 0/24')).toBeVisible()
    await expect
      .poll(async () => Number(await page.locator('[data-arena-ready]').getAttribute('data-draw-calls')))
      .toBeGreaterThan(0)
    const dc = Number(await page.locator('[data-arena-ready]').getAttribute('data-draw-calls'))
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
    expect(external, external.join('\n')).toEqual([])
  })

  test('deep link opens panel; Escape hides; e reopens', async ({ page }, info) => {
    desktopOnly(info)
    const errors = trackErrors(page)
    await page.goto('/#tranquility-base')
    await ready(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Tranquility Base' })).toBeVisible()
    await expect(page.getByText('Stations visited 1/24')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await page.keyboard.press('e')
    await expect(dialog.getByRole('heading', { name: 'Tranquility Base' })).toBeVisible()
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('walking forward reaches a station prompt and opens it', async ({ page }, info) => {
    desktopOnly(info)
    await page.goto('/#/arena')
    await ready(page)
    await page.keyboard.down('ArrowUp')
    await page.waitForFunction(
      () => document.querySelector('[data-testid=prompt]')?.getAttribute('data-station') === 'tranquility-base',
      undefined,
      { polling: 'raf', timeout: 20_000 },
    )
    await page.keyboard.up('ArrowUp')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Tranquility Base' })).toBeVisible()
  })

  test('skip to box score, then Back returns to arena without tip-off', async ({ page }, info) => {
    desktopOnly(info)
    await page.goto('/#/arena')
    await ready(page)
    await page.getByText('Skip to box score').click()
    await expect(page.locator('[data-station]')).toHaveCount(24)
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/box-score')
    await page.goBack()
    await ready(page)
    await expect(page.getByRole('button', { name: 'Tip-off' })).toHaveCount(0)
  })

  test('unknown hash shows tip-off and no dialog', async ({ page }, info) => {
    desktopOnly(info)
    const errors = trackErrors(page)
    await page.goto('/#nope')
    await page.getByRole('button', { name: 'Tip-off' }).click()
    await ready(page)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('visited count persists', async ({ page }, info) => {
    desktopOnly(info)
    await page.goto('/#robotics')
    await ready(page)
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await page.goto('/#/arena')
    await page.reload()
    await ready(page)
    await expect(page.getByText('Stations visited 1/24')).toBeVisible()
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('home shows box score with Enter the arena', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-station]')).toHaveCount(24)
    await expect(page.getByText('Enter the arena')).toBeVisible()
  })
})

test.describe('arena mobile', () => {
  test('box score to arena with joystick and skip', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile', 'mobile flow')
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.locator('[data-station]')).toHaveCount(24)
    await page.getByText('Enter the arena').click()
    await expect.poll(() => page.evaluate(() => location.hash)).toBe('#/arena')
    await ready(page)
    await expect(page.getByTestId('joystick')).toBeVisible()
    await expect(page.getByText('Skip to box score')).toBeVisible()
    expect(errors, errors.join('\n')).toEqual([])
  })
})
