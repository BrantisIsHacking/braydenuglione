import { describe, expect, it } from 'vitest'
import { profile } from '../src/content/profile'
import data from '../src/site/noscript.public.json'

describe('noscript data stays in sync with profile', () => {
  it('matches profile name/intro/email/links', () => {
    expect(data).toEqual({ name: profile.name, intro: profile.intro, email: profile.email, links: profile.links })
  })
})
