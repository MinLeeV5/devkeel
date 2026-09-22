## ADDED Requirements

### Requirement: Harness Lite MUST 使用最小 artifact 图
`lite` schema MUST 仅定义 `brief` 和 `tasks` 两个 planning artifact，其中 `tasks` 依赖 `brief`，apply 依赖并跟踪 `tasks.md`。

#### Scenario: 新建 lite change
- **WHEN** OpenSpec 使用 `lite` 创建 change
- **THEN** status SHALL 按 `brief -> tasks` 解锁，且 `applyRequires` 只包含 `tasks`

#### Scenario: 检查 lite 文件集合
- **WHEN** lite change 已达到 apply-ready
- **THEN** change 中 MUST NOT 要求 design、specs、human-review、verify 或 retrospective artifact

### Requirement: Brief MUST 汇总实施所需的最少上下文
`brief.md` MUST 按需覆盖背景与目标、主要用例、in/out、现有实现与影响区、约束、技术方案、关键决策与替代、风险、验收与验证，不得输出分析方法论或强制调用 requirement-analysis、brainstorming、technical-design skill。

#### Scenario: 普通 lite 需求已确认
- **WHEN** Agent 生成 brief
- **THEN** 文档 SHALL 优先保持在 500–800 个中文字符内并抓取上述适用重点

#### Scenario: 1200 字仍无法讲清楚
- **WHEN** brief 在约 1200 个中文字符内无法清楚表达范围、方案和验收
- **THEN** Agent MUST 暂停并建议用户升级 full，而不是继续堆叠 lite artifact

### Requirement: Tasks MUST 面向结果和验证
`tasks.md` 中每个任务 MUST 描述结果、可从仓库查明时的范围和验证方式；不得强制 per-file 微步骤、RED/GREEN/REFACTOR、commit message、覆盖矩阵或 `mode:` 字段，也不得设置全局行数或任务数上限。

#### Scenario: 从 brief 生成 tasks
- **WHEN** Agent 把已确认 brief 转为实施计划
- **THEN** 每个 checkbox SHALL 对应一个可验证结果并给出验证方法

#### Scenario: 任务需要较多文字
- **WHEN** 清楚描述任务所需内容超过建议篇幅
- **THEN** Agent SHALL 保留必要信息，不得为了固定行数压缩掉范围或验证条件

### Requirement: Lite Apply MUST 由当前 Agent 轻量执行
lite apply MUST 由当前 Agent 直接执行 tasks，始终进行邻近验证和低成本 diff 自审；只有明确测试接缝、变更风险、用户要求或项目规则命中时才按需使用 TDD、独立 review、worktree、subagent 或 commit。

#### Scenario: 普通 lite 实施
- **WHEN** 变更局部、验证充分且无共享核心风险
- **THEN** Agent SHALL 实现后运行对应验证并自审 diff，不得强制分派 subagent 或独立 reviewer

#### Scenario: 风险触发独立审查
- **WHEN** 变更影响共享核心或跨模块行为、测试证据较弱、Agent 明确不确定、diff 超出 brief，或用户/项目要求审查
- **THEN** Agent SHALL 使用 `review-orchestrator`，默认一次快速审查并只对阻断修复做定向复审

#### Scenario: 存在清晰测试接缝
- **WHEN** 功能或缺陷可先用稳定的自动化测试表达
- **THEN** Agent SHOULD 使用 TDD；否则 SHALL 在实现后完成最邻近的可执行验证

### Requirement: Task 勾选 MUST 反映验证状态
Agent MUST 仅在任务对应验证通过后将 checkbox 标为完成；验证失败、实现暂停或用户中断时 change MUST 保持 active，并以 `tasks.md` 作为唯一进度状态。

#### Scenario: 单项验证失败
- **WHEN** 某项实现完成但其验证命令失败
- **THEN** Agent MUST 保持该任务未勾选、报告证据并暂停或修复

#### Scenario: 恢复中断的 apply
- **WHEN** 用户再次对 active lite change 运行 `/opsx:apply`
- **THEN** Agent SHALL 从 `tasks.md` 中第一个未完成项恢复，不要求额外进度记录

### Requirement: Lite 成功后 MUST 自动轻量归档
全部任务验证通过后，lite apply MUST 使用普通 OpenSpec archive 自动归档 change；lite 不生成 delta specs，不要求 `--skip-specs`，且不得生成 verify、retrospective 或 PR/commit 门禁；归档失败时 MUST 保留可恢复状态。

#### Scenario: 最后一项任务完成
- **WHEN** 最后一项任务已验证并勾选
- **THEN** Agent SHALL 自动执行 lite 归档，并报告归档结果

#### Scenario: 全部任务完成后重新调用 apply
- **WHEN** OpenSpec apply instructions 返回 `all_done` 且 schemaName 为 `lite`
- **THEN** AGENTS MUST 继续尝试普通 archive，而不是只提示用户手动归档；commands/skills 与 CLI 保持不变

#### Scenario: 归档命令失败
- **WHEN** 自动归档因 CLI 或文件状态失败
- **THEN** Agent MUST 报告恢复命令，且不得伪造归档成功或清除 active change
