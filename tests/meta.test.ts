import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { findPrivateTerm, loadPrivateTerms } from '../src/privacy/privateTerms.mjs'

const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
const meta = (attr: 'name' | 'property', key: string) =>
  html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`))?.[1]

describe('index.html head', () => {
  it('has a descriptive title and a meta description of 160 characters or fewer', () => {
    const title = html.match(/<title>([^<]*)<\/title>/)![1]
    expect(title).toMatch(/Brayden Uglione/)
    expect(title).toMatch(/Software|SWE/)
    expect(title.length).toBeLessThanOrEqual(70)
    const d = meta('name', 'description')!
    expect(d.length).toBeGreaterThan(70)
    expect(d.length).toBeLessThanOrEqual(160)
    expect(d).toMatch(/Summer 2027/)
  })

  it('declares a canonical URL on the site origin and an absolute 1200x630 OG image', () => {
    expect(html).toContain('<link rel="canonical" href="__SITE_URL__/" />')
    expect(meta('property', 'og:image')).toBe('__SITE_URL__/og.png')
    expect(meta('name', 'twitter:image')).toBe('__SITE_URL__/og.png')
    expect(meta('property', 'og:image:width')).toBe('1200')
    expect(meta('property', 'og:image:height')).toBe('630')
    expect(meta('property', 'og:image:alt')).toBeTruthy()
    expect(meta('name', 'twitter:image:alt')).toBeTruthy()
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
    expect(meta('property', 'og:url')).toBe('__SITE_URL__/')
    expect(meta('property', 'og:site_name')).toBeTruthy()
  })

  it('keeps OG and Twitter titles and descriptions in step with the page', () => {
    expect(meta('property', 'og:title')).toBe(html.match(/<title>([^<]*)<\/title>/)![1])
    expect(meta('name', 'twitter:title')).toBe(meta('property', 'og:title'))
    expect(meta('name', 'twitter:description')).toBe(meta('property', 'og:description'))
    expect(meta('property', 'og:description')!.length).toBeLessThanOrEqual(200)
  })

  it('ships a favicon, robots.txt and the OG image', () => {
    expect(html).toMatch(/<link rel="icon"[^>]*href="\/favicon\.svg"/)
    for (const f of ['favicon.svg', 'robots.txt', 'og.png']) expect(existsSync(join(process.cwd(), 'public', f)), f).toBe(true)
  })

  it('never mentions a phone number or a private term', () => {
    expect(html).not.toMatch(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/)
    expect(findPrivateTerm(html, loadPrivateTerms())).toBeNull()
  })
})
