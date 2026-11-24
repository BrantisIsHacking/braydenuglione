import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, trackErrors } from '../helpers'
import { exhibitsIn, getExhibit } from '../../src/content'
import { placedIn } from '../../src/world/logic/interior'

const HOME = placedIn('workshop')

/** Scene committed, fade finished and the player writing its pose: keys now take effect. */
async function settled(page: Page) {
  await ready(page, 'workshop')
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
  await expect(page.locator(WORLD)).toHaveAttribute('data-pose', /,/)
  await page.waitForTimeout(300)
}

test.describe('workshop interior', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop flows')
    await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
  })

  for (const [name, url] of [['full', '/#/b/workshop'], ['low', '/?fx=low#/b/workshop']] as const) {
    test(`draw calls (${name}) <= 150`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(url)
      await ready(page, 'workshop')
      const n = await drawCalls(page)
      console.log(`workshop draw calls (${name}): ${n}`)
      expect(n).toBeGreaterThan(1)
      expect(n).toBeLessThanOrEqual(150)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('every home exhibit deep link opens its panel here', async ({ page }) => {
    test.setTimeout(120_000)
    // oculogica is a mirror here; its deep link opens HQ Tower floor 3 (covered by the HQ spec)
    const homeIds = new Set(exhibitsIn('workshop').filter((p) => !p.mirror).map((p) => p.exhibit.id))
    for (const e of HOME.filter((h) => homeIds.has(h.id))) {
      await page.goto('about:blank')
      await page.goto(`/#${e.id}`)
      await ready(page, 'workshop')
      await expect(page.getByRole('dialog', { name: getExhibit(e.id)!.title })).toBeVisible()
      await expect
        .poll(async () => {
          const p = await pose(page)
          return Math.hypot(p.x - e.pos[0], p.z - (e.pos[1] + 1.5))
        })
        .toBeLessThan(0.3)
    }
  })

  test('walk in from the entrance to the first exhibit prompt', async ({ page }) => {
    await page.goto('/#/b/workshop')
    await settled(page)
    const prompt = page.getByTestId('prompt')
    await page.keyboard.down('ArrowUp')
    try {
      await expect(prompt).toHaveAttribute('data-exhibit', /.+/, { timeout: 20_000 })
    } finally {
      await page.keyboard.up('ArrowUp')
    }
    const id = (await prompt.getAttribute('data-exhibit'))!
    expect(HOME.map((h) => h.id)).toContain(id)
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: getExhibit(id)!.title })).toBeVisible()
  })

  test('walk out', async ({ page }) => {
    await page.goto('/#/b/workshop')
    await settled(page)
    await holdUntil(page, 'ArrowDown', '(p) => p.z > 5 || p.x > 5')
    await expect(page.locator(`${WORLD}[data-scene="world"]`)).toBeVisible()
    await expect
      .poll(async () => {
        const p = await pose(page)
        return Math.hypot(p.x - 30, p.z + 22.5)
      })
      .toBeLessThan(1.2)
  })
})
