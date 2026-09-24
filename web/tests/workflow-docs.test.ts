import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('current V2 home documentation', () => {
  it('documents the complete progressive path without restoring retired methodology', () => {
    const source = readHomeSources()
    const progressiveDiagram = fs.readFileSync(path.join(WEB_ROOT, 'public/diagrams/progressive-path.svg'), 'utf-8')

    for (const pathName of ['专项 Skill', 'Direct', 'Lite', 'Full']) {
      expect(source).toContain(pathName)
    }
    expect(source).toContain('先明确结果与验收')
    expect(source).toContain('最近的反馈信号')
    expect(source).toContain('Lite 聚焦补缺、按需探针')
    expect(source).toContain('Full 检查假设、替代方向与风险')
    expect(source).toContain('完成双探针检查，可复用有效结论')
    expect(source).toContain('工作流提供默认深度，用户可单独调整')
    expect(progressiveDiagram).toContain('阻塞缺口合并去重')
    expect(progressiveDiagram).toContain('每轮只讨论一个关键决定')
    expect(progressiveDiagram).toContain('Lite / Full 由 OpenSpec 编排')
    expect(source).not.toContain('openspec-orchestration')
    expect(source).not.toContain('Paseo')
    expect(source).not.toContain('固定 TDD')
  })

  it('documents inspected large and small repository cases after quick start', () => {
    const homeSource = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home.tsx'), 'utf-8')
    const caseSource = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home/CaseStudiesSection.tsx'), 'utf-8')

    expect(homeSource.indexOf('<QuickStartSection')).toBeLessThan(homeSource.indexOf('<CaseStudiesSection'))
    expect(caseSource).toContain('example-workspace')
    expect(caseSource).toContain('devkeel-demo-project')
    expect(caseSource).toContain('23 rules · 7 skills · 1 agent')
    expect(caseSource).toContain('18 rules · 11 skills · 4 agents')
    expect(caseSource).toContain('8 条 rules 与 1 个前端 reviewer')
    expect(caseSource).toContain('当前 package.json 没有 test scripts')
  })

  it('presents domain-init before verify-init and preserves confirmation gates', () => {
    const source = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home/ExistingProjectSection.tsx'), 'utf-8')
    expect(source.indexOf('devkeel init')).toBeLessThan(source.indexOf('/domain-init'))
    expect(source.indexOf('/domain-init')).toBeLessThan(source.indexOf('/verify-init'))
    expect(source).toContain('AGENTS.md')
    expect(source).toContain('全局路由骨架')
    expect(source).toContain('用户 Review')
    expect(source).toContain('用户同意')
  })

  it('keeps source and public install guides synchronized', () => {
    const sourceGuide = fs.readFileSync(path.join(WEB_ROOT, 'install.md'), 'utf-8')
    const publicGuide = fs.readFileSync(path.join(WEB_ROOT, 'public', 'install.md'), 'utf-8')
    expect(publicGuide).toBe(sourceGuide)
  })

  it('keeps install commands current and protects existing project assets', () => {
    const guide = fs.readFileSync(path.join(WEB_ROOT, 'install.md'), 'utf-8')
    const shellBlocks = [...guide.matchAll(/```bash\n([\s\S]*?)```/g)]
      .map((match) => match[1]).join('\n')

    expect(shellBlocks).not.toMatch(/devkeel(?:@latest)?\s+(?:migrate|submodule)\b/)
    expect(shellBlocks).not.toMatch(/rm\s+-rf|git\s+(?:checkout|reset)|mv\s+docs\b/)
    expect(shellBlocks).not.toMatch(/git\s+(?:commit|push)\b/)
    expect(guide).toContain('sync --targets <targets> --force')
    expect(guide).toContain('先备份冲突的技能入口')
    expect(guide).toContain('`docs/` 是当前项目知识的位置')
    expect(guide).toContain('旧配置被忽略且不会被改写')
    expect(guide).toContain('共用同一套测试文档和规则')
    expect(guide).toContain('“全部更新”会覆盖待更新组件的本地修改')
  })

  it('installs from public npm without changing the user registry', () => {
    const guide = fs.readFileSync(path.join(WEB_ROOT, 'install.md'), 'utf-8')
    const quickStart = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home/QuickStartSection.tsx'), 'utf-8')
    for (const source of [guide, quickStart]) {
      expect(source).toContain('npx devkeel@latest init')
      expect(source).not.toContain('npm config set')
    }
  })

  it('documents the supported Node.js baseline', () => {
    const quickStart = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home/QuickStartSection.tsx'), 'utf-8')
    const packageJson = JSON.parse(fs.readFileSync(path.join(WEB_ROOT, 'package.json'), 'utf-8')) as { engines?: { node?: string } }
    expect(quickStart).toContain('Node.js ≥ 20.19.0')
    expect(packageJson.engines?.node).toBe('>=20.19.0')
  })

  it('keeps install guidance on the home page without one-instruction branding', () => {
    const quickStart = fs.readFileSync(path.join(WEB_ROOT, 'src/pages/home/QuickStartSection.tsx'), 'utf-8')
    expect(quickStart).toContain('https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md')
    expect(quickStart).toContain('推荐 · Agent 执行')
    expect(quickStart).not.toContain('一条指令')
  })
})

function readHomeSources(): string {
  const homeDir = path.join(WEB_ROOT, 'src/pages/home')
  return fs.readdirSync(homeDir)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => fs.readFileSync(path.join(homeDir, name), 'utf-8'))
    .join('\n')
}
