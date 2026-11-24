import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, trackErrors } from '../helpers'

async function started(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
}

const dialog = (page: Page) => page.getByRole('dialog', { name: 'Elevator' })

/** From the floor-1 entrance (0,-2): left to the lane, then up onto the pad. */
async function walkToPad(page: Page) {
  await page.locator(WORLD).focus()
  // the first key press can land before input is live; nudge until the player actually moves
  await expect
    .poll(async () => {
      await page.keyboard.down('ArrowLeft')
      await page.waitForTimeout(150)
      await page.keyboard.up('ArrowLeft')
      return (await pose(page)).x
    }, { timeout: 10_000 })
    .toBeLessThan(-0.3)
  await holdUntil(page, 'ArrowLeft', ({ x }) => x <= -5.5)
  await page.keyboard.down('ArrowUp')
  try {
    await expect(dialog(page)).toBeVisible({ timeout: 10_000 })
  } finally {
    await page.keyboard.up('ArrowUp')
  }
}

test.describe('hq-tower (desktop)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop flows'))

  for (const fx of ['full', 'low'] as const) {
    for (const f of [1, 2, 3, 4]) {
      test(`floor ${f} (${fx}): draw calls <= 150`, async ({ page }) => {
        const errors = trackErrors(page)
        await started(page)
        await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/hq-tower${f === 1 ? '' : `/${f}`}`)
        await ready(page, 'hq-tower', f)
        const dc = await drawCalls(page)
        console.log(`draw calls hq-tower floor ${f} ${fx}: ${dc}`)
        expect(dc).toBeGreaterThan(1)
        expect(dc).toBeLessThanOrEqual(150)
        expect(errors, errors.join('\n')).toEqual([])
      })
    }
  }

  test('every home exhibit deep link opens its panel on its floor', async ({ page }) => {
    await started(page)
    const cases: [string, string, number][] = [
      ['shah-sokoloff', 'IT Contractor', 1], ['code-ninjas', 'Curriculum Developer', 2], ['oculogica', 'Machine Learning Research Intern', 3],
      ['ai-camp', 'AI Camp', 3], ['zayi-fellow', 'AI Fellow', 4],
    ]
    for (const [id, name, floor] of cases) {
      await page.goto(`/#${id}`)
      await page.reload()
      await ready(page, 'hq-tower', floor)
      await expect(page.getByRole('dialog', { name: new RegExp(name, 'i') })).toBeVisible()
    }
  })

  test('floor 1 south exit leaves to the world at the HQ door', async ({ page }) => {
    await started(page)
    await page.goto('/#/b/hq-tower')
    await ready(page, 'hq-tower', 1)
    await page.waitForTimeout(500)
    await page.keyboard.down('ArrowDown')
    try {
      await page.waitForFunction(() => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') === 'world', undefined, { polling: 'raf' })
    } finally {
      await page.keyboard.up('ArrowDown')
    }
    await ready(page, 'world')
    await expect
      .poll(async () => {
        const p = await pose(page)
        return Math.hypot(p.x + 12, p.z + 22.5)
      })
      .toBeLessThan(0.5)
  })

  test('floor 3 south exit is a stairwell down to floor 2', async ({ page }) => {
    await started(page)
    await page.goto('/#/b/hq-tower/3')
    await ready(page, 'hq-tower', 3)
    await page.waitForTimeout(500)
    // arrival is the elevator pose; walk to the stair landing lane then south
    await holdUntil(page, 'ArrowDown', ({ z }) => z >= -2.5)
    await holdUntil(page, 'ArrowRight', ({ x }) => x >= -0.2)
    await page.keyboard.down('ArrowDown')
    await page.waitForURL(/#\/b\/hq-tower\/2$/, { timeout: 15_000 })
    await page.keyboard.up('ArrowDown')
    await ready(page, 'hq-tower', 2)
  })

  test('elevator Up and Down buttons move one floor and Back leaves the building', async ({ page }) => {
    await started(page)
    await page.goto('/#/world')
    await ready(page, 'world')
    await page.evaluate(() => {
      location.hash = '#/b/hq-tower'
    })
    await ready(page, 'hq-tower', 1)
    const before = await page.evaluate(() => history.length)
    await walkToPad(page)
    await expect(dialog(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Down' })).toBeDisabled()
    await page.getByRole('button', { name: 'Up' }).click()
    await ready(page, 'hq-tower', 2)
    expect(page.url()).toContain('#/b/hq-tower/2')
    expect(await page.evaluate(() => history.length)).toBe(before)
    await expect
      .poll(async () => {
        const p = await pose(page)
        return Math.hypot(p.x + 5.5, p.z + 7.6)
      })
      .toBeLessThan(0.5)
    await page.locator(WORLD).focus()
    await expect.poll(async () => {
      await page.keyboard.down('ArrowUp')
      await page.waitForTimeout(250)
      await page.keyboard.up('ArrowUp')
      return dialog(page).isVisible()
    }, { timeout: 10_000 }).toBe(true)
    await page.getByRole('button', { name: 'Down' }).click()
    await ready(page, 'hq-tower', 1)
    await page.goBack()
    await ready(page, 'world')
  })

  test('Esc, stand, step off and on', async ({ page }) => {
    await started(page)
    await page.goto('/#/b/hq-tower')
    await ready(page, 'hq-tower', 1)
    await walkToPad(page)
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await page.waitForTimeout(1000)
    await expect(dialog(page)).toBeHidden()
    await page.keyboard.press('e')
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page)).toBeHidden()
    await page.keyboard.down('ArrowDown')
    await page.waitForTimeout(400)
    await page.keyboard.up('ArrowDown')
    await page.keyboard.down('ArrowUp')
    await expect(dialog(page)).toBeVisible()
    await page.keyboard.up('ArrowUp')
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'hq-tower')
  })
})
