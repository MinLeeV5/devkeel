## ADDED Requirements

### Requirement: design.md template SHALL include a Code Design Preview section

`templates/openspec/schemas/superpowers-bridge/templates/design.md` SHALL 在「模块设计」之后新增「代码设计预览」section，包含三个子节：关键接口与类型、核心实现伪代码、变更前后对比。

#### Scenario: 模板包含新 section

- **WHEN** 读取 design.md 模板
- **THEN** SHALL 在「模块设计」和「数据设计」之间包含 `### 代码设计预览` 标题及三个 level-4 子节

#### Scenario: agent 填写代码设计预览

- **WHEN** agent 执行 design artifact 创建
- **THEN** SHALL 在代码设计预览 section 中填写关键函数签名、伪代码逻辑和变更前后 diff 对比

### Requirement: human-review.html SHALL render code design with diff highlighting

human-review.md 模板 SHALL 指引 agent 从 design.md 的「代码设计预览」section 提取内容，使用 highlight.js 语法高亮渲染代码块，对 diff 代码块添加绿色/红色行背景。

#### Scenario: Diff 代码块渲染

- **WHEN** design.md 包含 ```diff 代码块
- **THEN** human-review.html SHALL 渲染为带有 `.diff-add`（绿色背景）和 `.diff-remove`（红色背景）行样式的代码块

#### Scenario: 普通代码块渲染

- **WHEN** design.md 包含普通代码块（非 diff）
- **THEN** human-review.html SHALL 使用 highlight.js 语法高亮渲染
