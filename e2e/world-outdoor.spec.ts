import { test, expect, type Page } from '@playwright/test'
import { exitPose, spotPose } from '../src/world/logic/layout'
import { WORLD, drawCalls, pose, ready, settle, trackErrors } from './helpers'

const started = (page: Page) => page.addInitScript(() => sessionStorage.setItem('world.started', '1'))

// Stage 3 W0 baseline (world-stage-3 @ 7da8b50): world draw calls full 66, low 49. Task 10 target: baseline + 35.
const BASE = { full: 66, low: 49 }

async function expectPose(page: Page, want: { x: number; z: number }, tol = 0.6) {
  await settle(page)
  const p = await pose(page)
  expect(Math.abs(p.x - want.x), `x ${p.x}`).toBeLessThanOrEqual(tol)
  expect(Math.abs(p.z - want.z), `z ${p.z}`).toBeLessThanOrEqual(tol)
}

test.describe('outdoor (desktop)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop flows'))
  test.beforeEach(async ({ page }) => started(page))

  for (const fx of ['full', 'low'] as const) {
    test(`world draw calls (${fx}) <= 200 and <= baseline + 35`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/world`)
      await ready(page, 'world')
      await expect(page.locator(WORLD)).toHaveAttribute('data-fx', fx)
      const dc = await drawCalls(page)
      console.log(`draw calls world ${fx}: ${dc}`)
      expect(dc).toBeLessThanOrEqual(200)
      expect(dc).toBeLessThanOrEqual(BASE[fx] + 35)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  for (const [hash, scene, title, building] of [
    ['#chess', 'world', 'Chess', 'chess-park'],
    ['#roundnet', 'world', 'Roundnet club', 'park'],
  ] as const) {
    test(`${hash} lands in the world on its spot with the panel`, async ({ page }) => {
      const errors = trackErrors(page)
      await page.goto(`/${hash}`)
      await page.reload()
      await ready(page, scene)
      await expect(page.getByRole('dialog', { name: title })).toBeVisible()
      await expectPose(page, spotPose(building))
      expect(errors, errors.join('\n')).toEqual([])
    })
  }

  test('Map to the Library door, enter, Back lands on its exit pose', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/#/world')
    await ready(page, 'world')
    await page.getByRole('button', { name: 'Map' }).click()
    await page.getByRole('button', { name: 'Library', exact: true }).click()
    await ready(page, 'library')
    await page.goBack()
    await ready(page, 'world')
    await expectPose(page, exitPose('library'))
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('outdoor tablet 820x1180 (touch)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile', 'mobile flows'))
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })

  test('Explore: world ready, draw calls <= 200, joystick visible', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore' }).click()
    await ready(page, 'world')
    await expect(page.getByTestId('joystick')).toBeVisible()
    const dc = await drawCalls(page)
    console.log(`draw calls world tablet: ${dc}`)
    expect(dc).toBeLessThanOrEqual(200)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
