# 变更回顾：lighten-apply-orchestration

## §0 证据

- **提交数**：7（base `1aaa9b0`..HEAD）
- **diff 规模**：4 files changed, 323 insertions(+), 82 deletions(-)
- **任务完成率**：10 `[x]` + 2 `[~]`（延迟）+ 0 `[ ]`，共 12 项
- **活跃 Section**：6（schema 改动 / tasks instruction 强化 / tasks.md 模板 / 版本一致性 / 验证 / 自检）
- **全量审查轮次**：1 轮审查（1 P1 + 2 P2）→ 1 轮修复 → 复审通过，无 P0/P1 残留
- **新增外部依赖**：无
- **合并后 bug**：未合并，待 PR
- **归档时 OpenSpec validate 状态**：本 change 0 failed（`--all` 的 25 spec failed 为仓库预存，非本 change 引入）
- **测试覆盖信号**：tsc 0 错误、vitest 193/193 passed（本 change 未新增测试，改的是 instruction 文本）
- **提交链**：
  - `070390d` feat(schema): apply 引入三档执行模式路由与 tasks 格式硬约束
  - `21ec067` feat(templates): tasks.md 模板增加 mode 标注与粒度规范
  - `cc8d1e9` chore(versions): 同步 superpowers-lite schema 至 v9
  - `76837eb` fix(schema): 全量审查职责分工按模式限定 + batch 测试语义消歧
  - `211bcb8` style(schema): step 3 batch 测试描述对齐 step 4 精确措辞
  - `051d814` feat(schema): inline 档 commit 前锚定 verification-before-completion 纪律
  - (归档提交) chore(openspec): 归档 lighten-apply-orchestration change

## §1 收获

- **fork 外部 skill 的长期维护成本，应在设计期就评估**。本 change 一开始计划直接改 writing-plans SKILL.md（方案 A），讨论到"superpowers 升级时 update 的覆盖/跳过无法选择性合并"后，演进到方案 D（零 fork，用 instruction 覆盖）。这个决策点如果在 design 阶段就锁定，能省掉实现中段的回退。证据：writing-plans SKILL.md 经历"改→回退"两次操作（git diff 最终为空），消耗了实现时间。
- **mode 规范下沉模板为单一事实源，消除了多源描述的冗余**。原方案在 apply instruction + tasks.md 模板两处描述 mode 边界，讨论后收敛到仅模板注释。证据：design.md 的"迭代修正已纳入"行记录了这次收敛。
- **全量审查的 step 4 职责分工段按模式限定，是分层设计的必要补全**。三档分层如果只改执行器不改审查描述，会出现 batch 档代码质量层漏审（P1）。证据：commit `76837eb` 修复了 review-orchestrator 发现的这个 P1。

## §2 不足

- 🟡 **方案 D 的 instruction 覆盖力验证有循环性，未做不知情 agent 验证**。格式验证测试是我（已知 instruction 约束）产出，无法 100% 证明不知情 agent 会被 instruction 压住而非跟 SKILL.md 示范。真实验证需新 instruction 发布后另起 change 跑。证据：tasks.md §2.2 标 `[~]`，verify §7 列为真实缺口。
- 🟡 **元变更的鸡生蛋约束未被设计充分预判**。design 风险表虽记录了"元变更鸡生蛋"，但 tasks.md 的 §5.2 仍是 apply 执行时才发现"无法用新 apply 自验证三档路由实际运行"。这个约束应在 design 阶段就明确"本 change 的行为验证必须延迟到后续 change"。
- 📌 **apply 执行时为求速度未逐 task commit**。本 change 用 inline/batch 模式，按 tasks.md 的 commit 点分组提交（3 个功能提交 + 2 个修复提交），而非每个 task 一提交。虽符合 batch 模式"组内逐 task commit"精神（commit 点已在 tasks.md 标定），但与 SDD v6 的"每 task 一 commit"粒度不同——这是 inline/batch 模式与 isolated 模式的预期差异，非缺陷，但值得记录。

## §3 计划偏差

