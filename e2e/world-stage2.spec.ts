import { test, expect, type Page } from '@playwright/test'
import { getExhibit } from '../src/content'
import { exitPose } from '../src/world/logic/layout'
import { inFront } from '../src/world/types'
import type { BuildingId } from '../src/content/types'
import { WORLD, drawCalls, holdUntil, pose, ready, trackErrors, trackExternal } from './helpers'

const started = (page: Page) => page.addInitScript(() => sessionStorage.setItem('world.started', '1'))

type Home = { scene: BuildingId; floor?: number }
const W: Home = { scene: 'workshop' }
const C: Home = { scene: 'civic-center' }
const Q: Home = { scene: 'campus-quad' }
const H: Home = { scene: 'hall-of-fame' }
const HQ = (floor: number): Home => ({ scene: 'hq-tower', floor })

/** 24 stations and 7 banners, each with the building (and HQ floor) it lives in. */
const HOMES: Record<string, Home> = {
  'tranquility-base': W, 'dreams-come-true': W, 'debate-mate': W, 'zayi-ai-studio': W, 'airbnb-classifier': W,
  'shah-sokoloff': HQ(1), 'code-ninjas': HQ(2), oculogica: HQ(3), 'ai-camp': HQ(3), 'zayi-fellow': HQ(4),
  usacs: C, hackru: C, 'calc-ii-la': C, 'honors-ambassador': C, 'orientation-leader': C, 'teaching-mentoring': C,
  'rutgers-honors': Q, 'critics-choice': Q, ccm: Q, robotics: Q, 'advisory-council': Q, hackmcst: Q, nslc: Q, 'java-juniors': Q,
  'critics-choice-prize': H, 'best-code-tech': H, 'best-gemini': H, 'bloodiest-game': H, 'academy-scholar': H, 'rising-star': H, 'honor-societies': H,
}

