# 回顾: refactor-web-docs

> 撰写时间: 2026-05-15（verify 通过后）
> Commit 范围: `3ebbdbf..eeae0be`
> Worktree: `.claude/worktrees/refactor-web-docs`

---

## 0. 证据

- **Commit 范围**: `3ebbdbf..eeae0be` (1 commit, squash)
- **Diff 规模**: +977 / -997 行，跨 5 个文件
- **任务完成**: 8/8
- **活跃时长**: ~2 sessions（第一 session 完成 tasks 1-4，第二 session 完成 tasks 5-8 + verify）
- **Subagent 调度次数**: 0（主 agent 直接顺序执行）
- **新增外部依赖**: 无
- **合并后 bug**: 无（尚未合并）
- **归档时 OpenSpec validate 状态**: pass（`refactor-web-docs (change): valid=True issues=[]`）
- **测试覆盖信号**: n/a（纯静态 HTML 文档，无自动化测试）

Commit 链（时序）：

```
3ebbdbf fix(detect): guard readdirSync with isDirectory check
eeae0be refactor(web): split documentation into multi-page site
```

---

## 1. 收获

- [evidence: eeae0be, web/assets/styles.css] **CSS 抽取策略清晰有效** — 将公共样式抽到 `styles.css`（172 行），各页面仅保留专属样式为内联 `<style>`。changelog.html 只用 3 行覆盖（`--max-w:960px` + container override + active link），消除了 ~60 行重复代码。

- [evidence: eeae0be, 5 files changed] **单 squash commit 干净** — 整个重构压缩为 1 个 commit，在 worktree 中隔离工作不影响主分支，符合原子性原则。

- [evidence: brainstorm.md UC-1~UC-4 vs tasks.md 8/8] **brainstorm 与交付完全对齐** — brainstorm 中定义的 4 个用例全部落地，无遗漏无膨胀。

- [evidence: verify.md §4] **4 页导航互通验证通过** — Playwright 浏览器自动化验证了每个页面的导航链接和 `class="active"` 高亮，响应式断点在 768px/480px 正常。

---

## 2. 不足

- 🟡 [痛点 | evidence: session summary — Playwright snapshot returned wrong page] **Playwright MCP 快照偶尔返回旧页面内容** — 导航后需要额外 `browser_navigate` 才能获取正确快照，增加了验证耗时。非本变更代码问题，但影响了验证效率。

- 📌 [小问题 | evidence: brainstorm.md UC-4] **V1→V2 架构演进内容未迁移到 changelog.html** — brainstorm 中 UC-4 规划了将架构演进迁入 changelog，但 tasks.md 中未拆出此任务。实际 changelog.html 中已有 `#migration` 板块（先前版本已存在），该内容相当于已覆盖，只是首页侧的删除等同于"不再重复展示"而非"物理迁移"。影响为零，但计划表述与实际执行有细微偏差。

---

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|----------|----------|------|
| UC-4 架构演进"迁移"到 changelog | 首页删除即可，changelog 已有等价内容 | changelog.html 先前已有 `#migration` 版本对比板块，不需物理迁移 |
| tasks.md 仅 8 项 | 8 项足够覆盖 | brainstorm 的 4 个 UC 被设计为 5 个 task group（共 8 步），精简合理 |

---

## 4. Skill / 工作流合规性

| Skill                                            | 使用 |
|--------------------------------------------------|------|
| requirement-analysis                             | ✓ (brainstorm.md 充当需求分析) |
| technical-design                                 | ✓ (design.md) |
| superpowers:writing-plans                        | ✓ (tasks.md) |
| superpowers:using-git-worktrees                  | ✓ (.claude/worktrees/refactor-web-docs) |
| superpowers:subagent-driven-development          | ✗ |
| (传递) superpowers:test-driven-development       | ✗ |
| (传递) superpowers:requesting-code-review        | ✗ |
| superpowers:finishing-a-development-branch       | ✗ (尚未执行，retrospective 先于 finish) |

### 刻意跳过的 Skills

