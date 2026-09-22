## ADDED Requirements

### Requirement: OPSX 上游行为基线 MUST 可审计升级

Harness MUST 精确锁定用于执行 OPSX 的 OpenSpec CLI 版本，并让现有分发 skill 的兼容范围、
上游 provenance、资产版本与官方 factory 契约保持一致。上游新增的权限或工作流表面只有经过
独立集成决策后才可进入 Harness。

#### Scenario: 运行时与 skill provenance 同步升级

- **WHEN** Harness 更新 OpenSpec CLI 行为基线
- **THEN** 依赖 SHALL 精确锁定目标版本，模板与 dogfood skill SHALL 声明同一上游版本，资产版本 SHALL 递增，并由契约测试核对官方 factory

#### Scenario: 上游新增能力不被静默引入

- **WHEN** 新版本提供 Store selection、生成式 `allowed-tools` 或新的 update workflow
- **THEN** Harness SHALL 在没有独立设计与授权时继续排除这些能力

#### Scenario: Repo-local Apply 遵守路径边界

- **WHEN** OpenSpec 返回 repo-local `actionContext`
- **THEN** Apply SHALL 以 `allowedEditRoots` 限制写入，不依赖不可达的 `workspace-planning` 分支
