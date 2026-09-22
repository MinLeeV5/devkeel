# init-repo-type-awareness 实现计划

> **给 agentic 执行器：** 使用 superpowers:subagent-driven-development
> 按任务逐个实现本计划。步骤使用 checkbox (`- [ ]`) 语法追踪进度。

**目标：** 让 `devkeel init` 区分主仓库和领域子仓库，领域子仓库只落对应领域模板，同时修复 CLAUDE.md / AGENTS.md 被无条件覆写的问题。

**架构：** 在 config 数据模型新增 `repoType` / `domainType` 字段；在 detect 层新增仓库类型检测；在 templates 层新增智能覆写和领域模板复制；在 init 命令层根据 repoType 分流到主仓库流程或领域子仓库流程。

**技术栈：** TypeScript + ESM, tsup, Commander, @clack/prompts, vitest, pnpm

---

## 任务 1: 数据模型扩展 (config.ts)

**Files:**
- Modify: `src/lib/config.ts:5-12` (HarnessConfig 接口)
- Modify: `src/lib/config.ts:39-49` (buildDefaultConfig 函数)
- Test: `tests/config.test.ts`

- [ ] **步骤 1: 写失败测试 — repoType 字段**

```typescript
// tests/config.test.ts — 添加到已有测试文件
import { describe, it, expect } from 'vitest'
import { buildDefaultConfig } from '../src/lib/config.js'

describe('buildDefaultConfig with repoType', () => {
  it('should include repoType in config', () => {
    const config = buildDefaultConfig({
      name: 'test',
      types: ['backend'],
      targets: ['claude-code'],
      repoType: 'main',
    })
    expect(config.project.repoType).toBe('main')
  })

  it('should include domainType for domain repos', () => {
    const config = buildDefaultConfig({
      name: 'test',
      types: ['backend'],
      targets: ['claude-code'],
      repoType: 'domain',
      domainType: 'backend',
    })
    expect(config.project.repoType).toBe('domain')
    expect(config.project.domainType).toBe('backend')
  })

  it('should omit domainType for main repos', () => {
    const config = buildDefaultConfig({
      name: 'test',
      types: ['backend'],
      targets: ['claude-code'],
      repoType: 'main',
    })
    expect(config.project.domainType).toBeUndefined()
  })
})
```

- [ ] **步骤 2: 运行测试确认失败**

Run: `pnpm vitest run tests/config.test.ts`
Expected: FAIL — `buildDefaultConfig` 不接受 `repoType` 参数

- [ ] **步骤 3: 实现 — 扩展 HarnessConfig 接口和 buildDefaultConfig**

```typescript
// src/lib/config.ts — 修改 HarnessConfig 接口
export interface HarnessConfig {
  version: string
  project: {
    name: string
    types: string[]
    repoType?: 'main' | 'domain'
    domainType?: string
  }
  targets: string[]
}

// src/lib/config.ts — 修改 buildDefaultConfig
export function buildDefaultConfig(options: {
  name: string
  types: string[]
  targets: string[]
  repoType?: 'main' | 'domain'
  domainType?: string
}): HarnessConfig {
  const project: HarnessConfig['project'] = {
    name: options.name,
    types: options.types,
  }
  if (options.repoType) {
    project.repoType = options.repoType
  }
  if (options.domainType) {
    project.domainType = options.domainType
  }
  return {
    version: '2.0',
    project,
    targets: options.targets,
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

Run: `pnpm vitest run tests/config.test.ts`
Expected: PASS

- [ ] **步骤 5: 运行类型检查**

Run: `pnpm lint`
Expected: 无错误

- [ ] **步骤 6: 提交**

```bash
git add src/lib/config.ts tests/config.test.ts
git commit -m "feat(config): 新增 repoType 和 domainType 字段到 HarnessConfig"
```

---

## 任务 2: 仓库类型检测 (detect.ts)

**Files:**
- Modify: `src/lib/detect.ts` (新增 detectRepoType 函数)
- Test: `tests/detect.test.ts`

- [ ] **步骤 1: 写失败测试**

```typescript
// tests/detect.test.ts — 新建或追加
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { detectRepoType } from '../src/lib/detect.js'

