# 回顾: support-update-template-version-beta

> 撰写时间: 2026-07-06（verify 通过后）
> Commit 范围: `217429257a96bba3dd2aa5c1e9e822a285c75aff..e7e5bc9fdc67e9ce7f93a59c16f07cc43bfeb393`
> Worktree: `/Users/min/.paseo/worktrees/3pgnp2lm/support-update-template-version-beta`

---

## 0. 证据

- **Commit 范围**: `217429257a96bba3dd2aa5c1e9e822a285c75aff..e7e5bc9fdc67e9ce7f93a59c16f07cc43bfeb393` (6 commits)
- **Diff 规模**: +878 / -19 行，跨 12 个文件
- **任务完成**: 3/3 (`tasks.md` 中 3 个 `- [x]`，0 个 `- [ ]`)
- **活跃时长**: 约 25 分钟实现与验证，外加 review/fix/verify 收敛
- **Subagent 调度次数**: 1 次 deep review subagent
- **新增外部依赖**: 无
- **合并后 bug**: 无，尚未合并
- **归档时 OpenSpec validate 状态**: 本 change 单独 validate pass；仓库级 `validate --all` 因历史 main specs 缺 `## Purpose` / `## Requirements` fail
- **测试覆盖信号**: `pnpm test` 14 files / 222 tests passed；目标测试 49 tests passed；`pnpm lint` passed；`pnpm build` passed

Commit 链（时序）：

```text
bef79ab feat(update): 支持模板版本选择
d318e94 feat(update): 暴露模板版本参数
d0c3893 docs(update): 补充模板版本更新用法
66ab4c0 fix(update): 校验稳定模板版本
54e9c32 fix(update): 收紧模板版本校验
e7e5bc9 chore(openspec): 记录 update 模板版本验证
```

---

## 1. 收获

- `src/lib/templates-cache.ts` 将稳定版、显式版本和 beta 选择集中在缓存层，`src/commands/update.ts` 只负责 CLI 参数归一化。这个边界让 `resolveRequestedTemplatesVersion` 能通过纯函数测试覆盖，不依赖真实 npm registry。
- deep review 发现 `SEMVER_RE` 过宽后，`54e9c32` 一次性收紧了 semver 校验、prerelease 排序、npm 外部进程调用方式和残缺缓存判断，相关边界由 `tests/templates-cache.test.ts` 反例覆盖。
- `pnpm build` 后重跑 `pnpm test` 证明最初 `openspec` 子进程测试失败来自 fresh worktree 缺少 `dist/index.js`，不是本变更逻辑回归。

## 2. 不足

- 🔴 [阻塞性 | evidence: review + `54e9c32`] 初版 `SEMVER_RE` 不是严格 semver validator，能放行 `1.2.3beta` 等非法版本。已修复并补测试。
- 🟡 [痛点 | evidence: `pnpm test` 首次失败] 标准测试依赖先执行 `pnpm build` 生成 `dist/index.js`，fresh worktree 直接跑 `pnpm test` 会让 `openspec` 子进程测试失败。verify 中已记录修复路径。
- 📌 [小问题 | evidence: `verify.md`] 仓库级 `openspec validate --all` 被历史 main specs 格式挡住，导致本 change 只能用单 change validate 证明结构正确。

## 3. 计划偏差

| 计划任务 | 实际变化 | 原因 |
|----------|----------|------|
| 1.1 缓存层支持版本选择 | 增加严格 semver 反例、hyphenated prerelease、缓存可用性检查、`execFileSync` 参数数组 | deep review 指出初版 semver 和 shell 字符串执行风险 |
| 1.2 update 命令参数 | 增加 `--beta` 与显式版本在参数层直接互斥 | review 建议用户参数错误应在 CLI 层拒绝，避免包装成 registry 诊断 |
| 1.3 文档与验证 | 标准 `pnpm test` 前补跑 `pnpm build` | fresh worktree 缺少构建产物，导致 subprocess 测试找不到 `dist/index.js` |

## 4. Skill / 工作流合规性

| Skill | 使用 |
|-------|------|
| requirement-analysis | ✓ |
| technical-design | ✓ |
| writing-plans | ✓ |
| using-git-worktrees | ✓ |
| executing-plans | ✓ |
| subagent-driven-development | N/A（tasks.md 为 batch mode） |
| test-driven-development | ✓ |
| receiving-code-review | ✓ |
| review-orchestrator | ✓ |
| openspec-verify-change | ✓ |
| verification-before-completion | ✓ |
| finishing-a-development-branch | 待 archive 后执行 |

### 刻意跳过的 Skills

- **`subagent-driven-development`**
  - **跳过了什么**: 没有按 isolated 模式逐任务 dispatch implementer/reviewer。
  - **本轮为什么**: `tasks.md` 第 32 行标记为 `> mode: batch`，apply 动态指令要求 batch 使用 executing-plans 单 session 顺序执行，并在组尾运行 deep review。
  - **如何防止再次发生**: `one-off — schema boundary case, no prevention possible`。这是 schema 模式选择结果，不是执行遗漏；若未来希望所有实现都走 SDD，需要调整 tasks mode 规则，而不是在执行期强行覆盖。

- **`finishing-a-development-branch`**
  - **跳过了什么**: 尚未推送分支和创建 MR/PR。
  - **本轮为什么**: retrospective 在 archive 前生成，当前阶段尚未执行 archive 移动和归档提交；该 skill 属于 archive 完成后的分支收尾步骤。
  - **如何防止再次发生**: `scope-judgment rule`。retrospective 中标记为“待执行”而非失败；archive 提交完成后再调用 finishing-a-development-branch。

## 5. 意外

- 初始假设“已有 SEMVER_RE 足以保护 npm pack”是错的；它只限制了部分字符集，不是 semver 语义校验。
- 初始假设“标准测试可在 fresh worktree 直接跑”是错的；`tests/openspec.test.ts` 的 subprocess 用例依赖 `dist/index.js` 已存在。
- `openspec validate --all` 的失败不是本 change 的结构问题，而是历史 specs 与当前 validator 契约不一致。

## 6. 晋升候选 → 长期学习

- [ ] 🔴 **涉及外部进程的版本参数必须用严格语义校验，不只靠字符集正则** → **晋升到 skill**
  > **Why**: 本轮 `SEMVER_RE` 放行 `1.2.3beta` 等非法版本，违反“npm pack 前失败”的契约。
  > **How to apply**: 当用户输入会进入 `npm`、`git`、shell 或任意外部进程参数时，测试必须包含非法语义反例和执行前失败断言。

- [ ] 🟡 **fresh worktree 的标准测试若依赖构建产物，verify 应先运行 build** → **晋升到 CLAUDE.md / AGENTS.md**
  > **Why**: `pnpm test` 首次失败是 `dist/index.js` 缺失，不是代码逻辑失败。
  > **How to apply**: 在 Node CLI 仓库中执行含 subprocess/bin 相关测试前，先运行 `pnpm build` 或确认 `dist/` 存在。

- [ ] 📌 **仓库级 OpenSpec 历史格式失败应与当前 change validate 分开记录** → **一次性**
  > **Why**: 本轮 `validate --all` 暴露历史 specs 缺 `Purpose`，但当前 change 单独 validate 通过。
  > **How to apply**: 在 archive verify 阶段同时记录全仓结果和当前 change 结果，避免把历史债误判为本轮阻塞。
