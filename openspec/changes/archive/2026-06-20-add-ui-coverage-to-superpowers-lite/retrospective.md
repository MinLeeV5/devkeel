# Retrospective — add-ui-coverage-to-superpowers-lite

> 基于 evidence 的变更回顾，遵循 superpowers-lite schema retrospective instruction。

---

## §0 证据（量化前置信息）

| 指标 | 值 |
|---|---|
| 提交数 | 17（`0c80bbf..5ac65ec`） |
| diff 规模 | 23 文件 / +1672 / -9 |
| 任务完成率 | 15/15（100%） |
| figma skill 资产 | 8 文件 / +820 行（SKILL.md + 3 references × 2 副本） |
| schema.yaml 改动 | 7 处 instruction/模板 + version bump，+28 行 |
| 新增外部依赖 | 无（不动 package.json） |
| 合并后 bug | 无（归档时未推送，待 PR 合并后观察） |
| openspec validate 状态 | base==HEAD（4 passed / 25 failed 均为 pre-existing spec 缺 Purpose，无回归） |
| 测试覆盖信号 | `pnpm lint` tsc No errors；`pnpm test` 187/187；task 级 `test:` 逐项通过 |
| subagent 调度次数 | 2（review-orchestrator 全量审查 1 + verify 隐含 1）；实现由控制器直接执行（见 §4） |
| 活跃时长 | 单会话 |

**提交链**：

```
1e8af2e feat(skills): 新增 figma-fidelity-playbook 高保真还原方法论
e239b68 feat(schema): brainstorm 模板补 UI 维度提示
9d3eaec feat(schema): brainstorm instruction 补 UI 用例与约束要求
83ceb90 feat(schema): design 模板新增 UI 设计可选章节
e57b072 feat(schema): design instruction 补 UI 章节指引与 figma 引用
a0dbf13 feat(schema): specs 措辞修正，不再排斥 UI 行为契约
793a89a feat(schema): specs 新增 capability 覆盖度自检机制
2a71f10 feat(schema): tasks instruction 引用 figma 分轮次收敛流程
6e40a92 feat(schema): verify instruction 补 UI 还原度验证项
0e2b2bc chore(schema): superpowers-lite version bump 6 → 7
ce022e1 chore(schema): 同步 superpowers-lite 到 openspec 自用副本
63ae43e test(schema): superpowers-lite UI 维度结构验证
68daf54 test(schema): 确认 UI 维度改动不影响现有测试
609f616 test(schema): UI 维度全链路衔接端到端抽查
3256c9b chore(opsx): 标记 task 1.1/1.2 完成（前置提交已实现）
c92a07e fix(versions): 同步 superpowers-lite schema 版本 6 → 7
5ac65ec docs(verify): 产出 verify 报告
```

---

## §1 收获

1. **design.md 代码设计预览作为精确蓝图的价值**。本次 7 处 schema.yaml/模板改动
   在 design.md §1–§9 给出了逐字 diff，实现阶段几乎是无歧义转录。证据：
   全量 review-orchestrator 审查结论"实现与 design.md 代码设计预览 §1-9 精确对应"，
   仅 1 处版本声明遗漏（P3，已修正）。→ 对纯文本/配置资产变更，design 阶段把 diff
   写到预览级别能极大降低实现偏差。

2. **base==HEAD validate 对比证明无回归**。`openspec validate --all` 有 25 项
   pre-existing 失败，通过临时 worktree 检出 base SHA 逐项对比，确认 HEAD 与 base
   结果完全一致，可信地排除了"本次引入回归"的怀疑。证据：两次 worktree 对比
   输出 `items: 29, passed: 4, failed: 25` 完全相同。

3. **task 级 `test:` 字段 + 全量 `pnpm test` 三重覆盖**。每个 task 的 `test:`
   grep/diff 命令验证"改动落地"，`pnpm test` 验证"未破坏运行时"，`openspec validate`
   对比验证"无结构回归"。15 个 task 全部一次通过，无返工。

---

## §2 不足

| 级别 | 项 | 说明 |
|---|---|---|
| 🟡 痛点 | versions-yml.yml schemas 条目同步遗漏 | task 6.1 只改了 schema.yaml version，遗漏 versions-yml.yml 的 `schemas.superpowers-lite` 同步（base 时两者一致）。被 review-orchestrator P3-1 发现后修正（`c92a07e`）。运行时 `readSchemaVersion` 会覆盖该条目，功能无影响，但破坏了 base 时的一致性。 |
| 📌 小问题 | rtk 代理导致 `pnpm lint` JSON 解析报 EOF | `pnpm lint` 经 rtk 代理时输出 `JSON parse failed: EOF`，但底层 `npx tsc --noEmit` 确认 No errors。需绕过 rtk 直接跑 tsc 才能确认，增加了一步验证。 |