describe('detectRepoType', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return main when .gitmodules has submodule entries', () => {
    fs.writeFileSync(
      path.join(tmpDir, '.gitmodules'),
      '[submodule "libs/core"]\n\tpath = libs/core\n\turl = git@example.com:core.git\n',
    )
    expect(detectRepoType(tmpDir)).toBe('main')
  })

  it('should return domain when no .gitmodules exists', () => {
    expect(detectRepoType(tmpDir)).toBe('domain')
  })

  it('should return domain when .gitmodules is empty', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitmodules'), '')
    expect(detectRepoType(tmpDir)).toBe('domain')
  })

  it('should return domain when .gitmodules has no submodule entries', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitmodules'), '# empty config\n')
    expect(detectRepoType(tmpDir)).toBe('domain')
  })
})
```

- [ ] **步骤 2: 运行测试确认失败**

Run: `pnpm vitest run tests/detect.test.ts`
Expected: FAIL — `detectRepoType` 不存在

- [ ] **步骤 3: 实现 detectRepoType**

```typescript
// src/lib/detect.ts — 在文件末尾新增
export function detectRepoType(projectRoot: string): 'main' | 'domain' {
  const gitmodulesPath = path.join(projectRoot, '.gitmodules')
  if (!fs.existsSync(gitmodulesPath)) return 'domain'
  const content = fs.readFileSync(gitmodulesPath, 'utf-8')
  return /\[submodule\s+"[^"]+"\]/.test(content) ? 'main' : 'domain'
}
```

- [ ] **步骤 4: 运行测试确认通过**

Run: `pnpm vitest run tests/detect.test.ts`
Expected: PASS

- [ ] **步骤 5: 提交**

```bash
git add src/lib/detect.ts tests/detect.test.ts
git commit -m "feat(detect): 新增 detectRepoType 基于 .gitmodules 检测仓库类型"
```

---

## 任务 3: 智能文件覆写 (templates.ts)

**Files:**
- Modify: `src/lib/templates.ts` (新增 hasUserContent, writeSmartFile)
- Test: `tests/templates.test.ts`

- [ ] **步骤 1: 写失败测试 — hasUserContent**

```typescript
// tests/templates.test.ts — 新建或追加
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { hasUserContent } from '../src/lib/templates.js'

describe('hasUserContent', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should return false when file does not exist', () => {
    expect(hasUserContent(path.join(tmpDir, 'CLAUDE.md'), '@AGENTS.md\n\n# Test\n\n<!-- 项目描述 -->\n')).toBe(false)
  })

  it('should return false when file matches template exactly', () => {
    const template = '@AGENTS.md\n\n# Test\n\n<!-- 项目描述 -->\n'
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), template)
    expect(hasUserContent(path.join(tmpDir, 'CLAUDE.md'), template)).toBe(false)
  })

  it('should return false when file only differs by comment placeholders', () => {
    const template = '@AGENTS.md\n\n# Test\n\n<!-- 项目描述 -->\n'
    const existing = '@AGENTS.md\n\n# Test\n\n<!-- 自定义占位符 -->\n'
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), existing)
    expect(hasUserContent(path.join(tmpDir, 'CLAUDE.md'), template)).toBe(false)
  })

  it('should return true when file has user-written content', () => {
    const template = '@AGENTS.md\n\n# Test\n\n<!-- 项目描述 -->\n'
    const existing = '@AGENTS.md\n\n# Test\n\n这是一个电商后端服务，负责订单处理。\n'
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), existing)
    expect(hasUserContent(path.join(tmpDir, 'CLAUDE.md'), template)).toBe(true)
  })
})
```

- [ ] **步骤 2: 运行测试确认失败**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: FAIL — `hasUserContent` 不存在

- [ ] **步骤 3: 实现 hasUserContent**

```typescript
// src/lib/templates.ts — 在文件末尾新增
function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim()
}

export function hasUserContent(filePath: string, renderedTemplate: string): boolean {
  if (!fs.existsSync(filePath)) return false
  const existing = fs.readFileSync(filePath, 'utf-8')
  return stripComments(existing) !== stripComments(renderedTemplate)
}
```

- [ ] **步骤 4: 运行测试确认通过**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: PASS

- [ ] **步骤 5: 写失败测试 — writeSmartFile**

```typescript
// tests/templates.test.ts — 追加
import { writeSmartFile } from '../src/lib/templates.js'

