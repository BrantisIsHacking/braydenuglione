import { test, expect, type Page } from '@playwright/test'
import { getExhibit } from '../src/content'
import type { BuildingId } from '../src/content/types'
import { exitPose, spotPose } from '../src/world/logic/layout'
import { inFront } from '../src/world/types'
import { WORLD, drawCalls, holdUntil, pose, ready, settle, trackErrors, trackExternal, walkTo } from './helpers'

const started = (page: Page) => page.addInitScript(() => sessionStorage.setItem('world.started', '1'))

async function near(page: Page, want: { x: number; z: number }, message: string, tol = 0.3) {
  await expect
    .poll(async () => {
      const p = await pose(page)
      return Math.hypot(p.x - want.x, p.z - want.z)
    }, { message })
    .toBeLessThan(tol)
}

// The 13 interests: where each deep link lands (literal table, not derived from content).
const INTERESTS: { id: string; scene: string; floor?: number; title: RegExp; spot?: BuildingId }[] = [
  { id: 'basketball', scene: 'gym', title: /varsity basketball/i },
  { id: 'golf', scene: 'golf-clubhouse', floor: 1, title: /varsity golf/i },
  { id: 'chess', scene: 'world', title: /^chess$/i, spot: 'chess-park' },
  { id: 'rocket-league', scene: 'arcade', title: /rocket league/i },
  { id: 'fifa', scene: 'arcade', title: /fifa/i },
  { id: 'games', scene: 'arcade', title: /arcade cabinets/i },
  { id: 'roundnet', scene: 'world', title: /roundnet/i, spot: 'park' },
  { id: 'teams', scene: 'fan-shop', title: /teams/i },
  { id: 'movies', scene: 'cinema', title: /movies/i },
  { id: 'books', scene: 'library', title: /books/i },
  { id: 'music', scene: 'record-store', title: /music/i },
  { id: 'karaoke', scene: 'record-store', title: /karaoke/i },
  { id: 'stranger-things', scene: 'playhouse', title: /stranger things/i },
]

