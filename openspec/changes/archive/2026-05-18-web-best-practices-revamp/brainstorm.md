## TL;DR

重构 `web/best-practices.html` 最佳实践页面：删除"实践指南"章节（harness-cli 本身已覆盖），充实"Worktree + Setup"章节为推荐 paseo.sh 工具的完整内容。

## 需求背景

当前 best-practices.html 包含三个章节：
1. **场景速查**（保留） — 能力组合矩阵
2. **实践指南**（删除） — 四条核心原则，但这些内容本质上是 harness-cli 初始化时自动做的事情，重复展示没有价值
3. **Worktree + Setup**（重写） — 目前只是占位符（"即将推出"），需要填充 paseo.sh 工具推荐

痛点：Worktree + Setup 是实际开发中非常高频的需求（隔离环境、多任务并行），但当前页面没有给出具体指引。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 已使用 harness-cli 的开发者 | 想知道如何配合 worktree 高效并行工作 |
| Agent 工具使用者（Claude Code/Codex/OpenCode/Pi） | 想了解如何用 paseo 管理 worktree + setup 组合 |
| 移动端操作者 | 想知道能否在手机上发起/审查 Agent 任务 |

## 核心功能用例

### 1. 删除"实践指南"章节

- 整个 `<section>` 包含四条原则的 pillar cards 全部移除
- 理由：这些原则（先沉淀再执行、用 openspec 管理产出、领域包逐步沉淀、路由表保持简洁）是 harness-cli 本身的设计哲学，用户执行 `devkeel init` 后就自然遵循了，无需单独列为"最佳实践"

### 2. 重写"Worktree + Setup"章节

替换占位符为完整推荐内容，核心展示：

- **paseo 是什么** — worktree-first 的 Agent 开发环境管理工具
- **多 Agent 支持** — Claude Code、Codex、OpenCode、Pi
- **worktree + setup 组合** — 一键创建隔离分支 + 自动初始化环境，链接到 https://paseo.sh/docs/worktrees
- **移动端操作** — 专用 App，移动端可以发起任务、看 diff、审批
- **更多功能** — 链接到 https://paseo.sh/docs 了解全貌

### 3. 保留"场景速查"章节

场景矩阵表格保持不变。

## 需求边界

**In Scope:**
- 删除 "实践指南" section
- 重写 "Worktree + Setup" section 为 paseo.sh 推荐内容
- 保持与现有页面一致的设计风格（CSS、布局、card 组件）
- 外链到 paseo.sh/docs 和 paseo.sh/docs/worktrees

**Out of Scope:**
- 不改动场景速查表格
- 不改动 nav/footer
- 不新增页面或子页面
- 不修改 CSS 文件（复用现有样式）

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 保留"实践指南"但精简为 2 条 | 否决 — 这些内容属于 harness-cli 本身的 onboarding，放在 best-practices 页面是重复 |
| 把 paseo 推荐做成独立页面 | 否决 — 目前内容量不大，放在 best-practices 的一个 section 即可 |
| 在场景速查表中加 paseo 相关行 | 可选但不是本次重点 — 场景速查聚焦于 skill/命令层面 |

## 待确认项

- [ ] Worktree + Setup 章节的展示形式：用 pillar cards（类似被删除的实践指南）还是用图文介绍？
- [ ] 是否需要展示 paseo CLI 的具体命令示例？
- [ ] 移动端 App 是否有截图/mockup 可用于页面展示？

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue web-best-practices-revamp
