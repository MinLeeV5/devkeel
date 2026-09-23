# Brainstorming Workflow Specification

## Purpose

规定 DevKeel 如何通过成熟度分流、单题访谈和 Living Artifact 与开发者共同完成一次且唯一的设计
过程，并在需要持久化协调时把热上下文无损迁入 OpenSpec。

## Requirements

### Requirement: Brainstorming MUST 按输入成熟度选择讨论深度

Agent MUST 先调查仓库中可查明的事实，再区分早期想法、已有方案与已经明确的请求。早期想法
SHALL 从方向探索开始；已有方案 SHALL 只检查高影响缺口；目标、方案和验收均明确时 SHALL 紧凑
核验，不得为了满足流程重新发散。

#### Scenario: 用户提供成熟方案

- **WHEN** 用户已经说明目标、实现方向、边界和验收方式
- **THEN** Agent MUST 只检查会改变实施结果的缺口，不得重新生成另一份设计

#### Scenario: 答案可由仓库确定

- **WHEN** 代码、配置、测试或现有文档能够回答某个问题
- **THEN** Agent MUST 先调查并引用事实，不得把该事实反问用户

### Requirement: Brainstorming MUST 每轮只处理一个决定

Agent MUST 选择当前 `影响 × 不确定性` 最高的一项 gap，说明其重要性，提出一个问题，并给出推荐
答案、推荐依据和主要代价；存在多个合理选项时，MUST 紧凑列出选项并明确标注推荐项。Agent MUST
等待用户回答后再提出依赖于该答案的下一题；简单决定可以有多轮，不得用问题清单或长篇方案一次性
转移认知负担。

#### Scenario: 多个缺口同时存在

- **WHEN** 调查发现多个需求或技术缺口
- **THEN** Agent SHALL 只询问当前最关键的一项，并在回答后重新计算下一项

#### Scenario: 当前问题存在多个合理选项

- **WHEN** 当前单题存在多个可行答案
- **THEN** Agent MUST 紧凑列出选项、明确推荐项，并说明推荐依据与主要代价

#### Scenario: 用户回答仍有歧义

- **WHEN** 回答无法唯一确定当前决定
- **THEN** Agent MUST 继续澄清同一件事，不得把猜测持久化为用户决定

### Requirement: Brainstorming MUST 展示讨论阶段与关键缺口

Brainstorming SHALL 使用“探索中 / 收敛中 / 可确认”三个阶段，以当前工作状态的关键缺口判断：
目标、范围、主方向或核心可行性仍不明确时为探索中；主方向已有依据、仍有影响结果的决定时为
收敛中；当前讨论目标闭合且没有阻塞开放项时为可确认。阶段 MUST NOT 代表用户授权。

topic-only 的闭合范围 SHALL 是目标、主要边界和下一路径；change-draft SHALL 额外满足完整快照
确认条件。Agent MUST 每轮用一行“阶段 · 关键缺口”提示位置与剩余决定，没有缺口时说明待确认
当前结论；仅在阶段或关键缺口变化时展开解释。Agent MUST NOT 用百分比、预计剩余轮数或已确认
决定数量衡量收敛距离。

切换工作状态、范围扩大、新增依赖或假设被推翻时，Agent MUST 按受影响缺口重新判断阶段，不沿用
旧结论。证据足以支持方案选择即可；已明确留待实施后执行的验证 MUST NOT 自动成为阻塞项，
但可能推翻主方案的未知能力 MUST 仍作为核心可行性缺口。

#### Scenario: 边界明确后进入 change-draft

- **WHEN** topic-only 已可确认，但进入 change-draft 后仍有必需外部能力未证实
- **THEN** Agent MUST 按核心可行性缺口重新判断为探索中，说明依据，不沿用原阶段

#### Scenario: 多项决定已确认但主要契约未闭合

- **WHEN** 核心可行性有依据，但后端幂等、恢复等主要契约仍待确定
- **THEN** Agent MUST 保持收敛中并说明关键缺口，不因决定数量增加而声明可确认

#### Scenario: 只剩影响有限的局部决定

- **WHEN** 主要方案已明确，仍有会改变结构、行为或维护方式的局部决定
- **THEN** Agent MUST 保持收敛中，说明剩余决定，不提前发起快照确认

#### Scenario: 已明确的验证留待实施后执行

- **WHEN** 方案选择已有充分证据，验证方式已明确，仅实现与测试尚未执行
- **THEN** Agent MUST NOT 仅因此阻止进入可确认或新增阻塞 O

#### Scenario: 阶段与关键缺口均未变化

- **WHEN** 本轮没有改变阶段或关键缺口
- **THEN** Agent SHALL 保留一行阶段提示，不重复展开评估

