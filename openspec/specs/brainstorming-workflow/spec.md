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

### Requirement: Brainstorming MUST 展示有依据的置信度

topic-only 状态 SHALL 展示边界置信度，衡量目标、主要边界和持久化价值是否清楚；change-draft
状态 SHALL 展示实施准备度，衡量共同上下文是否足以安全生成 Apply 前置 artifacts。置信度 MUST
按 5% 取值，依据当前阶段最关键的未闭合缺口选择证据分档，不得按轮数、决定数量或 O 项数量加分，
也不得把 90% 作为尚未完成时的默认值。数值不代表成功概率、工作完成比例或用户授权。

边界置信度 SHALL 区分目标或范围不清（0–55%）、主要范围或职责待定（60–75%）、主要边界明确但
仍有边界决定（80–85%）、仅剩局部确认（90%）、边界问题闭合且可判断下一路径（95%）。
实施准备度 SHALL 区分主方案未形成或可行性冲突（0–55%）、核心链路或必需外部能力未证实
（60–75%）、主要契约、恢复或验证方案未闭合（80–85%）、主要方案与契约闭环且仅剩局部决定
（90%）、无阻塞 O 且可确认完整快照（95%）。更低档的关键缺口 MUST 限制当前分数，档内依据不足
时 SHALL 取较低值。证据足以支持方案选择即可，不要求提前完成实现或全部联调。

阶段切换 MUST 按新指标重新评估，不继承旧分数或把两种指标展示为同一涨跌轨迹。范围扩大、新增
依赖或假设被推翻时 MUST 重估受影响缺口，原分档不再满足时 MUST 降档。同阶段调分 MUST 有新证据
或决定依据，允许保持或下降；每轮 SHALL 说明本轮闭合项、分档依据、最大未决项及其阻塞性，分数
不变时也 MUST 说明进展与限制升档的缺口。没有新闭合项或阻塞项时 SHALL 如实说明。

数值 MUST NOT 单独决定推进。存在会改变结构、可观察行为或维护方式的开放决定时，实施准备度
MUST NOT 达到 95%；100% 仅表示用户已确认完整快照，不用于 topic-only。

#### Scenario: 边界明确后进入 change-draft

- **WHEN** 边界置信度为 90%，进入 change-draft 后仍有必需外部能力未证实
- **THEN** Agent MUST 重新评估实施准备度并限制在 75% 及以下，说明新指标依据，不沿用边界分数

#### Scenario: 大量决定已确认但主要契约未闭合

- **WHEN** 已确认多项页面与业务决定，核心可行性有依据，但后端幂等、恢复等主要契约仍待确定
- **THEN** Agent MUST 将实施准备度限制在 85% 及以下，不因决定数量增加而声明 90%

#### Scenario: 只剩影响有限的局部决定

- **WHEN** 主要方案与契约已闭环，仅剩影响有限的局部决定
- **THEN** Agent MAY 声明实施准备度为 90%，并说明该决定是否阻塞快照，不将局部确认视为全部完成

#### Scenario: 已明确的验证留待实施后执行

- **WHEN** 方案选择已有充分证据，验证方式已明确，仅相关实现与测试尚未执行
- **THEN** Agent MUST NOT 仅因此压低准备度或新增阻塞 O；可能推翻主方案的未知能力仍 MUST 作为阻塞

#### Scenario: 局部问题闭合但评分不变

- **WHEN** 本轮确认页面刷新策略，但核心任务能力仍未证实，实施准备度保持 75%
- **THEN** Agent MUST 说明已闭合的刷新策略、仍限制升档的任务能力及下一项核对，不能只报分数不变

#### Scenario: 高分后范围扩大

- **WHEN** 实施准备度为 90% 后新增必须支持的外部能力，且尚无证据证明可用
- **THEN** Agent MUST 重估并降至 75% 及以下，说明新增依赖如何影响原方案

#### Scenario: 新答案推翻已有假设

- **WHEN** 用户回答暴露新的边界或推翻当前方案
- **THEN** Agent MUST 降低或重估置信度，并说明变化原因

#### Scenario: 仍有阻塞决定

- **WHEN** 当前存在未解决的 `O-*`
- **THEN** Agent MUST NOT 把实施准备度声明为 95% 或把状态声明为 `CONFIRMED`

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

- **WHEN** 边界置信度约为 80% 且 change 有真实恢复、交接、并行或审计价值
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

实施准备度达到 95%、没有 O 项且目标、边界、行为、方案与验证闭环时，Agent MUST 列出全部当前
有效 D/A，每项一句话，并只询问是否确认该完整快照。用户明确确认后才可将状态改为 `CONFIRMED`
并将准备度视为 100%；不得把调用 `/opsx:ff` 或 artifact 文件存在视为确认。

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
- **THEN** Agent SHALL 返回当前置信度和一个下一问题，不创建 change

#### Scenario: 探索现有 Draft change

- **WHEN** 用户明确选择一个 Living brainstorm 为 `DRAFT` 的 change
- **THEN** Agent MAY 继续 change-draft 单题访谈，但不得生成下游 artifact
