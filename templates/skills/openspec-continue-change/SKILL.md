---
name: openspec-continue-change
description: 继续 OpenSpec change；Draft 时继续单题访谈，Confirmed 后每次最多投影一个 planning artifact。
license: MIT
metadata:
  author: openspec
  version: "2.2"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

继续现有 change。OpenSpec 结构状态负责依赖图，DevKeel Living 状态负责语义确认；文件存在不等于
设计完成。

## 1. 选择并读取 change

显式名称优先，其次使用对话中唯一 change；仍有歧义时运行 `list --json`，展示最近 3～4 个候选
让用户选择。随后运行：

```bash
npx devkeel@latest openspec status --change "<name>" --json
```

解析 `schemaName`、`artifacts[].status`、`artifacts[].requires`、`isPlanningComplete`、
`applyRequires`、`planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`。只为旧 CLI 兼容
读取 `isComplete`；状态 `skipped` 视为无需文件。路径以 JSON 为准。

## 2. 检查 Living 状态

从 `artifactPaths.brainstorm.existingOutputPaths` 找到唯一文件，并运行：

```bash
node "<brainstorming-skill-dir>/scripts/planning-state.mjs" "<brainstorm-path>"
```

- `DRAFT`：加载 `brainstorming` 的 change-draft，继续一个问题；本次不创建其他 artifact。
- `INVALID`：报告最小结构错误，修复格式但不替用户改变语义；仍非 Confirmed 时停止。
- `MISSING`：加载 brainstorm 的动态 instruction 初始化 DRAFT，再继续一个问题。
- `LEGACY`：延迟迁移。读取现有 artifacts，提取 D/A/O 候选，展示完整精简快照并等待用户确认；
  不默认确认、不批量改写所有 active changes。确认后写 Living 格式；下游忠实覆盖则 CURRENT，
  存在新增、冲突或遗漏则 STALE。
- `CONFIRMED`：才进入封闭投影。

brainstorm 的 `<!-- harness:lite-to-full-promotion -->` 或 tasks 的
`<!-- harness:full-tasks-reconciled -->` 任一存在都按 Full 恢复；promotion 缺 reconciliation 时，
先补齐 Full `applyRequires` 依赖闭包并重审 tasks，只保留有验证证据的 `[x]`。

## 3. 每次投影一个 artifact

若 `applyRequires` 全部 done 且 Living 下游为 CURRENT，立即停止并提示 `/opsx:apply <name>`；不要
生成 post-apply artifact。否则选择所需闭包内第一个 `ready` artifact：

```bash
npx devkeel@latest openspec instructions <artifact-id> \
  --change "<name>" --json
```

schema `instruction` 是该 artifact 的权威语义。解析 `context`、`rules`、`template`、
`resolvedOutputPath`、`dependencies`、`skipped`/`warning`；skipped 不写文件。每次都从磁盘重读
dependencies，即使刚在对话中看过。

只允许投影 D-*、A-*、仓库事实和机械转换。禁止调用 requirement-analysis、technical-design 或
生成式设计 skill。需要任何尚未确认且会改变结构、可观察行为或维护方式的选择时，不写 artifact：
把 brainstorm 重置 DRAFT、下游标为 STALE，回到 Brainstorming 一次只问一个问题。

写入后确认真实路径并刷新 status。若本次使全部 `applyRequires` 完成，进行来源覆盖检查；无遗漏、
冲突或新增语义时只把 brainstorm 下游状态更新为 CURRENT（这是流程状态，不改变 Confirmed）。

## 4. 简短回执

只报告新建 artifact、投影来源（例如 D-01、D-03、仓库事实）、总进度和下一步；不要求用户通读
完整 Markdown，不重复确认已锁定决定。普通 Continue 每次最多创建一个 artifact。
