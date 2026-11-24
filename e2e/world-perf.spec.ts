import { test, expect, type Page } from '@playwright/test'
import sharp from 'sharp'
import { WORLD, drawCalls, ready, trackErrors, trackExternal } from './helpers'

const skipUnless = (name: 'desktop' | 'mobile') => ({}, info: { project: { name: string } }) =>
  test.skip(info.project.name !== name, `${name} flows`)

/** Skips the start screen so a cold hash goes straight to the 3D view. */
async function started(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
}

async function canvasPixels(page: Page) {
  const { data, info } = await sharp(await page.locator('canvas').screenshot())
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, channels: info.channels }
}

test.describe('draw-call budgets (desktop)', () => {
  test.beforeEach(skipUnless('desktop'))
  const cases = [
    { name: 'world', hash: '#/world', scene: 'world', max: 200 },
    { name: 'gym', hash: '#/b/gym', scene: 'gym', max: 150 },
    { name: 'library (bespoke)', hash: '#/b/library', scene: 'library', max: 150 },
  ]
  for (const fx of ['full', 'low'] as const) {
    for (const c of cases) {
      test(`${c.name} (${fx}): draw calls <= ${c.max}`, async ({ page }) => {
        const errors = trackErrors(page)
        await started(page)
        await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}${c.hash}`)
        await ready(page, c.scene)
        await expect(page.locator(WORLD)).toHaveAttribute('data-fx', fx)
        const dc = await drawCalls(page)
        console.log(`draw calls ${c.name} ${fx}: ${dc}`)
        expect(dc).toBeGreaterThan(1)
        expect(dc).toBeLessThanOrEqual(c.max)
        expect(errors, errors.join('\n')).toEqual([])
      })
    }
  }
})

test.describe('no cross-origin requests (desktop)', () => {
  test.beforeEach(skipUnless('desktop'))
  test('tour world, gym and three panels stays same-origin; Spotify and YouTube only after their play clicks', async ({ page, baseURL }) => {
    const errors = trackErrors(page)
    const external = trackExternal(page, baseURL!)
    // Requests made by the site itself (main frame); the Spotify iframe's own telemetry and assets are not ours to police.
    const ownFrame: string[] = []
    page.on('request', (r) => {
      if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== new URL(baseURL!).origin && r.frame() === page.mainFrame()) ownFrame.push(r.url())
    })
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore' }).click()
    await ready(page, 'world')
    await page.goto('/#/b/gym')
    await ready(page, 'gym')
    await page.goto('/#books')
    await ready(page, 'library')
    await expect(page.getByRole('dialog', { name: /books/i })).toBeVisible()
    await page.goto('/#movies')
    await ready(page, 'cinema')
    await expect(page.getByRole('dialog', { name: /movies/i })).toBeVisible()
    await page.goto('/#frission')
    await ready(page, 'record-store')
    const spotify = page.getByRole('dialog', { name: /frission/i })
    await expect(spotify).toBeVisible()
    await expect(spotify.locator('iframe')).toHaveCount(0)
    await page.waitForTimeout(500)
    expect(external, external.join('\n')).toEqual([])
    await spotify.getByRole('button', { name: 'Play Frission' }).click()
    await expect(spotify.locator('iframe')).toHaveAttribute('src', 'https://open.spotify.com/embed/playlist/0CMrxtb1wc9P83qlrvmJ3o')
    await page.waitForTimeout(1500)
    external.length = 0
    await page.goto('/#critics-choice')
    await ready(page, 'campus-quad')
    const dialog = page.getByRole('dialog', { name: /critic/i })
    await expect(dialog).toBeVisible()
    await page.waitForTimeout(500)
    expect(ownFrame, ownFrame.join('\n')).toEqual([])

    const play = dialog.getByRole('button', { name: /^Play/ })
    await expect(play).toBeVisible()
    await play.click()
    await expect(dialog.locator('iframe')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//)
    await page.waitForTimeout(1500)
    const hosts = new Set(external.map((u) => new URL(u).hostname))
    for (const h of hosts) expect(h, `unexpected external host ${h}`).toMatch(/(^|\.)(youtube-nocookie\.com|ytimg\.com|spotify\.com|scdn\.co|spotifycdn\.com)$|google|gstatic|ggpht/)
    const own = errors.filter((e) => !/youtube|spotify|google|ERR_|Failed to load resource/i.test(e))
    expect(own, own.join('\n')).toEqual([])
  })
})

test.describe('reduced motion (desktop)', () => {
  test.beforeEach(skipUnless('desktop'))
  test.use({ reducedMotion: 'reduce' })

  test('Box Score default, Explore enters a still, fade-free world', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.locator('[data-exhibit]')).toHaveCount(46)
    await page.getByRole('button', { name: /Explore Brayden.s World/ }).click()
    await ready(page, 'world')
    await expect(page.locator(WORLD)).toHaveAttribute('data-motion', 'reduced')
    await expect(page.locator(WORLD)).not.toHaveAttribute('data-avatar', 'loading', { timeout: 20_000 })

    await page.waitForTimeout(1000)
    const a = await canvasPixels(page)
    await page.waitForTimeout(1000)
    const b = await canvasPixels(page)
    let diff = 0
    let total = 0
    for (let i = 0; i < a.data.length; i += a.channels) {
      total++
      for (let c = 0; c < 3; c++) {
        if (Math.abs(a.data[i + c] - b.data[i + c]) > 8) {
          diff++
          break
        }
      }
    }
    expect(diff / total).toBeLessThanOrEqual(0.005)

    // never fading-out while travelling to the gym through the Map
    await page.evaluate(() => {
      const w = window as unknown as { __seen: Set<string> }
      w.__seen = new Set()
      const tick = () => {
        const v = document.querySelector('[data-world-focus]')?.getAttribute('data-transition')
        if (v) w.__seen.add(v)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.keyboard.press('m')
    await expect(page.getByRole('dialog', { name: 'Map' })).toBeVisible()
    await page.getByRole('button', { name: /^(The )?Gym$/ }).click()
    await ready(page, 'gym')
    const seen = await page.evaluate(() => [...(window as unknown as { __seen: Set<string> }).__seen])
    expect(seen).not.toContain('fading-out')
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('mobile (Pixel 7)', () => {
  test.beforeEach(skipUnless('mobile'))

  test('Box Score default; Explore enters the world with joystick and no prompt', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await expect(page.locator('[data-exhibit]')).toHaveCount(46)
    await expect(page.locator('[data-station]')).toHaveCount(24)
    await page.getByRole('button', { name: /Explore Brayden.s World/ }).click()
    await ready(page, 'world')
    await expect(page.getByTestId('joystick')).toBeVisible()
    await expect(page.getByTestId('prompt')).toHaveCount(0)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('deep link /#books scrolls the Box Score to the books card', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/#books')
    await expect(page.locator('[data-exhibit]')).toHaveCount(46)
    await expect(page.locator('#books')).toBeInViewport()
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('tablet 820x1180 (touch)', () => {
  test.beforeEach(skipUnless('mobile'))
  test.use({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })

  test('Start screen, Explore, joystick visible, Interact hidden at spawn', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Explore' }).click()
    await ready(page, 'world')
    await expect(page.getByTestId('joystick')).toBeVisible()
    await expect(page.getByTestId('interact-button')).toBeHidden()
    expect(errors, errors.join('\n')).toEqual([])
  })
})
