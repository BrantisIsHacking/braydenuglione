import { expect, type ConsoleMessage, type Page } from '@playwright/test'

/** Console errors and page errors; `ignore` drops expected ones (e.g. an aborted model request). */
export function trackErrors(page: Page, ignore?: (m: ConsoleMessage) => boolean) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && !ignore?.(m) && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  return errors
}

/** Requests to any origin other than the site's. */
export function trackExternal(page: Page, baseURL: string) {
  const origin = new URL(baseURL).origin
  const external: string[] = []
  page.on('request', (r) => {
    const u = r.url()
    if (/^https?:/.test(u) && new URL(u).origin !== origin) external.push(u)
  })
  return external
}

export const WORLD = '[data-world-focus]'

/** Waits until `scene` ('world' or a building id) has committed and rendered a frame. */
export async function ready(page: Page, scene: string) {
  await expect(page.locator(`${WORLD}[data-ready="true"][data-scene="${scene}"]`)).toBeVisible({ timeout: 30_000 })
}

/** Player ground position from the wrapper's `data-pose` ("x,z", updated every 6 frames). */
export async function pose(page: Page): Promise<{ x: number; z: number }> {
  const raw = (await page.locator(WORLD).getAttribute('data-pose')) ?? ''
  const [x, z] = raw.split(',').map(Number)
  return { x, z }
}

/** Holds `key` until `predicate(pose)` holds (polled every animation frame in the page), then releases it. */
export async function holdUntil(
  page: Page,
  key: string,
  predicate: string | ((p: { x: number; z: number }) => boolean),
  timeout = 20_000,
) {
  const fn = typeof predicate === 'string' ? predicate : predicate.toString()
  await page.keyboard.down(key)
  try {
    await page.waitForFunction(
      ([sel, src]) => {
        const raw = document.querySelector(sel)?.getAttribute('data-pose')
        if (!raw) return false
        const [x, z] = raw.split(',').map(Number)
        // eslint-disable-next-line no-new-func
        return (new Function(`return (${src})`)() as (p: { x: number; z: number }) => boolean)({ x, z })
      },
      [WORLD, fn] as const,
      { polling: 'raf', timeout },
    )
  } finally {
    await page.keyboard.up(key)
  }
}

/** Whole-frame draw calls at frame 30 of the current scene (polls until the attribute is filled). */
export async function drawCalls(page: Page): Promise<number> {
  const read = async () => Number((await page.locator(WORLD).getAttribute('data-draw-calls')) || 0)
  await expect.poll(read, { timeout: 30_000 }).toBeGreaterThan(0)
  return read()
}
