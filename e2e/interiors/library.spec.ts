import { test, expect } from '@playwright/test'
import { WORLD, drawCalls, pose, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/library`)
    await ready(page, 'library')
    await settle(page)
    const dc = await drawCalls(page)
    console.log(`draw calls library ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('the books deep link opens its panel at the favorites table', async ({ page }) => {
  await page.goto('/#books')
  await ready(page, 'library')
  await expect(page.getByRole('dialog', { name: /books/i })).toBeVisible()
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x - 0, p.z - -6.5)
    })
    .toBeLessThan(0.3)
})

test('walk in to the favorites table prompt', async ({ page }) => {
  await page.goto('/#/b/library')
  await ready(page, 'library')
  await settle(page)
  await walkTo(page, 0, -6.5)
  await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'books')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /books/i })).toBeVisible()
})

test('the middle shelf unit opens the books panel on its first title', async ({ page }) => {
  await page.goto('/#/b/library')
  await ready(page, 'library')
  await settle(page)
  // the favorites table blocks the centre line: go round it
  await walkTo(page, 3.5, -2)
  await walkTo(page, 3.5, -14.5)
  await walkTo(page, 0, -14.5)
  await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'books')
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: /books/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[aria-current="true"]')).toHaveCount(1)
  await expect(dialog.locator('[aria-current="true"]')).toContainText(/\S/)
})

test('walk out through the south exit', async ({ page }) => {
  await page.goto('/#/b/library')
  await ready(page, 'library')
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  await ready(page, 'world')
  await settle(page)
  const p = await pose(page)
  expect(Math.hypot(p.x + 36, p.z + 7)).toBeLessThan(0.3)
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
})