#### Scenario: 阶段不变但关键缺口变化

- **WHEN** 一个阻塞决定已闭合，下一项关键缺口浮现，阶段仍为收敛中
- **THEN** Agent SHALL 更新提示并说明闭合项与剩余缺口，不为展示进展强制切换阶段

#### Scenario: 已可确认后范围扩大

- **WHEN** 新增必需外部能力，且尚无证据证明可用
- **THEN** Agent MUST 重新判断为探索中，说明新增依赖如何影响原方案

#### Scenario: 仍有阻塞决定

- **WHEN** 当前存在未解决的 `O-*`
- **THEN** Agent MUST NOT 声明可确认或将状态声明为 `CONFIRMED`

### Requirement: 需求与技术 skills MUST 只作为 Brainstorming 探针

`requirement-analysis` 与 `technical-design` MAY 在 Brainstorming 中以 probe 模式发现需求、行为、
结构、契约、失败恢复、迁移和维护边界的候选 gap。它们 MUST NOT 在 probe 模式写报告、写 artifact
或替用户作决定。候选 gap 去重后，Brainstorming MUST 仍遵守单题访谈。

#### Scenario: 需要扩展需求视角

- **WHEN** 当前共同理解可能遗漏需求或技术维度
- **THEN** Brainstorming MAY 调用相应 probe，并只把最高价值 gap 转成下一道问题

#### Scenario: 已进入下游 artifact 投影

- **WHEN** Agent 正在生成 design、specs 或 tasks
- **THEN** Agent MUST NOT 调用 requirement-analysis、technical-design 或其他生成式设计 skill

### Requirement: Brainstorming MUST 默认保持 topic-only

普通讨论 SHALL 在聊天热上下文中维护决定且不得写文件。只有用户显式调用 `/opsx:new`，或 Agent
说明跨会话恢复、交接、并行协作或审计价值并得到同意后，才可进入 change-draft。文件数、复杂度
或“最好有文档”本身 MUST NOT 触发 OpenSpec。

#### Scenario: 当前会话可以闭环

- **WHEN** 讨论和后续实现可在当前会话内完成且没有持久化协调价值
- **THEN** Agent SHALL 保持 topic-only，并在确认实施方案后由外部契约选择 Direct

#### Scenario: 出现持久化价值

- **WHEN** 目标、主要范围与职责已明确，且 change 有真实恢复、交接、并行或审计价值
- **THEN** Agent SHALL 询问用户是否创建 OpenSpec change，不得静默创建

### Requirement: Living brainstorm MUST 是共同设计的唯一语义源

change-draft MUST 只维护 `brainstorm.md`，使用 `D-*` 记录用户明确确认的单项语义决定，使用 `A-*`
记录用户明确授予 Agent 的自主类别，使用 `O-*` 记录阻塞问题；仓库事实 MUST 保持可定位引用，不得
伪装成决定。正文 SHALL 使用纯 `#### D-03` 等标题，并用 `[D-03](#d-03)` 链接，不得插入 HTML
anchor 或额外元数据。

#### Scenario: 用户明确回答当前问题

- **WHEN** 回答无歧义地确认一项语义决定
- **THEN** Agent SHALL 更新一个对应 D/A、解决相关 O，并保持稳定编号

#### Scenario: 决定被替代

- **WHEN** 新回答改变已有决定
- **THEN** Agent MUST 只保留新决定为当前有效项，并在简短变更记录中链接替代关系

### Requirement: Living brainstorm MUST 使用复杂度驱动的阅读图

`brainstorm.md` SHALL 用“30 秒了解”提供目标、边界和完成信号的精简视图。存在多阶段、分支、
异步交互、状态流转或 3 个以上协作组件时，“一图读懂”MUST 使用一张最合适的 Mermaid
flowchart、sequenceDiagram 或 stateDiagram-v2；简单变更 SHALL 删除整个图区。图中有语义的节点
或消息 MUST 标出 D/A 编号，图后 MUST 链接最关键的决定；图表不得引入正文未确认的新语义。

#### Scenario: 复杂变更需要全局主线

- **WHEN** 已确认决定包含多阶段、分支、异步、状态流转或 3 个以上协作组件
- **THEN** Agent MUST 生成一张回答主要阅读问题的图，并使其语义可追溯到 D/A

#### Scenario: 简单变更不需要配图

- **WHEN** 一张图不能比 30 秒概要和决定列表更清楚地表达 change
- **THEN** Agent SHALL 删除“一图读懂”整个章节，不得生成装饰性图表

### Requirement: topic-only 到 change-draft MUST 无损且不重新发散