describe('writeSmartFile', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should write full template when file does not exist', () => {
    const filePath = path.join(tmpDir, 'CLAUDE.md')
    writeSmartFile(filePath, '@AGENTS.md\n\n# Test\n', '@AGENTS.md')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('@AGENTS.md\n\n# Test\n')
  })

  it('should overwrite when file has only template content', () => {
    const filePath = path.join(tmpDir, 'CLAUDE.md')
    fs.writeFileSync(filePath, '@AGENTS.md\n\n# OldName\n\n<!-- 项目描述 -->\n')
    writeSmartFile(filePath, '@AGENTS.md\n\n# NewName\n\n<!-- 项目描述 -->\n', '@AGENTS.md')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('@AGENTS.md\n\n# NewName\n\n<!-- 项目描述 -->\n')
  })

  it('should preserve user content and ensure directive exists', () => {
    const filePath = path.join(tmpDir, 'CLAUDE.md')
    fs.writeFileSync(filePath, '# My Project\n\n这是用户写的内容\n')
    writeSmartFile(filePath, '@AGENTS.md\n\n# Template\n', '@AGENTS.md')
    const result = fs.readFileSync(filePath, 'utf-8')
    expect(result).toContain('@AGENTS.md')
    expect(result).toContain('这是用户写的内容')
  })

  it('should not modify when user content already has directive', () => {
    const filePath = path.join(tmpDir, 'CLAUDE.md')
    const content = '@AGENTS.md\n\n# My Project\n\n这是用户写的内容\n'
    fs.writeFileSync(filePath, content)
    writeSmartFile(filePath, '@AGENTS.md\n\n# Template\n', '@AGENTS.md')
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(content)
  })
})
```

- [ ] **步骤 6: 运行测试确认失败**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: FAIL — `writeSmartFile` 不存在

- [ ] **步骤 7: 实现 writeSmartFile**

```typescript
// src/lib/templates.ts — 在 hasUserContent 后新增
export function writeSmartFile(
  filePath: string,
  renderedContent: string,
  directive?: string,
): void {
  if (!hasUserContent(filePath, renderedContent)) {
    fs.writeFileSync(filePath, renderedContent, 'utf-8')
    return
  }
  if (!directive) return
  const existing = fs.readFileSync(filePath, 'utf-8')
  if (existing.includes(directive)) return
  fs.writeFileSync(filePath, directive + '\n\n' + existing, 'utf-8')
}
```

- [ ] **步骤 8: 运行测试确认通过**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: PASS

- [ ] **步骤 9: 提交**

```bash
git add src/lib/templates.ts tests/templates.test.ts
git commit -m "feat(templates): 新增 hasUserContent 和 writeSmartFile 智能覆写机制"
```

---

## 任务 4: 领域模板文件

**Files:**
- Create: `templates/agents-md-domain.md`
- Create: `templates/claude-md-domain.md`

- [ ] **步骤 1: 创建领域 AGENTS.md 模板**

```markdown
# AGENTS.md — {{PROJECT_NAME}} 执行契约

本文件是项目统一的执行契约。

## 1. 适用范围

本文件作用于仓库根目录。

## 2. 阅读顺序

1. 当前作用域生效的 AGENTS.md
2. .harness/rules/、.harness/skills/ 中与任务相关的内容
3. CLAUDE.md（若平台自动加载）

优先级：用户当前明确要求 > 当前 AGENTS.md > CLAUDE.md

## 3. 默认执行基线

- 歧义或风险不低时，先显式写出关键假设与未知项
- 默认选择最小、最容易验证的方案
- 只改与目标直接相关的内容，不顺手清理无关问题
- 在声称完成前提供可观察的验证证据

## 4. 路由表

| 任务类型 | Skill | 备注 |
|----------|-------|------|
| 代码审查 | review-orchestrator | |
| 调试排错 | automated-instrumented-debugging | |
| 原子提交 | commit | |
| 未命中以上 | 按默认执行基线推进 | |

## 5. 验证要求

- 优先运行与改动最接近的验证命令，再按需扩大范围
- 不要把"理论上应该可行"表述成"已经完成验证"

## 6. 输出风格