test.describe('stage 3 interests (desktop)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop flows'))
  test.beforeEach(async ({ page }) => started(page))

  test('every interest deep link lands home with its panel', async ({ page }) => {
    test.setTimeout(240_000)
    const errors = trackErrors(page)
    expect(INTERESTS).toHaveLength(13)
    for (const it of INTERESTS) {
      await page.goto(`/#${it.id}`)
      await page.reload()
      await ready(page, it.scene, it.floor)
      await expect(page.getByRole('dialog', { name: it.title }), it.id).toBeVisible()
      if (it.spot) {
        await settle(page)
        await near(page, spotPose(it.spot), it.id, 0.6)
      } else {
        const pos = getExhibit(it.id)?.pos
        expect(pos, it.id).toBeTruthy()
        await near(page, inFront(pos!), it.id)
      }
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('collection stops open on their item, and the highlight never leaks', async ({ page }) => {
    test.setTimeout(180_000)
    const errors = trackErrors(page)
    const current = page.locator('[aria-current="true"]')

    // library unit 3 (the shelf unit on the east side)
    await page.goto('/#/b/library')
    await ready(page, 'library')
    await settle(page)
    await walkTo(page, 3.5, -2)
    await walkTo(page, 3.5, -14.5)
    await walkTo(page, 6.5, -14.5)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'books')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: /books/i })).toBeVisible()
    await expect(current).toHaveText(/The Outsiders/)
    await page.keyboard.press('Escape')

    // arcade Halo
    await page.goto('/#/b/arcade')
    await ready(page, 'arcade')
    await settle(page)
    await walkTo(page, 6, -12.5)
    await walkTo(page, 7.5, -12.5)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'games')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(current).toHaveText(/Halo/)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    // fan shop Manchester City
    await page.goto('/#/b/fan-shop')
    await ready(page, 'fan-shop')
    await settle(page)
    await walkTo(page, 5, -10.5)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'teams')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: /teams/i })).toBeVisible()
    await expect(current).toHaveText(/Manchester City/)
    await page.keyboard.press('Escape')

    // cinema Cars poster stop
    await page.goto('/#/b/cinema')
    await ready(page, 'cinema')
    await settle(page)
    await walkTo(page, -1.5, -13.5)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'movies')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: /movies/i })).toBeVisible()
    await expect(current).toHaveText(/Cars/)
    await page.keyboard.press('Escape')

    // a fresh deep link on the games collection highlights nothing
    await page.goto('/#games')
    await page.reload()
    await ready(page, 'arcade')
    await expect(page.getByRole('dialog', { name: /arcade cabinets/i })).toBeVisible()
    await expect(current).toHaveCount(0)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('golf round trip: pad up, stairs down, Back leaves; hostile floors land on the clubhouse', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/#/world')
    await ready(page, 'world')
    await page.evaluate(() => {
      location.hash = '#/b/golf-clubhouse'
    })
    await ready(page, 'golf-clubhouse', 1)
    await settle(page)
    await walkTo(page, 0, -9)
    await page.keyboard.down('ArrowUp')
    try {
      await ready(page, 'golf-clubhouse', 2)
    } finally {
      await page.keyboard.up('ArrowUp')
    }
    await settle(page)
    await page.keyboard.down('ArrowDown')
    try {
      await page.waitForFunction((sel) => document.querySelector(sel)?.getAttribute('data-floor') === '1', WORLD, { polling: 'raf', timeout: 15_000 })
      await ready(page, 'golf-clubhouse', 1)
      await page.waitForTimeout(1500)
      await expect(page.locator(WORLD)).toHaveAttribute('data-floor', '1')
    } finally {
      await page.keyboard.up('ArrowDown')
    }
    await page.goBack()
    await ready(page, 'world')
    for (const f of ['3', '0', 'x']) {
      await page.goto(`/#/b/golf-clubhouse/${f}`)
      await page.reload()
      await ready(page, 'golf-clubhouse', 1)
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('walk out of every interest building lands on its exit pose without re-triggering', async ({ page }) => {
    test.setTimeout(240_000)
    const errors = trackErrors(page)
    const ids: BuildingId[] = ['library', 'arcade', 'record-store', 'playhouse', 'fan-shop', 'golf-clubhouse', 'cinema']
    for (const id of ids) {
      await page.goto(`/#/b/${id}`)
      await page.reload()
      await ready(page, id, id === 'golf-clubhouse' ? 1 : undefined)
      await settle(page)
      await page.keyboard.down('ArrowDown')
      try {
        await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 30_000 })
      } finally {
        await page.keyboard.up('ArrowDown')
      }
      await ready(page, 'world')
      await settle(page)
      await near(page, exitPose(id), id)
      await page.waitForTimeout(1500)
      await expect(page.locator(WORLD), id).toHaveAttribute('data-scene', 'world')
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('no external requests touring every interest building', async ({ page, baseURL }) => {
    test.setTimeout(180_000)
    const external = trackExternal(page, baseURL!)
    const errors = trackErrors(page)
    for (const id of ['library', 'arcade', 'record-store', 'playhouse', 'fan-shop', 'golf-clubhouse', 'cinema']) {
      await page.goto(`/#/b/${id}`)
      await page.reload()
      await ready(page, id)
    }
    await page.goto('/#/b/golf-clubhouse/2')
    await ready(page, 'golf-clubhouse', 2)
    await page.waitForTimeout(500)
    expect(external, external.join('\n')).toEqual([])
    expect(errors, errors.join('\n')).toEqual([])
  })

  const BUDGET: { name: string; hash: string; scene: string; floor?: number; max: number }[] = [
    { name: 'world', hash: '#/world', scene: 'world', max: 200 },
    { name: 'library', hash: '#/b/library', scene: 'library', max: 150 },
    { name: 'arcade', hash: '#/b/arcade', scene: 'arcade', max: 150 },
    { name: 'record-store', hash: '#/b/record-store', scene: 'record-store', max: 150 },
    { name: 'playhouse', hash: '#/b/playhouse', scene: 'playhouse', max: 150 },
    { name: 'fan-shop', hash: '#/b/fan-shop', scene: 'fan-shop', max: 150 },
    { name: 'golf-clubhouse', hash: '#/b/golf-clubhouse', scene: 'golf-clubhouse', floor: 1, max: 150 },
    { name: 'golf-course', hash: '#/b/golf-clubhouse/2', scene: 'golf-clubhouse', floor: 2, max: 150 },
  ]
  for (const fx of ['full', 'low'] as const) {
    test(`draw calls (${fx}) within budget in the world and every stage-3 interior`, async ({ page }) => {
      test.setTimeout(240_000)
      const errors = trackErrors(page)
      const out: string[] = []
      for (const b of BUDGET) {
        await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}${b.hash}`)
        await page.reload()
        await ready(page, b.scene, b.floor)
        await expect(page.locator(WORLD)).toHaveAttribute('data-fx', fx)
        const dc = await drawCalls(page)
        out.push(`${b.name}=${dc}`)
        expect(dc, b.name).toBeGreaterThan(1)
        expect(dc, b.name).toBeLessThanOrEqual(b.max)
      }
      console.log(`draw calls (${fx}): ${out.join(' ')}`)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})

test.describe('stage 3 tablet 820x1180 (touch)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile', 'touch flows'))
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })
  test.beforeEach(async ({ page }) => started(page))

  test('Map to the Arcade: ready, joystick visible, draw calls <= 150', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/#/world')
    await ready(page, 'world')
    await page.getByRole('button', { name: 'Map' }).click()
    await page.getByRole('button', { name: 'Arcade', exact: true }).click()
    await ready(page, 'arcade')
    await expect(page.getByTestId('joystick')).toBeVisible()
    const dc = await drawCalls(page)
    console.log(`draw calls tablet arcade: ${dc}`)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('world draw calls <= 200', async ({ page }) => {
    await page.goto('/#/world')
    await ready(page, 'world')
    const dc = await drawCalls(page)
    console.log(`draw calls tablet world: ${dc}`)
    expect(dc).toBeLessThanOrEqual(200)
  })
})

test.describe('stage 3 phone (Pixel 7)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile', 'touch flows'))

  test('Explore, Map, Record Store, an artist stop, tap Interact: music panel on that artist', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = trackErrors(page)
    await page.goto('/')
    await page.getByRole('button', { name: /Explore Brayden.s World/ }).click()
    await ready(page, 'world')
    await page.getByRole('button', { name: 'Map' }).click()
    await page.getByRole('button', { name: 'Record Store', exact: true }).click()
    await ready(page, 'record-store')
    await settle(page)
    await expect(page.getByTestId('joystick')).toBeVisible()
    // the joystick is a pointer drag; the walk uses the same movement through the arrow keys, the tap is real
    await holdUntil(page, 'ArrowUp', ({ z }) => z <= -18.5)
    await walkTo(page, -11.25, -18.5)
    const btn = page.getByTestId('interact-button')
    await expect(btn).toBeVisible()
    await expect(btn).toHaveAttribute('aria-label', /Drake/)
    await btn.tap()
    await expect(page.getByRole('dialog', { name: /music/i })).toBeVisible()
    await expect(page.locator('[aria-current="true"]')).toHaveText(/Drake/)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
