# Interactive Human Review Specification

## Purpose

定义 human-review.html 的折叠阅读、artifact 原文查看和共享资源注入行为。

## Requirements

### Requirement: 结果章节 MUST 可折叠

页面中实际渲染的结果章节 MUST 支持折叠/展开；artifact viewer MUST 默认折叠。交互状态 MAY 使用 localStorage 保持，但不得写回 artifact。

#### Scenario: 用户折叠章节

- **WHEN** 评审者点击章节标题
- **THEN** 对应内容 SHALL 切换可见状态，task checkbox MUST 保持只读

### Requirement: Artifact viewer MUST 按需展示原文

页面 MUST 包含 artifact viewer 和 `<!-- INJECT:artifacts -->` 占位符。`inject-review` MUST 扫描同目录 Markdown 及 `specs/*/spec.md`，安全转义后注入原文标签；缺少某类 artifact MUST NOT 报错。

#### Scenario: Lite 与 Full 文件集合不同

- **WHEN** inject-review 处理任一 schema 的 change
- **THEN** viewer SHALL 只展示实际存在的 artifacts，并保持可重复注入

### Requirement: Shared assets MUST 由 inject-review 注入

HTML MUST 保留 CSS、artifacts 和 JS 的约定占位符。`inject-review` MUST 注入包内共享资源、校验文档结构并保持幂等；资源缺失或 HTML 损坏 MUST 返回非零。

#### Scenario: 重复注入

- **WHEN** 对同一生成页面连续运行 inject-review
- **THEN** 结果 SHALL 不重复累积资源或 artifact 内容

#### Scenario: Markdown 包含 script 结束标签

- **WHEN** artifact 原文包含 `</script>`
- **THEN** 注入逻辑 MUST 转义该序列，避免破坏页面结构

### Requirement: Human-review skill MUST 调用注入并尝试打开

只有用户显式调用 human-review skill 后，skill MUST 生成页面、执行 `npx devkeel@latest inject-review <path>` 并尝试 `open-review`。inject 失败 MUST 停止；浏览器打开失败 SHALL 保留有效页面并报告路径。

#### Scenario: 用户未调用 human-review

- **WHEN** 普通规划、Apply、Verify 或 Archive 运行
- **THEN** 流程 MUST NOT 自动生成或打开 human-review 页面
