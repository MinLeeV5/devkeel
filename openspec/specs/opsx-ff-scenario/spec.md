# opsx-ff-scenario Specification

## Purpose

验证显式 `/opsx:ff` 在完整快照已确认时使用 Lite 封闭投影到 Apply 前置边界，同时不会生成 Full
或 post-apply artifacts。

## Requirements

### Requirement: opsx:ff 工作流 MUST 验证显式确认后的快速投影

集成场景 MUST 向 `/opsx:ff` 提供可命名主题、完整且明确确认的 D/A 快照，并验证默认
`lite` change、Living brainstorm 与 tasks 均被创建。场景 MUST 验证没有 design、specs、
verify 或 retrospective，并验证 planning-state 为 apply-ready。

#### Scenario: 完整 Lite 设计显式 FF

- **WHEN** 用户显式调用 `/opsx:ff`，确认 CLI verbose flag 的目标、范围、行为、实现和验证快照
- **THEN** Agent SHALL 创建默认 Lite change，忠实投影 brainstorm 与 tasks，并停止在 Apply 之前

### Requirement: opsx:ff 场景 MUST 记录动态调用证据

场景 MUST 验证 Agent 调用 OpenSpec new、status、instructions 和共享 planning-state 检查器；不得
通过固定路径推测结构状态。

#### Scenario: Agent 完成 FF

- **WHEN** 场景检查执行 transcript
- **THEN** transcript SHALL 包含 Lite selector、动态 status/instructions 和 Living 状态检查调用
