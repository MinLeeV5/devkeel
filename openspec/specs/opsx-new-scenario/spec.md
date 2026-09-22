# opsx-new-scenario Specification

## Purpose

验证 `/opsx:new` 默认创建 Lite change、初始化 Draft Living brainstorm，并停在一次一个问题的共同
设计阶段；显式 Full selector 仍须被保留。

## Requirements

### Requirement: opsx:new MUST 初始化 Living brainstorm

测试场景 MUST 验证 Agent 调用 `openspec-new-change`、OpenSpec new、status 和 brainstorm 动态
instructions，并写入 `brainstorm.md`。状态 MUST 为 `DRAFT`，输入中明确的信息 MAY 成为 D 项，
但 design、specs 和 tasks MUST NOT 在同一轮生成。

#### Scenario: 带可命名主题创建默认 change

- **WHEN** 在已 init fixture 中执行 `/opsx:new "add-user-auth"`
- **THEN** Agent SHALL 创建 `lite` change、写入 Draft Living brainstorm，并提出下一道问题

### Requirement: opsx:new MUST 服从显式 Full selector

`/opsx:new` MUST 保留用户显式选择的 `full` selector，不得因默认 Lite 或尚未完成共同设计而
重新分级。

#### Scenario: 用户显式选择 Full

- **WHEN** 用户执行 `/opsx:new "explicit-full" --schema full`
- **THEN** change selector SHALL 为 `full`，且仍只初始化 Living brainstorm
