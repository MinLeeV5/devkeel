// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketingNav } from '../src/components/MarketingNav'
import { HomePage } from '../src/pages/home'
import { CommunitySection } from '../src/pages/home/CommunitySection'
import { CaseStudiesSection } from '../src/pages/home/CaseStudiesSection'
import { COMPARISON_ROWS, ComparisonSection } from '../src/pages/home/ComparisonSection'
import { ExistingProjectSection } from '../src/pages/home/ExistingProjectSection'
import { HomeHero } from '../src/pages/home/HomeHero'
import { HowItWorksSection } from '../src/pages/home/HowItWorksSection'
import { MarketingFooter } from '../src/pages/home/MarketingFooter'
import { ProgressivePathSection } from '../src/pages/home/ProgressivePathSection'
import { QuickStartSection } from '../src/pages/home/QuickStartSection'
import { THEME_STORAGE_KEY, useThemeStore } from '../src/stores/theme-store'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.localStorage?.clear()
  useThemeStore.getState().setPreference('system')
  window.history.replaceState({}, '', '/')
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
})

describe('V2 home page', () => {
  it('leads existing-project owners to the embedded quick start', () => {
    render(<HomeHero />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('让现有项目成为 AI Agent')
    expect(screen.getByRole('link', { name: '快速开始' }).getAttribute('href')).toBe('#quickstart')
    expect(screen.getByRole('link', { name: '了解 DevKeel' }).getAttribute('href')).toBe('#comparison')
    expect(screen.getByText(/DevKeel V2 · 面向现有项目/)).toBeTruthy()
  })

  it('puts quick start first while keeping native chapter anchors', () => {
    const { container } = render(<HomePage />)
    const sectionIds = [...container.querySelectorAll('.home-article > section')].map((section) => section.id)

    expect(sectionIds.slice(0, 3)).toEqual(['quickstart', 'comparison', 'progressive-path'])
    expect(screen.getByRole('link', { name: '第 1 章：快速开始' }).getAttribute('href')).toBe('#quickstart')
    expect(screen.getByRole('link', { name: '第 2 章：痛点、现状与解决方案' }).getAttribute('href')).toBe('#comparison')
    expect(container.querySelector('a[href*="/v1/"]')).toBeNull()
  })

  it('compares the current release with open-source alternatives and contextual tradeoffs', () => {
    render(<ComparisonSection />)
    const table = screen.getByRole('table')

    for (const product of ['DevKeel', 'Superpowers', 'Matt Skills']) {
      expect(within(table).getAllByText(product).length).toBeGreaterThan(0)
    }
    expect(within(table).queryByText('DevKeel V1')).toBeNull()
    for (const version of ['V2', 'v6.2.0', 'v1.1.0']) {
      expect(within(table).getByText(version)).toBeTruthy()
    }
    expect(within(table).getByRole('rowheader', { name: '现有项目改造' })).toBeTruthy()
    expect(within(table).getByRole('rowheader', { name: '交付时间' })).toBeTruthy()
    expect(within(table).getByRole('rowheader', { name: 'Token 成本' })).toBeTruthy()
    expect(within(table).getAllByRole('button', { name: /5 \/ 5。查看说明/ }).length).toBeGreaterThan(0)
    expect(within(table).getByText(/domain-init \+ verify-init 扫描代码/)).toBeTruthy()
    expect(screen.getByText(/强制技能纪律覆盖设计、TDD、Review 与收尾/)).toBeTruthy()
    expect(screen.getByText(/可组合的小型 Skills/)).toBeTruthy()
    expect(screen.getByText('推荐主方案')).toBeTruthy()
    expect(within(table).getByText('推荐 · DEVKEEL V2')).toBeTruthy()
    expect(screen.getByText(/不是基准测试/)).toBeTruthy()
    expect(screen.queryByText(/Trellis/)).toBeNull()
    expect(screen.queryByText(/OMC|OMX/)).toBeNull()
  })

  it('tells chapter 02 as pain, open-source status, then the DevKeel solution', () => {
    render(<ComparisonSection />)
    const pain = screen.getByRole('heading', { name: '模型更强了，项目却仍然没有准备好' })
    const status = screen.getByRole('heading', { name: 'DevKeel V2 把项目上下文与渐进治理放在同一条主线上' })
    const solution = screen.getByRole('heading', { name: '把力气花在项目还没有提供的地方' })

    expect(pain.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(status.compareDocumentPosition(solution) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(solution.closest('#why-v2')).toBeTruthy()
  })

  it('shows score details while hovering or focusing a comparison cell', () => {
    render(<ComparisonSection />)
    const score = screen.getByRole('button', {
      name: 'DevKeel V2：现有项目改造，5 / 5。查看说明',
    })
    const scoreCell = score.closest('.comparison-score')
    const detail = document.getElementById(score.getAttribute('aria-describedby') ?? '')

    expect(scoreCell).toBeTruthy()
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')

    fireEvent.mouseEnter(scoreCell!)
    expect(score.getAttribute('aria-expanded')).toBe('true')
    expect(detail?.getAttribute('aria-hidden')).toBe('false')

    fireEvent.mouseLeave(scoreCell!)
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')

    fireEvent.focus(score)
    expect(score.getAttribute('aria-expanded')).toBe('true')
    expect(detail?.getAttribute('aria-hidden')).toBe('false')

    fireEvent.blur(score)
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')
  })

  it('toggles score details on repeated clicks and closes them with Escape', () => {
    render(<ComparisonSection />)
    const score = screen.getByRole('button', {
      name: 'DevKeel V2：现有项目改造，5 / 5。查看说明',
    })
    const scoreCell = score.closest('.comparison-score')
    const detail = document.getElementById(score.getAttribute('aria-describedby') ?? '')

    expect(scoreCell).toBeTruthy()
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')

    fireEvent.mouseEnter(scoreCell!)
    fireEvent.focus(score)
    fireEvent.click(score)
    expect(score.getAttribute('aria-expanded')).toBe('true')
    expect(detail?.getAttribute('aria-hidden')).toBe('false')
    expect(detail?.textContent).toContain('代价')

    fireEvent.mouseLeave(scoreCell!)
    fireEvent.blur(score)
    expect(score.getAttribute('aria-expanded')).toBe('true')
    expect(detail?.getAttribute('aria-hidden')).toBe('false')

    fireEvent.mouseEnter(scoreCell!)
    fireEvent.focus(score)
    fireEvent.click(score)
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')

    fireEvent.mouseLeave(scoreCell!)
    fireEvent.blur(score)
    fireEvent.mouseEnter(scoreCell!)
    expect(score.getAttribute('aria-expanded')).toBe('true')
    expect(detail?.getAttribute('aria-hidden')).toBe('false')

    fireEvent.click(score)
    fireEvent.keyDown(score, { key: 'Escape' })
    expect(score.getAttribute('aria-expanded')).toBe('false')
    expect(detail?.getAttribute('aria-hidden')).toBe('true')
  })

  it('defaults to the device theme and exposes all three theme choices', () => {
    const { container } = render(<HomePage />)
    const page = container.querySelector('.react-page[data-page="home"]')

    expect(page?.getAttribute('data-theme-preference')).toBe('system')
    expect(screen.getByRole('button', { name: '跟随设备' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: '浅色主题' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '暗色主题' })).toBeTruthy()
  })

  it('persists explicit themes and returns to the live device preference', () => {
    const mediaListeners = new Set<() => void>()
    let prefersDark = false
    const matchMedia = vi.fn().mockImplementation(() => ({
      matches: prefersDark,
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => mediaListeners.delete(listener),
    }))
    vi.stubGlobal('matchMedia', matchMedia)

    const { container } = render(<HomePage />)
    const page = container.querySelector('.react-page[data-page="home"]')

    fireEvent.click(screen.getByRole('button', { name: '暗色主题' }))
    expect(page?.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: '跟随设备' }))
    expect(page?.getAttribute('data-theme-preference')).toBe('system')
    expect(page?.getAttribute('data-theme')).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()

    prefersDark = true
    act(() => mediaListeners.forEach((listener) => listener()))
    expect(page?.getAttribute('data-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('switches all homepage diagrams with the selected theme', () => {
    render(<HomePage />)

    const diagramSources = (): string[] => [...document.querySelectorAll<HTMLImageElement>('.home-diagram')].map((image) => image.getAttribute('src') ?? '')

    expect(diagramSources()).toEqual([
      './diagrams/onboarding-flow.svg',
      './diagrams/progressive-path.svg',
      './diagrams/project-architecture.svg',
    ])

    fireEvent.click(screen.getByRole('button', { name: '暗色主题' }))

    expect(diagramSources()).toEqual([
      './diagrams/onboarding-flow-dark.svg',
      './diagrams/sharing-v2-routing.svg',
      './diagrams/sharing-v2-harness-architecture.svg',
    ])
  })

  it('locks the approved score matrix and gives every score a cost', () => {
    expect(COMPARISON_ROWS.map((row) => [
      row.dimension,
      row.products.harnessV2.score,
      row.products.superpowers.score,
      row.products.matt.score,
    ])).toEqual([
      ['现有项目改造', 5, 2, 3],
      ['项目知识生成', 5, 2, 4],
      ['验证基建建设', 5, 3, 3],
      ['轻重任务适配', 5, 2, 5],
      ['交付时间', 5, 2, 4],
      ['Token 成本', 5, 2, 4],
      ['跨会话与团队协作', 4, 4, 5],
      ['过程约束与审查', 4, 5, 4],
      ['跨平台复用', 4, 5, 4],
      ['技能组合与定制', 5, 4, 5],
    ])
    for (const row of COMPARISON_ROWS) {
      for (const cell of Object.values(row.products)) expect(cell.detail).toContain('；代价')
    }
  })

  it('shows one consolidated path and schema orchestration diagram', () => {
    render(<ProgressivePathSection />)

    expect(screen.getByRole('heading', { name: '从一句话需求开始，逐层收敛到充分路径' })).toBeTruthy()
    expect(screen.getByText(/有关键决定未明确时，\/brainstorming 按需引用需求与技术设计维度/)).toBeTruthy()
    expect(screen.getByRole('img', { name: /从一句话需求开始/ })).toBeTruthy()
    for (const path of ['专项 Skill', 'Direct', 'Lite', 'Full']) {
      expect(screen.getByText(path, { selector: 'strong' })).toBeTruthy()
    }
    expect(screen.getByText(/内置 Lite schema/)).toBeTruthy()
    expect(screen.getByText(/内置 Full schema/)).toBeTruthy()
    expect(document.querySelector('.openspec-orchestration')).toBeNull()
    expect(screen.getAllByRole('listitem').filter((item) => item.closest('.quality-baseline')).length).toBe(3)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('establishes the project entry before domain-init and verify-init', () => {
    render(<ExistingProjectSection />)
    const foundation = screen.getByLabelText('项目入口初始化')
    const engines = screen.getAllByRole('article').slice(0, 2)

    expect(foundation.textContent).toContain('devkeel init')
    expect(foundation.textContent).toContain('AGENTS.md')
    expect(foundation.textContent).toContain('全局路由骨架')
    expect(engines[0].textContent).toContain('/domain-init')
    expect(engines[0].textContent).toContain('用户 Review')
    expect(engines[1].textContent).toContain('/verify-init')
    expect(engines[1].textContent).toContain('用户同意')
  })

  it('explains that built-in schemas orchestrate OpenSpec for Lite and Full', () => {
    render(<HowItWorksSection />)

    expect(screen.getByText(/docs\/ 保存项目知识/)).toBeTruthy()
    expect(screen.getByText(/Lite \/ Full schema 定义相应编排/)).toBeTruthy()
    expect(screen.getByText(/Lite 与 Full 共用 OpenSpec 能力/)).toBeTruthy()
  })

  it('keeps Agent-first and manual quick-start paths on the home page', () => {
    render(<QuickStartSection />)
    const installLink = screen.getByRole('link', { name: 'https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md' })

    expect(installLink.getAttribute('href')).toBe('https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md')
    expect(screen.getByText(/推荐 · Agent 执行/)).toBeTruthy()
    expect(screen.getByText(/Node.js ≥ 20.19.0/)).toBeTruthy()
    expect(screen.getByText('偏好手动操作？查看 CLI 初始化步骤')).toBeTruthy()
    const onboardingFlow = screen.getByRole('img', { name: /domain-init、用户 Review、verify-init/ })
    expect(onboardingFlow.getAttribute('width')).toBe('960')
    expect(onboardingFlow.getAttribute('height')).toBe('440')
    expect(screen.getByText('01 / 快速开始')).toBeTruthy()
  })

  it('uses two inspected repositories as complete context-engineering cases', () => {
    render(<CaseStudiesSection />)

    expect(screen.getByRole('heading', { name: /同一套 DevKeel/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /example-workspace/ })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /devkeel-demo-project/ })).toBeTruthy()
    const enterpriseTree = screen.getByLabelText('example-workspace 目录结构').textContent ?? ''
    expect(enterpriseTree).toContain('frontend/                  # 前端 submodule')
    expect(enterpriseTree).toContain('backend/                   # 后端 submodule')
    expect(enterpriseTree).toContain('23 rules · 7 skills · 1 agent')
    expect(enterpriseTree).toContain('18 rules · 11 skills · 4 agents')
    expect(enterpriseTree).not.toContain('maxhub-ai-monorepo')
    expect(enterpriseTree).not.toContain('maxhubone-gateway')
    expect(screen.getByText(/一次提交新增 8 条 rules 与 1 个前端 reviewer/)).toBeTruthy()
    expect(screen.getByText(/当前 package.json 没有 test scripts/)).toBeTruthy()
    expect(screen.getByText(/真实 change 留下 brainstorm、design、spec、tasks、verify 与 retrospective/)).toBeTruthy()
  })

  it('copies the Agent prompt and reports clipboard rejection', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const quickStart = render(<QuickStartSection />)

    fireEvent.click(screen.getByRole('button', { name: '复制提示' }))
    expect(await screen.findByRole('button', { name: '已复制' })).toBeTruthy()
    expect(writeText).toHaveBeenCalledWith('按照 https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md 完成项目初始化')

    quickStart.unmount()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    render(<QuickStartSection />)
    fireEvent.click(screen.getByRole('button', { name: '复制提示' }))
    expect(await screen.findByRole('button', { name: '复制失败，请手动选择' })).toBeTruthy()
  })

  it('restores a cold-loaded home hash after the lazy page mounts', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    window.history.replaceState({}, '', '/#progressive-path')

    render(<HomePage />)

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  it('leaves mounted hash changes to native anchor scrolling', () => {
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    render(<HomePage />)
    window.history.replaceState({}, '', '/#quickstart')
    window.dispatchEvent(new Event('hashchange'))

    expect(scrollIntoView).not.toHaveBeenCalled()
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  it('keeps community links without promoting archived V1 pages', () => {
    const navigation = render(<MarketingNav activePage="home" />)
    const sharingLink = screen.getByRole('link', { name: '技术分享' })
    const changelogLink = screen.getByRole('link', { name: '变更日志' })

    expect(sharingLink.getAttribute('href')).toBe('./sharing.html')
    expect(sharingLink.compareDocumentPosition(changelogLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'V1' })).toBeNull()
    expect(screen.getByTitle('GitHub')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /工作流|架构设计|最佳实践|遥测/ })).toBeNull()

    navigation.unmount()
    render(<CommunitySection />)
    expect(screen.getByRole('link', { name: '交流与反馈' }).getAttribute('href')).toBe('https://github.com/MinLeeV5/devkeel/issues')

    cleanup()
    render(<MarketingFooter />)
    expect(screen.queryByRole('link', { name: 'V1' })).toBeNull()
    expect(screen.queryByRole('link', { name: /Stats|技术分享/ })).toBeNull()
  })
})
