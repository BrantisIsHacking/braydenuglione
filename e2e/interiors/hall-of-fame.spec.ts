import { test, expect } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, trackErrors } from '../helpers'
import { exhibitsIn } from '../../src/content'
import { inFront } from '../../src/world/types'
import { exitPose } from '../../src/world/logic/layout'

const HOME = exhibitsIn('hall-of-fame').filter((p) => !p.mirror)

test.describe('hall of fame interior', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop flows')
    await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
  })

  for (const [name, url] of [['full', '/#/b/hall-of-fame'], ['low', '/?fx=low#/b/hall-of-fame']] as const) {
    test(`draw calls (${name}) <= 150`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(url)
      await ready(page, 'hall-of-fame')
      const n = await drawCalls(page)
      console.log(`hall-of-fame draw calls ${name}: ${n}`)
      expect(n).toBeGreaterThan(1)
      expect(n).toBeLessThanOrEqual(150)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('every home exhibit deep link opens its panel here', async ({ page }) => {
    for (const p of HOME) {
      await page.goto('about:blank')
      await page.goto('/#' + p.exhibit.id)
      await ready(page, 'hall-of-fame')
      await expect(page.getByRole('dialog', { name: p.exhibit.title })).toBeVisible()
      const want = inFront(p.pos!)
      await expect
        .poll(async () => {
          const at = await pose(page)
          return Math.hypot(at.x - want.x, at.z - want.z)
        })
        .toBeLessThan(0.3)
    }
  })

  test('critics-choice deep link lands home, not here', async ({ page }) => {
    await page.goto('/#critics-choice')
    await ready(page, 'campus-quad')
  })

  test('walk in, press e at the mirror screen, panel opens and scene stays', async ({ page }) => {
    await page.goto('/#/b/hall-of-fame')
    await ready(page, 'hall-of-fame')
    await page.waitForTimeout(1000)
    await holdUntil(page, 'ArrowRight', ({ x }) => x >= 7.4)
    await holdUntil(page, 'ArrowUp', ({ z }) => z <= -4.4)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'critics-choice')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: "Critic's Choice Documentary" })).toBeVisible()
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'hall-of-fame')
  })

  test('walk out', async ({ page }) => {
    await page.goto('/#/b/hall-of-fame')
    await ready(page, 'hall-of-fame')
    await page.waitForTimeout(1000)
    await page.keyboard.down('ArrowDown')
    await page.waitForFunction(() => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') === 'world', null, { polling: 'raf', timeout: 15_000 })
    await page.keyboard.up('ArrowDown')
    await ready(page, 'world')
    const want = exitPose('hall-of-fame')
    await expect
      .poll(async () => {
        const at = await pose(page)
        return Math.hypot(at.x - want.x, at.z - want.z)
      })
      .toBeLessThan(1.2)
  })
})
