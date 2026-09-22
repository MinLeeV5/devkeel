# improve-init-command Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development
> to implement this plan task-by-task.

**Goal:** 修复 `devkeel init` 的 6 个问题：平台链接完整性、re-init 幂等性、子模块链接、stage-x 清理、openspec 增量更新、package.json 优化。

**Architecture:** 在现有 `src/commands/init.ts` + `src/lib/templates.ts` 架构上逐项修复。新增 3 个函数到 `templates.ts`（`cleanPlatformDirs`、`backupAndRemoveDirs`、`cleanLegacyStageFiles`、`updateOpenspecIncremental`），修改 `init.ts` 中的流程编排。

**Tech Stack:** TypeScript, ESM, Node.js fs API, @clack/prompts, vitest

---

## Task 1: 修复 codex 平台 agents 链接

- [ ] **Step 1:** 在 `src/lib/templates.ts:79` codex 分支中，在 `symlinkIfMissing(harnessRules, ...)` 之后添加 `symlinkIfMissing(harnessAgents, path.join(agentsDir, 'agents'))`
- [ ] **Step 2:** 在 `tests/` 中编写测试 `createPlatformLinks codex links agents`：创建临时目录，调用 `createPlatformLinks` with codex target，断言 `.agents/agents` symlink 存在且指向 `.harness/agents`
- [ ] **Step 3:** 运行 `pnpm test` 确认通过

> **Commit point:** `fix(templates): add missing agents symlink for codex platform`

---

## Task 2: 实现 re-init 平台目录清理

- [ ] **Step 1:** 在 `src/lib/templates.ts` 中新增 `getPlatformDirs(projectRoot, targets): string[]` — 返回目标平台对应的目录路径列表（如 `.claude/`、`.agents/`）
- [ ] **Step 2:** 在 `src/lib/templates.ts` 中新增 `backupAndRemoveDirs(dirs: string[]): void` — 对每个目录执行 `fs.renameSync(dir, dir + '.bak')`（如 .bak 已存在先删除），然后确认原目录已移除
- [ ] **Step 3:** 编写测试：`backupAndRemoveDirs` 正确备份和删除目录
- [ ] **Step 4:** 在 `src/commands/init.ts` 中，`createPlatformLinks` 调用前添加检测逻辑：调用 `getPlatformDirs` 获取已存在的平台目录，如有则通过 `p.confirm()` 询问用户，确认后调用 `backupAndRemoveDirs`
- [ ] **Step 5:** 编写测试：re-init 场景下备份和重建流程
- [ ] **Step 6:** 运行 `pnpm test` 确认通过

> **Commit point:** `feat(init): add re-init cleanup with backup for platform directories`

---

## Task 3: 实现废弃 stage-x 文件清理

- [ ] **Step 1:** 在 `src/lib/templates.ts` 中新增 `cleanLegacyStageFiles(projectRoot: string): string[]` — 扫描 `.harness/skills/` 和 `.harness/agents/` 下匹配 `stage-*.md` 的文件，删除并返回已删除文件列表
- [ ] **Step 2:** 编写测试：在临时目录创建 `stage-reviewer.md`、`stage-verifier.md` 和正常文件，调用函数后验证只有 stage-* 文件被删除
- [ ] **Step 3:** 在 `src/commands/init.ts` 中，模板复制完成后调用 `cleanLegacyStageFiles`，如有删除则通过 `p.log.info` 告知用户
- [ ] **Step 4:** 运行 `pnpm test` 确认通过

> **Commit point:** `feat(init): clean up legacy stage-*.md files during init`

---

## Task 4: 增强子模块平台链接

- [ ] **Step 1:** 修改 `src/commands/init.ts` 子模块初始化块（约 line 114-125）：在创建 `.harness/skills` 和 `.harness/rules` 之后，追加创建 `.harness/agents` 目录
- [ ] **Step 2:** 在子模块初始化块末尾，调用 `createPlatformLinks(subFull, targetList)` 为子模块创建平台链接
- [ ] **Step 3:** 编写测试：验证子模块目录包含平台链接
- [ ] **Step 4:** 运行 `pnpm test` 确认通过

> **Commit point:** `feat(init): create platform links for submodule projects`

---

## Task 5: 实现 openspec 增量更新

- [ ] **Step 1:** 在 `src/lib/templates.ts` 中新增 `updateOpenspecIncremental(openspecDir: string): void`：
  - 检查 `schemas/` 目录是否存在，不存在则从模板复制
  - 检查 `schemas/superpowers-bridge/` 是否存在，不存在则从模板复制
  - 检查 `changes/`、`specs/`、`archive/` 子目录是否存在，不存在则创建并添加 `.gitkeep`
- [ ] **Step 2:** 编写测试：验证增量补充逻辑（只补缺失，不覆盖已有）
- [ ] **Step 3:** 修改 `src/commands/init.ts`：将 openspec 的 `if exists skip` 替换为调用 `updateOpenspecIncremental`
- [ ] **Step 4:** 运行 `pnpm test` 确认通过

> **Commit point:** `feat(init): incremental openspec update when directory exists`

---

## Task 6: 优化 package.json 模板

- [ ] **Step 1:** 修改 `src/commands/init.ts` line 172 的 setup 脚本值为 `git submodule update --remote --init && npx devkeel setup`
- [ ] **Step 2:** 编写测试：验证生成的 package.json 包含正确的 setup 脚本且不含 main/author/license 字段
- [ ] **Step 3:** 运行 `pnpm test` 确认通过

> **Commit point:** `feat(init): update package.json setup script with submodule init`

---

## Task 7: 集成验证

- [ ] **Step 1:** 运行 `pnpm lint` 确认无类型错误
- [ ] **Step 2:** 运行 `pnpm test` 确认全部测试通过
- [ ] **Step 3:** 在本地执行 `node bin/devkeel.js init` 端到端验证完整流程
