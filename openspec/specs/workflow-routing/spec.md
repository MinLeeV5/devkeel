# Workflow Routing Specification

## Purpose

定义开发请求在专项 skill、Direct、Lite 与 Full 之间的成熟度分流、持久化判断、风险
升级和最低质量基线。

## Requirements

### Requirement: 写入操作 MUST 经过目标绑定的明确授权

Agent MUST 按独立目标和可执行子请求分别判断权限。用户明确要求修改、创建、实现、修复、删除、
保存或其他持久化动作，或明确认可最近一条仍清晰且写明动作与范围的实施方案时，才可对相应目标
授权。评价、问题、建议、可能性或只确认方向 MUST 保持只读；同一请求中一个目标的授权 MUST NOT
扩散到其他子句。会改变状态的 L0 操作同样 MUST 经过本门禁。

#### Scenario: 带文件路径的模糊反馈

- **WHEN** 用户指出文件可能需要改善，但没有要求执行修改
- **THEN** Agent MUST 保持只读并按需进入 Brainstorming，不得创建 change 或修改文件

#### Scenario: 认可具体实施方案

- **WHEN** 最近方案明确写出持久化动作与范围且用户明确认可
- **THEN** Agent SHALL 只对该方案中的目标和动作授权，不得依赖固定确认词

#### Scenario: 混合请求只授权一个目标

- **WHEN** 用户明确要求修复 A，同时只表示 B 也许可以优化
- **THEN** Agent MUST 只修改 A，B 继续保持只读

### Requirement: 普通开发请求 MUST 按输入成熟度完成共同设计

未被显式专项 skill 或 L0 接管的开发请求，Agent MUST 先检查目标、关键做法、边界和验证是否存在
会改变实施结果的 gap。输入明确时 SHALL 直接采用，不重复 brainstorm；成熟方案 SHALL 只做基于
仓库事实的 Gap Check；探索输入 SHALL 进入 Brainstorming 单题访谈。达到 95%、O 为 0 时 MUST
展示全部 D/A 快照并等待用户确认，确认后才可视为实施准备完成。

#### Scenario: 精确原子请求

- **WHEN** 用户已经明确目标、动作、范围和验证且仓库调查没有发现实质 gap
- **THEN** Agent SHALL 采用该输入，不得为流程形式制造替代方案或重复提问

#### Scenario: 成熟方案仍有关键缺口

- **WHEN** Gap Check 发现一个会改变结构、行为或维护方式的未知
- **THEN** Agent MUST 进入 Brainstorming，并且每轮只确认一件事

#### Scenario: 热上下文已有决定

- **WHEN** 用户已经确认 D/A 且没有新证据改变它们
- **THEN** Agent MUST 复用这些决定，不得在路由或 artifact 阶段再次发散

### Requirement: 专项 skill MUST 使用自身流程

用户显式调用某个专项 skill 或 Agent 判定请求命中 L0 时，对应 skill MUST 接管请求，不重复套用
普通开发的成熟度门禁。纯只读的回答、解释、审查或状态报告 MUST 使用对应只读流程，不选择 L1
写入模式。

#### Scenario: 用户显式调用 OPSX

- **WHEN** 用户执行 `/opsx:new`、`/opsx:continue` 或其他 OPSX 入口
- **THEN** 对应 skill SHALL 按自身授权与语义门禁执行

#### Scenario: 用户只要求解释

- **WHEN** 请求不包含持久化动作
- **THEN** Agent MUST NOT 仅为了完成流程而选择 Direct、Lite 或 Full

### Requirement: 开发请求 MUST 按持久化价值渐进路由

获得写入授权并完成适用共同设计后，Agent MUST 依据当前会话是否能闭环、是否有跨会话恢复、交接、
并行或审计价值，以及风险选择 `direct`、`lite` 或 `full`。不得按文件数、模块数或
交付项数量计分；Direct 与 Lite 边界不明确时 SHALL 偏向 Direct。明确的低风险 Direct SHALL 直接
执行；路由边界不清或出现持久化、外部契约协调、高后果且难回退的风险信号时 SHALL 加载只读
`workflow-routing` skill。

#### Scenario: 当前会话可以闭环

- **WHEN** 可以在当前会话完成必要调查、最小修改和邻近验证
- **THEN** Agent MUST 使用 Direct，且不得创建 OpenSpec change

