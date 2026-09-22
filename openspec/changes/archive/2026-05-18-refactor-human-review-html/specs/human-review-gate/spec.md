## MODIFIED Requirements

### Requirement: human-review.html SHALL use a Dashboard + 2 chapter structure

human-review.md 模板 SHALL 指引 agent 生成以下章节结构（替代原 6 章）：

1. Dashboard 总览（architecture-diagram SVG + 摘要 + 风险 + 任务概览）
2. 01 需求与设计（brainstorm TL;DR + 目标用户 + design 架构图 + 决策 + 代码设计预览）
3. 02 实现任务（tasks.md checkbox 列表）
4. Artifact 原文查看器（标签页 + marked.js）
5. 验收指引（/opsx:apply 命令）

#### Scenario: 去除独立的现状调查章节

- **WHEN** 检查生成的 human-review.html
- **THEN** SHALL 不包含独立的「02 现状调查」章节（explore.md 内容仅通过 Artifact 查看器可访问）

#### Scenario: 去除独立的变更提案章节

- **WHEN** 检查生成的 human-review.html
- **THEN** SHALL 不包含独立的「04 变更提案」章节

#### Scenario: 去除独立的规格清单章节

- **WHEN** 检查生成的 human-review.html
- **THEN** SHALL 不包含独立的「05 规格清单」章节（无 Requirement 卡片 + Scenario 块）

### Requirement: human-review.md template SHALL include marked.js CDN

human-review.md 的 CDN 依赖 section SHALL 新增 marked.js 引用。

#### Scenario: CDN 列表包含 marked.js

- **WHEN** 读取 human-review.md 模板的 CDN 依赖 section
- **THEN** SHALL 包含 `https://cdn.jsdmirror.com/npm/marked/marked.min.js` 引用

### Requirement: schema.yaml version SHALL be bumped to 5

修改 schema.yaml 后，version 字段 SHALL 从 4 升级为 5。

#### Scenario: 版本号一致性

- **WHEN** 读取 `templates/openspec/schemas/superpowers-bridge/schema.yaml`
- **THEN** `version` 字段 SHALL 为 `5`

#### Scenario: 项目内副本同步

- **WHEN** 读取 `openspec/schemas/superpowers-bridge/schema.yaml`
- **THEN** `version` 字段 SHALL 同样为 `5`

### Requirement: schema.yaml human-review instruction SHALL reflect new structure

schema.yaml 中 human-review artifact 的 instruction SHALL 更新为：收集所有 .md → 生成 Dashboard + 2 章 + Artifact 查看器结构的 HTML。

#### Scenario: instruction 引用新章节

- **WHEN** 读取 schema.yaml 的 human-review instruction
- **THEN** SHALL 描述 Dashboard + 需求与设计 + 实现任务 + Artifact 查看器的生成流程，而非旧的 6 章结构