用户同意持久化后，Agent MUST 创建默认 Lite 或已明确选择的 Full change，并把热上下文中全部当前
有效 D/A/O 原样映射进 Living brainstorm。概要和主题分组 MAY 提升可读性，但 MUST NOT 改写含义、
补充最佳实践或重新询问已确认事项。映射回执 SHALL 只报告迁入数量、来源和下一项 gap。

#### Scenario: 已完成多轮 topic-only 讨论

- **WHEN** 用户同意把当前主题持久化
- **THEN** Agent MUST 在同一变更中保留现有编号和语义，初始化 `DRAFT` 后继续唯一的下一题

#### Scenario: 主题输入本身清楚

- **WHEN** 用户显式 `/opsx:new` 且输入包含无歧义的决定
- **THEN** Agent MAY 将这些输入直接记录为 D 项，但 MUST NOT 把 Agent 推测记录为 D 项

### Requirement: Living brainstorm MUST 经完整快照确认

没有 O 项、不存在会改变结构、可观察行为或维护方式的开放决定，且目标、边界、行为、方案与验证
闭环时，Agent MUST 进入可确认阶段，列出全部当前有效 D/A，每项一句话，并只询问是否确认该完整
快照。用户明确确认后才可将状态改为 `CONFIRMED`；不得把阶段标签、调用 `/opsx:ff` 或 artifact
文件存在视为确认。

#### Scenario: 用户确认完整快照

- **WHEN** 用户明确确认全部当前 D/A 且 O 为 0
- **THEN** 状态 SHALL 变为 `CONFIRMED`，状态行计数 MUST 与正文一致

#### Scenario: 用户修正快照

- **WHEN** 用户修改任何一项当前决定
- **THEN** 状态 MUST 保持或重置为 `DRAFT`，并继续单题访谈

### Requirement: 语义变化 MUST 使下游投影失效

任何改变目标、结构、可观察行为或维护方式的 D/A 变化 MUST 将 Living 状态重置为 `DRAFT`，并在
已有下游 artifact 时把下游状态设为 `STALE`。纯排版和链接修复 MAY 保持确认状态。下游文件 MUST
保留并原地重投影，不得通过删除文件掩盖漂移。

#### Scenario: Confirmed change 新增语义决定

- **WHEN** 用户要求修改已确认方案中的行为
- **THEN** Agent MUST 先重开共同设计，保留下游文件并标记 `STALE`

#### Scenario: 只修复 Markdown 链接

- **WHEN** 修改不改变任何 D/A 的含义
- **THEN** Agent MAY 保持 `CONFIRMED` 与当前下游状态

### Requirement: OPSX Explore MUST 复用 Brainstorming

`/opsx:explore` MUST 加载同一个 `brainstorming` skill。没有明确或唯一 active change 时 SHALL 保持
topic-only；已有 change 时 MAY 读取动态 OpenSpec 上下文，并且只有该 change 已获 change-draft 写入
授权时才能维护其 `brainstorm.md`。Explore MUST NOT 修改实现代码或下游 planning artifacts。

#### Scenario: 探索普通主题

- **WHEN** 用户通过 `/opsx:explore` 提供主题但没有选定 change
- **THEN** Agent SHALL 返回阶段与关键缺口提示；有 gap 时只问下一项，已闭合时总结并请用户确认，不创建 change

#### Scenario: 探索现有 Draft change

- **WHEN** 用户明确选择一个 Living brainstorm 为 `DRAFT` 的 change
- **THEN** Agent MAY 继续 change-draft 单题访谈，但不得生成下游 artifact

### Requirement: 旧百分比 Draft MUST 可延迟迁移

planning-state 检查器 MUST 将旧百分比状态行继续识别为 `DRAFT`，返回 `stage: null` 与
`needsStageMigration: true`，不根据旧分数推断讨论阶段或确认状态。Agent SHALL 在下一次维护该
brainstorm 时按实际缺口重新判断阶段并更新状态行，保留 D/A/O 和下游状态，不批量改写旧文件。
无 Living 状态行的旧文档 SHALL 继续走现有 LEGACY 迁移和用户确认流程。

#### Scenario: 恢复旧百分比 Draft

- **WHEN** 旧 brainstorm 使用百分比 DRAFT 状态行且下游为 CURRENT
- **THEN** 检查器 MUST 仍返回 DRAFT、提示阶段迁移且不允许 Apply，Agent MUST 按实际缺口重评

#### Scenario: 新阶段标签不代替确认

- **WHEN** brainstorm 为 DRAFT 且阶段为可确认，下游已为 CURRENT
- **THEN** 检查器 MUST NOT 允许 Apply；若仍有 O 项则 MUST 判为无效
