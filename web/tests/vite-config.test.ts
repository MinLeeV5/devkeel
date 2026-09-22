import { describe, expect, it } from 'vitest'
import viteConfig from '../vite.config'

describe('vite development proxy', () => {
  it('uses only the local API server', () => {
    expect(viteConfig).toMatchObject({
      server: { proxy: { '/api': 'http://localhost:3000' } },
    })
  })
})
