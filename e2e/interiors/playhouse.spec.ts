import { test, expect } from '@playwright/test'
import { WORLD, drawCalls, pose, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/playhouse`)
    await ready(page, 'playhouse')
    await settle(page)
    const dc = await drawCalls(page)
    console.log(`draw calls playhouse ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('deep link opens the show panel in front of the playbill', async ({ page }) => {
  await page.goto('/#stranger-things')
  await ready(page, 'playhouse')
  await expect(page.getByRole('dialog', { name: /stranger things/i })).toBeVisible()
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x, p.z + 9.5)
    })
    .toBeLessThan(0.3)
})

test('walk in to the playbill prompt', async ({ page }) => {
  await page.goto('/#/b/playhouse')
  await ready(page, 'playhouse')
  await settle(page)
  await walkTo(page, 0, -9.5)
  await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'stranger-things')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /stranger things/i })).toBeVisible()
})

test('walk out through the south exit', async ({ page }) => {
  await page.goto('/#/b/playhouse')
  await ready(page, 'playhouse')
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
  await settle(page)
  await page.waitForTimeout(1500)
  await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
  const p = await pose(page)
  expect(Math.hypot(p.x + 20, p.z + 7.5)).toBeLessThan(0.3)
})
