import { describe, expect, it } from 'vitest'
import viteConfig from '../vite.config'

describe('vite static site', () => {
  it('serves real page entries without an API proxy or SPA fallback', () => {
    expect(viteConfig).toMatchObject({
      appType: 'mpa',
    })
    expect(viteConfig.server?.proxy).toBeUndefined()
  })
})
