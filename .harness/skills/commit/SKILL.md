---
name: commit
description: 用户明确选择 commit、push 或 MR/PR 后使用的原子交付流程。任务完成或归档本身不触发；在授权范围内完成交付目标及其必要动作。
metadata:
  author: "devkeel"
  version: "1.2.4"
---

# commit — 提交、推送与 MR/PR 工作流

仅当当前任务涉及 MR/PR 时读取 [MR/PR 流程](references/merge-request.md)；普通 commit、push 不读取该引用文件。

## Hard Rules

0. **交付授权**：按下文“授权边界”执行用户明确选择的交付目标及其必要动作，范围限于已确认的改动、仓库和目标分支；任务收尾、归档或“完成”不构成授权。
1. **每个 commit 单一逻辑**：必须能独立通过构建；不同性质的变更（feat/fix/refactor/style/docs）必须拆开。
2. **Submodule 优先**：含 submodule 的项目，必须先扫描并处理 submodule 内的已授权修改，再处理主仓库。
3. **尊重 ignore 配置**：`.gitmodules` 中 `ignore = all` 的 submodule，其指针变更**绝不提交**到主仓库。
4. **执行顺序不可跳过**：在已授权范围内按 Submodule 扫描 → 差异分析 → 拆分 → 校验暂存区 → 提交 → 可选推送 执行。
5. **禁止** `git add .` 与 `git add -A`，使用显式 `git add` 指定文件。
6. **commit message 格式**：`<type>(<scope>): <subject>`，subject 必须使用中文且简洁明了；`type` 与 `scope` 保持英文规范，专有名词、API、路径等可保留原文。
7. **暂存区强制校验**：每次 commit 前确认暂存区只包含本次逻辑变更的文件，不含意外文件或 ignore=all 的 submodule 指针。

## 授权边界

| 用户明确选择 | 包含的动作 | 停止边界 |
| :--- | :--- | :--- |
| commit | 提交已确认范围内的本地改动 | 不推送、不创建 MR/PR |
| push | 推送已确认的本地提交 | 不自动提交其他工作区改动、不创建 MR/PR |
| 创建 MR/PR | 完成该 MR/PR 所需的提交、推送与创建 | 不合并 |

已有必要提交或推送时直接复用，不重复执行或询问其授权；未明确的改动、仓库或目标分支先核对上下文，
仍不清楚时再澄清。合并须有对应的明确授权，创建 MR/PR 本身不包含合并。

## Type 类型表

| type | 用途 |
| :--- | :--- |
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档 |
| `style` | UI 样式或代码格式（不改变逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 构建 / 工具链 |

## Workflow（6 步）

### Step 0 — Submodule 优先扫描（含 submodule 的项目必须执行）

在分析主仓库变更之前，先扫描所有 submodule 是否有未提交的修改：

```bash
# macOS / Linux
git submodule foreach --quiet 'if [ -n "$(git status --porcelain)" ]; then echo "$sm_path"; fi'

# Windows (PowerShell)
git submodule foreach --quiet "if (git status --porcelain) { Write-Host $env:sm_path }"
```

若有 submodule 存在未提交修改：

1. **逐个进入有修改的 submodule 目录**，在其中完成完整的 commit 流程（Step 1–5）
2. 所有 submodule 的已授权动作完成后，再回到主仓库继续 Step 1；推送按上述授权边界判断

**主仓库指针处理规则**：检查 `.gitmodules` 中该 submodule 的 `ignore` 配置：
- `ignore = all` 或 `ignore = dirty`：**不提交**该 submodule 的指针变更到主仓库（即使 `git status` 显示了指针变更也要排除）
- 无 ignore 或 `ignore = none`：在主仓库中 `git add <submodule>` 更新指针

### Step 1 — 差异分析

```bash
git status
git diff --stat
git diff
```

识别变更簇（Change Clusters）：按"逻辑功能 + type 类型"聚类。

**注意**：若 `git status` 显示 submodule 指针变更，检查 `.gitmodules` 的 ignore 配置后决定是否纳入提交范围。`ignore = all` 的 submodule 指针变更必须排除。

### Step 2 — 拆分策略

| 反模式 | 推荐 |
| :--- | :--- |
| `fix`: 修了 bug + 顺手格式化整文件 | Commit 1 `style`: 格式化；Commit 2 `fix`: 修 bug |
| 一次性提交 feat + refactor + docs | 拆为 3 个独立 commit |

把每组变更明确每条 commit 的 type、scope、中文 subject、文件列表。

### Step 3 — 暂存与校验

显式 `git add` 该组文件。**禁止** `git add .` 与 `git add -A`。

如需批量 add 但要排除 submodule，使用 pathspec 排除：

```bash
git add -- . ':!<submodule-a>' ':!<submodule-b>'
```

校验暂存区：

```bash
git diff --cached --name-only
```

确认暂存区只包含本次逻辑变更的文件。若项目提供 submodule 校验脚本（如 `check-no-submodule-index.sh`），在 commit 前执行。

### Step 4 — 提交

```bash
git commit -m "fix(auth): 处理令牌过期边界场景"
```

Subject 反例：

- ❌ `fix: fix bug`（太模糊）
- ❌ `feat: fix login bug`（type 用错）
- ❌ `fix(auth): handle token expiry edge case`（subject 未使用中文）
- ✅ `fix(auth): 处理令牌过期边界场景`

### Step 5 — 按授权推送与复盘

授权包含推送时，执行 `git pull --rebase` 与 `git push`；否则只运行只读的
`git status` / `git log` 汇报本地提交状态，不把“已 commit”扩大为远端写入授权。

用 `git log --oneline -10` 复盘提交历史，确认无遗漏、无误提交。

只有用户明确选择 MR/PR 时才创建；push 完成本身不自动触发 MR/PR。

## Submodule 边界

若项目包含 submodule，提交时必须遵守以下边界：

| 场景 | 正确做法 | 错误做法 |
| :--- | :--- | :--- |
| 修改了工具链 / 文档类 submodule 内代码 | 进入子项目完成已授权的 commit/push，再决定是否更新主项目指针 | 在子项目处理前直接提交主项目指针 |
| 修改了业务 submodule 内代码 | 进入子项目完成用户授权的动作 | 在主项目 `git add .` 时连带索引变更 |
| 主项目 + 业务 submodule 都有变更 | 先在子项目内提交，再在主项目只 add 主项目自身文件 | 一次 commit 同时包含主项目和业务 submodule 索引 |
| 获取 submodule 最新代码 | `git submodule update --init --remote` | 在主项目中随意提交 submodule 指针 |

核心原则：
1. **Submodule 修改必须先于主仓库提交** — 永远先进入 submodule 完成已授权动作，再处理主仓库；处理顺序不改变上述授权边界。
2. **尊重 `.gitmodules` 的 ignore 配置** — `ignore = all` 的 submodule 指针变更**绝不提交**到主仓库，即使 git 显示了差异也必须排除。
3. 只有 `ignore = none` 或无 ignore 配置的 submodule，才在主仓库中提交指针更新。

## 收尾 Checklist

执行已授权交付动作前确认：

- [ ] 每个 commit 单一逻辑变更，能独立通过构建
- [ ] commit message 为 `type(scope): 中文 subject`
- [ ] 暂存区不含意外文件或不相关的 submodule 索引
- [ ] 无遗漏文件，无误提交的 `console.log` / 调试代码
- [ ] 若授权包含推送，`git pull --rebase` → `git push` → `git status` 全部通过；否则明确仍为本地提交
