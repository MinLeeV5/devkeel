---
name: openspec-archive-change
description: 检查完成状态、评估 spec sync，并按 schema 收尾门禁归档 OpenSpec change。
license: MIT
metadata:
  author: openspec
  version: "3.3"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

完成 active change 的归档。本 skill 以 OpenSpec 1.12.0 官方 Archive 的选择、状态检查、spec
assessment 和确认语义为基线；DevKeel 使用官方 CLI 代替上游 skill 的手工目录移动，并增加
Lite/Full 收尾门禁。

## 1. 选择 change 与读取动态状态

解析 `/opsx:archive [change-name] [--force] [--skip-specs]`。显式名称优先；其次使用对话中无
歧义的 change。无法唯一确定时运行 `list --json`，展示 active changes 及 schema 让用户选择；
不得猜测。

```bash
npx devkeel@latest openspec status --change "<name>" --json
```

解析 `schemaName`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext`、
`artifacts`、`artifacts[].requires` 和 `isPlanningComplete`。顶层 selector/metadata 缺失或
无效时停止；`--force` 不能绕过。

DevKeel schema 先运行共享 planning-state 检查器。普通归档要求有效 CONFIRMED、O 为 0、下游
CURRENT；LEGACY 先延迟迁移，DRAFT/INVALID/STALE 停止。显式 force 可以绕过实施完成度，但
不能把未确认设计伪装成 Confirmed，因此不能绕过 Living 语义门禁。

确认 `changeRoot`、artifact 路径和 archive 目标都能解析到 `planningHome` 返回的当前仓库范围；
任一路径越界或归属不明时，在写入前停止并报告具体路径。

## 2. 官方完成度与 spec assessment

列出所有非 `done` artifacts。从 `artifactPaths.tasks.existingOutputPaths` 读取全部 tasks 文件，
统计 `[x]` 与 `[ ]`；没有 tasks 文件时注明，不制造警告。

优先从 `artifactPaths.specs.existingOutputPaths` 读取 delta specs；字段缺失或列表为空时，递归
发现 `<changeRoot>/specs/**/*.md`。fallback 必须解析真实路径、拒绝越出 `changeRoot` 的符号
链接，并与字段返回的路径去重。存在 delta 时逐 capability 与 main spec 比较，汇总将发生的
ADDED/MODIFIED/REMOVED/RENAMED；区分“需要同步”“已同步”和“存在冲突”。
在任何确认或写入前展示 artifact、task、spec sync 的组合摘要。

先读取 `<changeRoot>/.openspec.yaml`：若 OpenSpec 1.12 写有 `skip_specs: true`，schema 不接受
delta specs。此时 `specs/` 下存在文件是阻断冲突，普通归档不得尝试同步或借 `--skip-specs`
掩盖；没有文件则跳过 spec assessment。

按 OpenSpec 使用的 UTC 日期和 `planningHome.changesDir` 计算目标
`<changesDir>/archive/YYYY-MM-DD-<name>`。目标已存在时必须在 spec sync 前停止；force 不能
绕过。OpenSpec CLI 仍可能在归档过程中写入 specs，因此该预检不可省略。

## 3. 按 schema 应用门禁

### Lite

非 `done` artifacts 或未完成 tasks 存在时，按官方基线展示警告并要求用户确认；确认后允许
CLI 的 `-y` 继续。默认同步 specs；只有用户明确选择才 `--skip-specs`。

```bash
npx devkeel@latest openspec archive "<name>" -y
```

用户显式 `--force` 时仅映射为 `--no-validate`，绝不能把字面 `--force` 传给 OpenSpec CLI。
Lite 不生成 Full verify 或 retrospective。

### Full：普通归档

1. 要求 brainstorm、tasks 完成，全部实现 checkbox 为 `[x]`。
2. brainstorm 的 `<!-- harness:lite-to-full-promotion -->` 或 tasks 的
   `<!-- harness:full-tasks-reconciled -->` 任一存在，都表示当前契约 Full，并要求
   `applyRequires` 完整依赖闭包；promotion 还要求 reconciliation 标记。
3. 只有两枚标记都不存在且旧任务格式或迁移记录确认是旧契约 Full 时，才允许 no-backfill；
   来源不明时询问。
4. `verify.md` 必须为 PASS，记录 `Final Review: P0/P1 CLEAR`，且指纹与当前实现一致：

   ```bash
   node "<verify-skill-dir>/scripts/implementation-fingerprint.mjs" \
     --change-dir "<changeRoot>" --expect "<verify-fingerprint>"
   ```

5. 全部只读门禁、spec assessment 和目标预检通过后，获取 retrospective 的 JSON
   instruction/template，并基于当前 artifacts、diff、Review 和 Verify 写入其
   `resolvedOutputPath`。文件已存在时表示上次归档尝试未完成，必须重新生成，不得阻断重试。
6. spec assessment 无冲突、目标预检通过后，运行官方 archive CLI；用户明确选择时才追加
   `--skip-specs`。

任一普通门禁失败时不得归档；指出应完成 Apply、重跑 Verify、修复 metadata，还是处理
spec/archive 状态。

### Full：显式 force

`--force` 只可绕过 DevKeel artifact readiness、未完成 tasks、verify 缺失/过期/非 PASS 和
OpenSpec validation。仍须重新生成 retrospective，并在 `Review 与 Verify` 中记录：

- `用户选择：` 明确的 force 选择；
- `绕过门禁：` 所有实际绕过项；
- `观察证据：` 每项失败或缺失门禁的事实；
- `剩余风险：` 保留风险；
- `恢复动作：` 最安全的具体恢复步骤。

`绕过门禁：` 使用适用的稳定 ID：`artifact-readiness`、`incomplete-tasks`、
`verify-missing`、`verify-stale`、`verify-non-pass`、`final-review-missing`、
`final-review-not-clear`、`openspec-validation`。映射为：

```bash
npx devkeel@latest openspec archive "<name>" -y --no-validate
```

force 不能绕过 selector/metadata 歧义、路径边界、已有目标、spec 冲突或 sync 失败、
不安全文件系统状态。

### 其他 schema

按官方基线处理：对未完成 artifacts/tasks 展示警告并确认；对 delta specs 展示同步摘要，让用户
选择默认同步或显式跳过；随后使用官方 archive CLI。若 schema 定义额外收尾 artifact 或
instruction，先遵循它；不得套用 Full 门禁。

## 4. CLI 归档与结果验证

DevKeel 明确覆盖上游 skill 的手工 `mkdir/mv`：不得自行创建 archive 目录或移动 `changeRoot`。
除 Full force 外，执行：

```bash
npx devkeel@latest openspec archive "<name>" -y
```

用户已明确选择跳过 spec sync 时才追加 `--skip-specs`。CLI 失败时 active change 中可能已经存在
本次生成的 retrospective；保留它并报告失败，下一次普通或 force 归档必须重新执行全部门禁并
覆盖该文件后重试。检查 main specs 是否已变化；若发生部分写入，列出实际 diff 和精确恢复点，
不得声称归档具备原子性。

成功后报告 change、schema、archive 位置、spec sync/skip、warnings、verification/force 状态。
默认停止；commit、push、PR 和清理必须另行授权。