- 面向工程师读者，优先给结论、边界、依据
- 需要对比、清单或多维信息时，优先使用表格或列表

## 7. 收尾要求

结束一次工作会话时，只有 git push 成功后，这次工作才算真正完成。

## 8. 资产位置

| 资产 | 路径 |
|------|------|
| 配置 | .harness/config.yml |
| Skills | .harness/skills/ |
| Rules | .harness/rules/ |
| Agents | .harness/agents/ |

## 9. 项目补充

<!-- 领域: {{DOMAIN_TYPE}} -->
<!-- 项目特有的约束、背景、注意事项写在此处 -->
```

Write to: `templates/agents-md-domain.md`

- [ ] **步骤 2: 创建领域 CLAUDE.md 模板**

```markdown
@AGENTS.md

# {{PROJECT_NAME}}

<!-- 项目描述 -->
```

Write to: `templates/claude-md-domain.md`

- [ ] **步骤 3: 提交**

```bash
git add templates/agents-md-domain.md templates/claude-md-domain.md
git commit -m "feat(templates): 新增领域子仓库的 AGENTS.md 和 CLAUDE.md 模板"
```

---

## 任务 5: 领域模板复制函数 (templates.ts)

**Files:**
- Modify: `src/lib/templates.ts` (新增 copyDomainTemplateAsRoot)
- Test: `tests/templates.test.ts`

- [ ] **步骤 1: 写失败测试**

```typescript
// tests/templates.test.ts — 追加
import { copyDomainTemplateAsRoot } from '../src/lib/templates.js'

describe('copyDomainTemplateAsRoot', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should copy domain template contents to .harness/ root level', () => {
    const harnessDir = path.join(tmpDir, '.harness')
    copyDomainTemplateAsRoot('backend', harnessDir)
    // backend domain template has skills/, rules/, agents/ subdirs
    expect(fs.existsSync(path.join(harnessDir, 'skills'))).toBe(true)
    expect(fs.existsSync(path.join(harnessDir, 'rules'))).toBe(true)
    expect(fs.existsSync(path.join(harnessDir, 'agents'))).toBe(true)
  })

  it('should do nothing for non-existent domain type', () => {
    const harnessDir = path.join(tmpDir, '.harness')
    copyDomainTemplateAsRoot('nonexistent', harnessDir)
    expect(fs.existsSync(harnessDir)).toBe(false)
  })
})
```

- [ ] **步骤 2: 运行测试确认失败**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: FAIL — `copyDomainTemplateAsRoot` 不存在

- [ ] **步骤 3: 实现 copyDomainTemplateAsRoot**

```typescript
// src/lib/templates.ts — 新增
export function copyDomainTemplateAsRoot(domainType: string, harnessDir: string): void {
  const source = path.join(getTemplatesDir(), 'domain', domainType)
  if (!fs.existsSync(source)) return
  for (const sub of ['skills', 'rules', 'agents']) {
    const subSource = path.join(source, sub)
    if (fs.existsSync(subSource)) {
      copyDirRecursive(subSource, path.join(harnessDir, sub))
    }
  }
}
```

- [ ] **步骤 4: 运行测试确认通过**

Run: `pnpm vitest run tests/templates.test.ts`
Expected: PASS

- [ ] **步骤 5: 提交**

```bash
git add src/lib/templates.ts tests/templates.test.ts
git commit -m "feat(templates): 新增 copyDomainTemplateAsRoot 将领域模板复制到 .harness/ 顶层"
```

---

## 任务 6: init 流程重构 — 仓库类型分流

**Files:**
- Modify: `src/commands/init.ts`
- Modify: `src/lib/config.ts` (buildDefaultConfig 已在任务 1 完成)

- [ ] **步骤 1: 在 init.ts 顶部新增 detectRepoType 导入**

```typescript
// src/commands/init.ts — 修改 import
import { detectEnvironment, detectRepoType } from '../lib/detect.js'
import { ..., writeSmartFile, copyDomainTemplateAsRoot } from '../lib/templates.js'
```

- [ ] **步骤 2: 在项目名称提示后、项目类型提示前插入仓库类型检测**

在 `runInit()` 中，`name` 提示之后插入：

```typescript
  const detectedRepoType = detectRepoType(projectRoot)
  const repoType = await p.select({
    message: `仓库类型？（检测到: ${detectedRepoType === 'main' ? '主仓库' : '领域子仓库'}）`,
    options: [
      { value: 'main', label: '主仓库（含子模块编排）' },
      { value: 'domain', label: '领域子仓库（独立技术领域）' },
    ],
    initialValue: detectedRepoType,
  })
  if (p.isCancel(repoType)) { p.cancel('已取消'); process.exit(0) }