无 🔴 阻塞性不足。

---

## §3 计划偏差

1. **task 1.1/1.2 在 apply 前已实现**。tasks.md 设计为 15 个连续 task，但 1.1/1.2
   （figma skill 嵌入 + 版本注册）在本 change 首个提交 `1e8af2e` 中已完成
   （上一个会话）。apply 阶段补标 checkbox 并补跑其 `test:` 确认通过，未重复实现。
   偏差原因：上一会话已启动实现，本会话接续。无负面影响。

2. **执行器从 subagent-driven-development 改为控制器直接执行**（详见 §4）。
   非 task 范围偏差，是执行方式偏差。

3. **base SHA 从 `1e8af2e`（当前 HEAD）修正为 `0c80bbf`（change 首提交父）**。
   初次按 apply instruction 字面 `git rev-parse HEAD` 记录了 1e8af2e，但这会让
   全量审查范围（1e8af2e..HEAD）为空。修正为 0c80bbf，让 review-orchestrator 覆盖
   整个 change 含已提交的 figma skill。偏差原因：apply instruction 的 `git rev-parse HEAD`
   假设 apply 前无本 change 提交，但本 change 1.1/1.2 已提交。

---

## §4 Skill / 工作流合规性

| Skill | 是否使用 | 说明 |
|---|---|---|
| using-git-worktrees | ⏭ 跳过 | 用户选择不使用 worktree（AskUserQuestion），apply instruction 明确允许。 |
| subagent-driven-development | ⚠️ 部分采用 | 调用了 skill 获取方法论，但实际实现由控制器直接执行而非 fresh-subagent-per-task。见下方「刻意跳过的 Skills」。 |
| test-driven-development | ✗ 跳过 | 见下方「刻意跳过的 Skills」。 |
| requesting-code-review | ✓ 使用 | dispatch review-orchestrator subagent 做全量 deep 审查（base..HEAD），无 P0/P1。 |
| finishing-a-development-branch | ⏳ 待执行 | 归档阶段步骤 4 调用。 |

### 刻意跳过的 Skills

**subagent-driven-development（部分跳过 — 实现未用 fresh subagent per task）**

- **跳过了什么**：skill 的核心机制「每个 task dispatch 一个 fresh implementer subagent
  + 两阶段 review（spec + quality）」。实际改为控制器直接逐 task 编辑 + 每 task 跑
  `test:` 验证 + 单次全量 review-orchestrator 审查。
- **本轮为什么**：触发因素是 skill 自身的 when-to-use 决策树。剩余 13 个 task 中
  8 个（2.2/3.2/4.1/4.2/5.1/5.2/6.1/6.2）改同一个 `schema.yaml` 的不同位置，属于
  tightly coupled（skill 决策树：tightly coupled → "Manual execution"）。且 design.md
  已给逐字 diff，实现是无歧义转录。fresh-subagent-per-task 会让每个 subagent 重读
  625 行 schema.yaml 定位插入点，且串行 dispatch 同一文件易因上下文丢失错位。
  具体触发：读完 schema.yaml 全文后发现 8 task 共改一文件的耦合结构。
- **如何防止再次发生**：schema apply instruction 是通用模板，对所有 change 一律要求
  subagent-driven-development。但 skill 自身决策树已识别 tightly-coupled 场景应改用
  manual。建议在 schema apply instruction 的执行器路由中增加条件分支：
  **当 ≥N 个 task 改同一文件且 design.md 已给逐字 diff 时，允许控制器直接执行 +
  单次全量 review-orchestrator 兜底**，而非强制 fresh-subagent-per-task。否则对
  纯文本资产变更会强制低效流程。此为 §6 晋升候选。

**test-driven-development（跳过）**

