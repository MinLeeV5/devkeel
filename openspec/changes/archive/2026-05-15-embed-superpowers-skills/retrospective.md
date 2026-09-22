# 回顾: embed-superpowers-skills

> 撰写时间: 2026-05-15（verify 通过后）
> Commit 范围: 尚未提交（工作目录中）
> Worktree: 主工作目录（未使用隔离 worktree）

---

## 0. 证据

- **Commit 范围**: 尚未提交，变更在工作目录中
- **Diff 规模**: tracked +27 / -1145 行（schema 引用替换），untracked +17 文件（8 个 skill 目录）
- **任务完成**: 14/14
- **活跃时长**: ~30 min（跨两个会话）
- **Subagent 调度次数**: 0（直接实现）
- **新增外部依赖**: 无
- **合并后 bug**: 无（尚未合并）
- **归档时 OpenSpec validate 状态**: change valid ✓
- **测试覆盖信号**: vitest 98/98 passed

---

## 1. 收获

- [evidence: `grep -r 'superpowers:' templates/` → 0] 全量替换一次到位，无遗漏。`replace_all` 策略对统一前缀替换高效可靠。
- [evidence: 8/8 metadata check pass] 先前会话已完成 skill 文件复制和 metadata 标注，本次会话只需验证 + 补完引用替换，分工合理。

## 2. 不足

- 📌 [小问题 | evidence: tsc 报错 `fullPath` unused] 并行会话修改同一文件（`templates.ts`）导致短暂的 TS 编译错误。虽然最终收敛，但缺乏显式的会话间协调机制。

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|----------|----------|------|
| 3.1 isHarnessGenerated 增加 content check | 函数被重写为基于版本号检测 | 并行会话采用了更优方案，本会话跳过 |
| 使用 worktree 隔离 | 直接在主工作目录操作 | 先前会话已在主目录开始工作，创建 worktree 会丢失进度 |
| 使用 ralph 执行器 | 直接实现 | 剩余任务为纯文本替换，调度 ralph 开销大于收益 |

## 4. Skill / 工作流合规性

| Skill                                    | 使用 |
|------------------------------------------|------|
| requirement-analysis                     | ✓（brainstorm 阶段） |
| technical-design                         | ✓（design 阶段） |
| writing-plans                            | ✓（tasks 阶段） |
| using-git-worktrees                      | ✗ |
| subagent-driven-development              | ✗ |
| (传递) test-driven-development           | ✗ |
| (传递) requesting-code-review            | ✗ |
| finishing-a-development-branch           | 待执行 |

> **默认期望**：全部 ✓。

### 刻意跳过的 Skills

- **`using-git-worktrees`**
  - **跳过了什么**: 整个 skill（未创建隔离 worktree）
  - **本轮为什么**: 先前会话已在主工作目录创建了 8 个 skill 目录（git status 显示 17 个 untracked 文件），创建 worktree 会从 HEAD 检出干净状态，丢失这些未跟踪文件
  - **如何防止再次发生**: `scope-judgment rule` — 当先前会话已在主目录产出未提交工作时，应在 apply 开头检测并提示"继续当前目录 vs 暂存后创建 worktree"

- **`subagent-driven-development`**
  - **跳过了什么**: 整个 skill（含传递的 TDD 和 code-review）
  - **本轮为什么**: 剩余 6 个任务全为纯文本替换（`replace_all` 操作），无业务逻辑代码变更，TDD（写测试→写实现→重构）在此无可测试的逻辑。subagent 调度的上下文传递开销（读取 design/specs/tasks）远超 6 个 `Edit` 调用的直接执行成本
  - **如何防止再次发生**: `scope-judgment rule` — 纯模板资产变更（无 `src/` 代码变更或 src 变更已由并行会话处理）时，执行层 skills 可降级为直接实现 + 最终 grep 验证

- **`test-driven-development`**（传递跳过）
  - **跳过了什么**: 整个 skill
  - **本轮为什么**: 同上 — 文本替换无可测试逻辑。`isHarnessGenerated` 是唯一涉及代码逻辑的任务，由并行会话处理
  - **如何防止再次发生**: 同 subagent-driven-development

- **`requesting-code-review`**（传递跳过）
  - **跳过了什么**: 整个 skill
  - **本轮为什么**: 同上 — 跟随 subagent-driven-development 跳过
  - **如何防止再次发生**: 同 subagent-driven-development

## 5. 意外

- `isHarnessGenerated` 被并行会话完全重写为版本号检测方案，原计划的 content-based check 不再需要。两种方案功能等价但实现路径不同。

## 6. 晋升候选 → 长期学习

- [ ] 🟡 **纯模板资产变更应允许跳过执行层 skills** → **晋升到 schema**（`superpowers-bridge` schema.yaml apply instruction）
  > **Why**: 8 个 skill 复制 + 引用替换全为文本操作，无需 TDD/code-review/subagent 开销
  > **How to apply**: 当 tasks.md 中无 `src/` 路径且无业务逻辑变更时，apply instruction 应提供"轻量路径"选项

- [ ] 📌 **并行会话协调需要显式机制** → **一次性**（本轮特殊情况）
  > **Why**: 两个会话修改同一文件导致短暂 TS 错误，虽然最终收敛但过程中有噪音
  > **How to apply**: 边界情况 — 通常一个 change 不会跨两个并行会话实现。若再次发生，应提前约定文件归属