```

- [ ] **步骤 3: 当 repoType 为 domain 时，新增领域类型选择**

```typescript
  let domainType: string | undefined
  if (repoType === 'domain') {
    const dt = await p.select({
      message: '领域类型？',
      options: [
        { value: 'backend', label: 'Backend' },
        { value: 'frontend', label: 'Frontend' },
        { value: 'other', label: 'Other' },
      ],
    })
    if (p.isCancel(dt)) { p.cancel('已取消'); process.exit(0) }
    domainType = dt as string
  }
```

- [ ] **步骤 4: 修改 buildDefaultConfig 调用传入新字段**

```typescript
  const config = buildDefaultConfig({
    name: name as string,
    types: types as string[],
    targets: targets as string[],
    repoType: repoType as 'main' | 'domain',
    domainType,
  })
```

- [ ] **步骤 5: 包裹主仓库独有逻辑为条件分支**

将通用模板复制、openspec、子模块处理等包裹在 `if (repoType === 'main')` 中：

```typescript
  if (repoType === 'main') {
    // 已有的通用模板复制逻辑 (lines 56-78)
    // 已有的 deprecatedAssets 检测 (lines 80-93)
    // 已有的 openspec 处理 (lines 95-108)
    // 已有的子模块处理 (lines 118-154)
  } else {
    // 领域子仓库流程
    copyDomainTemplateAsRoot(domainType!, path.join(projectRoot, '.harness'))
    p.log.success(`.harness/ (${domainType} 领域模板)`)
  }
```

- [ ] **步骤 6: 修改 AGENTS.md / CLAUDE.md 写入改用 writeSmartFile**

```typescript
  // 根据 repoType 选择模板
  const agentsTemplate = repoType === 'domain' ? 'agents-md-domain.md' : 'agents-md.md'
  const agentsVars = repoType === 'domain'
    ? { ...templateVars, DOMAIN_TYPE: domainType! }
    : { ...templateVars, SUBMODULE_SECTION: submoduleSection || '<!-- 无子项目 -->' }
  const agentsMd = renderTemplate(readTemplateFile(agentsTemplate), agentsVars)
  writeSmartFile(path.join(projectRoot, 'AGENTS.md'), agentsMd, '@AGENTS.md')
  p.log.success('AGENTS.md')

  if (targetList.includes('claude-code') || targetList.includes('cursor')) {
    const claudeTemplate = repoType === 'domain' ? 'claude-md-domain.md' : 'claude-md.md'
    const claudeMd = renderTemplate(readTemplateFile(claudeTemplate), templateVars)
    writeSmartFile(path.join(projectRoot, 'CLAUDE.md'), claudeMd, '@AGENTS.md')
    p.log.success('CLAUDE.md')
  }
  if (targetList.includes('gemini')) {
    const geminiMd = readTemplateFile('gemini-md.md')
    writeSmartFile(path.join(projectRoot, 'GEMINI.md'), geminiMd, '@AGENTS.md')
    p.log.success('GEMINI.md')
  }
