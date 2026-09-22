## ADDED Requirements

### Requirement: OPSX Update MUST 只修订已有 planning artifacts

`/opsx:update` MUST 根据 active change 的动态 schema 修订已有 planning artifacts，并在每个
artifact 写入前取得独立确认。它不得创建 artifact、推进 build frontier、修改实现代码或伪造
post-apply 证据。Harness Lite 已有但未暴露在 `artifactPaths` 中的可选 delta specs MUST 通过
受路径边界保护的 fallback 纳入修订。

#### Scenario: 自定义 schema 使用现有具体路径

- **WHEN** change 使用任意 schema 且用户要求修订计划
- **THEN** Update SHALL 从 `applyRequires` 沿 artifact dependencies 计算 Apply 前置 id 闭包，再展开这些 id 的 `existingOutputPaths`，并拒绝 `changeRoot` 或 `allowedEditRoots` 之外的路径

#### Scenario: post-apply artifact 出现在 planningArtifacts

- **WHEN** `actionContext.planningArtifacts` 同时包含 Apply 前置与 verify、retrospective 等后置 artifact
- **THEN** Update SHALL 只允许 Apply 前置依赖闭包中的 id，不得依据 `planningArtifacts` 单独判定可编辑范围

#### Scenario: Lite 可选 delta spec 未出现在 artifactPaths

- **WHEN** `lite` change 的 `<changeRoot>/specs/**/*.md` 已存在，但 `artifactPaths.specs.existingOutputPaths` 缺失或为空
- **THEN** Update SHALL 在解析真实路径并拒绝符号链接越界后纳入这些已有文件，且不得创建目录或 spec 文件

#### Scenario: 每个 artifact 单独确认

- **WHEN** coherence review 发现多个 artifacts 需要修改
- **THEN** Update SHALL 逐个展示修改和原因，并且一次确认不得授权后续 artifact

#### Scenario: 缺失 artifact 不由 Update 创建

- **WHEN** 对齐计划需要尚不存在的 artifact 或 glob 下的新文件
- **THEN** Update SHALL 保持 build frontier 不变并建议 `/opsx:continue`

#### Scenario: 已实施计划发生变化

- **WHEN** planning 修订使已完成 task 或实现证据可能过期
- **THEN** Update SHALL 只保留仍有当前证据支持的 `[x]`，保护 Lite→Full 标记，并建议 `/opsx:apply`，不得自动实施

#### Scenario: 请求改变 change 根本意图

- **WHEN** 用户请求不是细化而是把 active change 改成另一个目标
- **THEN** Update SHALL 停止修订并建议 `/opsx:new`

## MODIFIED Requirements

### Requirement: OPSX 上游行为基线 MUST 可审计升级

Harness MUST 精确锁定用于执行 OPSX 的 OpenSpec CLI 版本，并让现有分发 skill 的兼容范围、
上游 provenance、资产版本与官方 factory 契约保持一致。上游新增的权限或工作流表面只有经过
独立集成决策后才可进入 Harness。

#### Scenario: 运行时与 skill provenance 同步升级

- **WHEN** Harness 更新 OpenSpec CLI 行为基线
- **THEN** 依赖 SHALL 精确锁定目标版本，模板与 dogfood skill SHALL 声明同一上游版本，资产版本 SHALL 递增，并由契约测试核对官方 factory

#### Scenario: 上游新增能力不被静默引入

- **WHEN** 新版本提供新的权限或 workflow surface
- **THEN** Harness SHALL 只在独立设计、授权与回归完成后分发对应能力

#### Scenario: Update 经独立设计后接入

- **WHEN** `/opsx:update` 已完成 planning-only、确认和 Harness 状态守卫设计
- **THEN** Harness SHALL 分发 `openspec-update-change` 与 thin command，同时继续排除 Store selection 和生成式 `allowed-tools`

#### Scenario: Repo-local Apply 遵守路径边界

- **WHEN** OpenSpec 返回 repo-local `actionContext`
- **THEN** Apply SHALL 以 `allowedEditRoots` 限制写入，不依赖不可达的 `workspace-planning` 分支