- **跳过了什么**：TDD 的 RED/GREEN/REFACTOR 循环（先写失败测试 → 实现 → 重构）。
- **本轮为什么**：触发因素是 task 的 `test:` 字段性质。本 change 所有 `test:` 字段是
  `grep`/`diff`/`test -f`/`openspec validate` 等静态结构校验命令，不是可先写为失败态
  的单元测试。例如 `grep -q "视觉呈现" .../brainstorm.md` 在改动前必然为 false、
  改动后为 true，但它验证的是"文本是否落地"而非"行为是否正确"，不存在 RED 阶段可
  写的断言（文本改动本身就是实现）。schema description 也声明"无 test 字段的 task
  不跑测试"。具体触发：tasks.md 每个 task 的 `test:` 行均为 grep/diff。
- **如何防止再次发生**：TDD 对纯模板/配置资产变更不适用，这是 schema 边界情况。
  schema description 已声明"每个 task 的 test 字段是唯一测试指令"，隐含承认非 TDD
  场景。建议在 schema description 显式补充：**纯文本资产变更（模板/schema/规则）的
  task 验证以 `test:` 字段的静态校验为准，不强制 TDD RED/GREEN/REFACTOR**，避免
  执行器困惑。此为 §6 晋升候选。

---

## §5 意外

1. **`openspec validate --all` 25 项失败初看令人警觉**。初次跑 validate 看到 25 项
   `valid: false` 时，一度怀疑本次改动破坏了结构。意外点在于这些失败全是 pre-existing
   的现有 spec 缺 `## Purpose` 章节——说明仓库 `openspec/specs/` 下大量历史 spec
   不符合当前校验器的格式要求。假设"validate 失败 = 本次回归"被证伪，需 base 对比
   才能区分。这暴露了仓库的一个隐藏技术债（现有 spec 与校验器格式脱节）。

2. **versions-yml.yml 的 schemas 段是 vestigial**。审查发现 versions-yml.yml 的
   `schemas.superpowers-lite` 条目会被 `readSchemaVersion` 运行时覆盖，本身不是权威源
   （skill-versioning.md 已声明 schema 版本独立）。但它仍存在于文件中且 base 时与
   schema.yaml 一致。意外点：一个"非权威但仍需保持同步"的条目，bump 时容易遗漏。

---

## §6 晋升候选 → 长期学习

- [ ] 🟡 **schema apply instruction 应对纯文本资产变更降低 subagent 仪式感**
  - → **晋升到** schema（superpowers-lite schema.yaml apply instruction 执行器路由）
  - > **Why**: 对 tightly-coupled 纯文本/配置 task（多 task 改同一文件 + design.md
    > 已给逐字 diff），强制 fresh-subagent-per-task 会低效且易错位，subagent-driven-development
    > 自身决策树已识别此场景应改用 manual。
  - > **How to apply**: 当 change 的 task ≥N 个改同一文件、且 design.md 含逐字 diff
    > 预览时，apply 路由允许控制器直接执行 + 单次全量 review-orchestrator 兜底，
    > 而非强制 per-task subagent。关联 [[schema-text-asset-executor-routing]]。

- [ ] 🟡 **schema description 应显式声明纯文本资产变更不强制 TDD**
  - → **晋升到** schema（superpowers-lite schema.yaml description）
  - > **Why**: 本 change 所有 task 的 `test:` 是 grep/diff 静态校验，不存在可先写
    > 失败态的单元测试，TDD RED/GREEN/REFACTOR 不适用。执行器按"强制 TDD"理解会困惑。
  - > **How to apply**: description 补充一句——纯模板/schema/规则资产变更的 task
    > 验证以 `test:` 字段静态校验为准，不强制 TDD 循环。

- [ ] 📌 **版本 bump 时的「同步清单」机制**
  - → **晋升到** skill（figma/版本相关 skill 或一次性）
  - > **Why**: schema version bump 时 versions-yml.yml 的 schemas 条目被遗漏（P3-1），
    > 说明版本声明散落在多处时缺一致性检查。
  - > **How to apply**: bump schema version 时，检查 versions-yml.yml schemas 段 +
    > schema.yaml version + 两份副本（templates/ vs openspec/）三处同步。可固化为
    > task 模板的一个子步骤。

- [ ] 📌 **现有 openspec/specs/ spec 与校验器格式脱节的技术债**
  - → **晋升到** 一次性（独立 change）
  - > **Why**: 25 个现有 spec 缺 `## Purpose` 章节，导致 `openspec validate --all`
    > 长期 25 项失败，干扰每次 change 的回归判断（需 base 对比才能区分新旧失败）。
  - > **How to apply**: 作为独立 change 治理——为现有 spec 补 `## Purpose` 章节，
    > 或放宽校验器对历史 spec 的 Purpose 要求。
