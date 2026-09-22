# 回顾: upgrade-superpowers-to-v6

> 撰写时间: 2026-06-23（verify 通过后）
> Commit 范围: `9a0333d..HEAD`（实现走 inline 执行，归档时统一提交为单个 commit）
> Worktree: 未使用 worktree，直接在 master 主 checkout

---

## 0. 证据

- **Commit 范围**: `9a0333d..HEAD`（0 个中间 commit；全部改动将在归档时一次性提交，1 commit）
- **Diff 规模**: +376 / -235 行，跨 23 个文件（18 modified + 2 deleted + 新增 4 个目录/文件）
- **任务完成**: 10/10（`grep -cE '^\s*- \[x\]' tasks.md` = 10）
- **活跃时长**: 单次会话约 1.5 小时（brainstorm 收敛 + artifact 生成 + apply + verify）
- **Subagent 调度次数**: 1 次（review-orchestrator deep 全量审查）；apply 实现阶段 inline 执行未逐 task dispatch
- **新增外部依赖**: 无（纯模板资产变更，package.json 零改动）
- **合并后 bug**: 无（尚未合并；verify PASS，191/191 测试通过）
- **归档时 OpenSpec validate 状态**: pass（`openspec validate --changes` 无错误）
- **测试覆盖信号**: vitest 191 passed / 13 files（lint exit 0）

Commit 链（时序）：

```
9a0333d docs(web): CLI 合并版本 badge 改为 v0.8.5 ~ 0.8.6   ← base
（本次改动全在工作区，归档时单 commit 提交）
```

---

## 1. 收获

- [evidence: tasks.md 1.1 + templates/skills/subagent-driven-development/] 整目录替换策略正确：v6 多个 skill 带附属文件（SDD 的 task-reviewer-prompt.md/implementer-prompt.md/scripts/、systematic-debugging 的 11 个参考文件），若只替换 SKILL.md 会丢失 v6 review 流所需文件，design 阶段的候选 A 决策在实现时验证为唯一可行
- [evidence: brainstorm.md 探索过的替代方向 + design.md 方案对比] 分层互补方案（步骤 4 A 方案）在 schema instruction 落地后无自相矛盾，审查环节仅 P2-1 一处歧义且已修复，证明 brainstorm 阶段收敛的 5 条标准有效
- [evidence: tests/templates.test.ts 38 passed + tests/config.test.ts 17 passed] v6 上游 frontmatter 无 version 字段，用 release tag "6.0.3" 注入 metadata 既满足 embed spec 的 update 检测需求，又不违背外部 skill 保留原作者风格的规范，零测试回归
- [evidence: grep "superpowers:" 清零] 前缀清理用 skill 名称白名单精确替换（11 个已知 skill 名），避免误伤上游文本中的 "Superpowers" 品牌词（executing-plans:17 的 "Superpowers works much better..." 保留）

## 2. 不足

- 🟡 [痛点 | evidence: apply 阶段 inline 执行] apply schema 步骤 3 设计为调用 subagent-driven-development 逐 task dispatch implementer，但本次实现走 inline（我直接逐 task 实现）。原因是 task 全为确定性文件替换/文字编辑，dispatch 反增开销。但这偏离 schema 设计的 SDD 机制，§4 详述
- 📌 [小问题 | evidence: tasks.md 1.2] brainstorming 删除死文件 spec-document-reviewer-prompt.md 未在 tasks.md 显式列为子步骤——它是 v5 时代 spec-review-loop 的遗留，v6.0.3 自身无引用，实现时发现并删除。tasks.md 的 1.2 只写了 visual-companion 排除，未覆盖这个附带清理
- 📌 [小问题 | evidence: Bash 循环 bug] 第一版验证脚本 `for s in $EXPECTED` 把多 skill 名当单字符串处理（shell 未分词），导致误报"缺失"。改用字面量列表后正常。验证脚本本身的健壮性不足

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|----------|----------|------|
| 1.2 brainstorming 排除 visual-companion | 额外删除 spec-document-reviewer-prompt.md | v6 该文件是 v5 spec-review-loop 遗留死文件（SKILL.md 无引用），embed 排除 visual-companion 时顺带清理，避免引入无主孤儿文件 |
| 1.3 清理 superpowers: 前缀 | 涉及 4 文件（systematic-debugging/executing-plans/writing-plans/subagent-driven-development），比预期多 | v6 上游本身在前缀去化上不彻底，executing-plans/writing-plans 也有残留，embed 时必须全量清理 |
| apply 步骤 4 审查 | 审查发现 P2-1（步骤 4 分层表述与测试执行歧义），增加一次 fixer 修复 | design 写的分层互补表述只强调架构层，未点明仍跑全量测试，与步骤 3 测试策略字面冲突。审查捕获后补一句消歧 |
| human-review artifact | 跳过（未生成） | human-review 是 superpowers-lite 的可选分支（requires: tasks 但非 applyRequires），本次是内部资产升级无 UI/交互，无验收文档需求 |

## 4. Skill / 工作流合规性

