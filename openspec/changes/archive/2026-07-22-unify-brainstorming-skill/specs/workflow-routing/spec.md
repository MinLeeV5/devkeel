## ADDED Requirements

### Requirement: 写入操作 MUST 经过明确授权

Agent MUST 按独立目标和可执行子请求分别判断权限。只有用户以动作指令明确要求修改、创建、
实现、修复、删除、保存、提交或其他持久化操作，或明确认可最近一条仍清晰有效且同时包含具体
持久化动作与范围的实施方案或授权询问时，Agent 才 SHALL 为相应动作和目标授予写入权限。认可
SHALL 按上下文语义判断，不得依赖固定词表。评价、感受、建议、
可能性表达、问题陈述或单独列出文件路径 MUST 视为未授权，即使同一请求中的其他子句已经授权；
当这类表达需要讨论意图或设计时，Agent SHALL 自动进入只读 `brainstorming`。对未写明具体
持久化动作与范围的方向、目标或验收形成共同理解 MUST NOT 自动扩大为写入授权。任何会改变
本地或外部状态的 L0 专项操作也 MUST
经过本门禁；只读专项能力不需要写入授权。

#### Scenario: 带文件路径的模糊反馈

- **WHEN** 用户列出相关模板并表示内容可能缺少信息、可增加图表或需要改善可读性，但没有要求执行修改
- **THEN** Agent MUST 保持未授权状态并进入只读 brainstorming，不得修改文件或创建 change

#### Scenario: 明确要求执行修改

- **WHEN** 用户明确要求 Agent 按指定目标修改或实现相关文件
- **THEN** Agent SHALL 在该明确范围内授予写入权限，并继续执行任务分流

#### Scenario: 认可具体实施方案或授权询问

- **WHEN** Agent 最近一条仍清晰有效的消息写明具体持久化动作与范围，用户明确认可该实施方案或授权询问
- **THEN** Agent SHALL 只为对应方案写明的动作与范围授予写入权限

#### Scenario: 只认可不具体的方向或验收

- **WHEN** 用户认可某个方向、目标或验收结论，但最近上下文没有写明具体持久化动作与范围
- **THEN** Agent MUST 只记录相应决定并保持未授权状态

#### Scenario: 混合请求包含已授权和模糊目标

- **WHEN** 用户明确要求修复 A，同时只表示 B 也许可以优化
- **THEN** Agent MUST 只对 A 授权，B SHALL 保持只读且不得因 A 的授权被一并修改

#### Scenario: L0 专项能力会改变状态

- **WHEN** 缺陷管理、动态插桩、提交或其他 L0 操作将改变本地文件或外部状态，但相应目标尚未授权
- **THEN** Agent MUST NOT 执行其写入动作，并 SHALL 保持只读或取得明确授权

#### Scenario: 讨论已经达成共识

- **WHEN** brainstorming 已确认推荐方向，但用户尚未发出执行动作指令，也未明确认可写明具体持久化动作与范围的实施方案
- **THEN** Agent MUST 保持只读，不得把共识视为实施授权

## MODIFIED Requirements

### Requirement: 开发请求 MUST 渐进路由到三档流程

Harness 的执行契约 MUST 只在开发请求已经获得明确写入授权后，将其路由到 `direct`、
`lite` 或 `full`，并以是否需要持久化协调和已确认风险为依据，不得按文件数或
交付项数量机械计分。Direct 与 Lite 的默认倾向 MUST NOT 越过写入授权门禁。

#### Scenario: 请求尚未获得写入授权

- **WHEN** 用户只表达评价、建议、可能性或讨论意图，没有明确要求执行持久化动作
- **THEN** Agent MUST NOT 进入三档写入流程，并 SHALL 按授权契约保持只读

#### Scenario: 明显无需持久化协调

- **WHEN** 已授权请求能在当前会话内完成必要调查、最小修改和邻近验证
- **THEN** Agent MUST 使用 direct，且不得创建 OpenSpec change

#### Scenario: 不是明显 direct 且没有 full 风险

- **WHEN** 已授权请求需要简短的跨步骤协调，但不满足 full 建议条件
- **THEN** Agent MUST 默认选择 `lite`

#### Scenario: direct 与 lite 边界不明确

- **WHEN** 写入授权已成立，且 Agent 无法明确证明请求需要持久化协调
- **THEN** Agent SHALL 偏向 direct
