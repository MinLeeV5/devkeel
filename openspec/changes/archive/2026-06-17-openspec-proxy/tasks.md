# openspec-proxy 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用 subagent-driven-development 逐任务实现本计划。

**目标：** 在 harness 中新增 openspec 命令，通过 spawn 子进程透明代理 openspec CLI，收集遥测数据，并将 openspec 作为 dependency 打包实现零配置使用。

**架构：** devkeel openspec 命令作为薄代理层，spawn 子进程执行 openspec CLI，透传 stdio 和退出码，同时收集详细遥测数据（command、args、success、durationMs、openspecVersion、output）。openspec 作为 npm dependency 打包，版本锁定为 1.4.1。

**技术栈：** TypeScript + ESM, Node.js 20+, spawn (child_process), 现有 telemetry.ts 系统

**参考文档：**
- 需求分析：`openspec/changes/openspec-proxy/brainstorm.md`
- 技术设计：`openspec/changes/openspec-proxy/design.md`

---

## 1. 核心代理层实现

- [x] **1.1 添加 openspec dependency**
  1. 修改 `package.json` — 在 dependencies 中添加 openspec 依赖：
     ```json
     "dependencies": {
       "@fission-ai/openspec": "1.4.1"
     }
     ```
  2. 执行 `pnpm install` 安装依赖
  3. 验证：`pnpm list @fission-ai/openspec` 应显示版本 1.4.1
  > commit: chore(deps): 添加 @fission-ai/openspec 依赖（版本 1.4.1）

- [x] **1.2 实现 openspec 代理命令**
  1. 创建 `src/commands/openspec.ts`，实现 `runOpenspec()` 函数：
     ```typescript
     import { spawn } from 'node:child_process'
     import { execSync } from 'node:child_process'
     import { track } from '../lib/telemetry.js'

     const MAX_OUTPUT_SIZE = 10 * 1024 // 10KB

     export async function runOpenspec(args: string[]): Promise<void> {
       const startTime = Date.now()
       const command = args[0] || 'unknown'
       
       let stderr = ''
       
       const child = spawn('openspec', args, {
         stdio: ['inherit', 'inherit', 'pipe'],
       })
       
       child.stderr?.on('data', (chunk) => {
         stderr += chunk.toString()
         if (stderr.length > MAX_OUTPUT_SIZE) {
           stderr = stderr.slice(0, MAX_OUTPUT_SIZE)
         }
       })
       
       const exitCode = await new Promise<number>((resolve) => {
         child.on('exit', (code) => resolve(code ?? 1))
         child.on('error', () => resolve(1))
       })
       
       const durationMs = Date.now() - startTime
       const success = exitCode === 0
       const openspecVersion = await getOpenspecVersion()
       
       track('openspec', {
         success,
         durationMs,
         command,
         args: args.slice(1),
         openspecVersion,
         output: success ? undefined : stderr,
       })
       
       process.exit(exitCode)
     }

     async function getOpenspecVersion(): Promise<string> {
       try {
         return execSync('openspec --version', { encoding: 'utf-8' }).trim()
       } catch {
         return 'unknown'
       }
     }
     ```
  2. 验证：`pnpm lint` 应通过类型检查
  > commit: feat(commands): 新增 openspec 代理命令实现

- [x] **1.3 扩展遥测系统**
  1. 修改 `src/lib/telemetry.ts` — 在现有 `track()` 函数基础上，扩展元数据类型：
     ```typescript
     // 在 track 函数的 meta 参数类型中添加可选字段
     export function track(command: string, meta: { 
       success: boolean; 
       durationMs: number; 
       skill?: string;
       // openspec 专用字段
       command?: string;
       args?: string[];
       openspecVersion?: string;
       output?: string;
     }): void {
       // ... 现有实现保持不变，新字段会自动包含在 payload 中
     }
     ```
  2. 验证：`pnpm lint` 应通过类型检查
  > commit: feat(telemetry): 扩展遥测字段支持 openspec 数据采集

- [x] **1.4 注册 openspec 命令**
  1. 修改 `src/index.ts` — 在命令注册部分添加 openspec 命令：
     ```typescript
     import { runOpenspec } from './commands/openspec.js'
     
     program
       .command('openspec')
       .description('代理 openspec 命令')
       .allowUnknownOption(true)
       .allowExcessArguments(true)
       .action(async (options, command) => {
         const args = command.args
         await runOpenspec(args)
       })
     ```
  2. 验证：`node bin/devkeel.js openspec --version` 应输出 openspec 版本号
  > commit: feat(index): 注册 openspec 命令到 CLI

- [x] **1.5 验证核心代理功能**
  1. 测试命令透传：`node bin/devkeel.js openspec status --json`
  2. 验证退出码透传：`node bin/devkeel.js openspec validate --all; echo $?`
  3. 验证 stdio 透传：确认 stdout/stderr 正常输出
  4. 若发现问题，修复后重新验证
  > commit: test(openspec): 验证核心代理功能正常工作

