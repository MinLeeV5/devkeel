## ADDED Requirements

### Requirement: 开发请求 MUST 渐进路由到三档流程
Harness 的执行契约 MUST 将普通开发请求路由到 `direct`、`lite` 或 `full`，并以是否需要持久化协调和已确认风险为依据，不得按文件数或交付项数量机械计分。

#### Scenario: 明显无需持久化协调
- **WHEN** Agent 能在当前会话内完成必要调查、最小修改和邻近验证
- **THEN** Agent MUST 使用 direct，且不得创建 OpenSpec change

#### Scenario: 不是明显 direct 且没有 full 风险
- **WHEN** 请求需要简短的跨步骤协调，但不满足 full 建议条件
- **THEN** Agent MUST 默认选择 `lite`

#### Scenario: direct 与 lite 边界不明确
- **WHEN** Agent 无法明确证明请求需要持久化协调
- **THEN** Agent SHALL 偏向 direct

### Requirement: Lite 产物化前 MUST 完成关键决策
自动路由到 lite 时，Agent MUST 在创建 change 前讨论完会实质改变范围、技术方案或验收的未决事项；用户显式调用 `/opsx:new` 时 MAY 先创建脚手架再继续讨论。

#### Scenario: 存在关键未决事项
- **WHEN** 自动路由判定为 lite 且仍有关键方案分歧
- **THEN** Agent MUST 暂停产物生成并与用户讨论到确认

#### Scenario: 用户显式创建 change
- **WHEN** 用户明确调用 `/opsx:new` 且已提供可理解的主题
- **THEN** Agent MAY 立即创建 change 脚手架

### Requirement: Full 建议 MUST 由风险触发并经用户确认
除用户显式选择 full 或无上下文调用 `/opsx:new` 外，Agent MUST 先说明风险并取得用户确认后才能从 direct/lite 升到 `full`。

#### Scenario: 外部契约产生协调成本
- **WHEN** 同时存在外部控制的消费者、可观察契约语义或形状变化，以及协调、版本、迁移或回滚成本
- **THEN** Agent MUST 建议 full、说明命中原因并等待用户确认

#### Scenario: 仅修改 API CLI 或数据库内部实现
- **WHEN** 变更触及 API、CLI 或数据库代码，但没有外部控制消费者的协调成本
- **THEN** Agent MUST NOT 仅因技术名词而自动选择 full

### Requirement: Direct 中途升级 MUST 保留有效工作
direct 实施中发现范围实质扩大时，Agent MUST 先询问用户是否升级 lite；用户同意后 SHALL 保留已有调查和代码，且仅把已验证工作登记为完成。

#### Scenario: 用户同意升级
- **WHEN** direct 进行中出现持久化协调需求且用户同意升级
- **THEN** Agent SHALL 就地创建 lite change，并从现有上下文生成 brief/tasks

#### Scenario: 用户不同意升级
- **WHEN** 用户拒绝升级 lite
- **THEN** Agent MUST 停在用户接受的范围内，不得静默创建 change 或扩大实现

### Requirement: 默认执行基线 MUST 保持轻量
direct 和 lite MUST 只强制必要调查、最小范围实现、对应验证与完成前证据；worktree、subagent、TDD、独立 code review 和 commit 不得成为默认门禁。

#### Scenario: 普通低风险任务
- **WHEN** 请求没有专项风险且项目规则未另行要求
- **THEN** Agent MUST NOT 强制调用 worktree、subagent、TDD、review 或 commit 流程

#### Scenario: 明确原子操作或困难调试
- **WHEN** 用户明确请求提交、代码审查等原子操作，或问题确实需要动态插桩才能定位
- **THEN** Agent SHALL 调用对应专项 skill
