import { test, expect } from '@playwright/test'
import { WORLD, drawCalls, pose, ready, trackErrors } from '../helpers'

const HOME: Record<string, [number, number]> = {
  'rutgers-honors': [-8, -16], 'critics-choice': [0, -16], ccm: [8, -16],
  robotics: [-10, -9], 'advisory-council': [-5, -9], hackmcst: [0, -9], nslc: [5, -9], 'java-juniors': [10, -9],
}
const TITLES: Record<string, RegExp> = {
  'critics-choice': /Critic's Choice Documentary/,
}

test.describe('campus quad', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop flows')
    await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
  })

  for (const [label, url] of [['full', '/#/b/campus-quad'], ['low', '/?fx=low#/b/campus-quad']] as const) {
    test(`draw calls (${label}) <= 150`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(url)
      await ready(page, 'campus-quad')
      const n = await drawCalls(page)
      console.log(`campus-quad draw calls ${label}: ${n}`)
      expect(n).toBeGreaterThan(1)
      expect(n).toBeLessThanOrEqual(150)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('every home exhibit deep link opens its panel here', async ({ page }) => {
    for (const [id, pos] of Object.entries(HOME)) {
      await page.goto('about:blank')
      await page.goto(`/#${id}`)
      await ready(page, 'campus-quad')
      const dlg = page.getByRole('dialog', TITLES[id] ? { name: TITLES[id] } : {})
      await expect(dlg.first()).toBeVisible()
      await expect
        .poll(async () => { const p = await pose(page); return Math.hypot(p.x - pos[0], p.z - (pos[1] + 1.5)) }, { message: id })
        .toBeLessThan(0.3)
      if (id === 'critics-choice') {
        await expect(page.getByRole('button', { name: /^Play/ })).toBeVisible()
        await expect(page.locator('iframe')).toHaveCount(0)
      }
      await page.keyboard.press('Escape')
    }
  })

  test('walk in from the entrance to the first exhibit prompt', async ({ page }) => {
    await page.goto('/#/b/campus-quad')
    await ready(page, 'campus-quad')
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    await page.keyboard.down('ArrowUp')
    try {
      await page.waitForFunction(() => !!document.querySelector('[data-testid=prompt]'), undefined, { polling: 'raf', timeout: 20_000 })
    } finally {
      await page.keyboard.up('ArrowUp')
    }
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'hackmcst')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('walk out', async ({ page }) => {
    await page.goto('/#/b/campus-quad')
    await ready(page, 'campus-quad')
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    await page.keyboard.down('ArrowDown')
    try {
      await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
    } finally {
      await page.keyboard.up('ArrowDown')
    }
    await ready(page, 'world')
    const p = await pose(page)
    expect(Math.hypot(p.x + 30, p.z + 22.5)).toBeLessThan(1.2) // a key still held at the door keeps walking once idle
  })
})
