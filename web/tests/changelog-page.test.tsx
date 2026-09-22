// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { VersionCatalogResponse, VersionEntry } from '../src/lib/version-catalog'
import { ChangelogPage } from '../src/pages/changelog'
import { usePageUiStore } from '../src/stores/page-ui-store'

const templateCurrent: VersionEntry = {
  versions: ['2.0.0'],
  releasedAt: { from: '2026-07-12T08:30:00+08:00' },
  title: '模板 **当前版本**',
  archived: false,
  groups: [],
}

const cliCurrent: VersionEntry = {
  versions: ['9.9.9'],
  releasedAt: { from: '2026-07-13T09:00:00+08:00' },
  title: 'CLI **当前版本**',
  archived: false,
  groups: [
    {
      type: 'feat',
      label: 'Markdown 能力',
      items: [
        {
          name: '**安全渲染**',
          description: [
            '运行 `devkeel update`',
            '[官方文档](https://example.com/docs)',
            '[HTTP 文档](http://example.com/docs)',
            '[非规范 HTTPS](https:example.com/docs)',
            '[相对文档](./guide)',
          ].join('\n'),
        },
        {
          name: '<img src=x onerror=alert(1)>',
          description: [
            '[危险链接](javascript:alert(1))',
            '[数据链接](data:text/html,danger)',
            '[邮件链接](mailto:owner@example.com)',
            '[未知协议](ftp://example.com/file)',
            '',
            '```sh',
            'do-not-format-as-code',
            '```',
          ].join('\n'),
        },
      ],
    },
  ],
}

const cliFromVersion: VersionEntry = {
  versions: ['9.8.0'],
  releasedAt: { from: '2026-07-11T09:00:00+08:00' },
  title: 'CLI 上一版本',
  archived: false,
  groups: [],
}

const cliArchive: VersionEntry = {
  versions: ['9.0.0', '9.1.0'],
  releasedAt: {
    from: '2026-06-01T10:15:00+08:00',
    to: '2026-06-03T11:45:00+08:00',
  },
  title: '合并归档版本',
  archived: true,
  groups: [],
}

function makeCatalog(overrides: Partial<VersionCatalogResponse> = {}): VersionCatalogResponse {
  return {
    templates: { latest: '2.0.0', entries: [templateCurrent] },
    cli: { latest: '9.9.9', entries: [cliCurrent, cliFromVersion, cliArchive] },
    ...overrides,
  }
}

