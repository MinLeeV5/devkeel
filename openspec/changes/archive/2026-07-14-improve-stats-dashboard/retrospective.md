# 回顾: improve-stats-dashboard

> 撰写时间: 2026-07-14（verify 通过后）
> Commit 范围: `3c4ea8a8c0eb1a32171a8eee96fc8313ae376b24..26f12ef7884b0434eca0e2defd7a75d081a3d1cb`
> Worktree: `/Users/min/Works/harness-cli/.worktrees/improve-stats-dashboard`

> **更新 2026-07-14**：推送前 rebase 到 `origin/master@96542c2`，§0 中撰写时的
> `26f12ef` 实现提交现对应 `6fe0aca`，`9e4314c` 归档提交现对应 `637f857`；
> 最新实现范围为 `96542c2..6fe0aca`。原始 hash 保留为当时审计记录。

---

## 0. 证据

- **Commit 范围**: `3c4ea8a..26f12ef`（1 commit）
- **Diff 规模**: +1220 / -63 行，跨 6 个实现与测试文件
- **任务完成**: 8/8 implementation tasks；1 个 `[~]` 浏览器视觉 QA 延迟
- **活跃时长**: 约 1 小时 32 分（base commit 到实现 commit）
- **Subagent 调度次数**: n/a；当前 verify/archive 会话未调度 subagent
- **新增外部依赖**: 无
- **合并后 bug**: 无；尚未合并
- **归档时 OpenSpec validate 状态**: 当前 change strict 1/1 pass；全仓 5/29 pass，24 个既有 specs 缺少标准章节
- **测试覆盖信号**: 定向 4 files / 60 tests；web 全量 12 files / 128 tests；production build pass

Commit 链（时序）：

```text
3c4ea8a feat(stats): 优化统计页展示
26f12ef feat(stats): 完善遥测统计页交互与分页
```

---

## 1. 收获

- [evidence: `web/server.ts:42,78,239-318`; `server.test.ts:161-241`] 最近事件分页把响应限制为固定 20 条，同时覆盖非法页码、超末页、空数据、损坏行和 Email 映射。
- [evidence: `web/src/pages/stats.tsx:1047-1155`; `stats-page.test.tsx:346-494`] 分页状态与完整统计快照分离，失败保留旧数据、过期响应隔离和服务端钳制页都有可观察测试。
- [evidence: `stats.tsx:1215-1362,1599-1658`] 项目/用户排序、语义化表头和分页控件复用同一组纯函数与表格边界，没有引入 DOM 查询脚本。
- [evidence: `stats-charts.test.tsx`; web build] 图表方向和空状态通过配置级测试锁定，命令耗时图移除而平均耗时 KPI 保持兼容。
- [evidence: `verify.md`] 实现验证和交付门禁被拆开：dirty worktree 可验证，提交后 evidence 转为 `commitCount=1 / workingTreeChangeCount=0`。

## 2. 不足

- 🟡 [痛点 | evidence: `tasks.md` §5.1、`verify.md` §7] 真实浏览器桌面/≤640px QA 未执行；jsdom 能证明 DOM、ARIA 和 class，不能证明 Email 实际省略、分页换行、focus 与 tooltip 定位。
- 🟡 [痛点 | evidence: `openspec validate --all --json`] 全仓有 24 个既有主 specs 缺少 `## Purpose` / `## Requirements`，导致 repo-wide 验证无法全绿，降低了该门禁对单个 change 的信噪比。
- 📌 [小问题 | evidence: 验证命令日志] `pnpm --dir web test -- <files>` 在当前脚本组合下仍运行全量测试；精确定向需要 `pnpm --dir web exec vitest run <paths>`。
- 📌 [小问题 | evidence: artifact status] `human-review` 未产出，change 直接完成了 apply/verify；本次用户明确要求继续归档，按 warning 继续。

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|---|---|---|
| 5.1 浏览器视觉检查 | 保持 `[~]`，仅完成自动化、build、静态 CSS/ARIA 审计 | 当前会话没有使用真实浏览器运行容器；不把 jsdom 结果冒充视觉证据 |
| 5.1 OpenSpec 全仓校验 | 当前 change strict 通过，但 `--all` 仍有 24 个既有错误 | 错误均位于本 change diff 外，未扩大范围批量改写历史 specs |
| human-review artifact | 未生成 | 实现与验证已完成，用户在已知 warning 后明确要求继续归档 |
| 提交边界 | 实现与测试先形成独立 `feat(stats)` commit，归档 artifacts 后置 | 保证交付 evidence 先转为 committed/clean，再生成最终回顾与归档提交 |

