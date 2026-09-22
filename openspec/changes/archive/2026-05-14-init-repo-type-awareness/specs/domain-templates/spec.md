## ADDED Requirements

### Requirement: System SHALL provide domain-specific AGENTS.md template

系统 SHALL 包含领域子仓库专用的 AGENTS.md 模板文件 `templates/agents-md-domain.md`，内容为精简版执行契约，适配领域子仓库场景。

#### Scenario: Domain AGENTS.md template exists

- **WHEN** 构建系统打包模板
- **THEN** `templates/agents-md-domain.md` SHALL 存在且包含有效的 AGENTS.md 结构

#### Scenario: Domain AGENTS.md template is simpler than main

- **WHEN** 对比领域模板与主仓库模板
- **THEN** 领域模板 SHALL 不包含 openspec 变更流程路由、子模块处理等主仓库特有内容

#### Scenario: Domain AGENTS.md supports template variables

- **WHEN** 渲染领域 AGENTS.md 模板
- **THEN** 模板 SHALL 支持 `{{PROJECT_NAME}}` 和 `{{DOMAIN_TYPE}}` 变量替换

---

### Requirement: System SHALL provide domain-specific CLAUDE.md template

系统 SHALL 包含领域子仓库专用的 CLAUDE.md 模板文件 `templates/claude-md-domain.md`。

#### Scenario: Domain CLAUDE.md template exists

- **WHEN** 构建系统打包模板
- **THEN** `templates/claude-md-domain.md` SHALL 存在且包含 `@AGENTS.md` 引用指令

#### Scenario: Domain CLAUDE.md includes project context placeholder

- **WHEN** 渲染领域 CLAUDE.md 模板
- **THEN** 模板 SHALL 包含 `{{PROJECT_NAME}}` 变量和项目描述占位符

---

### Requirement: Init SHALL use domain templates for domain sub-repos

当 repoType 为 `domain` 时，init 流程写入 AGENTS.md 和 CLAUDE.md SHALL 使用领域专用模板而非主仓库模板。

#### Scenario: Domain init writes domain AGENTS.md

- **WHEN** repoType 为 `domain` 且执行 init
- **THEN** 系统 SHALL 使用 `templates/agents-md-domain.md` 渲染并写入 AGENTS.md（遵循智能覆写规则）

#### Scenario: Domain init writes domain CLAUDE.md

- **WHEN** repoType 为 `domain` 且执行 init
- **THEN** 系统 SHALL 使用 `templates/claude-md-domain.md` 渲染并写入 CLAUDE.md（遵循智能覆写规则）

#### Scenario: Main repo init still uses main templates

- **WHEN** repoType 为 `main` 且执行 init
- **THEN** 系统 SHALL 继续使用 `templates/agents-md.md` 和 `templates/claude-md.md`
