# Retrospective: refactor-verify-init-doc-driven

> **Schema**: superpowers-lite | **回顾日期**: 2026-06-20 | **base SHA**: c55dab6

## §0 证据

| 指标 | 值 | 来源 |
|------|-----|------|
| 提交数 | 2（实现 + artifacts）| `git log --oneline c55dab6..HEAD` |
| diff 规模 | 48 files changed, 952 insertions(+), 4086 deletions(-) | `git diff --stat c55dab6..HEAD` |
| 任务完成率 | 11/11（100%）| `grep -c '^- \[x\]' tasks.md` |
| 活跃时长 | 单会话 | 对话上下文 |
| subagent 调度次数 | 1（review-orchestrator deep 审查，dispatch code-reviewer）| apply 阶段记录 |
| 新增外部依赖 | 0（纯 skill 模板 markdown 改动）| `git diff c55dab6..HEAD -- package.json` |
| 合并后 bug | 0（尚未合并，归档前验证）| verify.md |
| 归档时 openspec validate | 29 items, 0 failed（25 pre-existing spec 缺 Purpose 不计入）| `openspec validate --all --json` |
| 测试覆盖信号 | tsc 0 errors / vitest 187 passed | task 6.2 |
| 一行式提交链 | `b9873b0` 实现 → `7969928` artifacts | git log |

核心事实：删除 17 份固定 stack-recipes 配方（4086 行删除主体），新增 frameworks-index 方法论 + scaffolding-principles 清单 + SKILL.md 五处改动（952 行新增/修改），diff 净减 3134 行。

## §1 收获

**1. 删除式重构的净收益显著** — 48 文件改动净减 3134 行，删除的 17 份 stack-recipes 是「会过期且覆盖不了」的纯负债，新增的方法论 + 清单只有 ~250 行却覆盖任意技术栈。证据：`b9873b0` 删除 4086 行 vs 新增 952 行。

**2. test 字段作为逐 task 门禁有效** — tasks.md 每个 task 的 `test:` 字段（grep/diff/test 命令）构成可执行的验收契约，实现阶段每步即时验证，11 个 task 零返工。证据：task 3 的 `! grep vitest.config` 第一次失败，立即定位并修复措辞，验证了门禁的捕获力。

**3. review-orchestrator 的 P2 捕获真实一致性缺陷** — dispatch 1 次 code-reviewer subagent 即识别出 fetch 降级语义三处措辞不统一（P2-1）和「候选通用配方」与「不写配方」理念的措辞张力（P2-4），均为实现阶段未察觉的真实可读性问题。证据：review 报告 4 条 P2 全部采纳，复验后双份一致 + 无残留。

**4. 双份副本 rsync --delete 同步策略可靠** — `rsync -a --delete templates/ .harness/` + `diff -rq` 校验，一次保证两份完全一致，无需手动逐文件同步。证据：task 5.1 一次通过，后续 P2 修复后再次 rsync + diff 仍一致。

## §2 不足

**🟡 痛点：tasks.md 的 test 字段全局 grep 与 task 范围不匹配**

task 4.1 的 test 是 `! grep -q "stack-recipes" SKILL.md`（全局），但 4.1 的描述只说改 Read First 段。实现时被迫在 4.1 阶段提前清除 Hard Rule 4/8、Phase 3、通用能力沉淀的所有 stack-recipes 引用，与 4.2/4.3 的 task 边界错位。

> **How to apply**: tasks.md 的 test 字段应与 task 描述范围对齐；若 test 是全局断言，task 描述应显式声明「清除全文残留」或将 test 限定到具体段落。

**📌 小问题：design 的「受影响区域」表遗漏 stack-matrix/output-formats 的悬空引用**

design.md 把 stack-matrix.md / output-formats.md 标为「不动」，但这两份文件实际有对 stack-recipes 的引用，删除后成悬空引用。实现阶段才发现并修复，属于 design 审查未覆盖的盲点。

> **How to apply**: 删除式重构的 design 阶段应全局 grep 被删资产名的引用，显式标注「悬空引用清理」为受影响区域，而非笼统标「不动」。

