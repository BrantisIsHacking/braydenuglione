import { test, expect } from '@playwright/test'
import { drawCalls, ready, trackErrors, trackExternal } from './helpers'

test('world smoke: start screen → Explore → world ready, no errors, no external requests', async ({ page, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop', 'desktop start flow')
  const errors = trackErrors(page)
  const external = trackExternal(page, baseURL!)
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore' }).click()
  await ready(page, 'world')
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Skip to box score' })).toBeVisible()
  expect(await drawCalls(page)).toBeLessThanOrEqual(200)
  expect(errors, errors.join('\n')).toEqual([])
  expect(external, external.join('\n')).toEqual([])
})
