# OPSX Schema Routing Specification

## Purpose

规定 OpenSpec 作为 DevKeel 持久化协调层时的创建、语义确认、封闭投影、风险升级和生命周期门禁；
OpenSpec 的结构状态不得代替开发者对共同设计的确认。

## Requirements

### Requirement: OpenSpec MUST 只在需要持久化协调时启用

Agent MUST 依据跨会话恢复、交接、并行协作或审计价值判断是否建议 OpenSpec，而不是依据文件数、
模块数或表面复杂度。当前会话可闭环的工作 SHALL 使用 Direct；用户显式调用 `/opsx:*` 时 SHALL
尊重该入口的授权边界。

#### Scenario: 当前会话可以闭环

- **WHEN** 已确认工作能在当前会话完成调查、实现和邻近验证
- **THEN** Agent SHALL 使用 Direct 且不得创建 OpenSpec change

#### Scenario: 用户选择持久化

- **WHEN** 用户接受 Agent 的持久化建议或显式调用 `/opsx:new`
- **THEN** Agent SHALL 创建或恢复 change，并进入 Living brainstorm

### Requirement: 创建入口 MUST 默认 Lite 并初始化 Living brainstorm

`/opsx:new` MUST 服从显式 schema；未指定时 MUST 使用 `lite`。只有用户显式选择 Full，或
Agent 说明治理/高风险理由并获得确认后，才可使用 `full`。创建后 MUST 在同一轮根据动态
instruction 初始化 `brainstorm.md` 为 `DRAFT`、迁入热上下文中的 D/A/O，并只提出下一道问题。

#### Scenario: 无上下文调用 New

- **WHEN** 用户调用 `/opsx:new` 但主题不足以命名
- **THEN** Agent MUST 先只询问主题，不得创建空 change

#### Scenario: 带清晰主题调用 New

- **WHEN** 用户提供可命名主题且未指定 schema
- **THEN** Agent SHALL 创建 Lite change、初始化 Living brainstorm，并停止在单题访谈

#### Scenario: 用户显式选择 Full

- **WHEN** 用户通过输入明确选择 `full`
- **THEN** Agent SHALL 将 `--schema full` 传给 OpenSpec CLI

### Requirement: OpenSpec 结构状态 MUST 与 DevKeel 语义状态分离

OPSX skill MUST 使用 OpenSpec 1.12.x 返回的 `schemaName`、`artifacts[].status`、
`artifacts[].requires`、`isPlanningComplete`、`applyRequires`、动态路径和 instruction 管理依赖图；
同时 MUST 用共享 planning-state 检查器验证 Living 状态、D/A/O 计数和下游状态。OpenSpec 的 `done`
只表示文件存在，MUST NOT 被解释为共同设计已确认或允许 Apply。

#### Scenario: Draft brainstorm 已被 OpenSpec 标记 done

- **WHEN** 结构状态显示 brainstorm `done` 但 Living 状态为 `DRAFT`
- **THEN** Continue 与 FF MUST 回到 Brainstorming，不得生成下游 artifact

#### Scenario: Planning 结构完整但投影已陈旧

- **WHEN** `isPlanningComplete` 为 true 但下游状态为 `STALE`
- **THEN** Apply MUST 停止，并要求重新确认或重投影

### Requirement: Planning artifacts MUST 是语义封闭投影

design、specs 与 tasks MUST 只继承 Confirmed D/A、可定位仓库事实和机械转换；每项设计、契约或
任务 SHALL 链接其 D/A 来源。投影期间 MUST NOT 调用 requirement-analysis、technical-design 或
其他生成式设计 skill。若模板需要尚未确认且会改变结构、可观察行为或维护方式的选择，Agent MUST
停止写入当前 artifact，将 brainstorm 重置为 `DRAFT`、下游设为 `STALE`，并回到单题访谈。

#### Scenario: 模板章节没有语义来源

- **WHEN** 模板包含当前 Confirmed 决定不需要的可选章节
- **THEN** Agent SHALL 删除或留空该章节，不得为了完整性创造内容

#### Scenario: 投影发现新的设计选择