## 4. Skill / 工作流合规性

| Skill | 使用 |
|---|---|
| requirement-analysis | ✓（brainstorm 需求与边界） |
| technical-design | ✓（design 完成检查有显式记录） |
| writing-plans | ✓（tasks 覆盖矩阵与分组计划） |
| using-git-worktrees | ✓（独立 `improve-stats-dashboard` worktree） |
| executing-plans | ✓（tasks 的 batch/inline 路由） |
| subagent-driven-development | ✗ |
| test-driven-development | ✓（任务逐项 RED/GREEN，新增 server/page/chart tests） |
| requesting-code-review | ✗（使用 deep review 记录和本轮直接验证审计替代） |
| openspec-verify-change | ✓（`verify.md`） |
| verification-before-completion | ✓（测试、build、strict validate、evidence、diff audit） |
| commit | ✓（实现原子提交 `26f12ef`） |
| finishing-a-development-branch | ⏳ 归档提交后执行 |

### 刻意跳过的 Skills

- **`subagent-driven-development`**
  - **跳过了什么**: 未使用 isolated task subagent 循环。
  - **本轮为什么**: `tasks.md` 的 1–4 节均显式标记 `mode: batch`，第 5 节为 `mode: inline`，没有任何 isolated task；按 schema 执行器路由应使用 executing-plans。
  - **如何防止再次发生**: `scope-judgment rule` — 仅当 tasks section 标记 `mode: isolated` 时要求 subagent-driven-development；batch/inline 不应被 retrospective 模板误报为流程缺失。

- **`requesting-code-review`**
  - **跳过了什么**: 未形成该 skill 的独立 review request artifact。
  - **本轮为什么**: tasks §5.1 已记录 deep review 通过，本轮又逐项完成代码、测试与 spec 映射审计；没有发现 P0/P1，但缺少可持久化的独立 review 输出。
  - **如何防止再次发生**: `schema graph fix` — apply 的 batch review 完成后保存 review 摘要或 hash 到 change 目录，使 retrospective 能区分“已运行但无持久证据”和“完全跳过”。

## 5. 意外

- 原假设是“没有 commit 就没有可验证实现”；实际 worktree 中存在 5 个 unstaged 和 1 个 untracked 实现文件，必须把 implementation evidence 与 delivery readiness 拆开。
- 原假设是 tasks 中记录的定向测试命令只运行 4 个文件；实际因脚本参数转发形式运行了 12 文件全量套件，后续改用 `pnpm --dir web exec vitest run ...` 才得到精确的 4/60 信号。
- 原假设是 `validate --all` 可作为本 change 的干净结构门禁；实际 24 个历史 specs 的格式债务会稳定触发失败，而当前 change strict 独立通过。

## 6. 晋升候选 → 长期学习

- [ ] 🟡 **verify 接受提交或 dirty 实现证据，archive 仍要求 committed/clean** → **晋升到 schema**
  > **Why**: agent 在没有明确提交授权时仍应能验证实现；把 commit 当作 verify 前置会让 linked worktree 的真实改动不可见。
  > **How to apply**: evidence 返回 `hasImplementationEvidence=true` 时允许 verify；仅 `commitCount>0 && workingTreeChangeCount==0` 时允许 archive/PR。

- [ ] 🟡 **repo-wide validate 需要区分 change 回归与历史基线债务** → **晋升到 schema**
  > **Why**: 24 个既有 spec 错误会掩盖当前 change strict 1/1 pass，导致门禁结论失真。
  > **How to apply**: verify 同时记录 current-change strict 与 all-repo 结果；历史基线失败需有显式 baseline/owner，而不是静默忽略或强迫当前 change 扩 scope。

- [ ] 📌 **Vitest 定向测试使用直接 exec 入口** → **晋升到项目 CLAUDE.md / AGENTS.md 验证约定**
  > **Why**: `pnpm --dir web test -- <files>` 在本项目运行了全量套件，不能提供精确的定向文件计数。
  > **How to apply**: stats/web 定向验证使用 `pnpm --dir web exec vitest run tests/<file>...`，全量验证保留 `pnpm --dir web test`。

- [ ] 📌 **jsdom 证据不能替代真实布局 QA** → **晋升到 ui-fidelity-playbook**
  > **Why**: Email overflow、≤640px wrapping、focus ring 和 tooltip placement 都依赖真实布局引擎。
  > **How to apply**: 涉及 overflow/media query/portal positioning 的 UI change，verify 必须显式记录真实浏览器证据或保留 `[~]` warning。
