import { describe, expect, it } from 'vitest'

import { isGonePage, PUBLIC_PAGE_PATHS, resolvePageRedirect, resolvePageRoute } from '../src/routes'

describe('web routes', () => {
  it('keeps V1 public while retiring stats and the V2 inventory', () => {
    expect(PUBLIC_PAGE_PATHS).toEqual([
      '/',
      '/index.html',
      '/workflow.html',
      '/templates-v2.html',
      '/architecture.html',
      '/best-practices.html',
      '/sharing.html',
      '/changelog.html',
      '/v1/index.html',
      '/v1/workflow.html',
      '/v1/architecture.html',
      '/v1/best-practices.html',
      '/v1/sharing.html',
      '/v1/capability-inventory.html',
    ])
    expect(PUBLIC_PAGE_PATHS).not.toContain('/capability-inventory.html')
  })

  it('resolves only current React pages', () => {
    expect(resolvePageRoute('/')).toMatchObject({ pageId: 'home', routePath: '/' })
    expect(resolvePageRoute('/index.html')).toMatchObject({ pageId: 'home', routePath: '/index.html' })
    expect(resolvePageRoute('/v1/index.html')).toMatchObject({ pageId: 'v1-home' })
    expect(resolvePageRoute('/v1/workflow.html')).toMatchObject({ pageId: 'v1-workflow' })
    expect(resolvePageRoute('/v1/architecture.html')).toMatchObject({ pageId: 'v1-architecture' })
    expect(resolvePageRoute('/v1/best-practices.html')).toMatchObject({ pageId: 'v1-best-practices' })
    expect(resolvePageRoute('/v1/stats.html')).toBeNull()
    expect(isGonePage('/v1/stats.html')).toBe(true)
    expect(isGonePage('/stats.html')).toBe(true)
    expect(resolvePageRoute('/workflow.html')).toBeNull()
    expect(resolvePageRoute('/capability-inventory.html')).toBeNull()
    expect(isGonePage('/capability-inventory.html')).toBe(true)
    expect(isGonePage('/v1/capability-inventory.html')).toBe(false)
  })

  it('redirects retired V2 detail pages to matching home chapters', () => {
    expect(resolvePageRedirect('/workflow.html')).toBe('/#progressive-path')
    expect(resolvePageRedirect('/templates-v2.html')).toBe('/#why-v2')
    expect(resolvePageRedirect('/architecture.html')).toBe('/#how-it-works')
    expect(resolvePageRedirect('/best-practices.html')).toBe('/#progressive-path')
    expect(resolvePageRedirect('/sharing.html')).toBeNull()
  })

  it('ignores search params and hashes during resolution', () => {
    expect(resolvePageRoute('/changelog.html?from=0.8.0#latest')).toMatchObject({ pageId: 'changelog' })
    expect(resolvePageRedirect('/workflow.html?legacy=1#old')).toBe('/#progressive-path')
  })
})