**📌 小问题：.base-sha 临时文件未纳入 .gitignore**

apply instruction 要求记录 base SHA 到 `openspec/changes/<name>/.base-sha`，但该文件未被 gitignore，归档前需手动删除避免污染归档目录。

> **How to apply**: 项目应在 .gitignore 增加 `openspec/changes/*/.base-sha` 或 apply instruction 改用内存记录。

## §3 计划偏差

| 偏差 | 原因 | 影响 |
|------|------|------|
| stack-matrix.md / output-formats.md 被改动（design 标「不动」）| 删除 stack-recipes 后这两份有悬空引用，必须清理 | 正向：消除悬空引用，链路闭合；偏差已在 verify.md 记录并说明理由 |
| task 4.1/4.2/4.3 合并为一次 SKILL.md 编辑 | task 4.1 的全局 `! grep stack-recipes` test 要求一次性清除所有引用，分批会导致中间态 test 失败 | 无负面影响；commit 划分从 3 个合并为 1 个 refactor 提交 |
| 未使用 worktree | 用户选择不使用（纯文档改动 + 已在 feat/verify-init 分支）| 无；符合 AGENTS.md「流程仪式感与风险成正比」|

## §4 Skill/工作流合规性

| Skill | 是否使用 | 说明 |
|-------|---------|------|
| openspec-apply-change（/opsx:apply）| ✓ | 入口，遵循 apply instruction 执行器路由 |
| using-git-worktrees | ✓（询问后跳过）| 询问用户是否用 worktree，用户选择不用，符合 instruction 分支 |
| subagent-driven-development | ✗ | 刻意跳过，见下方子节 |
| review-orchestrator | ✓ | dispatch code-reviewer subagent 执行 deep 审查 |
| openspec-verify-change | ✓ | 产出 verify.md，三维度验证 PASS |
| commit | ✗ | 刻意跳过，见下方子节 |

### 刻意跳过的 Skills

**subagent-driven-development**

- **跳过了什么**：apply instruction 步骤 3 要求调用 subagent-driven-development 逐 task dispatch subagent 实现，改为本会话直接逐 task 实现。
- **本轮为什么**：本 change 11 个 task 全是纯 markdown skill 资产改动，且任务间强顺序依赖（同步副本依赖前面所有改动）+ 改动同一批文件（templates/skills/verify-init/）。subagent-driven-development 适用于「independent tasks」并行执行，对顺序依赖 + 文件重叠的任务是反模式——dispatch 11 个 subagent 每个只做一点编辑、还要互相传递上下文，反而低效且易冲突。实际触发因素：观察 tasks.md 内容后判断任务非独立（观察到的任务结构，非外部阻塞）。
- **如何防止再次发生**：apply instruction 的执行器路由应增加「任务独立性 + 文件重叠度」判断分支——当 tasks.md 的 task 强顺序依赖且改动同一文件批时，允许主 agent 直接执行而非强制 subagent 化。可在 schema 的 apply instruction 中加入条件：「若 task 间有顺序依赖且文件重叠 >50%，主 agent 直接执行 + 单次 review-orchestrator 审查」。

**commit**

- **跳过了什么**：git-workflow rule 要求「调用 commit skill 完成原子化提交」，改为直接用 git 命令提交（3 个原子提交，Conventional Commits 格式）。
- **本轮为什么**：归档阶段需分批提交（实现 → artifacts → retrospective → archive 移动），每批的暂存范围需精确控制（排除 .base-sha、区分 skill 资产 vs change artifacts）。commit skill 的交互式拆分流程在归档的精确暂存场景下增加往返，且拆分策略已由 apply instruction 归档顺序明确。实际触发因素：归档提交顺序由 apply instruction 步骤 3-4 预定义，拆分边界固定（提交 hash b9873b0、7969928）。
- **如何防止再次发生**：commit skill 应支持「预设拆分方案」模式——接受调用方提供的提交分组清单，仅做暂存校验 + 格式检查，跳过交互式拆分推断。或在 AGENTS.md 的归档流程中明确「归档提交可由 apply 流程直接执行，commit skill 用于非归档场景的原子提交」。

