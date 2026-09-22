import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ChangelogPage } from '../src/pages/changelog'
import { PAGE_COMPONENTS } from '../src/pages/registry'
import { PAGE_ROUTES } from '../src/routes'

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_ROOT = path.join(WEB_ROOT, 'src')
const DIAGRAM_ROOT = path.join(WEB_ROOT, 'public', 'diagrams')

describe('React pages', () => {
  it('maps every current React route to a component', () => {
    for (const route of PAGE_ROUTES) expect(PAGE_COMPONENTS[route.pageId]).toBeDefined()
  })

  it('keeps the main, DevKeel research, and V1 sharing decks as standalone static pages', () => {
    expect(fs.existsSync(path.join(WEB_ROOT, 'public', 'sharing.html'))).toBe(true)
    expect(fs.existsSync(path.join(WEB_ROOT, 'public', 'sharing-harness-research.html'))).toBe(true)
    expect(fs.existsSync(path.join(WEB_ROOT, 'public', 'v1', 'sharing.html'))).toBe(true)
    expect(fs.existsSync(path.join(SRC_ROOT, 'pages', 'sharing.tsx'))).toBe(false)
    expect(PAGE_ROUTES.some((route) => route.routePath.includes('sharing'))).toBe(false)

    const sharingSource = fs.readFileSync(path.join(WEB_ROOT, 'public', 'sharing.html'), 'utf-8')
    const researchSource = fs.readFileSync(path.join(WEB_ROOT, 'public', 'sharing-harness-research.html'), 'utf-8')
    const fourLayersSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'sharing-v2-four-layers.svg'), 'utf-8')
    const orchestrationSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'sharing-v2-orchestration-evolution.svg'), 'utf-8')
    const dualLoopSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'sharing-v2-dual-loop.svg'), 'utf-8')
    expect(sharingSource).toContain('data-template-version="2.4.0"')
    expect(sharingSource.match(/<section class="slide/g)).toHaveLength(24)
    expect(researchSource).toContain('data-template-version="1.0.0"')
    expect(researchSource.match(/<section class="slide/g)).toHaveLength(7)
    expect(sharingSource).toContain('./diagrams/sharing-v2-routing.svg')
    expect(sharingSource).toContain('./diagrams/sharing-v2-context-flow.svg')
    expect(sharingSource).not.toContain('sharing-v2-research-map.svg')
    expect(sharingSource).not.toContain('https://github.com/obra/superpowers')
    expect(sharingSource).not.toContain('https://github.com/mattpocock/skills')
    for (const diagram of [
      'sharing-v2-context-flow',
      'sharing-v2-orchestration-evolution',
      'sharing-v2-harness-loop-handoff',
      'sharing-v2-dual-loop',
    ]) {
      expect(sharingSource).toContain(`./diagrams/${diagram}.svg`)
      for (const extension of ['svg', 'png']) {
        expect(fs.existsSync(path.join(DIAGRAM_ROOT, `${diagram}.${extension}`))).toBe(true)
      }
    }
    for (const diagram of [
      'sharing-v2-research-map',
      'sharing-v2-superpowers-flow',
      'sharing-v2-matt-flow',
      'sharing-v2-harness-lineage',
    ]) {
      expect(researchSource).toContain(`./diagrams/${diagram}.svg`)
      for (const extension of ['svg', 'png']) {
        expect(fs.existsSync(path.join(DIAGRAM_ROOT, `${diagram}.${extension}`))).toBe(true)
      }
    }
    expect(researchSource).toContain('https://github.com/obra/superpowers')
    expect(researchSource).toContain('https://github.com/mattpocock/skills')
    expect(sharingSource).toContain('演示对话 · 非真实运行记录')
    expect(sharingSource).toContain('案例闭环 · Lite')
    expect(sharingSource).toContain('<span class="status purple">ROUTE</span>')
    const liteExecutionIndex = sharingSource.indexOf('案例闭环 · Lite')
    const demoProjectIndex = sharingSource.indexOf('真实项目 · 01 / Build Foundation')
    const maxOneIndex = sharingSource.indexOf('真实项目 · 02 / Scale Boundaries')
    const loopHandoffIndex = sharingSource.indexOf('阶段交接 · DevKeel → Loop')
    expect(liteExecutionIndex).toBeLessThan(demoProjectIndex)
    expect(demoProjectIndex).toBeLessThan(maxOneIndex)
    expect(maxOneIndex).toBeLessThan(loopHandoffIndex)
    expect(sharingSource).toContain('devkeel-demo-project')
    expect(sharingSource).toContain('8 条项目规则')
    expect(sharingSource).toContain('没有 test scripts、Vitest、RTL 或 jsdom')
    expect(sharingSource).toContain('example-workspace')
    expect(sharingSource).toContain('23 rules · 7 skills · 1 agent')
    expect(sharingSource).toContain('18 rules · 11 skills · 4 agents')
    const brainstormDetailIndex = sharingSource.indexOf('头脑风暴结论：')
    const designConfirmationIndex = sharingSource.indexOf('这个设计是否确认？')
    const designApprovalIndex = sharingSource.indexOf('这个设计 OK，开始实施。')
    const liteApplyIndex = sharingSource.indexOf('已创建 Lite change：')
    expect(brainstormDetailIndex).toBeGreaterThan(-1)
    expect(brainstormDetailIndex).toBeLessThan(designConfirmationIndex)
    expect(designConfirmationIndex).toBeLessThan(designApprovalIndex)
    expect(brainstormDetailIndex).toBeLessThan(designApprovalIndex)
    expect(designApprovalIndex).toBeLessThan(liteApplyIndex)
    expect(sharingSource).toContain('<h2 class="reveal">痛点</h2>')
    expect(fourLayersSource).not.toContain('手机登录')
    expect(sharingSource).toContain('case-background-label">背景描述')
    expect(sharingSource).toContain('类比：网页端 ChatGPT')
    expect(sharingSource).toContain('PROMPT · 网页端 CHATGPT')
    expect(sharingSource).toContain('CONTEXT · CODEX')
    expect(sharingSource).toContain('AGENTS.md 决定它先看哪里、遵守什么、如何验证')
    expect(sharingSource).toContain('class="harness-inputs"')
    expect(sharingSource).not.toContain('harness-brace')
    expect(sharingSource).toContain('class="harness-layer-arrow"')
    expect(sharingSource).toContain('共同汇聚为可靠执行')
    expect(sharingSource).toContain('class="harness-scaffold-core"')
    expect(sharingSource).toContain('<span class="model-code">ROUTE</span><h3>编排</h3>')
    expect(sharingSource).toContain('<span class="model-code">RULES</span><h3>约束</h3>')
    expect(sharingSource).toContain('<span class="model-code">VERIFY</span><h3>验证</h3>')
    expect(sharingSource).not.toContain('PERSISTENCE LAYER')
    expect(sharingSource).toContain('编排 · devkeel init')
    expect(sharingSource).toContain('约束 · /domain-init')
    expect(sharingSource).toContain('验证 · /verify-init')
    expect(sharingSource).not.toContain('NEXT · V1 → V2 = ROUTE 编排策略的演进')
    expect(sharingSource).toContain('DevKeel 展开 · Route')
    expect(orchestrationSource).toContain('OpenSpec × SuperPowers')
    expect(sharingSource).toContain('DevKeel 展开 · Rules')
    expect(sharingSource).toContain('domain-init · OUTPUT')
    expect(sharingSource).toContain('.harness/skills/')
    expect(sharingSource).toContain('DevKeel 展开 · Verify')
    expect(sharingSource).toMatch(/<button class="process-tab is-summary" id="constraint-tab-5"[^>]*aria-selected="true"[^>]*tabindex="0"[^>]*><b>总结<\/b><\/button>/)
    expect(sharingSource).toMatch(/<button class="process-tab is-summary" id="verify-tab-6"[^>]*aria-selected="true"[^>]*tabindex="0"[^>]*><b>总结<\/b><\/button>/)
    expect(sharingSource).toContain("const initialIndex=tabs.findIndex(tab=>tab.getAttribute('aria-selected')==='true');")
    expect(sharingSource).not.toContain('EVIDENCE')
    expect(sharingSource).toContain('REPRODUCIBLE SIGNAL')
    expect(sharingSource).toContain('.harness/agents/test-verifier.md')
    expect(sharingSource).toContain('DevKeel V2 · Route 深入')
    expect(sharingSource.indexOf('DevKeel V2 · Route 深入')).toBeLessThan(sharingSource.indexOf('DevKeel 展开 · Rules'))
    expect(orchestrationSource).toContain('brainstorm → design → specs → tasks → apply → verify → retrospective → archive')
    expect(orchestrationSource).toContain('apply → verify')
    expect(orchestrationSource).toContain('brainstorm → tasks → apply → archive')
    expect(orchestrationSource).toContain('data-flow="fixed"')
    expect(orchestrationSource).toContain('data-flow="direct"')
    expect(orchestrationSource).toContain('data-flow="lite"')
    expect(orchestrationSource).toContain('data-flow="full"')
    expect(orchestrationSource).toContain('data-node-id="full-apply"')
    expect(orchestrationSource).toContain('TDD · code-review')
    expect(orchestrationSource).toContain('TDD（适用时）· code-review')
    expect(orchestrationSource).toContain('固定全流程 → 选择最短充分路径')
    expect(orchestrationSource).toContain('路径可以变短，工程底线不变')
    expect(orchestrationSource).toContain('必要调查  ·  最小实现  ·  对应验证  ·  完成证据')
    expect(orchestrationSource).not.toContain('human-review')
    expect(orchestrationSource).not.toContain('OMC')
    expect(sharingSource).not.toContain('orchestration-summary')
    expect(sharingSource).not.toContain('OMC')
    expect(sharingSource).toContain('阶段交接 · Prompt → Context')
    expect(sharingSource).toContain('阶段交接 · Context → DevKeel')
    expect(sharingSource).toContain('阶段交接 · DevKeel → Loop')
    expect(sharingSource).toContain('↺ 回写 DevKeel · 下一次任务自动继承')
    expect(sharingSource).toContain('AGENTS.md 项目地图')
    expect(sharingSource).toContain('<span class="green">Loop</span> 有两个时间尺度')
    expect(sharingSource).toContain('闭环不是无限重试')
    expect(sharingSource).not.toContain('LOOP DELIVERABLE')
    expect(dualLoopSource).toContain('分钟级 · 一次执行内')
    expect(dualLoopSource).toContain('迭代级 · 跨任务持续')
    expect(sharingSource).toContain('三种系统能力，如何落进')
    expect(sharingSource).toContain('DevKeel 不是文件清单')
    expect(sharingSource).toContain('交流与<span class="gradient-text">问答</span>')
    expect(sharingSource).toContain('>https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md</a>')
    expect(sharingSource).toContain('>https://github.com/MinLeeV5/devkeel</a>')
    expect(sharingSource).toContain('<h4>📖 官网</h4>')
    expect(sharingSource).not.toContain('<h4>📖 文档站</h4>')
    for (const retiredHeading of [
      'the bottleneck moved',
      'one system · four layers',
      'case snapshot · prompt only',
      'from capability to repository',
      'the orchestration map',
      'two feedback loops',
      'the full picture',
      'four questions',
    ]) expect(sharingSource).not.toContain(retiredHeading)
    for (const marker of [
      'class="progress-bar"',
      'class="nav-dots"',
      '.nav-dot:hover .nav-dot-title',
      '.nav-dot:focus-visible .nav-dot-title',
      "slide.querySelector('.eyebrow')",
      "replace(/^\\s*\\/\\/\\s*/,'')",
      "padStart(2,'0')",
      "title.className='nav-dot-title'",
      'new IntersectionObserver',
      'document.addEventListener(\'keydown\'',
    ]) expect(sharingSource).toContain(marker)
    for (const marker of [
      'class="progress"',
      'class="nav"',
      'new IntersectionObserver',
      'document.addEventListener(\'keydown\'',
    ]) expect(researchSource).toContain(marker)
  })

  it('removes retired V2 detail sources and inventory', () => {
    for (const sourcePath of [
      'pages/workflow.tsx',
      'pages/templates-v2.tsx',
      'pages/architecture.tsx',
      'pages/best-practices.tsx',
      'pages/capability-inventory.tsx',
    ]) {
      expect(fs.existsSync(path.join(SRC_ROOT, sourcePath))).toBe(false)
    }
    expect(Object.keys(PAGE_COMPONENTS)).not.toContain('capability-inventory')
  })

  it('uses shared marketing navigation only on the V2 home and changelog', () => {
    for (const page of ['home', 'changelog']) {
      const source = fs.readFileSync(path.join(SRC_ROOT, 'pages', `${page}.tsx`), 'utf-8')
      expect(source).toContain('<MarketingNav')
      expect(source).not.toContain('<nav>')
    }
  })

  it('keeps all V2 marketing navigation visuals in the shared component', () => {
    const componentSource = fs.readFileSync(path.join(SRC_ROOT, 'components', 'MarketingNav.tsx'), 'utf-8')
    const sharedStyles = fs.readFileSync(path.join(SRC_ROOT, 'components', 'MarketingNav.css'), 'utf-8')
    const homeStyles = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'home.css'), 'utf-8')
    const changelogSource = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'changelog.tsx'), 'utf-8')

    expect(componentSource).toContain("import './MarketingNav.css'")
    expect(sharedStyles).toContain('.marketing-nav {')
    expect(sharedStyles).not.toContain("data-page='home'")
    expect(sharedStyles).not.toContain("data-page='changelog'")
    expect(sharedStyles).toContain('max-width: 1320px')
    expect(sharedStyles).toContain('height: 64px')
    expect(sharedStyles).toContain('--marketing-nav-line')
    expect(sharedStyles).toContain('.marketing-nav .theme-switcher')
    expect(homeStyles).not.toContain(".react-page[data-page='home'] .marketing-nav")
    expect(changelogSource).not.toContain('.nav-links a.active')
    expect(changelogSource).toContain('MARKETING_FONT_STYLESHEET')
  })

  it('composes the home page as one six-chapter article with real-world cases after quick start', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home.tsx'), 'utf-8')
    const comparisonSource = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'ComparisonSection.tsx'), 'utf-8')

    for (const component of [
      '<HomeHero',
      '<ArticleNavigation',
      '<ComparisonSection',
      '<ProgressivePathSection',
      '<ExistingProjectSection',
      '<HowItWorksSection',
      '<QuickStartSection',
      '<CaseStudiesSection',
      '<CommunitySection',
      '<MarketingFooter',
    ]) {
      expect(source).toContain(component)
    }
    expect(source).not.toContain('<HarnessAnswerSection')
    expect(comparisonSource).toContain('<HarnessAnswerSection')
    expect(source.indexOf('<QuickStartSection')).toBeLessThan(source.indexOf('<CaseStudiesSection'))
  })

  it('keeps themed architecture diagrams accessible and responsive', () => {
    const source = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'ArchitectureDiagrams.tsx'), 'utf-8')
    const styles = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'home.css'), 'utf-8')

    expect(source).toContain('lightSrc="./diagrams/onboarding-flow.svg"')
    expect(source).toContain('darkSrc="./diagrams/onboarding-flow-dark.svg"')
    expect(source).toContain('lightSrc="./diagrams/progressive-path.svg"')
    expect(source).toContain('darkSrc="./diagrams/sharing-v2-routing.svg"')
    expect(source).toContain('alt="从一句话需求开始，由 Agent 自动匹配专项 Skill、Direct、Lite 或 Full 的渐进式任务路径图"')
    expect(source).toContain('lightSrc="./diagrams/project-architecture.svg"')
    expect(source).toContain('darkSrc="./diagrams/sharing-v2-harness-architecture.svg"')
    expect(source).toContain('alt="DevKeel 编排、规则与验证能力落到仓库载体并驱动 Coding Agent 交付的架构图"')
    expect(source).toContain('useThemeStore')
    expect(styles).toContain('.home-diagram {')
    expect(styles).toContain('width: 100%')
    expect(styles).toContain('.home-diagram-frame--path,')
    expect(styles).toContain('.home-diagram-frame--architecture { max-width: 1000px; }')
    expect(styles).not.toContain('min-width: 820px')
  })

  it('keeps website and design-source diagrams on the same topology', () => {
    const reactSource = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'ArchitectureDiagrams.tsx'), 'utf-8')
    const progressiveSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'progressive-path.svg'), 'utf-8')
    const darkProgressiveSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'sharing-v2-routing.svg'), 'utf-8')
    const architectureSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'project-architecture.svg'), 'utf-8')
    const darkArchitectureSource = fs.readFileSync(path.join(DIAGRAM_ROOT, 'sharing-v2-harness-architecture.svg'), 'utf-8')

    expect(reactSource).toContain('./diagrams/progressive-path.svg')
    expect(reactSource).toContain('./diagrams/sharing-v2-routing.svg')
    expect(reactSource).toContain('./diagrams/project-architecture.svg')
    expect(reactSource).toContain('./diagrams/sharing-v2-harness-architecture.svg')

    for (const source of [progressiveSource, darkProgressiveSource]) {
      expect(source).toContain('Direct')
      expect(source).toContain('Lite')
      expect(source).toContain('Full')
      expect(source).toContain('需要协作记忆')
      expect(source).toContain('高风险成立')
      expect(source).toContain('确认升级')
      expect(source).toContain('一句话需求')
      expect(source).toContain('Agent')
      expect(source).toContain('当前会话闭环')
      expect(source).toContain('调查 → 实现 → 验证 → 交付')
      expect(source.toLowerCase()).toContain('lite schema')
      expect(source.toLowerCase()).toContain('full schema')
      expect(source).toContain('id="full-to-schema"')
      expect(source).toContain('data-flow="full"')
      expect(source).toContain('marker-end="url(#arrow-full)"')
      expect(source).toContain('Brainstorm + Tasks')
      expect(source).toContain('Design + Specs + Tasks')
      expect(source).toContain('Apply + Review + Verify')
      expect(source).toContain('Retrospective + Archive')
      expect(source).toContain('原地升级')
    }
    expect(darkProgressiveSource).toContain('实施 · TDD（适用时）· 反馈 · diff 自审')
    for (const source of [architectureSource, darkArchitectureSource]) {
      expect(source).toContain('AGENTS.md + openspec/')
      expect(source).toContain('rules/ + skills/ + agents/')
      expect(source).toContain('tests · build · preview · review')
      expect(source).toContain('共同构成 Agent-ready Repository')
      expect(source).toContain('Coding Agent')
      expect(source).toContain('手机登录交付')
    }
  })

  it('fits the comparison without a horizontal scrollbar and stacks it on narrow screens', () => {
    const styles = fs.readFileSync(path.join(SRC_ROOT, 'pages', 'home', 'home.css'), 'utf-8')

    expect(styles).toContain('.comparison-table thead th {')
    expect(styles).toContain('position: sticky;')
    expect(styles).toContain('.comparison-table thead th:first-child,')
    expect(styles).toContain('left: 0;')
    expect(styles).toContain('.comparison-table-scroll { overflow: visible; }')
    expect(styles).toContain('content: attr(data-product-label);')
    expect(styles).toContain('.comparison-score.is-open .comparison-score-detail {')
    expect(styles).not.toContain('.comparison-score:hover .comparison-score-detail')
    expect(styles).not.toContain('.comparison-score:focus-within .comparison-score-detail')
    expect(styles).toContain('@media (max-width: 960px)')
  })

  it('keeps the V1 sharing deck navigation explicit and accessible', () => {
    const sharingSource = fs.readFileSync(path.join(WEB_ROOT, 'public', 'v1', 'sharing.html'), 'utf-8')

    for (const marker of [
      '<section class="slide',
      'class="progress-bar"',
      'class="nav-dots"',
      'new IntersectionObserver',
      'document.addEventListener(\'keydown\'',
    ]) expect(sharingSource).toContain(marker)

    expect(sharingSource).toContain('https://github.com/MinLeeV5/devkeel/issues')
    expect(sharingSource).toContain('data-template-version="1.3.1"')
    expect(sharingSource).toContain('OpenSpec 管"走哪步"，SuperPowers 管"怎么做好"')
    expect(sharingSource).not.toContain('Lite')
    expect(sharingSource).not.toContain('<div id="root"></div>')
  })

  it('does not inject raw html into React pages', () => {
    const source = readSourceFiles(SRC_ROOT).join('\n')
    expect(source).not.toContain('?raw')
    expect(source).not.toContain('dangerouslySetInnerHTML')
    expect(source).not.toContain('@ts-nocheck')
  })

  it('renders changelog update commands on wrapping lines', () => {
    const markup = renderToStaticMarkup(createElement(ChangelogPage))

    expect(markup).toContain('devkeel update\ndevkeel --version')
    expect(markup).toContain('npx devkeel@latest update\nnpx devkeel@latest --version')
    expect(markup).toContain('white-space:pre-wrap;overflow-wrap:anywhere')
    expect(markup).not.toContain('white-space:pre;overflow-x:auto')
  })

  it('keeps retired telemetry out of the React routes', () => {
    expect(PAGE_ROUTES.some((route) => route.routePath === '/stats.html')).toBe(false)
    const homeSource = readSourceFiles(path.join(SRC_ROOT, 'pages', 'home')).join('\n')
    const navSource = fs.readFileSync(path.join(SRC_ROOT, 'components', 'MarketingNav.tsx'), 'utf-8')
    expect(`${homeSource}\n${navSource}`).not.toContain('./stats.html')
  })
})

function readSourceFiles(dir: string): string[] {
  const files: string[] = []
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...readSourceFiles(entryPath))
    else if (/\.[cm]?[tj]sx?$/.test(entry.name)) files.push(fs.readFileSync(entryPath, 'utf-8'))
  }
  return files
}