#### Scenario: 需要轻量持久化协调

- **WHEN** 存在真实恢复、交接、并行或审计价值且没有 Full 风险
- **THEN** Agent SHALL 说明价值、取得用户同意后选择 Lite

#### Scenario: 用户拒绝持久化

- **WHEN** 用户不接受从 Direct 升级到 Lite
- **THEN** Agent MUST 停在用户接受的范围，不创建 change 或扩展实现

#### Scenario: 明确 Direct 不加载完整路由算法

- **WHEN** 当前会话闭环条件明确且没有持久化或治理信号
- **THEN** Agent SHALL 使用 AGENTS 中的紧凑路由直接执行，不加载 `workflow-routing`

### Requirement: Direct 升级 Lite MUST 保留有效工作

Direct 实施中出现持久化协调需求时，Agent MUST 询问用户是否持久化为 Lite。用户同意后 SHALL
保留已有调查和代码，把热上下文无损映射为 Living brainstorm，并且只有已经验证的工作才可登记为
完成；不得重新讨论已确认决定。

#### Scenario: 用户接受 Direct 升级

- **WHEN** Direct 中途需要跨会话恢复且用户同意创建 Lite
- **THEN** Agent SHALL 在同一上下文建立 change，并保留调查、代码与验证证据

### Requirement: Full 建议 MUST 由风险触发并经用户确认

除用户显式选择 Full 外，Agent 只有在同时存在外部控制的消费者、可观察契约的语义或形状变化、
以及协调、版本、迁移或回滚成本时，或变更具有难以简单代码回退的数据丢失、安全/合规或大范围故障
严重后果时，才可建议 Full。Agent MUST 说明风险并等待确认；仅触及 API、CLI 或数据库代码不是
Full 信号。用户拒绝时 SHALL 继续 Lite 并记录决定。

#### Scenario: 外部契约产生协调成本

- **WHEN** 三项外部契约风险同时成立
- **THEN** Agent MUST 建议 Full、说明依据并等待用户确认

#### Scenario: 只有技术名词命中

- **WHEN** 修改 API 或数据库内部实现但没有外部协调成本
- **THEN** Agent MUST NOT 自动升级 Full

### Requirement: Lite 升级 Full MUST 保留同一 change

已有 Lite change 后确认 Full 风险时，Agent MUST 原地升级，不得新建 change。升级 SHALL 保留
Living 决定、代码和验证证据，按当前 Full schema 补齐 `applyRequires` 并重审 tasks；只保留有
当前验证证据的完成项。selector 切换或校验失败时 MUST 回滚并报告恢复点。

#### Scenario: tasks 阶段升级

- **WHEN** Lite 已有 tasks 或实现且用户确认 Full
- **THEN** Agent SHALL 在同一 change 补齐 Full planning，并在完成前阻止 Apply

### Requirement: Direct 与 Lite 最低质量基线 MUST 保持轻量

Direct 和 Lite MUST 完成必要调查、最小实现、对应验证、低成本 diff 自审和完成证据。worktree、
subagent、TDD、独立 code review 和 commit MUST NOT 成为默认门禁；TDD MAY 在有稳定测试接缝或
项目要求时使用，review MAY 按实际风险触发，worktree/subagent MAY 按用户或项目要求使用，commit
MUST 只在用户明确选择后路由到对应 L0 skill。

#### Scenario: 普通低风险任务

- **WHEN** 项目规则和风险没有额外要求
- **THEN** Agent MUST NOT 强制 worktree、subagent、TDD、独立 review 或 commit

### Requirement: AGENTS MUST 只保留跨入口门禁与按需路由索引

根 `AGENTS.md` 与分发模板 MUST 保留指令优先级、写入授权、L0 skill 索引、L1 触发条件、OpenSpec
跨流程边界和完成证据要求。Brainstorming 的 D/A/O、置信度与快照算法，OpenSpec 的结构状态、
`applyRequires`、迁移与恢复算法，以及 Direct/Lite/Full 的升级事务 MUST 由对应 skills 或 schema
承载，不得在 AGENTS 中重复展开。

#### Scenario: 加载普通项目会话

- **WHEN** Agent 首次读取根 AGENTS
- **THEN** 它 SHALL 能决定是否加载专项 skill、`brainstorming` 或 `workflow-routing`，但无需同时
  加载未命中的完整工作流算法
