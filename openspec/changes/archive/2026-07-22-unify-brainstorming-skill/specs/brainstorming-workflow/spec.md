## ADDED Requirements

### Requirement: Brainstorming MUST 接管讨论而非明确执行请求

当用户明确要求头脑风暴、探索、比较或挑战方案时，Agent MUST 使用 `brainstorming`；当未授权的
模糊反馈需要澄清意图或设计时，Agent SHALL 由执行契约自动路由到该 skill。已经明确授权的实现、
修改或保存请求，以及对最近一条写明具体持久化动作与范围的实施方案或授权询问作出的明确认可，
MUST NOT 被 brainstorming 截获，而须交还执行契约逐目标选择写入流程。认可 MUST 按上下文语义
判断，不得依赖固定词表。

#### Scenario: 用户明确要求讨论

- **WHEN** 用户要求探索问题、比较候选或挑战已选方向，而非实施结果
- **THEN** Agent MUST 加载 brainstorming 并保持只读

#### Scenario: 用户明确要求实施

- **WHEN** 用户以动作指令明确要求实现已经确认的方案
- **THEN** Agent MUST NOT 重新强制 brainstorming，而 SHALL 进入授权后的任务分流

#### Scenario: 用户认可具体实施方案

- **WHEN** Agent 最近一条仍清晰有效的消息已写明具体持久化动作与范围，用户明确认可该实施方案或授权询问
- **THEN** Agent MUST 退出 brainstorming，并 SHALL 只按对应动作与范围进入任务分流

### Requirement: Brainstorming MUST 按问题成熟度自适应推进

`brainstorming` MUST 先进行事实梳理，建立目标、已知事实、外部未知和问题成熟度，再由 Agent
自动选择方向探索、方案比较或方案检验；目标或硬约束仍会改变方向时 SHALL 先进行问题界定，暂停
或结束时 MUST 轻量完成结论收束。Agent MUST NOT 强制依次执行所有阶段、凑固定数量的方案，
或在用户指定合理阶段时忽略该选择。

#### Scenario: 只有早期想法

- **WHEN** 用户只有未成形的问题或方向，没有真实候选方案
- **THEN** Agent SHALL 从方向探索推进，形成有意义的方向或下一项关键决定

#### Scenario: 已有多个真实候选

- **WHEN** 用户需要在多个候选之间作出选择
- **THEN** Agent SHALL 从方案比较推进，比较决定因素和代价，并给出推荐或条件式推荐

#### Scenario: 已有当前最优方案

- **WHEN** 用户已经选择方案或存在明显的当前最优方向
- **THEN** Agent SHALL 从方案检验推进，检查关键假设、失败路径、缓解措施和残余风险

#### Scenario: 讨论暂停或结束

- **WHEN** 本轮不再需要继续发散或用户准备转入其他动作
- **THEN** Agent MUST 汇总事实、候选与推荐、已确认决定、开放项，以及需要另行授权的下一步

### Requirement: Brainstorming MUST 保持问题边界与设计质量

主题横跨多个可独立交付部分时，Agent MUST 先拆清边界、依赖和先后关系，再聚焦当前问题。讨论
现有代码时，Agent MUST 先理解并遵循已有结构与约定，只提出直接服务当前目标的改进，不得顺带
重构；Agent SHALL 按实际需要设计，不预设尚未出现的功能，并使候选模块的职责、接口、依赖和
验证方式清楚。

#### Scenario: 主题包含多个独立部分

- **WHEN** 用户把多个可独立交付且存在依赖关系的部分作为一个主题提出
- **THEN** Agent MUST 先说明各部分边界、依赖和顺序，再聚焦当前需要讨论的部分

#### Scenario: 讨论现有代码的改进

- **WHEN** 当前目标只涉及现有代码的一部分
- **THEN** Agent MUST 遵循已有结构，只纳入服务当前目标且实际需要的改进，不得扩展为无关重构或超前功能

### Requirement: Brainstorming MUST 区分 Agent 推荐与用户决策

Agent SHALL 基于证据推荐当前最优候选并主动挑战其假设，但会改变目标、范围、验收标准、架构边界
或外部契约的实质决定 MUST 保留给用户确认。Agent MAY 自行采用不改变这些边界的低风险、可逆
默认值，并须说明该假设。

#### Scenario: 存在明显的当前最优候选

- **WHEN** 调查证据支持一个候选优于其他方向
- **THEN** Agent SHALL 明确推荐并说明依据，同时 MUST 保留涉及实质边界的决定等待用户确认

#### Scenario: 只缺少低风险实现细节

