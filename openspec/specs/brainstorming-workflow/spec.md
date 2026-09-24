# Brainstorming Workflow Specification

## Purpose

规定 DevKeel 如何通过讨论深度、成熟度分流、单题访谈和 Living Artifact 与开发者共同完成一次且
唯一的设计过程，并在需要持久化协调时把热上下文无损迁入 OpenSpec。

## Requirements

### Requirement: Brainstorming MUST 独立选择讨论深度

讨论深度 `lite` / `full` MUST 与工作流 schema、topic-only / change-draft 分别维护。选择顺序
SHALL 为用户当前明确指定、当前主题已记录深度、已选择工作流的同名默认值。没有这些输入时，
已有方案 SHALL 默认 Lite，明确要求探索方向、比较方案或挑战思路 SHALL 默认 Full，其他输入
SHALL 从 Lite 开始。用户 MAY 用自然语言覆盖；Agent 只有在歧义会明显影响讨论范围时才询问，
并 SHALL 在首次进入或深度变化时简短说明深度与依据。

Agent MUST 先调查仓库中可查明的事实，再区分早期想法、已有方案与已经明确的请求。早期想法
SHALL 从方向探索开始；已有方案 SHALL 以现有方向为起点，按当前深度检查；目标、方案和验收
均明确时 SHALL 复用充分依据，不得为了满足流程重新生成另一份设计。

#### Scenario: 用户提供成熟方案

- **WHEN** 用户已经说明目标、实现方向、边界和验收方式
- **THEN** Agent MUST 复用已有依据，完成当前深度的相关检查，不得重新生成另一份设计

#### Scenario: 尚未选择工作流

- **WHEN** 用户没有指定深度、没有当前主题深度，且没有选择工作流
- **THEN** Agent SHALL 根据讨论意图选择默认深度，不要求先创建 change 或选择 schema

#### Scenario: 用户覆盖工作流默认值

- **WHEN** 用户要求 Lite 工作流深入讨论，或 Full 工作流聚焦核验
- **THEN** Agent MUST 分别使用 Full 或 Lite 讨论深度，并保留原工作流的文档与治理要求

#### Scenario: 答案可由仓库确定

- **WHEN** 代码、配置、测试或现有文档能够回答某个问题
- **THEN** Agent MUST 先调查并引用事实，不得把该事实反问用户

### Requirement: 讨论深度 MUST 控制探索范围与收敛条件

Lite SHALL 围绕当前方向补齐关键缺口，按需定向调用探针；当前讨论目标闭合且没有阻塞决定时可
收敛。Full SHALL 主动检查相关假设、合理替代方向与风险，并在满足 Lite 条件之外完成需求和
技术双视角探查，允许复用仍有效的结果。两档 MUST 处理可能推翻主方案或影响关键验收的风险，
MUST NOT 用问题数量、调用次数、文档篇幅或全量维度清单衡量深度。

#### Scenario: Full 未发现高影响缺口

- **WHEN** 两类探查有仍适用的依据，当前讨论目标闭合且没有阻塞决定
- **THEN** Agent SHALL 直接收敛，不强制增加访谈轮次或生成替代方案

#### Scenario: Lite 发现关键风险

- **WHEN** Lite 调查发现会推翻主方案或影响关键验收的问题
- **THEN** Agent MUST 处理该问题，必要时定向调用探针，不因处于 Lite 而忽略风险

### Requirement: 讨论深度切换 MUST 保留有效上下文与范围控制

局部缺口 SHALL 在当前档位内解决，调用探针本身 MUST NOT 触发升级。需要明显扩大探索范围时，
Agent MUST 说明新证据与价值、建议切换并等待用户确认；用户主动切换时 SHALL 立即调整，保留
有效决定、调查和未解决的关键风险。Full 检查完成后 SHALL 直接收敛，无须先降为 Lite。
深度切换 MUST NOT 自动创建 change、修改 schema 或改变文档、实施与治理授权。

#### Scenario: Lite 定向调用技术探针

- **WHEN** 当前方案存在局部技术缺口，Agent 调用 technical-design 定向检查
- **THEN** 讨论 SHALL 保持 Lite，工作流路径不变

#### Scenario: 当前方向需要重新比较

- **WHEN** 新证据表明需要明显扩大探索范围
- **THEN** Agent MUST 提出切换建议，用户确认前不得按扩大的范围继续探索

#### Scenario: 用户要求缩小讨论深度

- **WHEN** 用户明确从 Full 切换 Lite
- **THEN** Agent SHALL 调整后续探查范围，但不得丢弃有效结论或隐去未解决的关键风险

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
确认条件。两种状态 MUST 完成当前讨论深度的相关检查后才可确认。Agent MUST 每轮用一行
“阶段 · 关键缺口”提示位置与剩余决定，没有缺口时说明待确认当前结论；仅在阶段或关键缺口变化时
展开解释。Agent MUST NOT 用百分比、预计剩余轮数或已确认决定数量衡量收敛距离。

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

Brainstorming SHALL 将讨论深度、目标与边界、已有 D/A、仓库依据及探查重点传给 probe。Lite
MAY 按需定向调用 `requirement-analysis` 或 `technical-design`；Full MUST 在收敛前完成双探针
检查，目标不清时先探查需求，方向具备依据后再深入技术。结果只有在结论可追溯且目标、边界和
事实依据仍适用、且覆盖当前深度的相关检查时才可复用；未覆盖或受影响部分 SHALL 补查，不每轮
重跑或仅凭调用记录认定完成。

