import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, pose, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

const prompt = (page: Page) => page.getByTestId('prompt')

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/arcade`)
    await ready(page, 'arcade')
    const dc = await drawCalls(page)
    console.log(`draw calls arcade ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

for (const [hash, title, x, z] of [
  ['rocket-league', /rocket league/i, -7.5, -6.5],
  ['fifa', /fifa/i, -4.5, -6.5],
  ['games', /arcade cabinets/i, 8.5, -2],
] as const) {
  test(`deep link #${hash} opens its panel here`, async ({ page }) => {
    await page.goto(`/#${hash}`)
    await ready(page, 'arcade')
    await settle(page)
    await expect(page.getByRole('dialog', { name: title })).toBeVisible()
    const p = await pose(page)
    expect(Math.hypot(p.x - x, p.z - z)).toBeLessThan(0.3)
  })
}

test('walk in to the first prompt', async ({ page }) => {
  await page.goto('/#/b/arcade')
  await ready(page, 'arcade')
  await settle(page)
  await walkTo(page, -7.5, -6.5)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'rocket-league')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('a stop opens its item: the Halo cabinet', async ({ page }) => {
  await page.goto('/#/b/arcade')
  await ready(page, 'arcade')
  await settle(page)
  // Halo = game 11 = row 1, column 5: (7.5, -14); stand in front at z -12.5
  await walkTo(page, 6, -12.5)
  await walkTo(page, 7.5, -12.5)
  await expect(prompt(page)).toHaveAttribute('data-exhibit', 'games')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.locator('[aria-current="true"]')).toHaveText(/Halo/)
})

test('walk out', async ({ page }) => {
  await page.goto('/#/b/arcade')
  await ready(page, 'arcade')
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  await settle(page)
  const p = await pose(page)
  expect(Math.hypot(p.x + 24, p.z - 34.5)).toBeLessThan(0.3)
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
})
