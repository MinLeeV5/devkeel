## ADDED Requirements

### Requirement: AGENTS MUST 为 OPSX 创建动作选择上下文对应的 schema
`/opsx:new`、`/opsx:propose` 和 `/opsx:ff` 保持上游通用内容；AGENTS MUST 支持 `lite` 与 `full`，用户显式指定 schema 时必须服从，有可理解上下文且未确认 full 时应选择 lite，无上下文时必须选择 full。

#### Scenario: 用户显式选择 lite 或 full
- **WHEN** 用户在命令输入中明确指定 `lite` 或 `full`
- **THEN** AGENTS SHALL 将对应 `--schema` 传给 OpenSpec CLI

#### Scenario: 有普通需求上下文
- **WHEN** 用户描述了非 direct 的普通需求且未命中已确认的 full 选择
- **THEN** AGENTS SHALL 使用 `--schema lite`

#### Scenario: new 没有需求上下文
- **WHEN** 用户调用 `/opsx:new` 但没有提供足以判断流程的上下文
- **THEN** AGENTS MUST 使用 `full`

### Requirement: AGENTS MUST 使 OPSX 后续动作服从 change 元数据
commands/skills 与 OpenSpec CLI 保持不变；AGENTS MUST 使 `/opsx:continue`、`/opsx:apply` 和 `/opsx:archive` 从 status/instructions 返回的 schemaName 和 artifact 信息驱动行为，不得用当前默认 schema 覆盖已有 change。

#### Scenario: 恢复已有 lite change
- **WHEN** 用户对 `.openspec.yaml` 指向 `lite` 的 change 调用 continue 或 apply
- **THEN** 命令 SHALL 执行 lite artifact 和生命周期规则

#### Scenario: 恢复迁移后的 full change
- **WHEN** 用户对由 `superpowers-lite` 迁移为 `full` 的 change 调用 continue 或 apply
- **THEN** 命令 SHALL 保持该 change 原有 artifact 与执行语义

### Requirement: Continue MUST 区分 artifact 完成与实现完成
当 `lite` 的 brief/tasks 已生成时，`/opsx:continue` MUST 提示进入 apply，不得因 `isComplete: true` 建议直接归档。

#### Scenario: Lite planning 已完成
- **WHEN** status 显示 lite artifact 全部 done 且 tasks 尚未实施
- **THEN** assistant SHALL 提示运行 `/opsx:apply <change-name>`

### Requirement: AGENTS MUST 按 schema 执行 Archive
AGENTS MUST 对 `lite` 使用普通 OpenSpec archive，且不增加 specs、verify、retrospective 和 finishing skill；对 `full` SHALL 保持原有归档契约。

#### Scenario: 手动归档 lite change
- **WHEN** 用户对已完成的 lite change 调用 `/opsx:archive`
- **THEN** AGENTS SHALL 使用 `openspec archive "<name>" -y`；lite 不生成 delta specs，因此无需 `--skip-specs`

#### Scenario: 归档 full change
- **WHEN** 用户对 `full` change 调用 `/opsx:archive`
- **THEN** 命令 SHALL 继续执行 full schema 所需的验证、回顾和交付流程

### Requirement: OPSX 用户入口 MUST 保持统一
Harness MUST 复用现有 `/opsx:*` 命令表达 lite/full 创建、恢复、实施和归档，不得为 lite 新增并行命令或强制专用 skill。

#### Scenario: 用户使用 lite 全流程
- **WHEN** 用户创建并实施 lite change
- **THEN** 用户 SHALL 只需使用现有 `/opsx:new|propose|continue|apply|archive` 入口
