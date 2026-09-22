# 变更 Brainstorm

## 目标

把 OpenSpec 1.6.0 官方 `openspec-update-change` 工作流作为第 12 个本地化 OPSX 入口加入
Harness。完成后，用户可通过 `/opsx:update [change-name]` 逐项确认并修订已有 planning
artifacts，使需求、设计、specs 与 tasks 重新一致，而不会创建新 artifact 或修改实现代码。

## 现状与问题

- OpenSpec 1.6.0 已提供 Update skill factory 和 `/opsx:update` command template，但 Harness
  当前只分发 11 个 OPSX workflows，并以负向契约明确排除 Update。
- 用户在 planning 完成或部分实施后改变需求时，只能手工选择 artifact 修改；Continue 负责
  创建下一个 artifact，Apply 负责代码实现，都不是“修订已有计划并跨 artifact 对齐”的入口。
- Harness 的 Lite→Full promotion/reconciliation 标记与已完成 tasks 具有持久恢复语义；直接复制
  上游提示可能误删标记，或把旧 `[x]` 状态带到已经变化的新计划。
- 当前工作区包含上一轮 OpenSpec 1.6 升级及其他用户修改；本次必须增量接入，不能回退它们。

## 范围与验收

In Scope：

- 新增 `openspec-update-change` 分发 skill 及 `/opsx:update` thin command，并同步
  `templates/` 与 `.harness/`。
- 保留官方选择 change、读取动态 schema、只编辑 `existingOutputPaths`、跨 artifact 双向对齐、
  每个 artifact 写入前确认以及 Update/Continue/Apply 边界。
- 对 Harness Lite 未暴露在 `artifactPaths` 中的已有可选 delta specs，沿用 Archive/Sync/Bulk 的
  realpath 安全发现；仍然只编辑已有文件，不创建 spec。
- 增加 Harness 约束：保留 Lite→Full 标记；变化后的 task 仅在仍有证据时保留 `[x]`；路径以
  `actionContext` 和当前 change 为界。
- 将新 skill 纳入资产版本表、模板分发与上游契约测试，并更新 OPSX 持久规格。
- 更新当前 Web 架构与能力清单中的 workflow 数量和入口说明，明确区分 `/opsx:update` 与刷新
  Agent 指令的原生 `openspec update`；历史 v1 页面保持不变。

Out of Scope：

- 不启用 Store 或生成式 `allowed-tools`，不改变其他 11 个 workflow 的入口语义。
- Update 不创建尚不存在的 artifact、不跨过 build frontier、不编辑应用代码、不自动 Apply、
  Archive、commit、push 或发布。
- 本次不发布 CLI/Templates 版本，不新增 changelog JSON；用户可见记录留到实际 Templates release。

验收条件：

- init/update 分发结果同时包含 update command 与 skill，dogfood 与模板逐字节一致。
- skill 声明 OpenSpec 1.6.0 provenance，官方 factory 与本地不变量都有自动化契约。
- 测试覆盖 thin command、existing-only、Lite delta fallback、逐项确认、custom schema、实施后
  回到 Apply 和禁止代码修改等核心边界。
- 聚焦测试、全量测试、TypeScript lint、指令审计和最终 P0/P1 审查通过。

## 方案方向与影响

命令只负责加载 `openspec-update-change` 并传递可选 change 名称与热上下文；全部选择、读取、
确认、写入与停止算法由 skill 单一持有。skill 基于 `status --json` 的 schema 与 concrete
`existingOutputPaths` 工作，并从 `applyRequires` 与动态 dependencies 计算 Apply 前置闭包，不硬编码
brainstorm/design/specs/tasks；缺失 artifact 委托 `/opsx:continue`，计划变化影响实现时委托
`/opsx:apply`。

新 skill 从 `1.0` 起步，并同步 `templates/versions-yml.yml`、`.harness/versions.yml`、模板测试和
当前 Web 能力清单。OPSX spec 将删除“Update 仍被排除”的旧结论，新增可验证的 Update
生命周期契约。

## 约束、风险与决策

- 每个 artifact 必须先展示具体修改及原因，再等待确认；一次确认不能隐式授权其他 artifact。
- `planningArtifacts` 可能同时包含 pre/post-apply artifacts，必须用 Apply 前置依赖闭包排除验证与
  收尾产物，不能按名称猜测自定义 schema 的阶段。
- 只编辑 `artifactPaths.<id>.existingOutputPaths`；glob 的 `resolvedOutputPath` 不是文件，不能写入，
  也不能由 Update 发明新文件。
- Lite delta fallback 只发现 `<changeRoot>/specs/**/*.md` 的已有真实文件，并拒绝符号链接越界。
- 意图发生根本变化时建议 `/opsx:new`，而不是把原 change 改成另一个目标。
- promotion/reconciliation marker 是解析与恢复契约，更新内容时必须原样保留；改变 tasks 语义
  后，没有当前实现证据支持的 `[x]` 必须恢复为 `[ ]`。
- Store、`allowed-tools` 继续作为显式 Harness 差异，并由契约测试锁定。

## 流程选择

采用 Harness Lite：这是新增一个独立、可回滚的 planning 入口，需要跨模板、版本与测试的简短
持久协调，但不改变已有命令语义、没有数据迁移，也不产生需 Full 治理的高后果风险。
