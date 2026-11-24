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

/** Waits until `scene` ('world' or a building id) has committed and rendered a frame; `floor` also matches data-floor. */
export async function ready(page: Page, scene: string, floor?: number) {
  const f = floor === undefined ? '' : `[data-floor="${floor}"]`
  await expect(page.locator(`${WORLD}[data-ready="true"][data-scene="${scene}"]${f}`)).toBeVisible({ timeout: 30_000 })
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

/**
 * Whole-frame draw calls of the current scene, refreshed every 30 frames. Waits until the value is
 * non-zero and unchanged across four reads 400 ms apart, so a half-built scene (lazy models, late
 * instances) is never measured.
 */
export async function drawCalls(page: Page): Promise<number> {
  const read = async () => Number((await page.locator(WORLD).getAttribute('data-draw-calls')) || 0)
  await expect.poll(read, { timeout: 30_000 }).toBeGreaterThan(0)
  let last = -1
  let same = 0
  await expect
    .poll(async () => {
      const cur = await read()
      same = cur > 0 && cur === last ? same + 1 : 0
      last = cur
      await page.waitForTimeout(400)
      return same
    }, { timeout: 30_000 })
    .toBeGreaterThanOrEqual(3)
  return last
}

/** Waits for the transition to be idle and the pose to stop changing (two equal `data-pose` reads 200 ms apart). */
export async function settle(page: Page): Promise<void> {
  await expect(page.locator(WORLD)).toHaveAttribute('data-transition', 'idle')
  let prev = ''
  await expect
    .poll(async () => {
      const cur = (await page.locator(WORLD).getAttribute('data-pose')) ?? ''
      const same = cur !== '' && cur === prev
      prev = cur
      await page.waitForTimeout(200)
      return same
    }, { timeout: 10_000 })
    .toBe(true)
}

/** Walks to (x, z) with the arrow keys: x first, then z, each released within `tol` metres. Walls and props may stop you short. */
export async function walkTo(page: Page, x: number, z: number, tol = 0.35): Promise<void> {
  const p0 = await pose(page)
  if (Math.abs(x - p0.x) > tol) {
    const right = x > p0.x
    await holdUntil(page, right ? 'ArrowRight' : 'ArrowLeft', `(p) => ${right ? `p.x >= ${x - tol}` : `p.x <= ${x + tol}`}`)
  }
  const p1 = await pose(page)
  if (Math.abs(z - p1.z) > tol) {
    const down = z > p1.z
    await holdUntil(page, down ? 'ArrowDown' : 'ArrowUp', `(p) => ${down ? `p.z >= ${z - tol}` : `p.z <= ${z + tol}`}`)
  }
}
