---
name: openspec-bulk-archive-change
description: 批量检查 spec 冲突，并按 schema 门禁归档用户明确选择的多个 OpenSpec changes。
license: MIT
metadata:
  author: openspec
  version: "2.2"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

批量归档多个 active changes。本 skill 保留 OpenSpec 1.12.0 官方的批次选择、完成度表、冲突
分析和一次确认；实际归档委托给 `openspec-archive-change`，不复制移动算法。

## 1. 明确选择

```bash
npx devkeel@latest openspec list --json
```

没有 active changes 时报告并停止。展示名称与 schema，让用户多选一个或多个，也可明确选择
全部；不得自动全选。

## 2. 批量只读预检

对每个已选 change 运行：

```bash
npx devkeel@latest openspec status --change "<name>" --json
```

收集：

- `schemaName`、`artifacts`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext`；
- DevKeel change 的 Living 状态、D/A/O 计数与下游状态；LEGACY 必须先逐 change 迁移；
- `.openspec.yaml` 的 `skip_specs`；为 true 却存在 `specs/` 文件时标为阻断，不参与 sync；
- `artifactPaths.tasks.existingOutputPaths` 中的完成/未完成 tasks；
- delta specs：优先读取 `artifactPaths.specs.existingOutputPaths`；字段缺失或列表为空时递归发现
  `<changeRoot>/specs/**/*.md`，解析真实路径、拒绝越出 `changeRoot` 的符号链接并去重；
- UTC archive 目标是否已存在。

逐项确认 `changeRoot`、artifact 路径和 archive 目标都属于 `planningHome` 返回的当前仓库范围；
路径越界、selector/metadata 无效或目标冲突等不能安全绕过的问题标为阻断。

## 3. 检测并解决 spec 冲突

建立 `capability -> changes` 映射；两个以上 change 修改同一 capability 即为冲突。对每个冲突：

1. 读取全部 delta specs 和当前 main spec；
2. 比较 ADDED/MODIFIED/REMOVED/RENAMED 的 requirement/scenario 语义；
3. 搜索实现与测试，判断哪些语义已落地；
4. 提出明确的同步/归档顺序、跳过项和理由。

实现证据可以判断语义是否落地，但不能单独证明合并顺序。只有一个 change 已实现时可以
建议只同步它；多个都实现时，结合依赖、创建时间和变更语义提出顺序。仍无法安全确定时
让用户选择，不得默认“较新覆盖较旧”或仅凭代码搜索自动决定。

## 4. 展示状态并一次确认

展示汇总表：Change、Schema、Artifacts、Tasks、Delta Specs、Conflicts、Archive Target、Status。
对冲突另列顺序和依据；对不完整项区分普通警告、需要该 change 显式 force、不可绕过。

在任何写入前让用户一次确认：最终有序列表、跳过项，以及每个 change 是否获得 `--force` 或
`--skip-specs` 授权。参数授权必须逐 change 记录，不能作为批次隐式默认。

## 5. 按序委托单项归档

逐项加载并遵循 `openspec-archive-change`，传入该 change 获得授权的参数。它负责 schema 门禁、
spec assessment、CLI archive 和目标验证；本 skill 不手工同步 specs、不创建 archive 目录、
不移动 `changeRoot`。

记录每项成功、跳过或失败及 archive、spec sync、verification/force 状态：

- 写入前失败且不影响后续 spec 语义：可以记录后继续；
- 可能已写 main specs：立即停止整个批次，列出实际变化和恢复点；
- 前项结果改变后项预检结论：重新只读检查并要求确认更新计划。

## 6. 汇总与守卫

分别汇总已归档、跳过、失败和未处理 changes；部分成功必须明确标记。允许一次只归档一个，
但典型用途是多个并行 change。

必须在写入前检测冲突并显示清晰状态；不得后台异步 sync、自动 commit/push/PR、清理未选
changes，或用批次成功掩盖失败。