- **WHEN** 生成 artifact 需要用户尚未确认的结构或行为决定
- **THEN** Agent MUST 暂停投影并只询问该决定

### Requirement: Full design MUST 优先使用高价值 UML 视图

Full `design.md` 中，图能明显降低组件关系、参与者交互、状态生命周期、领域结构或数据关系的理解
成本时，Agent MUST 使用 1～3 张 Mermaid UML/结构图，每张只回答一个问题。交互、状态、类型和
实体关系 SHALL 分别优先使用 sequenceDiagram、stateDiagram-v2、classDiagram 和 erDiagram；
组件依赖 MAY 使用结构化 flowchart。图中语义 MUST 链接 D/A 来源，正文和表格 MUST NOT 重复图中
已经清楚表达的关系。简单设计 SHALL 删除整个图区。

#### Scenario: 已确认设计包含复杂交互或结构

- **WHEN** Full design 的既有决定能通过 UML/结构图显著降低理解成本
- **THEN** Agent MUST 选择最少且足够的图型，并在图后链接对应 D/A 结论

#### Scenario: 配图需要新增设计

- **WHEN** 生成完整图形需要推测尚未确认的组件、消息、状态或关系
- **THEN** Agent MUST 停止投影并回到 Brainstorming，不得为了图形完整而补充语义

### Requirement: Continue MUST 每次最多投影一个 artifact

`/opsx:continue` MUST 先检查 Living 状态。Draft 时 SHALL 继续一个问题；Confirmed 时 SHALL 按
`applyRequires` 依赖闭包选择第一个 ready artifact、读取其动态 instruction 并从磁盘重读依赖，
每次最多创建一个 artifact。全部 Apply 前置 artifact 完成且来源覆盖一致后 SHALL 把下游状态设为
`CURRENT` 并提示 Apply，不得提前生成 post-apply artifact。

#### Scenario: Draft change 执行 Continue

- **WHEN** 当前 brainstorm 为 `DRAFT`
- **THEN** Continue SHALL 只继续 Brainstorming，不创建 design、specs 或 tasks

#### Scenario: Confirmed Full change 执行 Continue

- **WHEN** Full 的下一个 ready artifact 是 design
- **THEN** Continue SHALL 只投影 design 并报告其 D/A 来源

### Requirement: FF MUST 是显式加速入口而非确认捷径

只有用户显式调用 `/opsx:ff` 时才可使用 Fast-forward。FF MAY 在 brainstorm 已 `CONFIRMED` 后循环
投影全部 Apply 前置 artifacts；在 Draft 时仍 MUST 一次只询问一个用户决定，并在本次调用停止。
调用 FF 本身 MUST NOT 把 DRAFT 改为 CONFIRMED，也 MUST NOT 授权 Agent 发明或确认决定。

#### Scenario: 用户对 Draft change 调用 FF

- **WHEN** 当前仍有一个需要用户回答的 O 项
- **THEN** FF MUST 只提出该问题并停止，不得创建下游 artifact

#### Scenario: 用户对 Confirmed change 调用 FF

- **WHEN** D/A 快照已明确确认且没有 O 项
- **THEN** FF MAY 封闭投影全部 Apply 前置 artifacts，完成后提示 Apply

### Requirement: Propose 快捷入口 MUST 退役

DevKeel 分发物 MUST NOT 提供 `/opsx:propose` command 或 `openspec-propose` skill。已有受管安装在
update 时 SHALL 只删除内容仍匹配 DevKeel 标记的旧资产；用户自定义路径或内容 MUST 保留。

#### Scenario: 更新旧 DevKeel 安装

- **WHEN** 旧的 propose skill 和 command 仍是 DevKeel 受管版本
- **THEN** update SHALL 删除对应目录、command 和 versions 键

#### Scenario: 旧 command 已被用户修改

- **WHEN** `.harness/commands/opsx/propose.md` 不再包含 DevKeel 受管标记
- **THEN** update MUST 保留该文件并报告冲突或跳过原因

### Requirement: Update MUST 先修订语义源再重投影已有文件