需求探针 SHALL 根据深度聚焦当前目标、行为和验收缺口，或进一步检查问题定义、隐含假设、遗漏
场景与替代方向。技术探针 SHALL 根据深度聚焦当前方案的可行性和实现边界，或进一步检查技术
假设、替代路径、相关失败模式与维护代价；MUST 复用相关领域维度裁剪，不全量展开。

探针 MUST NOT 写报告、写 artifact、向用户提问或替用户作决定。候选项 MUST 包含证据、影响与
不确定性，并区分阻塞缺口和可选建议；没有缺口时 SHALL 返回简短检查结论与依据。可选机会 MUST
NOT 自动扩大范围或成为 O-*。已有决定只有在新证据揭示冲突或风险时才重新打开。候选 gap 去重后，
Brainstorming MUST 仍遵守单题访谈。独立 deliverable 模式 SHALL 保持原契约；未传探针深度时
SHALL 保持定向补缺。

#### Scenario: 需要扩展需求视角

- **WHEN** 当前共同理解可能遗漏需求或技术维度
- **THEN** Brainstorming MAY 调用相应 probe，并只把最高价值 gap 转成下一道问题

#### Scenario: Full 探查发现额外机会

- **WHEN** 探针发现仅在扩大范围后才有价值的改进
- **THEN** Agent SHALL 将其视为可选建议，不自动写入阻塞项或延迟当前方案收敛

#### Scenario: 复用先前有效探查

- **WHEN** 当前主题已有两类探查结论，目标、边界和依据仍适用
- **THEN** Full SHALL 复用这些结果，仅补查新增或受影响部分

#### Scenario: 从 Lite 定向补缺切换 Full

- **WHEN** 先前两类探针只完成 Lite 局部检查，用户现在选择 Full
- **THEN** Agent SHALL 复用已覆盖部分，补齐尚未检查的相关假设、替代方向与风险，不能只凭两类
  探针均已调用而认定 Full 检查完成

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
伪装成决定。正文 SHALL 使用纯 `#### D-03` 等标题，并用 `[D-03](#d-03)` 链接，决定标题不得
插入 HTML anchor 或额外元数据。

#### Scenario: 用户明确回答当前问题

- **WHEN** 回答无歧义地确认一项语义决定
- **THEN** Agent SHALL 更新一个对应 D/A、解决相关 O，并保持稳定编号

#### Scenario: 决定被替代

- **WHEN** 新回答改变已有决定
- **THEN** Agent MUST 只保留新决定为当前有效项，并在简短变更记录中链接替代关系

### Requirement: 讨论深度 MUST 可恢复且兼容旧记录

topic-only SHALL 仅在会话中维护深度与来源；change-draft SHALL 在获准维护的 `Planning 状态`
中保留可选“讨论深度”和“选择来源”，来源为用户指定、工作流默认或上下文默认。恢复时 SHALL
遵循讨论深度选择优先级；迁入或切换 schema MUST NOT 覆盖已有深度，用户确认切换后的来源 SHALL
为用户指定。旧文档缺少记录时 SHALL 使用默认规则，下次获准维护时补齐，不批量迁移。

这些字段 SHALL 是流程信息，不计入 D/A，也不作为 planning-state 的确认或 Apply 门槛。仅调整
深度或补齐记录 MUST NOT 重置 CONFIRMED 或下游状态；实际设计语义变化仍 MUST 触发原有失效规则。
新的默认深度要求 MUST NOT 重开旧 Confirmed 设计或阻止其下游投影。

#### Scenario: 恢复用户覆盖

- **WHEN** Full schema 的 brainstorm 记录了用户指定的 Lite 讨论深度
- **THEN** Agent MUST 恢复 Lite 讨论，不因 schema 为 Full 而覆盖用户选择

#### Scenario: 旧 Confirmed 文档缺少深度记录

- **WHEN** brainstorm 的确认与下游状态有效，但没有讨论深度和来源
- **THEN** 原有下游流程 SHALL 继续，不要求补做探针检查或重新确认；讨论恢复时才选择默认深度

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
有效 D/A/O 原样映射进 Living brainstorm，并保留讨论深度、来源与可复用调查。概要和主题分组 MAY
提升可读性，但 MUST NOT 改写含义、补充最佳实践或重新询问已确认事项。映射回执 SHALL 只报告
迁入数量、来源和下一项 gap。

#### Scenario: 已完成多轮 topic-only 讨论

- **WHEN** 用户同意把当前主题持久化
- **THEN** Agent MUST 在同一变更中保留现有编号和语义，初始化 `DRAFT` 后继续唯一的下一题

#### Scenario: 主题输入本身清楚

- **WHEN** 用户显式 `/opsx:new` 且输入包含无歧义的决定
- **THEN** Agent MAY 将这些输入直接记录为 D 项，但 MUST NOT 把 Agent 推测记录为 D 项

### Requirement: Living brainstorm MUST 经完整快照确认

没有 O 项、不存在会改变结构、可观察行为或维护方式的开放决定，且目标、边界、行为、方案与验证
闭环且当前讨论深度检查完成时，Agent MUST 进入可确认阶段，列出全部当前有效 D/A，每项一句话，
并只询问是否确认该完整快照。用户明确确认后才可将状态改为 `CONFIRMED`；不得把阶段标签、调用
`/opsx:ff` 或 artifact 文件存在视为确认。

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