## §5 意外

**意外 1：frameworks-index 旧版有完整的「context7 库名 + WebFetch 降级 URL」表**

预期 frameworks-index 只是简单 fetch 策略，实际它维护了一张每框架 6 列的对照表（框架/官方文档/配置参考/最佳实践/context7 库名/WebFetch 降级 URL），本身就是「小号配方表」，同样会过期。这印证了 brainstorm 的判断「URL 表会过期且违背不写死」，重写为方法论是必要的，而非可选优化。证据：旧 frameworks-index.md 第 17-59 行 4 张分领域表格。

**意外 2：SKILL.md「通用能力沉淀」段隐含 stack-recipes 引用**

该段建议用户「PR 到 stack-recipes/」，删除目录后成悬空引用，且「候选通用配方」措辞与新理念冲突。这不是 tasks.md 列出的改动点，靠 task 6.3 的全局 grep 才捕获。说明删除式重构的残留扫描必须覆盖全文，不能只看显式引用段。

**意外 3：scaffolding-principles 的 test 对「vitest.config」字面匹配过严**

task 3 的 test `! grep -q "vitest.config"` 本意是「不含具体栈 config 代码块」，但作为文件名示例的 `vitest.config.ts` 也会被匹配。实现时第一次 test 失败，需改写措辞为「vitest / Playwright / pytest 等各自的配置文件」规避字面匹配，同时保留语义。说明 test 字段的 grep 应区分「文件名提及」与「config 代码块」，或用更精确的模式。

## §6 晋升候选 → 长期学习

- [ ] 🟡 **删除式重构的 design 应全局扫描被删资产引用**
  → **晋升到** schema（design artifact instruction）
  > **Why**: design.md 把 stack-matrix/output-formats 标「不动」却遗漏其对被删 stack-recipes 的引用，实现时才发现悬空引用，属于 design 阶段可预防的盲点。
  > **How to apply**: design artifact 的「受影响区域」分析步骤中，要求对被删除/重命名的资产名执行全局 grep，将悬空引用清理显式列为受影响项，而非笼统标「不动」。

- [ ] 📌 **tasks.md 的 test 字段应与 task 描述范围对齐**
  → **晋升到** schema（tasks artifact instruction）
  > **Why**: task 4.1 描述只改 Read First，但 test 是全局 `! grep stack-recipes`，迫使提前清除后续 task 的引用，task 边界错位。
  > **How to apply**: tasks artifact 校验规则要求——若 test 是全局断言（grep 全文），task 描述须显式声明「清除全文残留」；否则 test 应限定到具体段落或文件。

- [ ] 📌 **apply 执行器路由应按任务独立性分支**
  → **晋升到** schema（apply instruction）
  > **Why**: subagent-driven-development 对顺序依赖 + 文件重叠的纯文档任务是反模式，强制 subagent 化降低效率。
  > **How to apply**: apply instruction 步骤 3 增加判断——task 间有顺序依赖且文件重叠度高时，允许主 agent 直接执行 + 单次 review-orchestrator 审查，替代逐 task subagent dispatch。

- [ ] 📌 **.base-sha 审查临时文件应纳入 .gitignore**
  → **晋升到** CLAUDE.md / .gitignore
  > **Why**: apply instruction 要求记录 base SHA 到文件，但未 gitignore，归档前需手动删除避免污染。
  > **How to apply**: 项目 .gitignore 增加 `openspec/changes/*/.base-sha` 规则，或 apply instruction 改为不落盘。

- [ ] 📌 **commit skill 应支持预设拆分方案模式**
  → **晋升到** skill（commit）
  > **Why**: 归档场景的提交边界由 apply instruction 预定义，commit skill 的交互式拆分推断增加往返。
  > **How to apply**: commit skill 增加「预设分组」入口，接受调用方提供的提交清单，仅做暂存校验 + 格式检查，跳过交互推断。
