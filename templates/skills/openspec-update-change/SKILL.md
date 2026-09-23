---
name: openspec-update-change
description: 修订现有 OpenSpec change；先更新 Living 决定并重新确认，再原地重投影现有 planning artifacts，绝不修改代码。
license: MIT
metadata:
  author: openspec
  version: "2.1"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

原地修订 change 的共同设计与已有投影。绝不能修改实现代码。

## 1. 选择与读取

显式名称优先；无法唯一确定时用 `list --json` 让用户选择。运行 `status --json`，解析
`schemaName`、`artifacts[].requires`、`applyRequires`、`artifactPaths`、`planningHome`、
`changeRoot` 和 `actionContext.planningArtifacts`。OpenSpec 1.12 的 schema `instruction` 是权威；
只为旧 CLI 兼容读取 `isComplete`。

所有候选文件必须来自 `artifactPaths.<id>.existingOutputPaths`。只有字段缺失时才对
`<changeRoot>/specs/**/*.md` 使用 existing-only fallback；解析 canonical path 并拒绝越过
`changeRoot` 的符号链接。artifact id 与文件路径不是同类值，不得直接求交集；不得写入
`allowedEditRoots` 以外位置。

## 2. 先修订语义源

运行共享 planning-state 检查器。LEGACY 先按 Continue 延迟迁移；INVALID 先修复格式。

把用户请求拆成相互依赖的语义决定，每次只处理一件事。加载 Brainstorming change-draft：调查
仓库事实，给出猜测与影响，等待用户明确回答。答案无歧义后更新对应 D/A/O：

- 任何语义变化把状态重置 DRAFT，下游状态设为 STALE；
- 当前实现和验证证据仍成立的 tasks `[x]` 可暂时保留，受影响或不确定项恢复 `[ ]`；
- 纯排版、错链或不改变含义的修复不使 Confirmed 失效；
- `<!-- harness:lite-to-full-promotion -->` 和
  `<!-- harness:full-tasks-reconciled -->` 的 Full 恢复语义必须保留。

满足 Brainstorming 的快照确认条件后，展示全部当前 D/A 快照。只有用户明确确认，才改为
CONFIRMED；不要逐个 artifact 再要求确认。

## 3. 原地重投影已有 artifacts

按 `applyRequires` 与 `artifacts[].requires` 计算 planning 传递闭包和拓扑顺序。只处理已经存在、
且受决定变化影响的下游文件；不得创建尚不存在的 artifact，也不得在 glob artifact 下新建文件。
缺失必需 artifact 留给 `/opsx:continue <name>`。

对每个受影响 artifact 调用 JSON instructions，遵循 `template`、schema `instruction` 与
`resolvedOutputPath`，并从磁盘重读 `dependencies`。只投影 D/A、仓库事实和机械转换；禁止调用
requirement-analysis/technical-design。发现新选择时停止，回到第 2 节，不写当前 artifact。

Full specs 更新前读取对应 main spec；tasks 只保留当前实现与验证仍支持的 `[x]`。完成所有已有
投影后做来源覆盖检查：忠实则将下游状态设为 CURRENT；仍缺失/冲突则保持 STALE。

## 4. 输出

简短汇总修改的 D/A、重投影文件、重置的 tasks、当前 Living/下游状态和下一步。不得 Apply、
实现、创建新 artifact、commit、push 或 archive。