`/opsx:update` MUST 使用 Brainstorming 单题循环修改 Living D/A/O。任何语义变化 SHALL 重置为
`DRAFT` 并保留下游文件为 `STALE`；用户重新确认完整快照后，Update MAY 按拓扑原地重投影受影响且
已经存在的 planning artifacts，不得创建缺失 artifact、修改实现代码或逐 artifact 要求用户确认。

#### Scenario: 修改已确认行为

- **WHEN** 用户要求改变一个 Confirmed D 项
- **THEN** Update MUST 先完成单题决定和完整快照确认，再重投影受影响文件

#### Scenario: 必需 artifact 尚不存在

- **WHEN** 新决定需要一个尚未生成的 Apply 前置 artifact
- **THEN** Update SHALL 保持 build frontier 并提示 `/opsx:continue`

### Requirement: Lite 到 Full MUST 原地升级

已有 Lite change 命中外部契约协调或难回退严重风险时，Agent MUST 说明风险并取得用户确认。确认后
SHALL 在同一 change 切换 selector，保留 Living 决定、代码和验证证据，补齐 Full 强制投影并重审
tasks；用户拒绝时 SHALL 继续 Lite，不得创建第二个 change 或反复追问同一风险。

#### Scenario: tasks 阶段确认升级

- **WHEN** 用户确认将已有 Lite change 升级 Full
- **THEN** Agent SHALL 写入 promotion 标记、补齐 design/specs、重审 tasks，并只保留有证据的完成项

#### Scenario: 用户拒绝升级

- **WHEN** 用户理解风险但拒绝 Full
- **THEN** Agent SHALL 保持 Lite selector 并记录该决定

### Requirement: Apply MUST 同时满足结构与语义门禁

Apply MUST 要求 OpenSpec `applyRequires` 完成，以及 brainstorm 为有效 `CONFIRMED`、O 为 0、下游为
`CURRENT`。实施中发现新设计选择时 MUST 停止实现、把 brainstorm 重置为 `DRAFT` 并将下游设为
`STALE`。CLI 继续保持上游兼容；该语义保护 SHALL 由 `/opsx:*` skills 执行，不作为人工直接调用
`devkeel openspec *` 的强制 CLI 状态机。

#### Scenario: 人工直接调用 OpenSpec CLI

- **WHEN** 用户绕过 OPSX skill 直接运行结构命令
- **THEN** CLI MAY 按上游行为运行，但 DevKeel Agent MUST NOT 据此声称语义已确认

#### Scenario: Apply 发现新的维护选择

- **WHEN** 实施需要尚未确认且会改变维护方式的决定
- **THEN** Agent MUST 保留已完成证据并返回 Brainstorming，不得自行补设计

### Requirement: Schema 生命周期 MUST 遵守 OpenSpec 1.12 的 skip_specs

DevKeel MUST 精确锁定经测试的 OpenSpec 1.12.x 基线并采用其动态 instruction、`requires`、
`isPlanningComplete` 与 `skip_specs` 契约。Lite 没有 specs artifact 时，Sync 与 Archive MUST 尊重
`skip_specs`，不得扫描或同步 ad-hoc delta specs；Full SHALL 按 schema 同步正式 delta specs。

#### Scenario: Lite change 包含手工 specs 目录

- **WHEN** schema 返回 `skip_specs: true`
- **THEN** Sync/Archive MUST NOT 把该目录作为 Lite planning artifact 同步

#### Scenario: Full change 完成生命周期

- **WHEN** Full 的 tasks、当前实现 verify 和 Final Review 满足 schema 门禁
- **THEN** Archive SHALL 同步正式 specs、生成 retrospective 并归档，交付动作仍需另行授权

### Requirement: Legacy change MUST 延迟迁移

没有 Living 状态行的旧 change MUST 在首次 Continue、Update 或 Apply 时迁移，不得批量重写全部
active changes。Agent MUST 从现有 artifacts 提取 D/A/O 候选并让用户一次确认精简快照；确认后
根据下游是否忠实覆盖决定标记 `CURRENT` 或 `STALE`。

#### Scenario: 首次恢复旧 change

- **WHEN** planning-state 返回 `LEGACY`
- **THEN** Agent MUST 保留现有文件、展示 D/A/O 候选并等待用户确认，不得直接 Apply