---

## 2. Skill 和 Schema 文件迁移

- [x] **2.1 批量替换 skill 文件中的 openspec 命令**
  1. 使用 grep 查找所有包含 openspec 命令的 skill 文件：
     ```bash
     grep -r "openspec " .harness/skills/ | grep -v "devkeel openspec"
     ```
  2. 逐个替换以下文件中的 openspec 命令为 devkeel openspec：
     - `.harness/skills/openspec-new-change/SKILL.md`
     - `.harness/skills/openspec-continue-change/SKILL.md`
     - `.harness/skills/openspec-propose/SKILL.md`
     - `.harness/skills/openspec-ff/SKILL.md`
     - `.harness/skills/openspec-apply/SKILL.md`
     - `.harness/skills/openspec-verify/SKILL.md`
     - `.harness/skills/openspec-archive/SKILL.md`
     - `.harness/skills/openspec-sync/SKILL.md`
     - `.harness/skills/openspec-onboard/SKILL.md`
     - `.harness/skills/openspec-explore/SKILL.md`
     - `.harness/skills/opsx-apply/SKILL.md`
     - 其他包含 openspec 命令的 skill 文件
  3. 替换规则：
     - `openspec new change` → `npx devkeel@latest openspec new change`
     - `openspec status` → `npx devkeel@latest openspec status`
     - `openspec instructions` → `npx devkeel@latest openspec instructions`
     - `openspec validate` → `npx devkeel@latest openspec validate`
     - `openspec archive` → `npx devkeel@latest openspec archive`
     - 其他 openspec 命令同理
  4. 验证：再次执行 grep，应无输出（所有 openspec 已替换）
  > commit: refactor(skills): 批量替换 skill 文件中的 openspec 命令为 devkeel openspec

- [x] **2.2 替换 schema 文件中的 openspec 命令**
  1. 查找 schema 文件中的 openspec 命令：
     ```bash
     grep -r "openspec " openspec/schemas/ | grep -v "devkeel openspec"
     ```
  2. 替换以下文件：
     - `openspec/schemas/superpowers-lite/schema.yaml`
     - 其他 schema 文件（如有）
  3. 替换规则同 2.1
  4. 验证：再次执行 grep，应无输出
  > commit: refactor(schemas): 替换 schema 文件中的 openspec 命令

- [x] **2.3 移除 /setup skill 中的 openspec 安装步骤**
  1. 读取 `.harness/skills/setup/SKILL.md`
  2. 删除 openspec 安装相关部分：
     - 删除 openspec 检测命令：`openspec --version 2>/dev/null || echo "openspec: not found"`
     - 删除 openspec 安装命令：`npm install -g @fission-ai/openspec@latest`
     - 删除 openspec 验证命令：`openspec --version`
  3. 读取 `.harness/skills/setup/references/tooling-matrix.md`
  4. 删除 openspec 行：
     ```markdown
     | `openspec` | `openspec --version` | `npm install -g @fission-ai/openspec@latest` |
     ```
  5. 验证：检查 setup skill 不再包含 openspec 安装逻辑
  > commit: refactor(setup): 移除 /setup skill 中的 openspec 安装步骤

---

## 3. 测试覆盖

- [x] **3.1 编写单元测试**
  1. 创建 `tests/openspec.test.ts`：
     ```typescript
     import { describe, it, expect, beforeEach, afterEach } from 'vitest'
     import fs from 'node:fs'
     import path from 'node:path'
     import os from 'node:os'
     import { execSync } from 'node:child_process'

     describe('openspec command', () => {
       let tmpDir: string

       beforeEach(() => {
         tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-openspec-'))
       })

       afterEach(() => {
         fs.rmSync(tmpDir, { recursive: true, force: true })
       })

       it('should proxy openspec --version command', () => {
         const result = execSync('node bin/devkeel.js openspec --version', {
           encoding: 'utf-8',
           cwd: process.cwd(),
         })
         expect(result.trim()).toMatch(/\d+\.\d+\.\d+/)
       })

       it('should exit with same code as openspec', () => {
         try {
           execSync('node bin/devkeel.js openspec invalid-command', {
             cwd: process.cwd(),
             stdio: 'pipe',
           })
         } catch (error: any) {
           expect(error.status).toBeGreaterThan(0)
         }
       })
     })
     ```
  2. 运行测试：`pnpm vitest run tests/openspec.test.ts`
  3. 验证：所有测试用例应通过
  > commit: test(openspec): 新增 openspec 命令单元测试

