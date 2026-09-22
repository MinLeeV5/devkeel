# Human Review Dashboard Specification

## Purpose

定义可选 human-review 页面如何只基于现有 artifacts 展示结果总览、风险与进度，并在关系复杂时选择合适的可视化表达。

## Requirements

### Requirement: Dashboard MUST 汇总可观察结果

Dashboard MUST 从实际存在的 artifacts 汇总 change 名称、一句话结果、schema/progress、范围、风险、任务和验证状态；无法由 artifacts 支持的卡片 MUST 省略，不得猜测。

#### Scenario: Lite change 尚未验证

- **WHEN** 页面仅能读取 brainstorm 与未完成 tasks
- **THEN** Dashboard SHALL 展示范围与任务状态，并省略不存在的 Verify 结论

### Requirement: 关系复杂时 MUST 优先使用 Mermaid

流程、状态、依赖或跨系统影响用图能明显改善理解时，页面 MUST 优先使用 Mermaid；不得固定调用特定制图 skill 或为简单变更强制配图。

#### Scenario: 多系统契约变化

- **WHEN** artifacts 描述三个以上系统间的交互
- **THEN** Dashboard SHOULD 使用 Mermaid 表达影响关系
