# Lite Workflow Specification

## Purpose

定义 `lite` 的共享 brainstorm、结果任务、当前 Agent 实施和快速归档契约。

## Requirements

### Requirement: Lite MUST 使用 brainstorm → tasks 规划链

`lite` MUST 只定义 `brainstorm` 与 `tasks` 两个 planning artifact；tasks MUST 依赖 brainstorm，Apply MUST 依赖并跟踪 `tasks.md`。

#### Scenario: 新建 Lite change

- **WHEN** OpenSpec 使用 `lite` 创建 change
- **THEN** status SHALL 按 `brainstorm → tasks` 解锁，且 `applyRequires` SHALL 只包含 `tasks`

#### Scenario: 检查 Lite 文件集合

- **WHEN** Lite change 达到 apply-ready
- **THEN** change MUST NOT 要求 design、specs、verify 或 retrospective artifact

### Requirement: Brainstorm MUST 保留实施所需决策

`brainstorm.md` MUST 按需记录目标、现状、范围、方案方向、影响、约束、风险、验收和流程选择；内容完整性 MUST NOT 受字符数或章节数限制，文档长度 MUST NOT 作为升级 Full 的信号。

#### Scenario: 已有热上下文

- **WHEN** 同一 Agent 仍可靠持有已确认调查和决策
- **THEN** Agent SHALL 直接复用，不得仅为生成 artifact 重复调查或重读交付物

#### Scenario: Brainstorm 内容较长

- **WHEN** 清楚表达范围、方案和验收需要较多文字
- **THEN** Agent SHALL 保留必要信息，并只按已确认风险判断是否建议 Full

### Requirement: Tasks MUST 面向可验证结果

每个 task checkbox MUST 对应一个可独立验证的结果，并按需给出主要范围与验证方式；同一结果的代码、测试、配置和文档 SHOULD 合并，不得强制逐文件微步骤、RED/GREEN 阶段、覆盖矩阵、执行 mode、commit 字段或任务数上限。

#### Scenario: 从 brainstorm 生成 tasks

- **WHEN** Agent 将已确认 brainstorm 转为实施清单
- **THEN** 每个 checkbox SHALL 描述完成后的可观察结果和验证方法

### Requirement: Lite Apply MUST 由当前 Agent 轻量执行

Lite Apply MUST 由当前 Agent 顺序实施，保护既有工作区修改，运行邻近验证，并只在验证通过后勾选任务。TDD、worktree、实现 subagent、独立 review 和 commit MUST NOT 成为默认门禁。

#### Scenario: 普通 Lite 实施

- **WHEN** 变更验证充分且未命中审查风险
- **THEN** Agent SHALL 完成最小实现、邻近验证和低成本 diff 自审

#### Scenario: 命中审查风险

- **WHEN** 变更影响共享核心或跨模块行为、测试证据较弱、实现不确定、diff 超出 brainstorm，或用户/项目要求审查
- **THEN** Agent SHALL 使用 `review-orchestrator` 做一次快速审查，并只定向复审阻断修复

#### Scenario: 验证失败

- **WHEN** 某项任务的验证仍失败
- **THEN** Agent MUST 保持任务未勾选、报告恢复点并停止 Apply

### Requirement: Lite 成功后 MUST 快速归档并停止交付动作

全部任务通过后，Lite Apply MUST 使用普通 OpenSpec archive 自动归档，不生成 Full Verify 或 retrospective。归档后 commit、push、PR 和清理 MUST 分别由用户显式选择，默认停止。

#### Scenario: 最后一项任务完成

- **WHEN** 最后一项任务已验证并勾选
- **THEN** Agent SHALL 执行 `openspec archive "<name>" -y` 并报告结果

#### Scenario: 归档完成但用户未选择交付动作

- **WHEN** Lite archive 成功
- **THEN** Agent MUST NOT 自动 commit、push、创建 PR 或清理工作区