- **WHEN** 某项选择可逆且不会改变目标、范围、验收、架构边界或外部契约
- **THEN** Agent MAY 采用合理默认值并向用户说明，无需为了形式暂停讨论

### Requirement: Brainstorming 提问 MUST 连续且有决策价值

Agent MUST 先调查仓库中可查明的事实，只在外部决定会实质改变方向时提问。需要提问的一轮
SHALL 提出一至三个属于同一决策链、可基于当前信息同时回答的问题，并提供必要判断依据或推荐；
若后一个问题依赖前一个答案，Agent MUST 拆分轮次。没有真实未知时，Agent MUST NOT 为满足格式
而提问。

#### Scenario: 三项问题可同时回答

- **WHEN** 范围、主要使用者和成功标准属于同一决策链，且彼此不依赖前一项答案
- **THEN** Agent MAY 在同一轮提出这三个连续问题

#### Scenario: 后续问题依赖前答

- **WHEN** 候选方案取决于用户先确认的目标边界
- **THEN** Agent MUST 先确认目标边界，再在后续轮次讨论候选方案

#### Scenario: 答案可从仓库获得

- **WHEN** 文件、配置、历史实现或只读命令能够确定答案
- **THEN** Agent MUST 先调查并呈现证据，不得把该事实反问用户

### Requirement: Brainstorming MUST 保持严格只读

`brainstorming` MAY 搜索、读取、比较并运行不改变状态的检查，但 MUST NOT 修改代码、配置、文档或
OpenSpec artifact，不得创建 change、提交或执行其他持久化动作。仅形成讨论共识 MUST NOT 被解释为
写入授权；保存或实施结论必须退出 brainstorming，并由后续明确动作请求，或对写明具体持久化动作
与范围的实施方案或授权询问作出的明确认可，重新进入相应写入流程。

#### Scenario: 讨论形成完整方案

- **WHEN** Agent 与用户只就方向、目标或验收达成共识，尚无写明具体持久化动作与范围的方案被明确认可
- **THEN** Agent MUST 只收束讨论，不得创建 planning artifact 或开始实现

#### Scenario: 用户随后明确要求实施

- **WHEN** 用户在后续请求中明确要求修改、创建、实现、修复或保存具体结果
- **THEN** Agent SHALL 退出 brainstorming，并由执行契约重新检查授权和流程路由

### Requirement: OpenSpec 上下文 MUST 按条件加载

`brainstorming` MUST 仅在通过 `/opsx:explore` 调用、用户明确指定 change，或热上下文中存在 active
change 时加载同一 skill 内的 OpenSpec reference。topic-only 调用 MAY 按需检查可用 change 或进行
通用只读调查，但 MUST NOT 要求或虚构 change-specific 上下文；选定或唯一确定 change 后，Agent
SHALL 从 OpenSpec 返回结果解析真实动态根目录、现有 artifact 位置与 action context，不得硬编码
默认路径。仓库仅存在 `openspec/` 目录 MUST NOT 触发 CLI 或 OpenSpec 模式，且加载 reference 后仍须
遵守严格只读边界。

#### Scenario: 普通仓库讨论

- **WHEN** 请求没有 OPSX 入口、明确 change 或热 active change，即使仓库包含 `openspec/`
- **THEN** Agent MUST 使用通用 brainstorming，不运行 OpenSpec CLI

#### Scenario: OPSX topic-only 探索

- **WHEN** 用户通过 `/opsx:explore` 提供主题，但没有明确或可唯一确定的 change
- **THEN** Agent SHALL 保留 raw topic 并按需列出现有 change 或调查仓库，不得虚构 change 路径或创建 change

#### Scenario: 探索现有 change

- **WHEN** 用户明确 change 名称，或热上下文能唯一确定 active change
- **THEN** Agent SHALL 使用 OpenSpec 返回的动态根目录、现有 artifact 位置与 action context 调查，但不得更新任何 artifact

### Requirement: OPSX Explore MUST 复用唯一 Brainstorming skill

`/opsx:explore` MUST 保持可用，并 SHALL 将原始主题、明确 change 和可用热上下文传给
`brainstorming` 的 OpenSpec 模式。命令 MUST NOT 复制 brainstorming 算法、加载已退休的
`openspec-explore` skill，或提供用户批准后直接更新 artifact 的分支。

#### Scenario: 调用兼容入口

- **WHEN** 用户执行 `/opsx:explore` 并提供主题或 change
- **THEN** 命令 SHALL 加载 `brainstorming`，在严格只读边界内返回探索结果