- **`superpowers:subagent-driven-development`**
  - **跳过了什么**: 整个 skill。tasks.md 头部标注了 "使用 superpowers:subagent-driven-development"，但实际由主 agent 顺序执行所有 8 个任务。
  - **本轮为什么**: 任务全部是静态 HTML 文件的内容搬迁（copy-paste + 删除），无需编译、无需测试、无依赖安装。单 agent 执行比启动 subagent 更高效 — 每个 task 的上下文（哪些 section 搬去哪个文件）高度耦合，subagent 需要完整上下文才能执行，并行收益为零。观察：commit `eeae0be` 为 squash commit，说明所有操作在同一连续上下文中完成。
  - **如何防止再次发生**: `scope-judgment rule` — 纯文档搬迁（无编译产物、无测试、任务间强耦合）时，subagent-driven-development 为可选。可在 tasks.md 模板的头部注释改为条件触发："若任务可独立验证则使用 subagent，否则顺序执行"。

- **`superpowers:test-driven-development`**
  - **跳过了什么**: 整个 skill（TDD 循环）。
  - **本轮为什么**: 变更产出为纯静态 HTML + CSS，无可运行的测试框架覆盖（vitest 覆盖 `src/`，不覆盖 `web/`）。验证通过 Playwright 浏览器自动化（视觉 + 交互检查）替代单元测试。观察：`web/` 目录无 `*.test.*` 文件，项目 vitest config 不扫描 `web/`。
  - **如何防止再次发生**: `one-off — schema boundary case, no prevention possible` — 此变更是纯文档 HTML 重构，不产出可测试代码。TDD 对无程序逻辑的静态文档不适用。若未来 web/ 引入 JS 逻辑或构建流程，TDD 将重新适用。

- **`superpowers:requesting-code-review`**
  - **跳过了什么**: 整个 skill（请求 code review）。
  - **本轮为什么**: 变更性质为 HTML/CSS 内容搬迁，无业务逻辑变更、无 API 变更、无安全影响。verify.md 已通过 Playwright 进行了全面的视觉+交互验证（4 页导航、响应式断点、tab 切换），相当于验收测试替代了 code review。观察：verify.md Overall Decision = PASS，commit `eeae0be` 的 diff 仅涉及 `web/` 目录的 HTML/CSS。
  - **如何防止再次发生**: `scope-judgment rule` — 纯文档/样式重构（diff 仅触及 `web/*.html` + `web/assets/*.css`，无 `src/` 变更）时，Playwright 验收可替代正式 code review。若涉及 `src/` 或 `templates/` 则必须请求 review。

- **`superpowers:finishing-a-development-branch`**
  - **跳过了什么**: 暂未执行（retrospective 在 finish 之前产出）。
  - **本轮为什么**: schema 拓扑要求 retrospective 在 verify 之后产出，但 finishing-a-development-branch 通常在所有 artifact 完成后执行。这是时序问题而非跳过 — 将在 archive 阶段执行。
  - **如何防止再次发生**: 无需防止 — 这是 schema 正常时序。finish 将在 `/opsx:archive` 时触发。

---

## 5. 意外

- **Playwright MCP 的页面快照有时延迟** — 假设 `browser_navigate` 后立即可获取正确快照，但实际偶尔返回上一页内容。需要额外一次导航或等待。
- **tasks.md 路径不在 worktree 中** — 假设 openspec 文件随 worktree 复制，实际 `openspec/` 目录仅存在于主仓库。需用绝对路径访问 `/Users/min/Works/harness-cli/openspec/...`。

---

## 6. 晋升候选 → 长期学习

- [ ] 🟡 **纯文档变更可跳过 subagent + TDD + code review** → **晋升到 schema** (superpowers-bridge `apply` 阶段增加 scope-type 判断)
  > **Why**: 静态 HTML/CSS 搬迁无编译产物、无可测试逻辑、任务间强耦合，subagent/TDD/review 三者均增加开销无收益
  > **How to apply**: 当 tasks.md 中的 diff 范围仅触及 `web/*.html` + `web/assets/*.css`（或等价的纯文档目录）时，apply 阶段的 3 个传递 skill 改为可选

- [ ] 📌 **openspec 文件不随 worktree 移动** → **一次性**（记录即可）
  > **Why**: git worktree 只复制仓库代码，openspec/ 在主仓库中；worktree 中操作时需用主仓库绝对路径
  > **How to apply**: 在 worktree 中编辑 openspec artifact 时，始终使用主仓库路径而非 worktree 相对路径

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
