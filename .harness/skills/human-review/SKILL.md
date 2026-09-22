---
name: human-review
description: >
  将 OpenSpec change 的现有 artifacts 渲染为可交互 human-review.html 并尝试打开。
  仅在用户显式调用 human-review skill 或明确要求生成人工评审页面时使用。
metadata:
  author: "devkeel"
  version: "1.0.1"
---

# Human Review

为人类阅读现有 OpenSpec artifacts 生成一个非门禁、可重复生成的 HTML 视图。

## 1. 选择 change

使用用户给出的 change；否则从热上下文推断，只有一个 active change 时可自动选择，仍有
歧义时列出并询问。运行：

```bash
npx devkeel@latest openspec status --change "<name>" --json
```

解析 `schemaName`、`changeRoot` 和 `artifactPaths`。`changeRoot` 是页面位置的运行时事实，
不得假设 change 位于仓库内固定目录；从 `artifactPaths` 读取实际存在的 Markdown artifacts。

支持 Lite、Full 和已有自定义 schema。不要要求缺失的 design/specs/verify/retrospective，
也不要为了页面补造 schema artifact。

## 2. 生成页面

将 `reviewPath` 设为 `<changeRoot>/human-review.html`。完整读取
`references/html-contract.md`，按其结构生成：

```text
<reviewPath>
```

页面面向决策结果：概括目标、影响、边界、关键设计、任务、验收、风险和未决项；只展示
现有 artifacts 能支持的区域。复杂流程、时序、状态或依赖关系优先使用 Mermaid。保留
artifact viewer，让审阅者能查看注入的原文。

重新调用时可以重建这个生成文件，但不得修改 `.openspec.yaml`、artifact Markdown、任务
checkbox、源代码或 schema。`human-review.html` 不是 artifact，不改变 status，也不满足任何
apply/archive gate。

## 3. 注入并打开

生成 HTML 后运行：

```bash
npx devkeel@latest inject-review "<reviewPath>"
npx devkeel@latest open-review "<reviewPath>"
```

`inject-review` 必须成功；它负责注入 artifact 原文、共享 CSS/JS 并校验页面。随后始终尝试
`open-review`。浏览器打开失败不删除页面，也不把评审标成失败；报告绝对路径和错误，让
用户可手动打开。

## 4. 停止

报告页面路径、注入的 artifacts 和打开结果后停止。不要自动调用 apply、verify、archive、
commit、push、PR 或 cleanup。
