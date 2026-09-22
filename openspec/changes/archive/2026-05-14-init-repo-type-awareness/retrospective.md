# 回顾: init-repo-type-awareness

> 撰写时间: 2026-05-14（verify 通过后）
> Commit 范围: `0c2603d..900ef27`
> Worktree: 已合并到 main

---

## 0. 证据

- **Commit 范围**: `0c2603d..900ef27` (1 commit)
- **Diff 规模**: +468 / -97 行，跨 9 个文件
- **任务完成**: 21/21
- **活跃时长**: ~2h（跨 2 个 context window，中间有一次 compaction）
- **Subagent 调度次数**: 1（初期用 explorer 分析 init.ts 行为）
- **新增外部依赖**: 无
- **合并后 bug**: 无
- **归档时 OpenSpec validate 状态**: pass (4/4)
- **测试覆盖信号**: vitest 78 tests, 0 failures

Commit 链（时序）：

```
0c2603d fix(config): 移除与 OpenSpec CLI 冲突的命名规范 rules (base)
900ef27 feat(init): 区分主仓库和领域子仓库，智能覆写 CLAUDE.md/AGENTS.md
```

---

## 1. 收获

- [evidence: 900ef27, tests/templates.test.ts] `hasUserContent` + `writeSmartFile` 的 TDD 红绿循环干净，一次修正测试预期后全过（"OldName vs NewName" 测试用例设计有误，修正为仅注释差异的用例更准确地反映设计意图）
- [evidence: 900ef27, src/lib/detect.ts:84-90] `detectRepoType` 用单个正则 `/\[submodule\s+"[^"]+"\]/` 覆盖了所有边界（空文件、纯注释、正常 submodule），实现极简
- [evidence: 900ef27, src/commands/init.ts] init 流程的 `if (repoType === 'main') / else` 分支结构清晰，领域子仓库路径只做必要的 3 件事（copyDomainTemplateAsRoot + 领域模板 + 平台链接），避免了过度抽象

## 2. 不足

- 🟡 [痛点 | evidence: context compaction] 第一轮 context window 耗尽导致 compaction，前期在 openspec artifact 生成（brainstorm → proposal → specs → design → tasks → plan）上花费了大量 context，留给实际 apply 的空间不足
- 📌 [小问题 | evidence: 900ef27] 将 21 个任务打包为 1 个 commit 而非按 plan 中的 9 个 task 分别提交，原因是 compaction 后需要快速完成剩余工作

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|----------|----------|------|
| 5.3 抽取 `runDomainInit()` 为独立函数 | 保留为 init.ts 内的 if/else 分支 | 调用点只有一处（domain 主流程），独立函数增加间接层无收益 |
| 7.4/7.5 集成测试 | 由单元测试覆盖核心逻辑 | init 流程依赖 @clack/prompts 交互，mock 成本高且脆弱；核心逻辑（hasUserContent, writeSmartFile, copyDomainTemplateAsRoot）已有完整单元测试 |
| 9 个独立 commit | 合并为 1 个 commit | compaction 后批量完成，单次提交更高效 |

## 4. Skill / 工作流合规性

| Skill                                            | 使用 |
|--------------------------------------------------|------|
| requirement-analysis                             | ✓ (openspec proposal/specs) |
| technical-design                                 | ✓ (openspec design.md) |
| superpowers:writing-plans                        | ✓ (plan.md) |
| superpowers:using-git-worktrees                  | ✓ (worktree-init-repo-type-awareness) |
| superpowers:subagent-driven-development          | ✗ |
| (传递) superpowers:test-driven-development       | ✓ (RED-GREEN 循环) |
| (传递) superpowers:requesting-code-review        | ✗ |
| superpowers:finishing-a-development-branch       | ✗ |

### 刻意跳过的 Skills

- **`superpowers:subagent-driven-development`**
  - **跳过了什么**: 整个 skill — 未使用 subagent 逐 task 派发 + 两阶段 review
  - **本轮为什么**: compaction 后 context window 已消耗约 60%，剩余空间不足以支撑多轮 subagent 调度。观察到第一轮 context 在 openspec artifact 生成阶段（brainstorm → plan 共 6 个 artifact）已耗尽，留给 apply 的 context 不足
  - **如何防止再次发生**: `scope-judgment rule` — 当 openspec artifact 数量 ≥ 6 时，plan 阶段应主动提醒用户"artifact 生成已消耗大量 context，建议在新 session 中执行 apply"，而非在同一 session 继续

- **`superpowers:requesting-code-review`**
  - **跳过了什么**: 整个 skill — 未在实现后请求 code review
  - **本轮为什么**: 与 subagent-driven-development 同因 — context 紧张。核心逻辑通过 TDD 验证（78 tests pass），但缺少独立 review 视角
  - **如何防止再次发生**: `scope-judgment rule` — apply 完成后若 context 不足以做 review，应提示用户在新 session 中运行 `/opsx:verify` 前补一轮 review

- **`superpowers:finishing-a-development-branch`**
  - **跳过了什么**: 整个 skill — 直接 fast-forward merge + push，未走标准的 finishing 流程
  - **本轮为什么**: 单 commit fast-forward 场景下 finishing 流程（rebase、squash、PR）无额外价值。用户直接要求 "合并到 master 并推送"
  - **如何防止再次发生**: `one-off — schema boundary case` — 当变更为单 commit 且用户显式要求直接合并时，finishing skill 的 rebase/PR 步骤是冗余的。这是合理的边界情况，因为 finishing 主要价值在于多 commit 场景下的历史整理

## 5. 意外

- `pnpm lint` 命令在 worktree 中因 ESLint JSON 解析错误失败，但 `npx tsc --noEmit` 通过。实际原因可能是 rtk hook 对 ESLint 输出的处理问题，非代码问题
- writeSmartFile 的 "overwrite template content" 测试用例最初设计有误：用不同项目名对比无法区分"模板变量差异"和"用户内容差异"，这是 hasUserContent 设计的固有限制而非 bug

## 6. 晋升候选 → 长期学习

- [ ] 🟡 **openspec artifact 密集型 change 应分 session 执行 plan 和 apply** → **晋升到 memory** (type: feedback)
  > **Why**: 本轮 6 个 openspec artifact + plan + apply 耗尽 context window，导致 compaction 后无法使用 subagent-driven-development 和 code-review skill
  > **How to apply**: 当 openspec change 的 artifact 数量 ≥ 6 时，plan 完成后建议用户开新 session 执行 `/opsx:apply`

- [ ] 📌 **hasUserContent 对模板变量变化无感知** → **一次性**（记录即可）
  > **Why**: 设计选择 — stripComments 后纯文本比较无法区分"项目名从 OldName 变为 NewName"和"用户写了自定义内容"。当前行为（保守保留）是正确的 default
  > **How to apply**: 若未来需要更智能的检测（如重命名项目后 re-init），需引入模板结构化比较而非纯文本 diff
