# Retrospective: externalize-templates-npm

## §0 变更概要

将 `templates/` 目录就地升级为 `devkeel-templates` 独立 npm 包，CLI 运行时通过 `npm view` + `npm pack` 实时拉取最新模板到本地缓存，解耦模板迭代与 CLI 发版。

**Schema:** superpowers-lite
**Commits:** 7
**Files changed:** 13 (+356, -30)

## §1 什么做得好

1. **架构决策清晰：** `templates-dir.ts` 零依赖模块打破循环依赖，DAG 保持干净。提取时机恰到好处——在 review round 1 发现 P1 后立即修复。
2. **安全防御到位：** semver 正则守卫防止 shell 注入，`npm pack` 替代 `fetch` 尊重 `.npmrc` 鉴权，`mkdtempSync` + `try/finally` 保证并发安全和资源清理。
3. **Review 驱动迭代：** 经历 4 轮 deep review，从 P0 blocker（config.ts 路径未适配、fetch 无鉴权）到 P2 清理（死代码、spinner 一致性），每轮修复都提升了代码质量。
4. **测试覆盖渐进增强：** 从 4 个 TemplatesFetchError 构造测试扩展到 13 个，覆盖 meta round-trip、tarball 解压、semver 校验等核心路径。使用 `__test__` + `VITEST` 守卫暴露内部函数的方式兼顾了封装性和可测性。

## §2 什么可以做得更好

1. **Design 文档与实际实现脱节：** design.md 描述的方案（fetch + node:zlib）在 review 中被推翻，但 design.md 未同步更新。后续维护者可能困惑于文档与代码不一致。
   - **改进：** review 修复涉及设计变更时，应同步更新 design.md。
2. **Task 4.2 过早标记完成：** "验证 getBuiltinVersions 自动适配" 被标记为 done，但实际 config.ts 并未自动适配（使用硬编码路径而非 getTemplatesDir）。这是 review round 1 发现的 P0 blocker。
   - **改进：** "验证"类任务应提供可观察证据（如测试输出）后再标记。
3. **e2e 验证阻塞未提前规划：** 5 个 e2e 任务依赖模板包发布，但实现阶段未考虑发布顺序。
   - **改进：** tasks.md 中标注依赖关系，或拆分为"实现"和"发布后验证"两阶段。

## §3 关键技术决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 下载方式 | `npm pack` | 自动读取 `.npmrc` auth token；fetch 无法鉴权 |
| 解压方式 | `tar` 库 | 避免 shell 注入；不依赖系统 tar 命令 |
| 状态管理 | 模块级 mutable 变量 | getTemplatesDir 在 10+ 处调用，DI 成本过高 |
| 循环依赖 | 提取 templates-dir.ts | 最小改动打破循环，零额外依赖 |
| 并发安全 | `mkdtempSync` | 进程唯一临时目录，避免竞态 |

## §4 意外发现

1. **`config.ts` 的 `getBuiltinVersions` 和 `readSchemaVersion` 使用硬编码路径** — 原以为它们通过 `getTemplatesDir()` 获取路径，实际独立拼接。这导致移除 templates/ 后这两个函数静默失效（返回空对象），是典型的"假设未验证"风险。
2. **`tar` 库 v7 使用具名导出** — `import tar from 'tar'` 在 ESM 构建时报错，需要 `import { extract } from 'tar'`。tsup/esbuild 对 CJS/ESM 互操作的处理需要留意。
3. **vitest 从 worktree 运行时会扫到主仓库 tests/** — 需要用 `--dir tests` 限定范围，否则测试重复执行。

## §5 流程效率

| 阶段 | 评价 |
|------|------|
| Brainstorm | ✅ 充分收敛，方案 B 在 brainstorm 中已锁定 |
| Design | ⚠️ 方案描述准确但未跟随 review 修复更新 |
| Tasks | ✅ 粒度合适，16/21 完成度良好 |
| Apply | ✅ subagent-driven 效率高，7 commits 干净 |
| Verify | ✅ 4 轮 review 逐层递进，发现并修复所有 blocker |

## §6 下次建议

1. Review 修复涉及设计变更时，增加"同步更新 design.md"的 checklist item
2. "验证"类任务（task 4.2）要求提供可观察证据后才可标记完成
3. 涉及外部依赖（npm registry）的 e2e 验证，在 tasks.md 中显式标注前置条件
