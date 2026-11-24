import { test, expect, type Page } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, pose, ready, trackErrors } from '../helpers'

const HOME: { id: string; title: string; pos: [number, number] }[] = [
  { id: 'usacs', title: 'USACS Education & Mentorship', pos: [-7, -12] },
  { id: 'hackru', title: 'Head of Judging Operations', pos: [0, -12] },
  { id: 'calc-ii-la', title: 'Calculus II Learning Assistant', pos: [7, -12] },
  { id: 'honors-ambassador', title: 'Honors College Ambassador', pos: [-6, -6] },
  { id: 'orientation-leader', title: 'Orientation Leader', pos: [-2, -6] },
  { id: 'teaching-mentoring', title: 'Teaching & Mentoring', pos: [6, -6] },
]

async function settled(page: Page) {
  await ready(page, 'civic-center')
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
  await expect(page.locator(WORLD)).toHaveAttribute('data-pose', /.+/)
  await page.locator(WORLD).focus()
}

test.describe('civic center', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop flows')
    await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
  })

  for (const [label, url] of [['full', '/#/b/civic-center'], ['low', '/?fx=low#/b/civic-center']] as const) {
    test(`draw calls (${label}) <= 150`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(url)
      await ready(page, 'civic-center')
      const n = await drawCalls(page)
      console.log(`civic-center draw calls (${label}): ${n}`)
      expect(n).toBeGreaterThan(1)
      expect(n).toBeLessThanOrEqual(150)
      expect(errors).toEqual([])
    })
  }

  test('every home exhibit deep link opens its panel here', async ({ page }) => {
    for (const e of HOME) {
      await page.goto(`/#${e.id}`)
      await page.reload()
      await settled(page)
      await expect(page.getByRole('dialog', { name: e.title })).toBeVisible()
      const p = await pose(page)
      expect(Math.hypot(p.x - e.pos[0], p.z - (e.pos[1] + 1.5))).toBeLessThan(0.3)
    }
  })

  test('walk in from the entrance to the first exhibit prompt', async ({ page }) => {
    await page.goto('/#/b/civic-center')
    await settled(page)
    await holdUntil(page, 'ArrowUp', (p) => p.z < -4.6)
    await expect(page.locator('[data-testid=prompt]')).toHaveAttribute('data-exhibit', /.+/)
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('walk out', async ({ page }) => {
    await page.goto('/#/b/civic-center')
    await settled(page)
    await page.keyboard.down('ArrowDown')
    try {
      await expect(page.locator(`${WORLD}[data-scene="world"]`)).toBeVisible({ timeout: 20_000 })
    } finally {
      await page.keyboard.up('ArrowDown')
    }
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    const p = await pose(page)
    expect(Math.hypot(p.x - 12, p.z + 22.5)).toBeLessThan(1.2) // a key still held at the door keeps walking once idle
  })
})
