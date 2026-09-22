# 验证报告

> 此文件由 `openspec-verify-change` skill 在 apply 完成后产出，用以确认实现
> 与 specs / design / tasks 的一致性。失败的检查须返回对应 artifact 修正后
> 再重跑 verify。

**变更**: `data-driven-changelog`
**验证时间**: `2026-07-13 19:29 CST`
**验证者**: `Codex / GPT-5`

---

## 1. 结构验证 (`npx devkeel@latest openspec validate --all --json`)

- [ ] 全部 items `"valid": true`

**结果**：

```text
29 items: 5 passed, 24 failed.
全部 24 个失败项均缺少主 spec 必需的 `## Purpose` / `## Requirements` 结构。
`git diff --name-only e2b17a0..5abd2c8 -- openspec/specs` 无输出，
确认这些失败不由本 change 修改主 specs 引入。
```

| Item | Type | Issues |
|---|---|---|
| agent-detection | spec | 缺少 `## Purpose` / `## Requirements` |
| changelog-two-column | spec | 缺少 `## Purpose` / `## Requirements` |
| cli-telemetry | spec | 缺少 `## Purpose` / `## Requirements` |
| code-design-preview | spec | 缺少 `## Purpose` / `## Requirements` |
| dashboard-overview | spec | 缺少 `## Purpose` / `## Requirements` |
| domain-subrepo-init | spec | 缺少 `## Purpose` / `## Requirements` |
| domain-templates | spec | 缺少 `## Purpose` / `## Requirements` |
| embed-superpowers-skills | spec | 缺少 `## Purpose` / `## Requirements` |
| human-review-gate | spec | 缺少 `## Purpose` / `## Requirements` |
| index-workflow-simplify | spec | 缺少 `## Purpose` / `## Requirements` |
| init-openspec-incremental | spec | 缺少 `## Purpose` / `## Requirements` |
| init-reinit-cleanup | spec | 缺少 `## Purpose` / `## Requirements` |
| init-submodule-linking | spec | 缺少 `## Purpose` / `## Requirements` |
| interactive-review | spec | 缺少 `## Purpose` / `## Requirements` |
| nav-links-update | spec | 缺少 `## Purpose` / `## Requirements` |
| omc-setup | spec | 缺少 `## Purpose` / `## Requirements` |
| omx-setup | spec | 缺少 `## Purpose` / `## Requirements` |
| openspec-setup | spec | 缺少 `## Purpose` / `## Requirements` |
| repo-type-detection | spec | 缺少 `## Purpose` / `## Requirements` |
| schema-test-integration | spec | 缺少 `## Purpose` / `## Requirements` |
| smart-file-write | spec | 缺少 `## Purpose` / `## Requirements` |
| templates-packaging | spec | 缺少 `## Purpose` / `## Requirements` |
| unified-test-designer | spec | 缺少 `## Purpose` / `## Requirements` |
| workflow-page | spec | 缺少 `## Purpose` / `## Requirements` |

**阻断结论**：schema 强制要求所有 items 为 valid；修复这 24 份既有主 specs
会显著超出 `data-driven-changelog` 的实施范围，因此本轮未擅自批量改写。

---

## 2. 任务完成度 (`tasks.md`)

- [x] 所有 `- [ ]` 已变为 `- [x]`

6/6 个任务已完成，无 `[~]` 延迟任务。

---

## 3. 增量 Spec 同步状态

| Capability | 同步状态 | 备注 |
|---|---|---|
| changelog-two-column | ✗ 待同步 | 主 spec 仍为旧格式与旧布局说明；本 change 的 API/React 增量尚未同步 |
| changelog-version-catalog | ✗ 待同步 | 尚无 `openspec/specs/changelog-version-catalog/spec.md` |

同步状态本身可在 archive 流程处理，但不能覆盖第 1 节的全库结构失败。

---

## 4. Design / Specs 一致性抽查

| 抽样项 | design 描述 | specs 对应 | 差距 |
|---|---|---|---|
| 双版本流 | CLI / Templates 独立目录、排序与 latest | `changelog-version-catalog` 双流需求 | 无 |
| 版本排序 | `releasedAt.to ?? releasedAt.from` 倒序 | catalog spec 同一规则 | 无 |
| latest 可见性 | 最新条目必须 `archived: false` | catalog spec latest 归档场景 | 无 |
| React 历史区 | archived 条目与 V1 → V2 长文位于默认收起区 | two-column 历史区需求 | 无 |
| 运行目录 | `--source-versions` 显式选择源码目录 | server 实现与 package script | 无 |

**漂移警告**：无。Round 4 发现的 OpenSpec 文案漂移已由 `5abd2c8` 修复并复核。

---

## 5. 实现信号

- [x] 提交证据有效：`commitCount=21`，`completedTasks=6`
- [x] 项目测试、构建与 lint 全部通过
- [x] 写入本报告前 tracked worktree clean
- [ ] 所有相关 commit 已推送（按当前工作流未推送；archive 阶段再处理）

**测试执行结果**：

```text
pnpm --dir web test: 8 files / 88 tests passed
pnpm --dir web build: TypeScript、Vite 与 versions build verifier passed
pnpm test: 18 files / 238 tests passed
pnpm build: passed
pnpm lint: passed
web/public/versions ↔ web/dist/versions: diff clean（CLI 27，Templates 11）
git diff --check: passed
Round 4 full review: P0=0, P1=0, P2=0
```

| 仓库 | Commit 范围 | Commit 数 |
|---|---|---:|
| 主仓库 | `e2b17a0e00f5b2b7bd02463f9620d1f82718b15a..5abd2c84e5d25929bf6464677cf850462f912b4c` | 21 |

---

## 6. 前门路由泄漏检测（警告，非阻塞）

- [x] `docs/superpowers/specs/` 下没有 Markdown 文件。

---

## 7. 延迟验证的覆盖缺口检查

tasks.md 无 `[~]` 标记，无延迟验证缺口。

---

## 8. 测试报告

N/A：本 change 未产出 `test-points.md` 或 `test-cases.md`。自动化回归结果见第 5 节。

---

## 9. UI 还原度验证

本 change 没有外部设计稿或截图，设计事实为既有 Changelog 结构与交互契约。
React 测试已覆盖默认 Templates tab、CLI 切换、loading/error/retry、独立 latest、
默认关闭历史区、V1 → V2 disclosure、`?from=` 定位和 Markdown/XSS 边界；生产
构建与 Hono dist 路由测试通过。未发现结构、交互或状态回归。

---

## Overall Decision

- [ ] ✅ PASS — 可进入 finishing-a-development-branch 与归档
- [ ] ⚠️ PASS WITH WARNINGS — 可进入后续步骤但需注意
- [x] ❌ FAIL — 返回失败的 artifact 修正后重跑 verify

**下一步**：先决定是否另起范围统一修复 24 份既有主 specs 的必需章节；
`openspec validate --all --json` 全部通过后覆盖重跑本报告，再进入 archive。