- **原方案 A（改 writing-plans）→ 方案 D（零 fork）**：实现中段因 fork 维护成本讨论而回退 writing-plans 改动，改用 tasks instruction 格式硬约束。design.md 已同步更新方案对比表与代码设计预览第 4 点。偏差原因：设计期未充分评估 fork 外部 skill 的升级冲突。
- **inline 边界硬校验 → 去除**：原 design 在 apply instruction 加了 inline 边界硬校验（≤3 文件/无契约/无逻辑），讨论"apply 忠实执行不判模式"的自洽性后去除，仅保留 mode 存在性检查。偏差原因：发现"不判模式但校验边界"的逻辑割裂。
- **mode 缺省降级 isolated → mode 必填**：原 design 设计"旧 tasks.md 无 mode 降级 isolated"的向后兼容，讨论到"模板与 schema 同提交更新无兼容期"后改为 mode 必填。偏差原因：过度套用向后兼容惯性。
- **inline 档补 commit 前最小验证门（051d814）**：原方案 inline 跳过 TDD/code-review/全量审查后无任何验证门，commit 前声明完成缺乏证据。实现后补锚定 verification-before-completion 纪律——commit 前跑该 task 最小验证并读输出，粒度（task 级、非全量）下沉到 tasks.md 模板 inline 边界注释。偏差原因：initial design 过度追求提速，漏了"跳过一切"的验证真空。

## §4 Skill/工作流合规性

本 schema apply 阶段调用的 skill：

| Skill | 实际使用 | 说明 |
|---|---|---|
| writing-plans | ✓ | 产出 tasks.md（本 change tasks.md 遵循新粒度规范，dogfooding） |
| requirement-analysis | ✓ | brainstorm 阶段调用，含源码调查 |
| technical-design | ✓ | design 阶段调用，产出方案对比 + ATAM |
| subagent-driven-development | ✗ 刻意跳过 | 本 change 多为 inline/batch 模式，用 executing-plans 单 session 执行；isolated 档未触发（本 change 无破坏性重构） |
| executing-plans | ✓（等价） | inline/batch 档语义由 apply 协调 agent 直接执行（本 change 是元变更，apply 用旧 instruction，实际由我顺序执行） |
| review-orchestrator | ✓ | 全量审查 deep 模式，发现 1 P1 + 2 P2 |
| openspec-verify-change | ✓ | 产出 verify.md |
| using-git-worktrees | ✗ 刻意跳过 | 用户选择不使用 worktree，主 checkout 执行 |

### 刻意跳过的 Skills

- **subagent-driven-development**
  - **跳过了什么**：isolated 档的 per-task subagent 派发 + task-reviewer + whole-branch review
  - **本轮为什么**：本 change 改的是 instruction 文本（schema.yaml/tasks.md 模板），无 TS 源码逻辑改动，全部为 inline/batch 级文本编辑。按新设计的 mode 分配（tasks.md 标注），无 Section 命中 isolated（无破坏性重构/迁移/并行无依赖分支）。用 SDD 的 per-task subagent 派发纯文本编辑是过度编排。
  - **如何防止再次发生**：这是新 apply 设计的预期行为（isolated 降为 opt-in，非默认）。本 change 恰好验证了"非破坏性变更不应走 isolated"的设计意图。无需 schema 修复——这正是本 change 要确立的行为。

- **using-git-worktrees**
  - **跳过了什么**：git worktree 隔离工作区创建
  - **本轮为什么**：用户在 apply 步骤 1 通过 AskUserQuestion 显式选择"不使用 worktree"。本 change 改 3 个模板文件，纯文本无复杂依赖，主 checkout 直接做更简。符合 git-workflow rule"小变更可在 master 提交"。
  - **如何防止再次发生**：无需防止——这是用户显式选择，apply instruction 步骤 1 的 worktree 二选一机制正常工作。

## §5 意外