```

- [ ] **步骤 7: 运行类型检查**

Run: `pnpm lint`
Expected: 无错误

- [ ] **步骤 8: 提交**

```bash
git add src/commands/init.ts
git commit -m "feat(init): 根据 repoType 分流主仓库和领域子仓库 init 流程"
```

---

## 任务 7: 子模块批量 init 优化

**Files:**
- Modify: `src/commands/init.ts` (子模块处理段落)

- [ ] **步骤 1: 修改子模块处理 — 为每个子模块增加领域类型选择**

将 `init.ts` 中子模块 for 循环内的逻辑替换：

```typescript
      for (const subPath of selectedPaths) {
        const subFull = path.join(projectRoot, subPath)
        const subEntries = fs.existsSync(subFull)
          ? fs.readdirSync(subFull).filter(e => e !== '.git')
          : []
        if (subEntries.length === 0) {
          p.log.warning(`${subPath}/ 是空仓库，请先拉取代码（git submodule update --init ${subPath}）`)
          continue
        }

        const subDomainType = await p.select({
          message: `${subPath} 的领域类型？`,
          options: [
            { value: 'backend', label: 'Backend' },
            { value: 'frontend', label: 'Frontend' },
            { value: 'other', label: 'Other' },
          ],
        })
        if (p.isCancel(subDomainType)) continue

        const subName = path.basename(subPath)
        const subConfig = buildDefaultConfig({
          name: subName,
          types: [subDomainType as string],
          targets: targetList,
          repoType: 'domain',
          domainType: subDomainType as string,
        })
        writeConfig(subFull, subConfig)
        copyDomainTemplateAsRoot(subDomainType as string, path.join(subFull, '.harness'))

        const subTemplateVars = { PROJECT_NAME: subName, DOMAIN_TYPE: subDomainType as string }
        const subAgentsMd = renderTemplate(readTemplateFile('agents-md-domain.md'), subTemplateVars)
        writeSmartFile(path.join(subFull, 'AGENTS.md'), subAgentsMd, '@AGENTS.md')

        if (targetList.includes('claude-code') || targetList.includes('cursor')) {
          const subClaudeMd = renderTemplate(readTemplateFile('claude-md-domain.md'), subTemplateVars)
          writeSmartFile(path.join(subFull, 'CLAUDE.md'), subClaudeMd, '@AGENTS.md')
        }

        createPlatformLinks(subFull, targetList)
        p.log.success(`${subPath}/ 领域配置 (${subDomainType}) + 平台链接`)
      }
```

- [ ] **步骤 2: 运行类型检查**

Run: `pnpm lint`
Expected: 无错误

- [ ] **步骤 3: 提交**

```bash
git add src/commands/init.ts
git commit -m "feat(init): 子模块批量 init 改用领域子仓库流程"
```

---

## 任务 8: 集成测试

**Files:**
- Create or Modify: `tests/init.test.ts`

- [ ] **步骤 1: 写集成测试 — 领域子仓库 init**

```typescript
// tests/init.test.ts — 追加
describe('domain subrepo init output', () => {
  it('should create .harness/ with domain templates only', () => {
    // 验证 .harness/skills/ 来自 domain/backend/ 而非通用模板
    // 验证不存在 .harness/commands/
    // 验证不存在 openspec/
  })

  it('should write config with repoType and domainType', () => {
    // 验证 config.yml 包含 repoType: domain, domainType: backend
  })
})
```

具体测试逻辑需根据已有 init 测试的 mock 模式编写（可能需要 mock @clack/prompts）。

- [ ] **步骤 2: 写集成测试 — 智能覆写**

```typescript
describe('smart file write in init', () => {
  it('should not overwrite CLAUDE.md with user content', () => {
    // 准备含用户内容的 CLAUDE.md
    // 运行 init 流程
    // 验证用户内容被保留
  })
})
```

- [ ] **步骤 3: 运行全部测试**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **步骤 4: 运行构建**

Run: `pnpm build`
Expected: 无错误

- [ ] **步骤 5: 提交**

```bash
git add tests/
git commit -m "test(init): 新增领域子仓库 init 和智能覆写集成测试"
```

---

## 任务 9: 最终验证

- [ ] **步骤 1: 运行完整测试套件**

Run: `pnpm test`
Expected: ALL PASS

- [ ] **步骤 2: 构建验证**

Run: `pnpm build`
Expected: 无错误

- [ ] **步骤 3: 手动冒烟测试 — 主仓库 init**

Run: `cd /tmp && mkdir test-main && cd test-main && git init && node /path/to/harness-cli/bin/devkeel.js init`
验证：选 main → 通用模板 + openspec 落地

- [ ] **步骤 4: 手动冒烟测试 — 领域子仓库 init**

Run: `cd /tmp && mkdir test-domain && cd test-domain && git init && node /path/to/harness-cli/bin/devkeel.js init`
验证：选 domain → 只有领域模板，无 openspec

- [ ] **步骤 5: 最终提交（如有修复）**

```bash
git push
```
