import { test, expect } from '@playwright/test'
import { WORLD, drawCalls, holdUntil, ready, settle, trackErrors, walkTo } from '../helpers'

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop flows')
  await page.addInitScript(() => sessionStorage.setItem('world.started', '1'))
})

for (const fx of ['full', 'low'] as const) {
  test(`draw calls (${fx}) <= 150`, async ({ page }) => {
    const errors = trackErrors(page)
    await page.goto(`${fx === 'low' ? '/?fx=low' : '/'}#/b/record-store`)
    await ready(page, 'record-store')
    const dc = await drawCalls(page)
    console.log(`draw calls record-store ${fx}: ${dc}`)
    expect(dc).toBeGreaterThan(1)
    expect(dc).toBeLessThanOrEqual(150)
    expect(errors, errors.join('\n')).toEqual([])
  })
}

test('deep links open the music panel and the karaoke station', async ({ page }) => {
  await page.goto('/#music')
  await ready(page, 'record-store')
  await expect(page.getByRole('dialog', { name: /music/i })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goto('/#karaoke')
  await ready(page, 'record-store')
  await expect(page.getByRole('dialog', { name: /karaoke/i })).toBeVisible()
})

test('walk to the listening booth: Frission panel, no Spotify before Play, iframe after', async ({ page }) => {
  const spotify: string[] = []
  page.on('request', (r) => { if (/spotify/i.test(new URL(r.url()).hostname)) spotify.push(r.url()) })
  await page.goto('/#/b/record-store')
  await ready(page, 'record-store')
  await settle(page)
  await walkTo(page, 9.5, -3.4 + 1.5)
  const prompt = page.getByTestId('prompt')
  await expect(prompt).toHaveAttribute('data-exhibit', 'frission')
  await page.keyboard.press('e')
  const dialog = page.getByRole('dialog', { name: /frission/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Open in Spotify' })).toHaveAttribute('href', 'https://open.spotify.com/playlist/0CMrxtb1wc9P83qlrvmJ3o')
  await expect(dialog.locator('iframe')).toHaveCount(0)
  await page.waitForTimeout(500)
  expect(spotify, spotify.join('\n')).toEqual([])
  await dialog.getByRole('button', { name: 'Play Frission' }).click()
  const frame = dialog.locator('iframe')
  await expect(frame).toHaveAttribute('src', 'https://open.spotify.com/embed/playlist/0CMrxtb1wc9P83qlrvmJ3o')
  await expect(frame).toHaveAttribute('title', 'Frission — Spotify playlist')
})

test('walk the stacks: the first stop opens the music panel on Drake', async ({ page }) => {
  await page.goto('/#/b/record-store')
  await ready(page, 'record-store')
  await settle(page)
  await holdUntil(page, 'ArrowUp', ({ z }) => z <= -18.5)
  await walkTo(page, -11.25, -18.5)
  const prompt = page.getByTestId('prompt')
  await expect(prompt).toHaveAttribute('data-exhibit', 'music')
  await expect(prompt).toContainText('Drake')
  await page.keyboard.press('e')
  await expect(page.getByRole('dialog', { name: /music/i })).toBeVisible()
  await expect(page.locator('[aria-current="true"]')).toContainText('Drake')
})

test('walk out through the south exit', async ({ page }) => {
  await page.goto('/#/b/record-store')
  await ready(page, 'record-store')
  await settle(page)
  await page.keyboard.down('ArrowDown')
  try {
    await expect(page.locator(WORLD)).toHaveAttribute('data-scene', 'world', { timeout: 20_000 })
  } finally {
    await page.keyboard.up('ArrowDown')
  }
})
