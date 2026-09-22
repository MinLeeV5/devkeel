# Optional Human Review Specification

## Purpose

定义显式 `human-review` skill 如何把现有 OpenSpec artifacts 渲染为只读页面，而不进入 schema 或归档门禁。

## Requirements

### Requirement: Human Review MUST 仅显式调用

`human-review` MUST 只在用户调用 `$human-review` 或明确要求评审页面时运行。Lite 与 Full schema MUST NOT 包含 human-review artifact，页面生成 MUST NOT 改变 status、task checkbox 或 archive readiness。

#### Scenario: 普通 Continue 或 Apply

- **WHEN** 用户未要求 human review
- **THEN** Agent MUST NOT 自动生成 `human-review.html`

### Requirement: Human Review MUST 使用现有 artifacts

Skill MUST 读取选定 change 中实际存在的 Markdown artifacts，按结果展示目标、影响、范围、设计、任务、验证、风险和未决项；缺失章节 MUST 省略，不得为页面补造 artifact。

#### Scenario: Lite 只有 brainstorm 与 tasks

- **WHEN** 用户为 Lite change 生成页面
- **THEN** 页面 SHALL 展示可支持的内容，并 MUST NOT 要求 design/specs/verify/retrospective

### Requirement: 页面 MUST 可注入并重复生成

生成的 `human-review.html` MUST 包含共享 CSS、artifact 和 JS 占位符；skill MUST 运行 `inject-review`，随后尝试 `open-review`。重新调用 MUST 可重建页面且注入保持幂等。

#### Scenario: 浏览器打开失败

- **WHEN** inject 成功但 open-review 失败
- **THEN** skill SHALL 保留页面并报告路径，不得把 change 状态标记失败

### Requirement: Human Review MUST 保持只读

Skill MUST NOT 修改 `.openspec.yaml`、artifact Markdown、源代码或任务状态，也 MUST NOT 自动调用 Apply、Verify、Archive、commit、push、PR 或清理。

#### Scenario: 页面生成完成

- **WHEN** human-review.html 已生成并注入
- **THEN** skill SHALL 报告页面路径和打开结果后停止