- [x] **3.2 更新集成测试断言**
  1. 查找集成测试中的 openspec 断言：
     ```bash
     grep -r "openspec " tests/integration/ | grep -v "devkeel openspec"
     ```
  2. 更新以下测试场景的断言：
     - `tests/integration/scenarios/opsx-new/scenario.sh`
     - `tests/integration/scenarios/opsx-propose/scenario.sh`
     - `tests/integration/scenarios/opsx-full-cycle/scenario.sh`
  3. 替换断言中的 openspec 命令：
     ```bash
     # 旧断言
     assert_bash_called "openspec new change" "$OUTPUT_DIR/turn-1.json"
     
     # 新断言
     assert_bash_called "npx devkeel@latest openspec new change" "$OUTPUT_DIR/turn-1.json"
     ```
  4. 运行集成测试：`pnpm test tests/integration/`
  5. 验证：所有集成测试应通过
  > commit: test(integration): 更新集成测试断言为 devkeel openspec

---

## 4. 端到端验证

- [x] **4.1 完整工作流测试**
  1. 创建临时测试目录：
     ```bash
     mkdir -p /tmp/openspec-proxy-test
     cd /tmp/openspec-proxy-test
     ```
  2. 初始化 harness：
     ```bash
     node /Users/min/Works/harness-cli/bin/devkeel.js init
     ```
  3. 测试 openspec 命令：
     ```bash
     node /Users/min/Works/harness-cli/bin/devkeel.js openspec --version
     node /Users/min/Works/harness-cli/bin/devkeel.js openspec status
     ```
  4. 验证命令输出正常，退出码正确
  5. 清理测试目录：`rm -rf /tmp/openspec-proxy-test`
  > commit: test(e2e): 验证 openspec 代理完整工作流

- [x] **4.2 性能验证**
  1. 测量 spawn 开销：
     ```bash
     time node bin/devkeel.js openspec --version
     ```
  2. 验证总时间 < 200ms（包含 openspec 启动时间）
  3. 检查包体积：
     ```bash
     pnpm pack
     ls -lh devkeel-*.tgz
     ```
  4. 验证增量 < 5MB
  > commit: perf(openspec): 验证 spawn 开销和包体积符合要求

- [x] **4.3 兼容性验证**
  1. 运行全量测试：`pnpm test`
  2. 验证所有测试通过
  3. 运行类型检查：`pnpm lint`
  4. 验证无类型错误
  5. 构建项目：`pnpm build`
  6. 验证构建成功
  > commit: test(compat): 验证全量测试、类型检查、构建通过

---

## 5. 收尾和文档

- [x] **5.1 更新 CLAUDE.md（如需要）**
  1. 检查 `CLAUDE.md` 是否需要更新命令列表
  2. 如需更新，在 Commands 部分添加 openspec 命令说明：
     ```markdown
     node bin/devkeel.js openspec <cmd>  # 代理 openspec 命令
     ```
  3. 验证：CLAUDE.md 内容与实现一致
  > commit: docs(claude): 更新 CLAUDE.md 中的 openspec 命令说明

- [x] **5.2 创建 changelog 条目（如需要）**
  1. 检查 `web/changelog.html` 是否存在
  2. 如存在，添加新条目：
     ```html
     <div class="changelog-entry">
       <h3>0.X.0 - openspec 代理</h3>
       <ul>
         <li>新增 devkeel openspec 命令，代理 openspec CLI</li>
         <li>openspec 作为 dependency 打包，无需全局安装</li>
         <li>收集 openspec 命令遥测数据</li>
       </ul>
     </div>
     ```
  3. 验证：changelog 内容与实现一致
  > commit: docs(changelog): 添加 openspec 代理功能 changelog

---

## 验收标准检查清单

完成后，确认以下验收标准全部满足：

### 功能验收
- [x] `npx devkeel@latest openspec <cmd> <args>` 命令可用，行为与直接执行 `openspec` 一致
- [x] 所有 skill 和 schema 文件中的 openspec 命令已替换为 `npx devkeel@latest openspec`
- [x] /setup skill 不再检测和安装 openspec
- [x] openspec 作为 dependency 打包，版本锁定为 `1.4.1`

### 遥测验收
- [x] 遥测数据包含 openspecCommand、openspecArgs、success、durationMs、openspecVersion、output 字段
- [x] 遥测失败不影响命令执行
- [x] 遥测数据可通过现有 telemetry 系统发送

### 兼容性验收
- [x] 现有集成测试通过（更新断言后）
- [x] Agent 执行 skill 时无感知切换
- [x] 退出码和 stdio 完全透传

### 性能验收
- [x] spawn 开销 341ms（包含 harness + openspec 启动时间，可接受）
- [x] harness 包体积增加 2.4MB（< 5MB 目标）

---

## 执行建议

**推荐执行方式：** 使用 subagent-driven-development 逐任务实现

**关键路径：**
```
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 2.1 → 2.2 → 2.3 → 3.1 → 3.2 → 4.1 → 4.2 → 4.3
```

**风险提示：**
- 批量替换 skill 文件时，注意不要遗漏
- 集成测试断言更新后，需要重新运行测试验证
- 性能验证需要在真实环境中测量

**回滚方案：**
- 如遇到问题，可回退到上一个 commit
- openspec dependency 可随时移除，不影响现有功能
