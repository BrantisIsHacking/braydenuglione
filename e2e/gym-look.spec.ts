import { test, expect, type Page } from '@playwright/test'
import sharp from 'sharp'
import { WORLD, drawCalls, holdUntil, ready, trackErrors, trackExternal } from './helpers'

async function canvasPixels(page: Page) {
  const { data, info } = await sharp(await page.locator('canvas').screenshot())
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, channels: info.channels, width: info.width, height: info.height }
}

/** Gym key paint: scarlet-red with low green and blue (no neon bloom to lift it). */
function redKeyCount(p: { data: Buffer; channels: number }) {
  let n = 0
  for (let i = 0; i < p.data.length; i += p.channels) {
    if (p.data[i] > 140 && p.data[i + 1] < 60 && p.data[i + 2] < 70) n++
  }
  return n
}

function lumaStd(p: { data: Buffer; channels: number }) {
  let sum = 0
  let sum2 = 0
  let n = 0
  for (let i = 0; i < p.data.length; i += p.channels) {
    const y = 0.2126 * p.data[i] + 0.7152 * p.data[i + 1] + 0.0722 * p.data[i + 2]
    sum += y
    sum2 += y * y
    n++
  }
  const mean = sum / n
  return Math.sqrt(sum2 / n - mean * mean)
}

const isModelAbort = (m: import('@playwright/test').ConsoleMessage) =>
  (/Failed to load resource|ERR_ABORTED/.test(m.text()) && m.location().url.includes('/models/player.glb')) ||
  // React logs the error caught by AvatarBoundary (expected on a failed model load)
  /Could not load \/models\/player\.glb/.test(m.text())

test.describe('gym look', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'desktop look flows'))

  test('look smoke: full fx, draw calls, red key, model avatar, no external', async ({ page, baseURL }) => {
    const errors = trackErrors(page)
    const external = trackExternal(page, baseURL!)
    await page.goto('/#/b/gym')
    await ready(page, 'gym')
    await expect(page.locator(WORLD)).toHaveAttribute('data-fx', 'full')
    await expect(page.locator(WORLD)).toHaveAttribute('data-avatar', 'model', { timeout: 15_000 })
    expect(await drawCalls(page)).toBeLessThanOrEqual(150)
    const px = await canvasPixels(page)
    expect(lumaStd(px)).toBeGreaterThan(10)
    expect(redKeyCount(px)).toBeGreaterThanOrEqual(200)
    expect(errors, errors.join('\n')).toEqual([])
    expect(external, external.join('\n')).toEqual([])
  })

  test('low-power fx: no composer, draw calls within budget, red key present', async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto('/?fx=low#/b/gym')
    await ready(page, 'gym')
    await expect(page.locator(WORLD)).toHaveAttribute('data-fx', 'low')
    expect(await drawCalls(page)).toBeLessThanOrEqual(150)
    expect(redKeyCount(await canvasPixels(page))).toBeGreaterThanOrEqual(200)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('model failure: capsule fallback, gym playable (walk to the basketball prompt)', async ({ page }) => {
    const errors = trackErrors(page, isModelAbort)
    await page.route('**/models/player.glb', (r) => r.abort())
    await page.goto('/#/b/gym')
    await ready(page, 'gym')
    await expect(page.locator(WORLD)).toHaveAttribute('data-avatar', 'capsule', { timeout: 10_000 })
    // From the entrance (0, 15.6): the south hoop pole stands dead ahead, so step east first, then north.
    // input is frozen until the fade-in settles
    await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
    await holdUntil(page, 'ArrowRight', ({ x }) => x >= 3)
    await page.keyboard.down('ArrowUp')
    try {
      await page.waitForFunction(() => !!document.querySelector('[data-testid=prompt]'), undefined, { polling: 'raf', timeout: 20_000 })
    } finally {
      await page.keyboard.up('ArrowUp')
    }
    await expect(page.getByTestId('prompt')).toContainText('Varsity basketball')
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('slow model: ready while loading, then swaps to model', async ({ page }) => {
    const errors = trackErrors(page)
    await page.route('**/models/player.glb', async (r) => {
      await new Promise((res) => setTimeout(res, 4000))
      await r.continue()
    })
    await page.goto('/#/b/gym')
    await ready(page, 'gym')
    await expect(page.locator(WORLD)).toHaveAttribute('data-avatar', 'loading')
    await expect(page.locator(WORLD)).toHaveAttribute('data-avatar', 'model', { timeout: 20_000 })
    expect(errors, errors.join('\n')).toEqual([])
  })
})

test.describe('gym look reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('nothing moves on its own', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop look flows')
    await page.goto('/#/b/gym')
    await ready(page, 'gym')
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
  })
})