test.describe('stage 2 (desktop)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop flows'))
  test.beforeEach(async ({ page }) => started(page))

  test('every station and banner deep link lands home with its panel', async ({ page }) => {
    test.setTimeout(240_000)
    expect(Object.keys(HOMES)).toHaveLength(31)
    for (const [id, home] of Object.entries(HOMES)) {
      await page.goto(`/#${id}`)
      await page.reload()
      await ready(page, home.scene, home.floor)
      await expect(page.getByRole('dialog')).toHaveCount(1)
      const pos = getExhibit(id)?.pos
      expect(pos, id).toBeTruthy()
      const want = inFront(pos!)
      await expect
        .poll(async () => {
          const p = await pose(page)
          return Math.hypot(p.x - want.x, p.z - want.z)
        }, { message: id })
        .toBeLessThan(0.3)
    }
  })

  test('mirrors never change the home', async ({ page }) => {
    await page.goto('/#oculogica')
    await ready(page, 'hq-tower', 3)
    await page.goto('/#/b/workshop')
    await page.reload()
    await ready(page, 'workshop')
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    await page.locator(WORLD).focus()
    await holdUntil(page, 'ArrowUp', ({ z }) => z < -4.6)
    await expect(page.getByTestId('prompt')).toHaveAttribute('data-exhibit', 'oculogica')
    await page.keyboard.press('e')
    await expect(page.getByRole('dialog', { name: 'Machine Learning Research Intern' })).toBeVisible()
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'workshop')
  })

  test('fast travel across buildings and floors', async ({ page }) => {
    await page.goto('/#/b/workshop')
    await ready(page, 'workshop')
    await page.getByRole('button', { name: 'Map' }).click()
    await page.getByRole('button', { name: /^AI Fellow/ }).click()
    await ready(page, 'hq-tower', 4)
    await page.goBack()
    await ready(page, 'workshop')
    await page.goForward()
    await ready(page, 'hq-tower', 4)
  })

  test('walk out of every career building', async ({ page }) => {
    test.setTimeout(120_000)
    for (const id of ['workshop', 'hq-tower', 'civic-center', 'campus-quad', 'hall-of-fame'] as const) {
      await page.goto(`/#/b/${id}`)
      await page.reload()
      await ready(page, id)
      await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
      await page.locator(WORLD).focus()
      await page.keyboard.down('ArrowDown')
      try {
        await page.waitForFunction(() => document.querySelector('[data-world-focus]')?.getAttribute('data-scene') === 'world', undefined, { polling: 'raf', timeout: 20_000 })
      } finally {
        await page.keyboard.up('ArrowDown')
      }
      await ready(page, 'world')
      const want = exitPose(id)
      await expect
        .poll(async () => {
          const p = await pose(page)
          return Math.hypot(p.x - want.x, p.z - want.z)
        }, { message: id })
        .toBeLessThan(0.5)
      await page.waitForTimeout(1500)
      await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world')
    }
  })

  test('a key held across the scene fade works as soon as the scene is idle', async ({ page }) => {
    await page.goto('/#/b/civic-center')
    await page.locator(WORLD).waitFor({ state: 'attached' })
    await page.locator(WORLD).focus()
    await page.keyboard.down('ArrowUp')
    try {
      await ready(page, 'civic-center')
      await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
      await expect.poll(async () => (await pose(page)).z, { timeout: 5_000 }).toBeLessThan(-2.5)
    } finally {
      await page.keyboard.up('ArrowUp')
    }
  })

  test('holding ArrowDown through a stairs ride lands exactly one floor lower', async ({ page }) => {
    await page.goto('/#/b/hq-tower/4')
    await ready(page, 'hq-tower', 4)
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    await page.locator(WORLD).focus()
    // from the elevator arrival, walk to the stair landing lane first
    await holdUntil(page, 'ArrowDown', ({ z }) => z >= -2.5)
    await holdUntil(page, 'ArrowRight', ({ x }) => x >= -0.2)
    await page.keyboard.down('ArrowDown')
    try {
      await page.waitForURL(/#\/b\/hq-tower\/3$/, { timeout: 15_000 })
      await ready(page, 'hq-tower', 3)
      await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
      await page.waitForTimeout(3000)
      expect(page.url()).toMatch(/#\/b\/hq-tower\/3$/)
      await expect(page.locator(WORLD)).toHaveAttribute('data-floor', '3')
    } finally {
      await page.keyboard.up('ArrowDown')
    }
  })

  test('media failure keeps interiors working', async ({ page }) => {
    test.setTimeout(120_000)
    const errors = trackErrors(page, (m) => /Failed to load resource|ERR_FAILED/.test(m.text()))
    await page.route('**/media/**', (r) => r.abort())
    for (const [hash, scene, floor] of [
      ['#/b/campus-quad', 'campus-quad'], ['#/b/hall-of-fame', 'hall-of-fame'], ['#/b/workshop', 'workshop'], ['#/b/hq-tower/3', 'hq-tower', 3],
    ] as const) {
      await page.goto(`/${hash}`)
      await page.reload()
      await ready(page, scene, floor)
      expect(await drawCalls(page), hash).toBeLessThanOrEqual(150)
    }
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('no external requests touring every career building', async ({ page, baseURL }) => {
    test.setTimeout(120_000)
    const external = trackExternal(page, baseURL!)
    for (const [hash, scene, floor] of [
      ['#/b/workshop', 'workshop'], ['#/b/hq-tower', 'hq-tower', 1], ['#/b/hq-tower/4', 'hq-tower', 4],
      ['#/b/civic-center', 'civic-center'], ['#/b/campus-quad', 'campus-quad'], ['#/b/hall-of-fame', 'hall-of-fame'], ['#/b/cinema', 'cinema'],
    ] as const) {
      await page.goto(`/${hash}`)
      await ready(page, scene, floor)
    }
    expect(external, external.join('\n')).toEqual([])
  })

  for (const fx of ['full', 'low'] as const) {
    test(`draw calls (${fx}) <= 150 in every interior`, async ({ page }) => {
      test.setTimeout(180_000)
      const errors = trackErrors(page)
      const counts: string[] = []
      for (const [hash, scene, floor] of [
        ['#/b/workshop', 'workshop'], ['#/b/hq-tower', 'hq-tower', 1], ['#/b/hq-tower/2', 'hq-tower', 2], ['#/b/hq-tower/3', 'hq-tower', 3],
        ['#/b/hq-tower/4', 'hq-tower', 4], ['#/b/civic-center', 'civic-center'], ['#/b/campus-quad', 'campus-quad'],
        ['#/b/hall-of-fame', 'hall-of-fame'], ['#/b/cinema', 'cinema'],
      ] as const) {
        await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}${hash}`)
        await page.reload()
        await ready(page, scene, floor)
        const n = await drawCalls(page)
        counts.push(`${scene}${floor ? `/${floor}` : ''}=${n}`)
        expect(n, hash).toBeGreaterThan(1)
        expect(n, hash).toBeLessThanOrEqual(150)
      }
      console.log(`draw calls (${fx}): ${counts.join(' ')}`)
      expect(errors, errors.join('\n')).toEqual([])
    })
  }
})

test.describe('stage 2 (tablet)', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile', 'mobile flows'))
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })
  test('Explore, Map, Campus Quad: ready, joystick visible, draw calls within budget', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore' }).click()
    await ready(page, 'world')
    await page.getByRole('button', { name: 'Map' }).click()
    await page.getByRole('button', { name: 'Campus Quad', exact: true }).click()
    await ready(page, 'campus-quad')
    await expect(page.getByTestId('joystick')).toBeVisible()
    expect(await drawCalls(page)).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
})