- **"契约变更 → isolated"的初始规则是反的**。研究 12 个框架后最初设计三档时，把"契约变更"列为 isolated 触发条件。用真实案例 add-mobile-summary-page 验证时发现：后端契约变更（新增 API 端点）恰恰最该 batch（一起改保证契约自洽），而非 isolated。isolated 的真正触发条件是"高风险可逆性需求（破坏性重构/迁移）或需并行无依赖分支"。这个认知修正发生在 brainstorm→design 之间，已写入 brainstorm In Scope。
- **executing-plans skill 已存在但 apply 没暴露**。源码调查发现 writing-plans 的 Execution Handoff 本就提供 SDD vs executing-plans 二选一，但 superpowers-lite 的 apply instruction 硬编码只调 SDD。这意味着 batch 语义的 skill 已存在，三档模式不需要新造 skill——方案 A（instruction 内联路由）的可行性正建立于此。
- **mode 边界对"单 task 中等改动"有盲区**。格式验证测试时发现：单个、有逻辑改动、但非破坏性的 task（如加 --json 选项），按严格边界不满足 inline（有逻辑）/batch（不是一组）/isolated（非破坏性）任一。三档边界对这类常见场景无自然落点。已记入 design 风险表，留后续评估是否需补"standard"档。

## §6 晋升候选 → 长期学习

- [ ] 🟡 **fork 外部 skill 前必须评估升级冲突** → **晋升到** skill（新建 skill-forking 规范或纳入 skill-versioning）
  > **Why**: 直接改 superpowers 官方 skill 会 fork，update 机制只能覆盖/跳过二选一，无法选择性合并，导致升级时要么丢定制要么丢官方更新。
  > **How to apply**: 改 templates/skills/ 下 author 非 devkeel 的 skill 前，先评估能否用 instruction/模板覆盖代替改源文件；必须改时在改动处加 fork 标记注释。

- [ ] 🟡 **元变更的行为验证须显式延迟到后续 change** → **晋升到** schema（retrospective 或 design 风险表模板）
  > **Why**: 改 apply/编排自身的元变更，用旧 apply 执行无法自验证新行为，鸡生蛋约束不可消除。
  > **How to apply**: design 阶段识别到元变更时，显式在风险表记录"行为验证延迟到后续 change"，tasks.md 对应验证项标 `[~]` 指向 verify，retrospective 记录为后续跟进项。

- [ ] 📌 **mode 边界需补"单 task 中等改动"落点** → **晋升到** schema（superpowers-lite tasks.md 模板 mode 边界注释）
  > **Why**: 三档边界（inline≤3文件无逻辑/batch强耦合组/isolated破坏性）对"单 task 有逻辑非破坏性"无自然落点，常见场景会误判。
  > **How to apply**: 评估是否补 standard 档（单 task 中等改动，走 executing-plans 单 session + TDD），或放宽 inline 边界。需后续 change 验证。

- [ ] 📌 **apply 期不判模式是设计自洽的关键** → **晋升到** CLAUDE.md 或 schema 设计说明
  > **Why**: "apply 忠实执行不校验模式选择"与"inline 边界硬校验"逻辑割裂；模式正确性应交规划期+verify，apply 只读模式+检查存在性。
  > **How to apply**: 任何"apply 校验模式"的冲动都应回到"规划期标定 + verify 回查"的信任边界，避免 apply 期做不可机械判定的语义检查。

- [ ] 🟡 **跳过审查的模式仍需 commit 前最小验证门** → **晋升到** schema（superpowers-lite apply instruction 通用纪律）
  > **Why**: inline 档跳过 TDD/code-review/全量审查后，若 commit 前无任何验证，声明完成缺乏证据，违背 verification-before-completion。提速不能以"零验证 commit"为代价。
  > **How to apply**: 任何跳过 TDD/审查的模式（inline 及未来可能的 standard 档），instruction 必须锚定"commit 前跑该 task 最小验证并读输出"，粒度下沉到 tasks.md 模板对应 mode 边界注释，避免"最小验证"歧义。

## 后续跟进项（来自 verify §7 真实缺口）

1. **新 apply 行为验证**：本 change 发布后，另起 change 用新 apply 跑一份测试用 tasks.md，验证三档路由实际运行行为（inline 跳 TDD、batch 组尾测试、isolated SDD 全套）。
2. **instruction 覆盖力不知情验证**：新 instruction 发布后，让不知情 agent（未被告知 instruction 约束）跑 writing-plans 生成 tasks.md，确认产出是 plan 边界格式而非 step 级 checkbox。若压不住，退路是回退到直接改 writing-plans SKILL.md。
3. **仓库预存 25 spec failed**：`openspec/specs/` 下 25 项 spec 校验 failed（预存，非本 change 引入），建议另行排查处理。
