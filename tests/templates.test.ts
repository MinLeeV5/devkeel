import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import YAML from 'yaml'
import { copyTemplateSkills, copyOpenspecTemplate, readTemplateFile, renderTemplate, ensureGitignore, copyTemplateFile, createPlatformLinks, detectExistingPlatformDirs, cleanLegacyStageFiles, updateOpenspecIncremental, hasUserContent, writeSmartFile, extractUserSlots, fillUserSlots, extractFrameworkContent } from '../src/lib/templates.js'
import { getBuiltinVersions, readVersions, writeVersions } from '../src/lib/versions.js'

describe('templates', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-tpl-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('copyTemplateSkills', () => {
    it('should copy skills to target directory', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)
      expect(fs.existsSync(path.join(target, 'commit', 'SKILL.md'))).toBe(true)
      expect(fs.readFileSync(
        path.join(target, 'commit', 'references', 'merge-request.md'),
        'utf-8',
      )).toBe(readTemplateFile('skills/commit/references/merge-request.md'))
      expect(fs.existsSync(path.join(target, 'requirement-analysis', 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(
        target,
        'openspec-verify-change',
        'scripts',
        'implementation-fingerprint.mjs',
      ))).toBe(true)
      expect(fs.existsSync(path.join(target, 'openspec-update-change', 'SKILL.md')))
        .toBe(true)
    })

    it('should keep review findings platform-independent and readable', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)

      const relativeSkillPath = path.join('review-orchestrator', 'SKILL.md')
      const relativeContractPath = path.join(
        'review-orchestrator',
        'references',
        'output-contract.md',
      )
      const relativeModePath = path.join(
        'review-orchestrator',
        'references',
        'mode-strategy.md',
      )
      const skill = fs.readFileSync(path.join(target, relativeSkillPath), 'utf-8')
      const outputContract = fs.readFileSync(path.join(target, relativeContractPath), 'utf-8')
      const modeStrategy = fs.readFileSync(path.join(target, relativeModePath), 'utf-8')
      const reviewInstructions = `${skill}\n${outputContract}\n${modeStrategy}`

      expect(reviewInstructions).toContain('平台无关')
      expect(outputContract).toContain('可定位的相对路径与起始行')
      expect(outputContract).toContain('不要求固定章节')
      expect(reviewInstructions).not.toContain('完整四段')
      expect(reviewInstructions).not.toMatch(/^::/m)
      expect(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'skills', relativeSkillPath),
        'utf-8',
      )).toBe(skill)
      expect(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'skills', relativeContractPath),
        'utf-8',
      )).toBe(outputContract)
      expect(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'skills', relativeModePath),
        'utf-8',
      )).toBe(modeStrategy)
    })

    it('should package evidence-first debugging with progressive instrumentation', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)

      const debugDir = path.join(target, 'systematic-debugging')
      const skill = fs.readFileSync(path.join(debugDir, 'SKILL.md'), 'utf-8')
      const diagnosis = fs.readFileSync(path.join(debugDir, 'references', 'diagnosis.md'), 'utf-8')
      const instrumentation = fs.readFileSync(
        path.join(debugDir, 'references', 'instrumentation.md'),
        'utf-8',
      )
      const javascriptHttp = fs.readFileSync(
        path.join(debugDir, 'references', 'javascript-http.md'),
        'utf-8',
      )
      const java8Http = fs.readFileSync(
        path.join(debugDir, 'references', 'java8-http.md'),
        'utf-8',
      )

      expect(skill).toContain('name: systematic-debugging')
      expect(skill).toContain('version: "1.0.1"')
      expect(skill).toContain('插桩是遇到运行时观测缺口后的升级手段，不是默认入口')
      expect(skill).toContain('建立反馈信号')
      expect(skill).toContain('临时代码写入已获授权')
      expect(skill).toContain('连续三次修复尝试失败')
      expect(skill).toContain('references/diagnosis.md')
      expect(skill).toContain('references/instrumentation.md')
      expect(diagnosis).toContain('建立可判定反馈信号')
      expect(diagnosis).toContain('生成 2–4 个候选')
      expect(diagnosis).toContain('性能分支')
      expect(instrumentation).toContain('POST /log?s=<session>&r=<runtime>&e=<event>')
      expect(instrumentation).toContain('/*HDBG:7kx2*/')
      expect(javascriptHttp).toContain('Electron renderer')
      expect(javascriptHttp).toContain('优先使用 Web 模板直连 collector')
      expect(javascriptHttp).toContain('TypeScript 不使用单独 emitter')
      expect(javascriptHttp).toContain('(globalThis as any).__hdbg')
      expect(javascriptHttp).toContain('ESM/CJS')
      expect(java8Http).toContain('HttpURLConnection')
      expect(fs.existsSync(path.join(debugDir, 'assets', 'hdbg-web.js'))).toBe(true)
      expect(fs.existsSync(path.join(debugDir, 'assets', 'hdbg-node.cjs'))).toBe(true)
      expect(fs.existsSync(path.join(debugDir, 'assets', 'Hdbg.java'))).toBe(true)

      const dogfoodDir = path.join(
        process.cwd(),
        '.harness',
        'skills',
        'systematic-debugging',
      )
      expect(fs.readFileSync(path.join(dogfoodDir, 'SKILL.md'), 'utf-8')).toBe(skill)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'diagnosis.md'),
        'utf-8',
      )).toBe(diagnosis)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'instrumentation.md'),
        'utf-8',
      )).toBe(instrumentation)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'javascript-http.md'),
        'utf-8',
      )).toBe(javascriptHttp)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'java8-http.md'),
        'utf-8',
      )).toBe(java8Http)

      const relativeFiles = (directory: string, prefix = ''): string[] => (
        fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
          const relative = prefix ? `${prefix}/${entry.name}` : entry.name
          const entryPath = path.join(directory, entry.name)
          return entry.isDirectory() ? relativeFiles(entryPath, relative) : [relative]
        })
      )
      expect(relativeFiles(dogfoodDir).sort()).toEqual(relativeFiles(debugDir).sort())
      for (const relative of relativeFiles(debugDir)) {
        expect(fs.readFileSync(path.join(dogfoodDir, relative)))
          .toEqual(fs.readFileSync(path.join(debugDir, relative)))
      }
    })

    it('should keep technical-design methods internal and caller-owned', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)

      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'dimension-selection.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'default-template.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'domain-profiles', 'frontend.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'domain-profiles', 'desktop.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'domain-profiles', 'native-service.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'dimensions', 'D03-runtime-boundaries.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'technical-design', 'references', 'dimensions', 'D10-security-privacy.md'))).toBe(true)

      const readAllMarkdown = (dir: string): string => {
        return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
          const entryPath = path.join(dir, entry.name)
          if (entry.isDirectory()) return readAllMarkdown(entryPath)
          if (!entry.name.endsWith('.md')) return []
          return fs.readFileSync(entryPath, 'utf-8')
        }).join('\n')
      }

      const skill = fs.readFileSync(path.join(target, 'technical-design', 'SKILL.md'), 'utf-8')
      const dimensionSelection = fs.readFileSync(path.join(target, 'technical-design', 'references', 'dimension-selection.md'), 'utf-8')
      const defaultTemplate = fs.readFileSync(path.join(target, 'technical-design', 'references', 'default-template.md'), 'utf-8')
      const uiDimension = fs.readFileSync(path.join(target, 'technical-design', 'references', 'dimensions', 'D07-ui-interaction.md'), 'utf-8')
      const allTechnicalDesignMarkdown = readAllMarkdown(path.join(target, 'technical-design'))
      expect(skill).toContain('默认由当前')
      expect(skill).toContain('native-service')
      expect(skill).toContain('references/dimension-selection.md')
      expect(skill).toContain('只读取命中的')
      expect(skill).toContain('core / supporting / checklist / skip')
      expect(skill).toContain('不自动生成 tasks')
      expect(skill).toContain('用户或调用方提供的具体模板优先')
      expect(skill).toContain('只有输出路径或设计约束、没有具体结构时，不视为已提供模板')
      expect(skill).toContain('没有提供模板时，读取 `references/default-template.md`')
      expect(skill).toContain('不追加默认模板章节')
      expect(defaultTemplate).toContain('## 一句话方案')
      expect(defaultTemplate).toContain('## 关键决策与权衡')
      expect(defaultTemplate).toContain('## 验证方案')
      expect(skill).toContain('不要在最终文档写维度矩阵')
      expect(skill).toContain('不输出分析过程')
      expect(allTechnicalDesignMarkdown).not.toContain('### 设计维度选择')
      expect(skill).not.toContain('产出 `### 设计维度选择` 表格')
      expect(skill).not.toContain('先展示 `### 设计维度选择`')
      expect(skill).not.toContain('已输出维度选择表')
      expect(dimensionSelection).toContain('内部记录不得复制到最终技术方案')
      expect(dimensionSelection).toContain('`skip` 不进入最终输出')
      expect(dimensionSelection).not.toContain('设计关注点')
      expect(dimensionSelection).not.toContain('## 输出格式')
      expect(dimensionSelection).not.toContain('| 维度 | 领域/触点 | 优先级 | 选择原因 | 输出位置 |')
      expect(skill).not.toContain('ui-fidelity-playbook')
      expect(skill).toContain('OpenSpec 下游 artifact 的投影阶段不得调用本 skill')
      expect(skill).toContain('作为只读探针')
      expect(uiDimension).not.toContain('ui-fidelity-playbook')
      expect(allTechnicalDesignMarkdown).not.toContain('ui-fidelity-playbook')
      expect(skill).toContain('不输出设计文档')
    })

    it('should keep requirement analysis focused', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)

      const requirement = fs.readFileSync(path.join(target, 'requirement-analysis', 'SKILL.md'), 'utf-8')
      const requirementDefaultTemplate = fs.readFileSync(
        path.join(target, 'requirement-analysis', 'references', 'default-template.md'),
        'utf-8',
      )
      expect(requirement).toContain('默认由当前 Agent 做聚焦调查')
      expect(requirement).toContain('只有调查面确实很宽')
      expect(requirement).toContain('仅询问无法从上下文或仓库查明')
      expect(requirement).toContain('不自动调用 Explore、technical-design')
      expect(requirement).toContain('用户或调用方提供的具体模板优先')
      expect(requirement).toContain('只有输出路径或内容约束、没有具体结构时，不视为已提供模板')
      expect(requirement).toContain('没有提供模板时，读取 `references/default-template.md`')
      expect(requirement).toContain('不追加默认模板章节')
      expect(requirementDefaultTemplate).toContain('## 一句话需求')
      expect(requirementDefaultTemplate).toContain('## 用户场景与预期行为')
      expect(requirementDefaultTemplate).toContain('## 验收标准')
      expect(requirement).not.toContain('将其分成 200-300 字')
      expect(requirement).not.toContain('每节结束后询问')
    })

    it('should package brainstorming as the only discussion skill', () => {
      const target = path.join(tmpDir, 'skills')
      copyTemplateSkills(target)

      expect(fs.existsSync(path.join(target, 'brainstorming', 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'workflow-routing', 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'brainstorming', 'references', 'openspec-context.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'brainstorming', 'references', 'living-brainstorm.md'))).toBe(true)
      expect(fs.existsSync(path.join(
        target,
        'brainstorming',
        'scripts',
        'openspec-status-snapshot.sh',
      ))).toBe(true)
      expect(fs.existsSync(path.join(target, 'grilling'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'openspec-explore'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'systematic-debugging', 'SKILL.md'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'automated-instrumented-debugging'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'receiving-code-review'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'architecture-diagram'))).toBe(false)

      const retired = [
        'grilling',
        'openspec-explore',
        'automated-instrumented-debugging',
        'receiving-code-review',
        'writing-plans',
        'executing-plans',
        'subagent-driven-development',
        'requesting-code-review',
        'verification-before-completion',
        'finishing-a-development-branch',
        'test-driven-development',
        'using-git-worktrees',
        'architecture-diagram',
        'human-review',
        'openspec-propose',
      ]
      for (const skillName of retired) {
        expect(fs.existsSync(path.join(target, skillName))).toBe(false)
        expect(fs.existsSync(path.join(process.cwd(), '.harness', 'skills', skillName))).toBe(false)
      }
      const packagedVersions = YAML.parse(readTemplateFile('versions-yml.yml')) as {
        skills: Record<string, string>
      }
      const dogfoodVersions = YAML.parse(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'versions.yml'),
        'utf-8',
      )) as { skills: Record<string, string> }
      expect(packagedVersions.skills['architecture-diagram']).toBeUndefined()
      expect(dogfoodVersions.skills['architecture-diagram']).toBeUndefined()
      expect(packagedVersions.skills['human-review']).toBeUndefined()
      expect(dogfoodVersions.skills['human-review']).toBeUndefined()

      const brainstorming = fs.readFileSync(path.join(target, 'brainstorming', 'SKILL.md'), 'utf-8')
      const openspecContext = fs.readFileSync(
        path.join(target, 'brainstorming', 'references', 'openspec-context.md'),
        'utf-8',
      )
      const livingBrainstorm = fs.readFileSync(
        path.join(target, 'brainstorming', 'references', 'living-brainstorm.md'),
        'utf-8',
      )
      const statusSnapshot = fs.readFileSync(
        path.join(target, 'brainstorming', 'scripts', 'openspec-status-snapshot.sh'),
        'utf-8',
      )
      expect(brainstorming).toContain('author: "devkeel"')
      expect(brainstorming).toContain('version: "9.1.0"')
      expect(brainstorming).toContain('topic-only（默认）')
      expect(brainstorming).toContain('change-draft')
      expect(brainstorming).toContain('每轮严格只处理一个决定')
      expect(brainstorming).toContain('给出推荐答案、依据与主要代价')
      expect(brainstorming).toContain('明确标注')
      expect(brainstorming).toMatch(/每轮(?:只)?用一行“阶段 · 关键缺口”/u)
      expect(brainstorming).toContain('影响 × 不确定性')
      expect(brainstorming).toContain('D-*')
      expect(brainstorming).toContain('A-*')
      expect(brainstorming).toContain('O-*')
      expect(livingBrainstorm).toContain('没有阻塞 O-*')
      expect(livingBrainstorm).toContain('只询问用户是否确认这份完整快照')
      expect(livingBrainstorm).toContain('[D-03](#d-03)')
      expect(brainstorming).toMatch(/下游投影阶段禁止调用这些探针/u)
      expect(livingBrainstorm).toContain('旧 `brainstorm.md` 没有 Living 状态行')
      expect(brainstorming).not.toContain('writing-plans')
      expect(openspecContext).toContain('topic-only')
      expect(openspecContext).toContain('changeRoot')
      expect(openspecContext).toContain('existingOutputPaths')
      expect(openspecContext).toContain('actionContext')
      expect(openspecContext).toContain('scripts/openspec-status-snapshot.sh')
      expect(openspecContext).toContain('planning-state.mjs')
      expect(statusSnapshot).toContain('jq -c')
      expect(statusSnapshot).toContain('existingArtifacts')

      const planningState = fs.readFileSync(
        path.join(target, 'brainstorming', 'scripts', 'planning-state.mjs'),
        'utf-8',
      )
      expect(planningState).toContain("state: 'LEGACY'")
      expect(planningState).toContain('applyReady')

      const workflowRouting = fs.readFileSync(
        path.join(target, 'workflow-routing', 'SKILL.md'),
        'utf-8',
      )
      expect(workflowRouting).toContain('version: "1.1.0"')
      expect(workflowRouting).toContain('不授予写权限、不创建 change')
      expect(workflowRouting).toContain('Direct → Lite')
      expect(workflowRouting).toContain('Lite → Full')
      expect(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'skills', 'workflow-routing', 'SKILL.md'),
        'utf-8',
      )).toBe(workflowRouting)

      const dogfoodDir = path.join(process.cwd(), '.harness', 'skills', 'brainstorming')
      expect(fs.readFileSync(path.join(dogfoodDir, 'SKILL.md'), 'utf-8')).toBe(brainstorming)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'openspec-context.md'),
        'utf-8',
      )).toBe(openspecContext)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'references', 'living-brainstorm.md'),
        'utf-8',
      )).toBe(livingBrainstorm)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'scripts', 'openspec-status-snapshot.sh'),
        'utf-8',
      )).toBe(statusSnapshot)
      expect(fs.readFileSync(
        path.join(dogfoodDir, 'scripts', 'planning-state.mjs'),
        'utf-8',
      )).toBe(planningState)

      const readLiveTemplateText = (entryPath: string): string => {
        const stat = fs.statSync(entryPath)
        if (stat.isDirectory()) {
          return fs.readdirSync(entryPath)
            .map(entry => readLiveTemplateText(path.join(entryPath, entry)))
            .join('\n')
        }
        return /\.(?:md|ya?ml)$/.test(entryPath)
          ? fs.readFileSync(entryPath, 'utf-8')
          : ''
      }
      const liveWorkflowText = [
        path.join(process.cwd(), 'templates', 'agents-md.md'),
        path.join(process.cwd(), 'templates', 'commands'),
        path.join(process.cwd(), 'templates', 'openspec'),
        path.join(process.cwd(), 'templates', 'skills'),
      ].map(readLiveTemplateText).join('\n')
      const retiredWorkflowNames = retired.slice(2).filter(
        skillName => skillName !== 'architecture-diagram',
      )
      for (const skillName of retiredWorkflowNames) {
        expect(liveWorkflowText).not.toContain(skillName)
      }
      expect(readTemplateFile('openspec/config.yaml')).not.toContain('architecture-diagram')
    })
  })

  describe('copyOpenspecTemplate', () => {
    it('should copy openspec directory with empty subdirs', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)
      expect(fs.existsSync(path.join(target, 'config.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'environment.toml'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'settings.json'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'schemas', 'full', 'schema.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'schemas', 'lite', 'schema.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'schemas', 'superpowers-lite'))).toBe(false)
      expect(fs.existsSync(path.join(target, 'changes', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'specs', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(target, 'archive', '.gitkeep'))).toBe(true)
    })

    it('should keep independent planning review opt-in before Apply', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const config = fs.readFileSync(path.join(target, 'config.yaml'), 'utf-8')
      expect(config).toContain('Apply 前不触发独立 Review')
      expect(config).toContain('用户明确要求审查时例外')
      expect(config).not.toContain('Project:')
      expect(config).not.toContain('{{PROJECT_NAME}}')
    })

    it('should gate verify on completed tasks and record the final code fingerprint', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const schema = fs.readFileSync(path.join(target, 'schemas', 'full', 'schema.yaml'), 'utf-8')
      const verifyTemplate = fs.readFileSync(
        path.join(target, 'schemas', 'full', 'templates', 'verify.md'),
        'utf-8',
      )
      const verifyInstruction = schema.slice(
        schema.indexOf('  - id: verify'),
        schema.indexOf('  - id: retrospective'),
      )

      expect(verifyInstruction).toContain('tasks.md 中所有实现 checkbox 均为 [x]')
      expect(verifyInstruction).toContain('implementation-fingerprint.mjs')
      expect(verifyInstruction).toContain('不得自行定义摘要算法')
      expect(verifyInstruction).toContain('Final Verification')
      expect(verifyInstruction).toContain('PASS')
      expect(verifyInstruction).toContain('FAIL')
      expect(verifyInstruction).toContain('BLOCKED')
      expect(verifyInstruction).not.toContain('commitCount')
      expect(verifyInstruction).not.toContain('deliveryReady')
      expect(verifyTemplate).toContain('## 元数据')
      expect(verifyTemplate).toContain('实现指纹')
      expect(verifyTemplate).toContain('harness-implementation-fingerprint-v1')
      expect(verifyTemplate).toContain('代码状态')
      expect(verifyTemplate).not.toContain('交付就绪')
    })

    it('should keep verify output concise without dropping audit gates', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const schema = fs.readFileSync(path.join(target, 'schemas', 'full', 'schema.yaml'), 'utf-8')
      const verifyTemplate = fs.readFileSync(
        path.join(target, 'schemas', 'full', 'templates', 'verify.md'),
        'utf-8',
      )
      const verifyInstruction = schema.slice(
        schema.indexOf('  - id: verify'),
        schema.indexOf('  - id: retrospective'),
      )

      expect(verifyTemplate.trim().split(/\r?\n/).length).toBeLessThanOrEqual(100)
      expect(verifyInstruction.trim().split(/\r?\n/).length).toBeLessThanOrEqual(90)
      expect(verifyTemplate).toContain('## 汇总')
      expect(verifyTemplate).toContain('- **结论：**')
      expect(verifyTemplate).toContain('- **检查：**')
      expect(verifyTemplate).toContain('## 检查结果')
      expect(verifyTemplate).toContain('## 失败详情')
      expect(verifyTemplate).toContain('## 未验证范围')
      expect(verifyTemplate).toContain('## 结论与下一步')
      expect(verifyTemplate).not.toContain('证据映射')
      expect(verifyTemplate).not.toMatch(/^## \d+\./m)
      expect(verifyInstruction).not.toContain('verify.md §7')
    })

    it('should keep dogfood and distributable schemas recursively identical', () => {
      const listFiles = (root: string, current = root): string[] => fs
        .readdirSync(current, { withFileTypes: true })
        .flatMap(entry => {
          const entryPath = path.join(current, entry.name)
          return entry.isDirectory()
            ? listFiles(root, entryPath)
            : [path.relative(root, entryPath)]
        })
        .sort()

      for (const schemaName of ['full', 'lite']) {
        const templateRoot = path.join(
          process.cwd(),
          'templates',
          'openspec',
          'schemas',
          schemaName,
        )
        const dogfoodRoot = path.join(process.cwd(), 'openspec', 'schemas', schemaName)
        const templateFiles = listFiles(templateRoot)
        const dogfoodFiles = listFiles(dogfoodRoot)

        expect(dogfoodFiles).toEqual(templateFiles)
        for (const relativePath of templateFiles) {
          expect(fs.readFileSync(path.join(dogfoodRoot, relativePath)))
            .toEqual(fs.readFileSync(path.join(templateRoot, relativePath)))
        }
      }
    })

    it('should package lite as a two-artifact workflow without heavy skill gates', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const schemaPath = path.join(target, 'schemas', 'lite', 'schema.yaml')
      const raw = fs.readFileSync(schemaPath, 'utf-8')
      const schema = YAML.parse(raw) as {
        name: string
        version: number
        artifacts: Array<{ id: string; requires: string[] }>
        apply: { requires: string[]; tracks: string }
      }

      expect(schema.name).toBe('lite')
      expect(schema.version).toBe(9)
      expect(schema.artifacts.map(artifact => artifact.id)).toEqual(['brainstorm', 'tasks'])
      expect(schema.artifacts[0]!.requires).toEqual([])
      expect(schema.artifacts[1]!.requires).toEqual(['brainstorm'])
      expect(schema.apply).toMatchObject({ requires: ['tasks'], tracks: 'tasks.md' })
      expect(raw).not.toContain('使用 Skill 工具调用')
      expect(raw).not.toContain('using-git-worktrees')
      expect(raw).not.toContain('subagent-driven-development')
      expect(raw).not.toContain('requesting-code-review')

      const brainstorm = fs.readFileSync(
        path.join(target, 'schemas', 'lite', 'templates', 'brainstorm.md'),
        'utf-8',
      )
      const tasks = fs.readFileSync(
        path.join(target, 'schemas', 'lite', 'templates', 'tasks.md'),
        'utf-8',
      )
      expect(brainstorm).toContain('> **状态：** `DRAFT` · **阶段：** 探索中')
      expect(brainstorm).toContain('## ⚡ 30 秒了解')
      expect(brainstorm).toContain('## 🗺️ 一图读懂')
      expect(brainstorm).toContain('sequenceDiagram')
      expect(brainstorm).toContain('stateDiagram-v2')
      expect(brainstorm).toContain('图只可视化已确认决定')
      expect(brainstorm).toContain('## 当前有效决定')
      expect(brainstorm).toContain('#### D-01')
      expect(brainstorm).toContain('## Agent 自主范围')
      expect(brainstorm).toContain('## 开放问题')
      expect(brainstorm).toContain('- **下游状态：** `NONE`')
      expect(brainstorm).toContain('## 决策变更记录')
      expect(brainstorm).not.toContain('<a id=')
      expect(brainstorm).not.toContain('## 架构与影响概览')
      expect(brainstorm).not.toContain('[!IMPORTANT]')
      expect(raw).not.toContain('500–800')
      expect(raw).not.toContain('1200')
      expect(tasks).toContain('**结果：**')
      expect(tasks).toContain('**来源：**')
      expect(tasks).toContain('**范围：**')
      expect(tasks).toContain('**验证：**')
      expect(tasks).not.toContain('> mode:')
      expect(tasks).not.toContain('commit:')
    })

    it('should keep full apply current-agent owned without execution modes', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const schema = fs.readFileSync(path.join(target, 'schemas', 'full', 'schema.yaml'), 'utf-8')
      const applyInstruction = schema.slice(schema.indexOf('\napply:'))

      expect(applyInstruction).toContain('当前 Agent')
      expect(applyInstruction).toContain('branch、HEAD、git status')
      expect(applyInstruction).toContain('review-orchestrator mode=auto')
      expect(applyInstruction).toContain('仅 P0/P1 阻断')
      expect(applyInstruction).toContain('不分派实现 Agent')
      expect(applyInstruction).not.toContain('inline/batch/isolated')
      expect(applyInstruction).not.toContain('using-git-worktrees')
      expect(applyInstruction).not.toContain('subagent-driven-development')
      expect(applyInstruction).not.toContain('executing-plans')
    })

    it('should keep OpenSpec commands as thin skill entrypoints', () => {
      const commandBySkill: Record<string, string> = {
        'openspec-new-change': 'new',
        'openspec-continue-change': 'continue',
        'openspec-update-change': 'update',
        'openspec-ff-change': 'ff',
        'openspec-apply-change': 'apply',
        'openspec-verify-change': 'verify',
        'openspec-archive-change': 'archive',
      }

      for (const [skillName, commandName] of Object.entries(commandBySkill)) {
        const command = readTemplateFile(`commands/opsx/${commandName}.md`)
        expect(command).toContain(`Load and follow the \`${skillName}\` skill.`)
        expect(command).not.toContain('openspec instructions')
        expect(command).not.toContain('<!-- harness:lite-to-full-promotion -->')
        expect(command).not.toContain('<!-- harness:full-tasks-reconciled -->')
      }
    })

    it('should keep apply, verify, and archive schema-aware and single-purpose', () => {
      const applyCommand = readTemplateFile('commands/opsx/apply.md')
      const verifyCommand = readTemplateFile('commands/opsx/verify.md')
      const archiveCommand = readTemplateFile('commands/opsx/archive.md')
      const applySkill = readTemplateFile('skills/openspec-apply-change/SKILL.md')
      const verifySkill = readTemplateFile('skills/openspec-verify-change/SKILL.md')
      const archiveSkill = readTemplateFile('skills/openspec-archive-change/SKILL.md')

      expect(applyCommand).toContain('Load and follow the `openspec-apply-change` skill')
      expect(verifyCommand).toContain('Load and follow the `openspec-verify-change` skill')
      expect(archiveCommand).toContain('Load and follow the `openspec-archive-change` skill')

      expect(applySkill).toContain('openspec instructions apply')
      expect(applySkill).toContain('遵循 schema `instruction`')
      expect(applySkill).toContain('`all_done` + Lite')
      expect(applySkill).toContain('`all_done` + Full')
      expect(applySkill).toContain('不得把通用 Apply 的 `all_done` 文案')
      expect(applySkill).toContain('`Final Review: P0/P1 CLEAR`')
      expect(applySkill).toContain('`planningHome`')
      expect(applySkill).toContain('`contextFiles`')
      expect(applySkill).toContain('`allowedEditRoots`')
      expect(applySkill).not.toContain('workspace-planning')
      expect(applySkill).not.toContain('record branch, HEAD, and pre-existing dirty')
      expect(applySkill).not.toContain('Do not commit per task')
      expect(applySkill).not.toContain('REQUIRED SUB-SKILL')

      expect(verifySkill).toContain('官方三维验证框架')
      expect(verifySkill).toContain('完整性 Completeness')
      expect(verifySkill).toContain('正确性 Correctness')
      expect(verifySkill).toContain('一致性 Coherence')
      expect(verifySkill).toContain('implementation-fingerprint.mjs')
      expect(verifySkill).toContain('独立 Verify')
      expect(verifySkill).toContain('`NOT_RUN`')
      expect(verifySkill).not.toContain('Initialize verification report structure')
      expect(verifySkill).not.toContain('Requirement Implementation Mapping')

      expect(archiveSkill).toContain('字面 `--force`')
      expect(archiveSkill).toContain('-y --no-validate')
      expect(archiveSkill).toContain('openspec archive "<name>" -y')
      expect(archiveSkill).toContain('`Final Review: P0/P1 CLEAR`')
      expect(archiveSkill).toContain('implementation-fingerprint.mjs')
      expect(archiveSkill).toContain('UTC 日期')
      expect(archiveSkill).toContain('其他 schema')
      expect(archiveSkill).toContain('默认停止')
      expect(archiveSkill).toContain('`planningHome`')
      expect(archiveSkill).toContain('`artifactPaths`')
      expect(archiveSkill).toContain('文件已存在时表示上次归档尝试未完成')
      expect(archiveSkill).toContain('覆盖该文件后重试')
      expect(archiveSkill).not.toContain('retrospective 在归档前尚未')
      expect(archiveSkill).not.toContain('mv "<changeRoot>"')
      expect(archiveSkill).not.toContain('invoke **finishing-a-development-branch**')
    })

    it('should scope delivery authorization to the selected outcome', () => {
      const commit = readTemplateFile('skills/commit/SKILL.md')
      const gitRule = fs.readFileSync(
        path.join(process.cwd(), '.harness', 'rules', 'git-workflow.md'),
        'utf-8',
      )

      expect(commit).toContain('version: "1.2.3"')
      expect(commit).toContain('完成该 MR/PR 所需的提交、推送与创建')
      expect(commit).toContain('创建 MR/PR 本身不包含合并')
      expect(commit).toContain('任务收尾、归档或“完成”不构成授权')
      expect(commit).not.toContain('或任务进入收尾阶段时使用')
      expect(gitRule).toContain('只有用户明确选择后才分别执行 commit、push、MR/PR 或清理')
      expect(gitRule).not.toContain('push 成功才算完成')
    })

    it('should keep design methods in the design skill and output a result-oriented document', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const schema = fs.readFileSync(path.join(target, 'schemas', 'full', 'schema.yaml'), 'utf-8')
      expect(schema).toContain('不得调用 technical-design/requirement-analysis')
      expect(schema).not.toContain('D1-D14')
      expect(schema).not.toContain('core/supporting/checklist/skip')

      const skill = readTemplateFile('skills/technical-design/SKILL.md')
      expect(skill).toContain('references/dimensions/Dxx-*.md')
      expect(skill).toContain('core / supporting / checklist / skip')
      expect(skill).toContain('不要在最终文档写维度矩阵')

      const template = fs.readFileSync(path.join(target, 'schemas', 'full', 'templates', 'design.md'), 'utf-8')
      expect(template).toContain('## 🧭 一句话方案')
      expect(template).toContain('**核心方案：**')
      expect(template).toContain('## 🗺️ UML 设计视图')
      expect(template).toContain('sequenceDiagram')
      expect(template).toContain('stateDiagram-v2')
      expect(template).toContain('classDiagram')
      expect(template).toContain('erDiagram')
      expect(template).toContain('通常只保留 1～3 张高价值图')
      expect(template).toContain('## 决定来源')
      expect(template).toContain('## 实现视图')
      expect(template).toContain('| 来源 | 组件或边界 | 已确认职责与变化 | 验证信号 |')
      expect(template).toContain('## 契约、状态与失败处理')
      expect(template).toContain('[D-03](brainstorm.md#d-03)')
      expect(template).not.toContain('设计关注点')
      expect(template).not.toContain('core / supporting / checklist / skip')
      expect(template).not.toContain('| 维度 | 领域/触点 | 优先级 | 选择原因 | 输出位置 |')
    })

    it('should make every full artifact mandatory and stop planning at tasks', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const raw = fs.readFileSync(path.join(target, 'schemas', 'full', 'schema.yaml'), 'utf-8')
      const schema = YAML.parse(raw) as {
        version: number
        artifacts: Array<{ id: string; requires: string[]; optional?: boolean }>
        apply: { requires: string[]; tracks: string }
      }

      expect(schema.version).toBe(26)
      expect(schema.artifacts.map(artifact => artifact.id)).toEqual([
        'brainstorm', 'design', 'specs', 'tasks', 'verify', 'retrospective',
      ])
      expect(schema.artifacts.map(artifact => artifact.requires)).toEqual([
        [], ['brainstorm'], ['design'], ['specs'], ['tasks'], ['verify'],
      ])
      expect(schema.artifacts.every(artifact => artifact.optional === undefined)).toBe(true)
      expect(schema.apply).toMatchObject({ requires: ['tasks'], tracks: 'tasks.md' })
      const fullTasks = fs.readFileSync(
        path.join(target, 'schemas', 'full', 'templates', 'tasks.md'),
        'utf-8',
      )
      expect(fullTasks).toContain('<!-- harness:full-tasks-reconciled -->')
      expect(raw).toContain('<!-- harness:lite-to-full-promotion -->')
      expect(raw).toContain('<!-- harness:full-tasks-reconciled -->')
      expect(raw).toContain('两枚标记都无且能确认旧契约')
      expect(raw).not.toContain('  - id: human-review')
    })

    it('should share brainstorm across lite and full', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const liteBrainstorm = fs.readFileSync(
        path.join(target, 'schemas', 'lite', 'templates', 'brainstorm.md'),
        'utf-8',
      )
      const fullBrainstorm = fs.readFileSync(
        path.join(target, 'schemas', 'full', 'templates', 'brainstorm.md'),
        'utf-8',
      )

      expect(fullBrainstorm).toBe(liteBrainstorm)
      expect(fs.existsSync(
        path.join(target, 'schemas', 'full', 'templates', 'human-review.md'),
      )).toBe(false)
    })

    it('should keep the delta spec template aligned with official OpenSpec structure', () => {
      const target = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(target)

      const spec = fs.readFileSync(
        path.join(target, 'schemas', 'full', 'templates', 'spec.md'),
        'utf-8',
      )

      for (const section of ['ADDED', 'MODIFIED', 'REMOVED', 'RENAMED']) {
        expect(spec).toContain(`## ${section} Requirements`)
      }
      expect(spec).toContain('### Requirement:')
      expect(spec).toContain('#### Scenario:')
      expect(spec).toContain('- **WHEN**')
      expect(spec).toContain('- **THEN**')
      expect(spec).toContain('SHALL')
      expect(spec).toContain('MUST')
      expect(spec).not.toContain('## 一图读懂')
      expect(spec).not.toMatch(/^## .*[🌀-🫿]/mu)
    })
  })

  describe('renderTemplate', () => {
    it('should replace template variables', () => {
      const result = renderTemplate('Hello {{NAME}}, type: {{TYPE}}', { NAME: 'world', TYPE: 'test' })
      expect(result).toBe('Hello world, type: test')
    })
  })

  describe('readTemplateFile', () => {
    it('should read agents-md template', () => {
      const content = readTemplateFile('agents-md.md')
      expect(content).toContain('AGENTS.md')
      expect(content).toContain('任务分流')
      expect(content).toContain('指令优先级与加载')
      expect(content).toContain('先确认任务归属并索引候选，再读取小范围片段')
      expect(content).toContain('`docs/` 保存项目知识，`openspec/` 保存任务过程。')
      expect(content).toContain('用户显式调用 `/opsx:*` 时加载对应 skill')
      expect(content).toContain('包含 `openspec/` 的 DevKeel 根仓库执行')
      expect(content).toContain('子项目代码、构建和测试在目标')
    })
  })

  describe('upstream OpenSpec entrypoint templates', () => {
    it('keeps promotion state in runtime owners instead of thin adapters', () => {
      for (const relativePath of [
        'skills/openspec-new-change/SKILL.md',
        'skills/openspec-continue-change/SKILL.md',
        'skills/openspec-update-change/SKILL.md',
        'skills/openspec-apply-change/SKILL.md',
        'skills/openspec-archive-change/SKILL.md',
      ]) {
        const source = readTemplateFile(relativePath)
        expect(source, relativePath).toContain('<!-- harness:lite-to-full-promotion -->')
        expect(source, relativePath).toContain('<!-- harness:full-tasks-reconciled -->')
      }

      expect(readTemplateFile('skills/openspec-ff-change/SKILL.md'))
        .toContain('加载并执行 `openspec-new-change`')
      expect(fs.existsSync(path.join(
        process.cwd(),
        'templates',
        'skills',
        'openspec-propose',
      ))).toBe(false)

      for (const relativePath of [
        'skills/openspec-ff-change/SKILL.md',
        'commands/opsx/new.md',
        'commands/opsx/continue.md',
        'commands/opsx/update.md',
        'commands/opsx/ff.md',
        'commands/opsx/apply.md',
        'commands/opsx/archive.md',
      ]) {
        const source = readTemplateFile(relativePath)
        expect(source, relativePath).not.toContain('<!-- harness:lite-to-full-promotion -->')
        expect(source, relativePath).not.toContain('<!-- harness:full-tasks-reconciled -->')
        expect(source, relativePath).not.toContain('no-backfill')
      }
    })

    it('keeps the changed OpenSpec skills in Chinese', () => {
      for (const skillName of [
        'brainstorming',
        'openspec-new-change',
        'openspec-continue-change',
        'openspec-update-change',
        'openspec-ff-change',
        'openspec-onboard',
        'openspec-apply-change',
        'openspec-verify-change',
        'openspec-archive-change',
        'openspec-bulk-archive-change',
        'openspec-sync-specs',
      ]) {
        const source = readTemplateFile(`skills/${skillName}/SKILL.md`)
        const description = source.match(/^description:\s*(.+)$/mu)?.[1] ?? ''
        const body = source.slice(source.indexOf('\n---\n') + 5)
        expect(description, skillName).toMatch(/[\u3400-\u9fff]/u)
        expect(body, skillName).toMatch(/[\u3400-\u9fff]/u)
      }
    })

    it('keeps onboarding and bulk archive on the current delegated workflow', () => {
      const onboard = readTemplateFile('skills/openspec-onboard/SKILL.md')
      expect(onboard).toContain('默认 Lite')
      expect(onboard).toContain('`openspec-new-change`')
      expect(onboard).toContain('`openspec-continue-change`')
      expect(onboard).toContain('`openspec-apply-change`')
      expect(onboard).toContain('`openspec-archive-change`')
      expect(onboard).not.toContain('proposal.md')
      expect(onboard).toContain('EXPLAIN → DO → SHOW → PAUSE')

      const bulkArchive = readTemplateFile(
        'skills/openspec-bulk-archive-change/SKILL.md',
      )
      expect(bulkArchive).toContain('`openspec-archive-change`')
      expect(bulkArchive).toContain('不得自动全选')
      expect(bulkArchive).toContain('不得默认“较新覆盖较旧”')
      expect(bulkArchive).not.toContain('mv openspec/changes')
      expect(bulkArchive).not.toContain('mkdir -p openspec/changes/archive')

      const sync = readTemplateFile('skills/openspec-sync-specs/SKILL.md')
      expect(sync).toContain('幂等')
      expect(sync).toContain('保持 change active')

      const brainstorming = readTemplateFile('skills/brainstorming/SKILL.md')
      const openspecContext = readTemplateFile(
        'skills/brainstorming/references/openspec-context.md',
      )
      expect(brainstorming).toContain('topic-only（默认）')
      expect(brainstorming).toContain('change-draft')
      expect(openspecContext).toContain('不得写其他 artifact 或实现代码')
    })

    it('keeps update planning-only, schema-driven, and confirmation-gated', () => {
      const update = readTemplateFile('skills/openspec-update-change/SKILL.md')

      expect(update).toContain('`actionContext.planningArtifacts`')
      expect(update).toContain('`applyRequires`')
      expect(update).toContain('`artifacts[].requires`')
      expect(update).toContain('planning 传递闭包')
      expect(update).toContain('`artifactPaths.<id>.existingOutputPaths`')
      expect(update).toContain('artifact id 与文件路径不是同类值，不得直接求交集')
      expect(update).toContain('`<changeRoot>/specs/**/*.md`')
      expect(update).toContain('existing-only fallback')
      expect(update).toContain('读取对应 main spec')
      expect(update).toContain('`allowedEditRoots`')
      expect(update).toContain('canonical path')
      expect(update).toContain('拒绝越过')
      expect(update).toContain('当前实现和验证证据仍成立的 tasks `[x]`')
      expect(update).toContain('恢复 `[ ]`')
      expect(update).toContain('<!-- harness:lite-to-full-promotion -->')
      expect(update).toContain('<!-- harness:full-tasks-reconciled -->')
      expect(update).toContain('schema `instruction`')
      expect(update).toContain('每次只处理一件事')
      expect(update).toContain('用户明确确认')
      expect(update).toContain('不得创建尚不存在的 artifact')
      expect(update).toContain('不得在 glob artifact 下新建文件')
      expect(update).toContain('绝不能修改实现代码')
      expect(update).toContain('`/opsx:continue <name>`')
      expect(update).not.toContain('openspec store list --json')
      expect(update).not.toContain('allowed-tools:')
    })

    it('keeps the implementation fingerprint helper synchronized with dogfood', () => {
      const relativePath = path.join(
        'skills',
        'openspec-verify-change',
        'scripts',
        'implementation-fingerprint.mjs',
      )
      const packaged = readTemplateFile(relativePath)
      const dogfood = fs.readFileSync(
        path.join(process.cwd(), '.harness', relativePath),
        'utf8',
      )

      expect(packaged).toContain('harness-implementation-fingerprint-v1')
      expect(packaged).toContain(':(exclude)')
      expect(dogfood).toBe(packaged)
    })

    it('keeps commands and skills unchanged and synchronized with dogfood copies', () => {
      const expectedVersions: Record<string, string> = {
        'openspec-new-change': '2.3',
        'openspec-ff-change': '2.1',
        'openspec-onboard': '2.3',
        'openspec-continue-change': '2.1',
        'openspec-update-change': '2.1',
        'openspec-apply-change': '3.1',
        'openspec-archive-change': '3.2',
        'openspec-bulk-archive-change': '2.1',
        'openspec-sync-specs': '2.1',
        'openspec-verify-change': '3.3',
      }
      const commandBySkill: Record<string, string> = {
        'openspec-new-change': 'new',
        'openspec-ff-change': 'ff',
        'openspec-onboard': 'onboard',
        'openspec-continue-change': 'continue',
        'openspec-update-change': 'update',
        'openspec-apply-change': 'apply',
        'openspec-archive-change': 'archive',
        'openspec-bulk-archive-change': 'bulk-archive',
        'openspec-sync-specs': 'sync',
        'openspec-verify-change': 'verify',
      }
      const packagedVersions = YAML.parse(readTemplateFile('versions-yml.yml')) as {
        skills: Record<string, string>
      }
      const dogfoodVersions = YAML.parse(fs.readFileSync(
        path.join(process.cwd(), '.harness', 'versions.yml'),
        'utf-8',
      )) as { skills: Record<string, string> }

      expect(packagedVersions.skills['openspec-update-change']).toBe('2.1')
      expect(packagedVersions.skills['openspec-propose']).toBeUndefined()
      expect(dogfoodVersions.skills['openspec-update-change']).toBe(
        packagedVersions.skills['openspec-update-change'],
      )

      for (const [skillName, version] of Object.entries(expectedVersions)) {
        const skill = readTemplateFile(`skills/${skillName}/SKILL.md`)
        const dogfoodSkill = fs.readFileSync(
          path.join(process.cwd(), '.harness', 'skills', skillName, 'SKILL.md'),
          'utf-8',
        )
        const commandName = commandBySkill[skillName]!
        const command = readTemplateFile(`commands/opsx/${commandName}.md`)
        const dogfoodCommand = fs.readFileSync(
          path.join(process.cwd(), '.harness', 'commands', 'opsx', `${commandName}.md`),
          'utf-8',
        )

        expect(skill).toContain(`version: "${version}"`)
        expect(command).toContain(`Load and follow the \`${skillName}\` skill.`)
        expect(dogfoodSkill).toBe(skill)
        expect(dogfoodCommand).toBe(command)
      }
    })
  })

  describe('ensureGitignore', () => {
    it('should create .gitignore from template when none exists', () => {
      ensureGitignore(tmpDir)
      const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
      expect(content).toContain('.omc/')
      expect(content).toContain('.omx/')
      expect(content).toContain('node_modules/')
      expect(content).toContain('.superpowers')
    })

    it('should append missing entries to existing .gitignore', () => {
      fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'node_modules/\n', 'utf-8')
      ensureGitignore(tmpDir)
      const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
      expect(content).toContain('node_modules/')
      expect(content).toContain('.omc/')
      expect(content.indexOf('node_modules/')).toBe(0)
    })

    it('should not duplicate entries when run twice', () => {
      ensureGitignore(tmpDir)
      ensureGitignore(tmpDir)
      const content = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8')
      const matches = content.match(/\.omc\//g)
      expect(matches).toHaveLength(1)
    })
  })

  describe('copyTemplateFile', () => {
    it('should copy the template license', () => {
      const target = path.join(tmpDir, 'LICENSE')
      copyTemplateFile('LICENSE', target)
      const content = fs.readFileSync(target, 'utf-8')
      expect(content).toContain('MIT License')
    })
  })

  describe('createPlatformLinks', () => {
    beforeEach(() => {
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.harness', 'rules'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.harness', 'agents'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.harness', 'commands'), { recursive: true })
    })

    it('should create agents symlink for codex platform', () => {
      createPlatformLinks(tmpDir, ['codex'])
      const agentsLink = path.join(tmpDir, '.agents', 'agents')
      expect(fs.existsSync(agentsLink)).toBe(true)
      expect(fs.lstatSync(agentsLink).isSymbolicLink()).toBe(true)
    })

    it('should create all four symlinks for codex platform', () => {
      createPlatformLinks(tmpDir, ['codex'])
      expect(fs.existsSync(path.join(tmpDir, '.agents', 'skills'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.agents', 'rules'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.agents', 'agents'))).toBe(true)
      expect(fs.existsSync(path.join(tmpDir, '.agents', 'commands'))).toBe(true)
    })

    it('should create agents symlink for claude-code platform', () => {
      createPlatformLinks(tmpDir, ['claude-code'])
      expect(fs.existsSync(path.join(tmpDir, '.claude', 'agents'))).toBe(true)
      expect(fs.lstatSync(path.join(tmpDir, '.claude', 'agents')).isSymbolicLink()).toBe(true)
    })
  })

  describe('detectExistingPlatformDirs', () => {
    it('should detect existing platform directories', () => {
      fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true })
      const result = detectExistingPlatformDirs(tmpDir, ['claude-code', 'codex'])
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(path.join(tmpDir, '.claude'))
    })

    it('should return empty when no platform dirs exist', () => {
      const result = detectExistingPlatformDirs(tmpDir, ['claude-code', 'codex'])
      expect(result).toHaveLength(0)
    })
  })

  describe('cleanLegacyStageFiles', () => {
    it('should delete stage-*.md files from skills and agents', () => {
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills'), { recursive: true })
      fs.mkdirSync(path.join(tmpDir, '.harness', 'agents'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'stage-reviewer.md'), '')
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'stage-verifier.md'), '')
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills', 'commit'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'commit', 'SKILL.md'), '')
      fs.writeFileSync(path.join(tmpDir, '.harness', 'agents', 'stage-reviewer.md'), '')
      fs.writeFileSync(path.join(tmpDir, '.harness', 'agents', 'code-reviewer.md'), '')

      const deleted = cleanLegacyStageFiles(tmpDir)

      expect(deleted).toHaveLength(3)
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'stage-reviewer.md'))).toBe(false)
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'stage-verifier.md'))).toBe(false)
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'agents', 'stage-reviewer.md'))).toBe(false)
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'agents', 'code-reviewer.md'))).toBe(true)
    })

    it('should return empty array when no stage files exist', () => {
      fs.mkdirSync(path.join(tmpDir, '.harness', 'skills'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, '.harness', 'skills', 'commit.md'), '')

      const deleted = cleanLegacyStageFiles(tmpDir)
      expect(deleted).toHaveLength(0)
    })
  })

  describe('hasUserContent', () => {
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

  describe('writeSmartFile', () => {
    it('should write full template when file does not exist', () => {
      const filePath = path.join(tmpDir, 'CLAUDE.md')
      writeSmartFile(filePath, readTemplateFile('claude-md.md'), '@AGENTS.md')
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('@AGENTS.md\n')
    })

    it('should overwrite when file has only comment differences', () => {
      const filePath = path.join(tmpDir, 'CLAUDE.md')
      fs.writeFileSync(filePath, '@AGENTS.md\n\n# Test\n\n<!-- 旧版占位符 -->\n')
      writeSmartFile(filePath, '@AGENTS.md\n\n# Test\n\n<!-- 新版占位符 -->\n', '@AGENTS.md')
      expect(fs.readFileSync(filePath, 'utf-8')).toBe('@AGENTS.md\n\n# Test\n\n<!-- 新版占位符 -->\n')
    })

    it('should preserve user content and ensure directive exists', () => {
      const filePath = path.join(tmpDir, 'CLAUDE.md')
      fs.writeFileSync(filePath, '# My Project\n\n这是用户写的内容\n')
      writeSmartFile(filePath, readTemplateFile('claude-md.md'), '@AGENTS.md')
      const result = fs.readFileSync(filePath, 'utf-8')
      expect(result).toContain('@AGENTS.md')
      expect(result).toContain('这是用户写的内容')
    })

    it('should not modify when user content already has directive', () => {
      const filePath = path.join(tmpDir, 'CLAUDE.md')
      const content = '@AGENTS.md\n\n# My Project\n\n这是用户写的内容\n'
      fs.writeFileSync(filePath, content)
      writeSmartFile(filePath, readTemplateFile('claude-md.md'), '@AGENTS.md')
      expect(fs.readFileSync(filePath, 'utf-8')).toBe(content)
    })
  })

  describe('updateOpenspecIncremental', () => {
    it.each([
      ['harness-lite', 'lite'],
      ['harness-full', 'full'],
    ])('should migrate %s selectors to %s without changing artifact progress', (legacy, target) => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)
      fs.renameSync(path.join(openspecDir, 'schemas', target), path.join(openspecDir, 'schemas', legacy))
      const configPath = path.join(openspecDir, 'config.yaml')
      fs.writeFileSync(configPath, `schema : '${legacy}' # keep selector formatting\nproject: keep-me\n`)
      const changePaths = ['changes/active', 'changes/archive/done', 'archive/legacy']
      for (const changePath of changePaths) {
        const dir = path.join(openspecDir, changePath)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, '.openspec.yaml'), `schema: ${legacy}\ncreated: 2026-09-22\n`)
        fs.writeFileSync(path.join(dir, 'tasks.md'), '- [x] done\n- [ ] pending\n')
      }

      updateOpenspecIncremental(openspecDir)

      expect(fs.readFileSync(configPath, 'utf-8')).toContain(`schema : '${target}' # keep selector formatting`)
      expect(fs.existsSync(path.join(openspecDir, 'schemas', legacy))).toBe(false)
      expect(fs.existsSync(path.join(openspecDir, 'schemas', target, 'schema.yaml'))).toBe(true)
      for (const changePath of changePaths) {
        const dir = path.join(openspecDir, changePath)
        expect(YAML.parse(fs.readFileSync(path.join(dir, '.openspec.yaml'), 'utf-8')))
          .toEqual({ schema: target, created: '2026-09-22' })
        expect(fs.readFileSync(path.join(dir, 'tasks.md'), 'utf-8')).toBe('- [x] done\n- [ ] pending\n')
      }
      expect(updateOpenspecIncremental(openspecDir).changedPaths).toEqual([])
    })

    it('should install new schemas before migrating an existing init project', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      const writeFile = (relativePath: string, content: string): void => {
        const filePath = path.join(tmpDir, relativePath)
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, content, 'utf-8')
      }
      writeFile('openspec/config.yaml', 'schema: superpowers-lite\nproject: keep-me\n')
      writeFile(
        'openspec/changes/in-progress/.openspec.yaml',
        'schema: superpowers-lite\ncreated: 2026-07-21\n',
      )
      writeFile('openspec/changes/in-progress/tasks.md', '- [x] done\n- [ ] pending\n')
      writeFile('openspec/schemas/superpowers-lite/schema.yaml', 'name: superpowers-lite\n')
      writeFile(
        '.harness/skills/brainstorming/SKILL.md',
        '---\nname: brainstorming\nmetadata:\n  author: superpowers\n---\n',
      )
      const versions = getBuiltinVersions()
      versions.skills['brainstorming'] = '6.0.3'
      versions.schemas['superpowers-lite'] = '14'
      writeVersions(tmpDir, versions)

      const result = updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(openspecDir, 'schemas', 'full', 'schema.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'schemas', 'lite', 'schema.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'schemas', 'superpowers-lite'))).toBe(false)
      expect(fs.existsSync(path.join(tmpDir, '.harness', 'skills', 'brainstorming'))).toBe(true)
      expect(YAML.parse(fs.readFileSync(
        path.join(openspecDir, 'changes', 'in-progress', '.openspec.yaml'),
        'utf-8',
      ))).toMatchObject({ schema: 'full', created: '2026-07-21' })
      expect(YAML.parse(fs.readFileSync(
        path.join(openspecDir, 'config.yaml'),
        'utf-8',
      ))).toMatchObject({
        schema: 'full',
        project: 'keep-me',
        context: expect.stringContaining('全局规则'),
      })
      expect(fs.readFileSync(
        path.join(openspecDir, 'changes', 'in-progress', 'tasks.md'),
        'utf-8',
      )).toBe('- [x] done\n- [ ] pending\n')
      expect(result.changedPaths).toEqual(expect.arrayContaining([
        'openspec/config.yaml',
        'openspec/changes/in-progress/.openspec.yaml',
        'openspec/schemas/superpowers-lite',
      ]))
      expect(result.changedPaths).not.toContain('.harness/skills/brainstorming')
      expect(result.preservedPaths).toEqual([])
      expect(readVersions(tmpDir)?.skills['brainstorming']).toBe('6.0.3')
    })

    it('should add schemas when missing', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })

      updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(openspecDir, 'schemas', 'full', 'schema.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'changes', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'specs', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'archive', '.gitkeep'))).toBe(true)
    })

    it('should overwrite registered managed schemas', () => {
      writeVersions(tmpDir, getBuiltinVersions())
      const openspecDir = path.join(tmpDir, 'openspec')
      const schemasDir = path.join(openspecDir, 'schemas', 'full')
      fs.mkdirSync(schemasDir, { recursive: true })
      fs.writeFileSync(path.join(schemasDir, 'schema.yaml'), 'custom: true\n')

      updateOpenspecIncremental(openspecDir)

      const content = fs.readFileSync(path.join(schemasDir, 'schema.yaml'), 'utf-8')
      expect(content).not.toBe('custom: true\n')
      expect(content).toContain('full')
    })

    it('should sync all files inside existing schema dirs', () => {
      writeVersions(tmpDir, getBuiltinVersions())
      const openspecDir = path.join(tmpDir, 'openspec')
      const schemasDir = path.join(openspecDir, 'schemas', 'full')
      fs.mkdirSync(schemasDir, { recursive: true })

      updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(schemasDir, 'templates', 'tasks.md'))).toBe(true)
      expect(fs.existsSync(path.join(schemasDir, 'schema.yaml'))).toBe(true)
    })

    it('should remove stale files not present in source templates', () => {
      writeVersions(tmpDir, getBuiltinVersions())
      const openspecDir = path.join(tmpDir, 'openspec')
      const schemasDir = path.join(openspecDir, 'schemas', 'full')
      const templatesDir = path.join(schemasDir, 'templates')
      fs.mkdirSync(templatesDir, { recursive: true })
      fs.writeFileSync(path.join(templatesDir, 'deprecated.md'), 'old\n')

      updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(templatesDir, 'deprecated.md'))).toBe(false)
      expect(fs.existsSync(path.join(templatesDir, 'tasks.md'))).toBe(true)
    })

    it('should add only the supported root config file', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })

      updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(openspecDir, 'config.yaml'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'settings.json'))).toBe(false)
      expect(fs.existsSync(path.join(openspecDir, 'environment.toml'))).toBe(false)
    })

    it('should preserve custom root selector metadata', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      const config = 'schema: custom-flow\nproject: keep-me\n'
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), config)

      const result = updateOpenspecIncremental(openspecDir)
      const updatedConfig = YAML.parse(fs.readFileSync(
        path.join(openspecDir, 'config.yaml'),
        'utf-8',
      )) as Record<string, unknown>
      const templateConfig = YAML.parse(fs.readFileSync(
        path.join(process.cwd(), 'templates', 'openspec', 'config.yaml'),
        'utf-8',
      )) as Record<string, unknown>

      expect(updatedConfig).toMatchObject({
        schema: 'custom-flow',
        project: 'keep-me',
        context: templateConfig['context'],
      })
      expect(result.changedPaths).toContain('openspec/config.yaml')
    })

    it('should preserve an explicit full root schema', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      fs.writeFileSync(
        path.join(openspecDir, 'config.yaml'),
        "schema : 'full' # keep selector formatting\nproject: keep-me\n",
        'utf-8',
      )
      const result = updateOpenspecIncremental(openspecDir)
      const updatedConfig = fs.readFileSync(path.join(openspecDir, 'config.yaml'), 'utf-8')

      expect(updatedConfig).toContain("schema : 'full' # keep selector formatting")
      expect(YAML.parse(updatedConfig)).toMatchObject({
        schema: 'full',
        project: 'keep-me',
      })
      expect(result.changedPaths).toContain('openspec/config.yaml')
    })

    it('should replace only managed context and make a second sync a no-op', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      const config = [
        '# keep leading comment',
        "schema : 'custom-flow' # keep selector formatting",
        'context: |',
        '  stale project context',
        'rules:',
        '  proposal:',
        '    - keep custom rule',
        'references:',
        '  - shared-store',
        '',
      ].join('\n')
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), config)

      const firstResult = updateOpenspecIncremental(openspecDir)
      const firstContent = fs.readFileSync(path.join(openspecDir, 'config.yaml'), 'utf-8')
      const firstConfig = YAML.parse(firstContent) as Record<string, unknown>
      const templateConfig = YAML.parse(fs.readFileSync(
        path.join(process.cwd(), 'templates', 'openspec', 'config.yaml'),
        'utf-8',
      )) as Record<string, unknown>

      expect(firstContent).toContain('# keep leading comment')
      expect(firstContent).toContain("schema : 'custom-flow' # keep selector formatting")
      expect(firstConfig).toMatchObject({
        schema: 'custom-flow',
        context: templateConfig['context'],
        rules: { proposal: ['keep custom rule'] },
        references: ['shared-store'],
      })
      expect(firstResult.changedPaths).toContain('openspec/config.yaml')

      const secondResult = updateOpenspecIncremental(openspecDir)
      expect(fs.readFileSync(path.join(openspecDir, 'config.yaml'), 'utf-8')).toBe(firstContent)
      expect(secondResult.changedPaths).not.toContain('openspec/config.yaml')
    })

    it('should create subdirectories when missing', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })

      updateOpenspecIncremental(openspecDir)

      expect(fs.existsSync(path.join(openspecDir, 'changes', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'specs', '.gitkeep'))).toBe(true)
      expect(fs.existsSync(path.join(openspecDir, 'archive', '.gitkeep'))).toBe(true)
    })
  })

  describe('extractUserSlots', () => {
    it('should extract named slots from content', () => {
      const content = `# Header
<!-- harness:user:scope -->
子模块列表
<!-- /harness:user:scope -->
## Other`
      const slots = extractUserSlots(content)
      expect(slots.size).toBe(1)
      expect(slots.get('scope')).toBe('子模块列表\n')
    })

    it('should extract multiple slots', () => {
      const content = `<!-- harness:user:scope -->
A
<!-- /harness:user:scope -->
中间
<!-- harness:user:project -->
B
<!-- /harness:user:project -->`
      const slots = extractUserSlots(content)
      expect(slots.size).toBe(2)
      expect(slots.get('scope')).toBe('A\n')
      expect(slots.get('project')).toBe('B\n')
    })

    it('should return empty map when no markers', () => {
      const slots = extractUserSlots('# No markers here')
      expect(slots.size).toBe(0)
    })
  })

  describe('fillUserSlots', () => {
    it('should replace slot content with preserved values', () => {
      const template = `# Header
<!-- harness:user:scope -->
default
<!-- /harness:user:scope -->`
      const slots = new Map([['scope', '用户自定义内容\n']])
      const result = fillUserSlots(template, slots)
      expect(result).toContain('用户自定义内容')
      expect(result).not.toContain('default')
    })

    it('should keep original when slot not in map', () => {
      const template = `<!-- harness:user:scope -->
default
<!-- /harness:user:scope -->`
      const slots = new Map<string, string>()
      const result = fillUserSlots(template, slots)
      expect(result).toContain('default')
    })
  })

  describe('extractFrameworkContent', () => {
    it('should strip user slots and return framework only', () => {
      const content = `# Framework
<!-- harness:user:scope -->
用户内容
<!-- /harness:user:scope -->
## More framework`
      const framework = extractFrameworkContent(content)
      expect(framework).toContain('# Framework')
      expect(framework).toContain('## More framework')
      expect(framework).not.toContain('用户内容')
    })

    it('should detect framework changes', () => {
      const oldContent = `# Old
<!-- harness:user:scope -->
same
<!-- /harness:user:scope -->`
      const newContent = `# New
<!-- harness:user:scope -->
same
<!-- /harness:user:scope -->`
      expect(extractFrameworkContent(oldContent)).not.toBe(extractFrameworkContent(newContent))
    })

    it('should ignore user slot differences', () => {
      const a = `# Same
<!-- harness:user:scope -->
AAA
<!-- /harness:user:scope -->`
      const b = `# Same
<!-- harness:user:scope -->
BBB
<!-- /harness:user:scope -->`
      expect(extractFrameworkContent(a)).toBe(extractFrameworkContent(b))
    })
  })
})
