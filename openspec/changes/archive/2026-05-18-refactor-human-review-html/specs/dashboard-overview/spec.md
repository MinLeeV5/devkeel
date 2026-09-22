## ADDED Requirements

### Requirement: Dashboard SHALL render an architecture-diagram SVG showing change impact

human-review.md 模板 SHALL 指引 agent 调用 architecture-diagram skill 生成 inline SVG，展示变更涉及的模块、文件和依赖关系拓扑，用颜色区分新增（绿）/修改（蓝）/删除（红）。

#### Scenario: architecture-diagram skill 可用

- **WHEN** agent 生成 human-review.html 且 architecture-diagram skill 可用
- **THEN** Dashboard 区域 SHALL 包含一个 `.architecture-diagram-container` 内的 inline SVG

#### Scenario: architecture-diagram skill 不可用时降级

- **WHEN** architecture-diagram skill 不可用
- **THEN** Dashboard SHALL 使用 Mermaid graph 替代，展示相同的模块影响拓扑

### Requirement: Dashboard SHALL display a change summary card

Dashboard 区域 SHALL 包含变更摘要卡片，内容从 brainstorm.md TL;DR 提取，附带变更类型标签（feat/refactor/fix）。

#### Scenario: 摘要卡片内容

- **WHEN** 评审者查看 Dashboard
- **THEN** SHALL 看到一句话摘要 + 变更类型标签 + change 名称

### Requirement: Dashboard SHALL show risk signal indicators

Dashboard SHALL 展示风险信号指示器，标识：破坏性变更、跨模块影响、新增外部依赖。

#### Scenario: 存在破坏性变更

- **WHEN** proposal.md 中标记了破坏性变更
- **THEN** Dashboard SHALL 显示红色「破坏性变更」徽章

#### Scenario: 无高风险信号

- **WHEN** 变更为非破坏性、单模块、无新依赖
- **THEN** Dashboard SHALL 显示绿色「低风险」标识

### Requirement: Dashboard SHALL include task progress overview

Dashboard SHALL 展示任务进度概览，包含总任务数、按组分类的折叠列表。

#### Scenario: 任务概览展示

- **WHEN** tasks.md 包含 N 个 checkbox 任务分为 M 组
- **THEN** Dashboard SHALL 显示「M 组 / N 个任务」概览