function respondWith(catalog: VersionCatalogResponse): Response {
  return new Response(JSON.stringify(catalog), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockCatalog(catalog = makeCatalog()): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(respondWith(catalog))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function findVersionTitle(title: string): Promise<HTMLElement> {
  return screen.findByText((_content, element) => (
    element?.classList.contains('version-title') === true && element.textContent === title
  ))
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

beforeEach(() => {
  usePageUiStore.setState({ changelogTab: 'templates' })
  window.history.replaceState({}, '', '/changelog.html')
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ChangelogPage', () => {
  it('defaults to Templates and switches to the CLI catalog', async () => {
    mockCatalog()
    render(<ChangelogPage />)

    const templatesTab = screen.getByRole('button', { name: /模板资产/ })
    const cliTab = screen.getByRole('button', { name: /CLI/ })
    await findVersionTitle('模板 当前版本')

    expect(templatesTab.classList.contains('active')).toBe(true)
    expect(templatesTab.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('#panel-templates')?.classList.contains('active')).toBe(true)

    fireEvent.click(cliTab)

    expect(cliTab.classList.contains('active')).toBe(true)
    expect(cliTab.getAttribute('aria-pressed')).toBe('true')
    expect(document.querySelector('#panel-cli')?.classList.contains('active')).toBe(true)
    expect(await findVersionTitle('CLI 当前版本')).toBeTruthy()
  })

  it('shows independent latest versions for CLI and Templates', async () => {
    mockCatalog()
    render(<ChangelogPage />)

    expect(await screen.findByText('CLI v9.9.9')).toBeTruthy()
    expect(screen.getByText('Templates v2.0.0')).toBeTruthy()
  })

  it('shows a stable loading state without stale hard-coded latest versions', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
    render(<ChangelogPage />)

    expect(screen.getByText('正在加载版本记录…')).toBeTruthy()
    expect(document.body.textContent).not.toContain('v1.2.5')
    expect(document.body.textContent).not.toContain('v0.8.10')
  })

  it('reports request failures and retries without losing the selected tab', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(respondWith(makeCatalog()))
    vi.stubGlobal('fetch', fetchMock)
    render(<ChangelogPage />)

    fireEvent.click(screen.getByRole('button', { name: /CLI/ }))
    expect(await screen.findByText(/版本记录加载失败.*network unavailable/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    await findVersionTitle('CLI 当前版本')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: /CLI/ }).classList.contains('active')).toBe(true)
  })

  it('retains the diagnostic while one retry is in progress and ignores duplicate retries', async () => {
    const retryResponse = deferred<Response>()
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockImplementationOnce(() => retryResponse.promise)
    vi.stubGlobal('fetch', fetchMock)
    render(<ChangelogPage />)

    expect(await screen.findByText(/版本记录加载失败.*network unavailable/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    expect(screen.getByText(/版本记录加载失败.*network unavailable/)).toBeTruthy()
    expect(screen.getByText('正在重新加载版本记录…')).toBeTruthy()
    const retryButton = screen.getByRole('button', { name: '重试中…' }) as HTMLButtonElement
    expect(retryButton.disabled).toBe(true)
    fireEvent.click(retryButton)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(async () => {
      retryResponse.resolve(respondWith(makeCatalog()))
      await retryResponse.promise
    })
    await findVersionTitle('模板 当前版本')
    expect(screen.queryByText(/版本记录加载失败/)).toBeNull()
    expect(screen.queryByText('正在重新加载版本记录…')).toBeNull()
  })

  it('renders archived versions in the existing expandable history treatment', async () => {
    mockCatalog()
    render(<ChangelogPage />)
    fireEvent.click(screen.getByRole('button', { name: /CLI/ }))

    const summary = await screen.findByText('📚 查看历史版本')
    const details = summary.closest('details')
    expect(details?.open).toBe(false)

    fireEvent.click(summary)

    expect(details?.open).toBe(true)
    expect(within(details as HTMLElement).getByText('v9.0.0 ~ v9.1.0')).toBeTruthy()
    expect(within(details as HTMLElement).getByText('2026-06-01 10:15 ~ 2026-06-03 11:45')).toBeTruthy()
  })

  it('does not render an empty history archive and keeps empty groups structurally stable', async () => {
    mockCatalog(makeCatalog({
      templates: { latest: '2.0.0', entries: [templateCurrent] },
      cli: { latest: '9.9.9', entries: [cliCurrent] },
    }))
    render(<ChangelogPage />)

    await findVersionTitle('模板 当前版本')
    const panel = document.querySelector('#panel-templates') as HTMLElement
    expect(panel.querySelector('.history-archive')).toBeNull()
    expect(panel.querySelector('.version-section .changes')).toBeTruthy()
    expect(panel.querySelector('.change-group')).toBeNull()
  })

  it('allows only the supported inline Markdown surface', async () => {
    mockCatalog()
    render(<ChangelogPage />)
    fireEvent.click(screen.getByRole('button', { name: /CLI/ }))

    await findVersionTitle('CLI 当前版本')
    const cliPanel = document.querySelector('#panel-cli') as HTMLElement
    expect(within(cliPanel).getByText('当前版本').tagName).toBe('STRONG')
    expect(screen.getByText('安全渲染').tagName).toBe('STRONG')
    const inlineCode = screen.getByText('devkeel update')
    expect(inlineCode.tagName).toBe('CODE')
    expect(inlineCode.parentElement?.querySelector('br')).toBeTruthy()

    const docsLink = screen.getByRole('link', { name: '官方文档' })
    expect(docsLink.getAttribute('href')).toBe('https://example.com/docs')
    expect(docsLink.getAttribute('target')).toBe('_blank')
    expect(docsLink.getAttribute('rel')).toContain('noopener')
    expect(screen.getByRole('link', { name: 'HTTP 文档' }).getAttribute('href')).toBe('http://example.com/docs')
    const nonCanonicalHttpsLink = screen.getByRole('link', { name: '非规范 HTTPS' })
    expect(nonCanonicalHttpsLink.getAttribute('target')).toBe('_blank')
    expect(nonCanonicalHttpsLink.getAttribute('rel')).toBe('noopener noreferrer')
    expect(screen.getByRole('link', { name: '相对文档' }).getAttribute('href')).toBe('./guide')
    expect(document.querySelector('img[src="x"]')).toBeNull()
    expect(screen.queryByRole('link', { name: '危险链接' })).toBeNull()
    expect(screen.queryByRole('link', { name: '数据链接' })).toBeNull()
    expect(screen.queryByRole('link', { name: '邮件链接' })).toBeNull()
    expect(screen.queryByRole('link', { name: '未知协议' })).toBeNull()
    expect(Array.from(cliPanel.querySelectorAll('code')).some((code) => code.textContent?.includes('do-not-format-as-code'))).toBe(false)
    expect(cliPanel.textContent).toContain('do-not-format-as-code')
    expect(document.body.textContent).toContain('<img src=x onerror=alert(1)>')
  })

  it('automatically activates CLI and scrolls to its latest entry after ?from= data loads', async () => {
    mockCatalog()
    window.history.replaceState({}, '', '/changelog.html?from=9.8.0')
    const scrolledIds: string[] = []
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function scroll(this: HTMLElement): void {
      scrolledIds.push(this.id)
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    render(<ChangelogPage />)

    const banner = (await screen.findByText('🔔 你有更新的版本')).closest('.version-update-banner')
    expect(banner?.textContent).toContain('v9.8.0')
    expect(banner?.textContent).toContain('v9.9.9')

    await waitFor(() => expect(usePageUiStore.getState().changelogTab).toBe('cli'))
    expect(scrolledIds).toEqual(['v9.9.9'])
  })

  it('ignores an archived ?from= target and leaves history closed while scrolling to CLI latest', async () => {
    mockCatalog()
    window.history.replaceState({}, '', '/changelog.html?from=9.0.0')
    const scrolledIds: string[] = []
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function scroll(this: HTMLElement): void {
      scrolledIds.push(this.id)
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    render(<ChangelogPage />)

    await screen.findByText('🔔 你有更新的版本')
    const archive = screen.getByText('📚 查看历史版本').closest('details')

    await waitFor(() => expect(usePageUiStore.getState().changelogTab).toBe('cli'))
    expect(archive?.open).toBe(false)
    expect(scrolledIds).toEqual(['v9.9.9'])
  })

  it('scrolls to CLI latest when ?from= is not in the catalog', async () => {
    mockCatalog()
    window.history.replaceState({}, '', '/changelog.html?from=8.0.0')
    const scrolledIds: string[] = []
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(function scroll(this: HTMLElement): void {
      scrolledIds.push(this.id)
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    render(<ChangelogPage />)

    await screen.findByText('🔔 你有更新的版本')
    await waitFor(() => expect(scrolledIds).toEqual(['v9.9.9']))
  })

  it.each(['Enter', ' '])('closes the passive update banner with %j without another scroll', async (key) => {
    mockCatalog()
    window.history.replaceState({}, '', '/changelog.html?from=9.8.0')
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView')
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    render(<ChangelogPage />)

    await screen.findByText('🔔 你有更新的版本')
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
    fireEvent.keyDown(screen.getByRole('button', { name: '关闭更新提示' }), { key })

    expect(screen.queryByText('🔔 你有更新的版本')).toBeNull()
    expect(usePageUiStore.getState().changelogTab).toBe('cli')
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('does not render the Templates V2 retrospective promo', async () => {
    mockCatalog()
    render(<ChangelogPage />)

    await findVersionTitle('模板 当前版本')
    expect(screen.queryByText('Templates V2 · Release & design retrospective')).toBeNull()
    expect(screen.queryByText('V2 已成为当前工作方式')).toBeNull()
    expect(screen.queryByRole('link', { name: '查看 V2 的设计答案 →' })).toBeNull()
    expect(screen.queryByText('V1 → V2 设计变更：为什么重构')).toBeNull()
    expect(document.body.textContent).not.toContain('OpenSpec + SuperPowers + OMC')
  })
})
