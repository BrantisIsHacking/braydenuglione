import { defineConfig } from 'vitest/config'
import { loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function noscriptBody(): string {
  const d = JSON.parse(readFileSync(fileURLToPath(new URL('./src/site/noscript.public.json', import.meta.url)), 'utf8')) as {
    name: string; intro: string; email: string; links: { label: string; url: string }[]
  }
  const links = d.links.map((l) => `          <li><a href="${esc(l.url)}">${esc(l.label)}</a></li>`).join('\n')
  return `<h1>${esc(d.name)}</h1>
        <p>${esc(d.intro)}</p>
        <p>Email: <a href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>
        <ul>
${links}
        </ul>`
}

function siteHtml(env: Record<string, string>): Plugin {
  const site = (env.VITE_SITE_URL || 'https://brayden-uglione.pages.dev').replace(/\/$/, '')
  const token = env.VITE_CF_BEACON_TOKEN
  return {
    name: 'site-html',
    transformIndexHtml(html) {
      if (!html.includes('<!--NOSCRIPT_BODY-->')) throw new Error('site-html: <!--NOSCRIPT_BODY--> placeholder missing from index.html')
      const out = html.replaceAll('__SITE_URL__', site).replace('<!--NOSCRIPT_BODY-->', () => noscriptBody())
      if (!token) return out
      const tag = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon="${JSON.stringify({ token }).replaceAll('"', '&quot;')}"></script>`
      return out.replace('</body>', () => `    ${tag}\n  </body>`)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), siteHtml(loadEnv(mode, process.cwd(), 'VITE_'))],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
}))