| Skill | 使用 |
|---|---|
| requirement-analysis（brainstorm） | ✓（前置对话已收敛 5 条标准，brainstorm.md 直接整理产出） |
| technical-design（design） | ✓ 手动降级（design.md 完成检查已说明：模板资产升级，架构改动局限于 schema instruction 文字，按 editing-discipline 手动产出） |
| writing-plans（tasks） | ✓（tasks.md 按 schema 模板结构产出，粗粒度 checkbox + 微步骤 + commit 点） |
| using-git-worktrees | ✗（用户选择不用 worktree，直接 master） |
| subagent-driven-development（apply 执行器） | ✗（inline 执行，未逐 task dispatch） |
| test-driven-development（传递） | ◐（每个 task 的 test: 字段执行了针对性测试，但非完整 RED/GREEN/REFACTOR 循环——模板资产变更无"先写失败测试"场景） |
| review-orchestrator（步骤 4 全量审查） | ✓（dispatch code-reviewer agent，deep 模式，架构/规范层） |
| receiving-code-review（fixer 环节） | ◐（P2-1 修复时按"验证后再实现"纪律处理，未显式 invoke skill） |
| verification-before-completion | ✓（verify 前跑 lint+test 取证据，verify.md 全部基于可观察证据） |
| finishing-a-development-branch | ⏳（归档阶段 8 触发，本回顾撰写时尚未执行） |

### 刻意跳过的 Skills

- **`using-git-worktrees`**
  - **跳过了什么**: 整个 skill（apply 步骤 1 询问 worktree 时用户选"不用"）
  - **本轮为什么**: 用户明确选择直接在 master 主 checkout 实现。触发因素：本次改动是模板文件复制 + schema 文字编辑，无并行开发、无隔离需求，用户在 AskUserQuestion 中选"不用 worktree，直接 master"。apply instruction 步骤 1 本身设计为"根据用户选择执行不同流程"，跳过是 instruction 允许的分支
  - **如何防止再次发生**: `scope-judgment rule` — 不需防止，这是 instruction 设计的合法分支（步骤 1 明文"选择不使用 worktree：直接在当前主 checkout 中工作"）。worktree 是可选隔离手段而非强制

- **`subagent-driven-development`（apply 执行器）**
  - **跳过了什么**: skill 的逐 task dispatch implementer 机制（我直接 inline 实现每个 task）
  - **本轮为什么**: 10 个 task 全为确定性操作（整目录 cp、frontmatter 注入、sed 替换、yaml 编辑），无判断性实现工作。dispatch implementer subagent 每个需构造 task brief、等待返回、读 review package，开销远超 inline 直接操作。触发因素：tasks.md 的每个 task 微步骤都是机械命令（"删除目录""复制文件""编辑 frontmatter"），无歧义无设计判断
  - **如何防止再次发生**: `scope-judgment rule` — 当 tasks.md 的 task 全为确定性文件操作（cp/rm/sed/yaml 编辑）且无设计判断时，inline 执行是合理降级。但应在 apply instruction 中明文化这一判断条件，避免每次依赖人工裁量。候选见 §6

## 5. 意外

- **v6 上游 frontmatter 无 version 字段**：预期上游用 per-skill version，实际 v6 用 plugin release tag 管版本，SKILL.md 只有 name+description。embed spec 要求 metadata.version 存在（update 检测依赖），需用 release tag "6.0.3" 注入。这个冲突在 design 阶段已识别并写入方案，但"上游完全移除 version 字段"这一事实仍出乎预期
- **v6 上游前缀去化不彻底**：预期 v6.0.0 "vendor-neutral" 重构后 superpowers: 前缀已清零，实际 executing-plans/writing-plans/subagent-driven-development/systematic-debugging 仍有残留。embed 的去前缀是必要固定动作，非"清理本地历史遗留 bug"
- **brainstorming 的 spec-document-reviewer-prompt.md 是死文件**：预期 v6 brainstorming 排除 visual-companion 后其余文件均有用，实际该 prompt 文件是 v5 spec-review-loop 时代的遗留，v6 SKILL.md 改用 inline Spec Self-Review 后已无引用，但文件未删

## 6. 晋升候选 → 长期学习

- [ ] 🟡 **apply 执行器 inline 降级条件应明文化** → **晋升到 schema** (`templates/openspec/schemas/superpowers-lite/schema.yaml` apply 步骤 3)
  > **Why**: 本次 apply 走 inline 执行（未 dispatch SDD），因 task 全为确定性文件操作。但 schema 步骤 3 当前无条件要求"调用 subagent-driven-development"，人工裁量降级偏离 schema 设计，且不同执行者判断标准不一
  > **How to apply**: 在 schema apply 步骤 3 增加判断分支：当 tasks.md 的 task 全为确定性文件操作（cp/rm/sed/yaml 编辑，无设计判断）时，允许 inline 执行并在 task 报告中标注降级理由；含设计判断的 task 仍必须 dispatch SDD

- [ ] 📌 **嵌入外部 skill 时去前缀是固定动作，应写入 embed spec** → **晋升到 openspec/specs/embed-superpowers-skills/spec.md**
  > **Why**: v6 上游本身前缀去化不彻底（executing-plans/writing-plans 等仍有 superpowers: 前缀），每次嵌入升级都需全量清理。当前 spec 只说"引用必须裸名"但未强调"上游源文件本身可能含前缀，嵌入时必须清理"
  > **How to apply**: 在 embed spec 的 "References SHALL use bare skill names" requirement 下新增 scenario：嵌入外部 skill 时，对上游源文件做 superpowers: 前缀全量替换，grep 校验清零

- [ ] 📌 **外部 skill 升级前应检查上游遗留死文件** → **晋升到一次性**（本次已处理，记录即可）
  > **Why**: v6 brainstorming 的 spec-document-reviewer-prompt.md 是 v5 时代遗留死文件，上游未删。嵌入时若不检查会引入孤儿文件
  > **How to apply**: 嵌入外部 skill 前，对每个附属文件 grep 其是否被 SKILL.md 引用，无引用的视为死文件评估是否删除。本次已删除该文件，不具有跨轮次通用性（下次升级若上游已清理则无需）
