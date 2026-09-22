## Purpose

定义领域子仓库的精简 Agent 入口、平台 bootstrap 和 init 模板选择，确保子仓库可以安全独立执行，
同时把通用工作流与 OpenSpec 协调留在 DevKeel 主仓库。

## Requirements

### Requirement: System SHALL provide domain-specific AGENTS.md template

系统 SHALL 包含领域子仓库专用的 AGENTS.md 模板文件 `templates/agents-domain-md.md`，作为从主仓库进入或独立打开子仓库时的精简执行入口。

#### Scenario: Domain AGENTS.md template exists

- **WHEN** 构建系统打包模板
- **THEN** `templates/agents-domain-md.md` SHALL 存在且包含有效的 AGENTS.md 结构

#### Scenario: Domain AGENTS.md template is simpler than main

- **WHEN** 对比领域模板与主仓库模板
- **THEN** 领域模板 SHALL 不复制 Direct/Lite/Full、Brainstorming 或 OpenSpec 的主仓库编排算法
- **AND** 模板 SHALL 明确代码与验证留在子仓库、OpenSpec 和知识产出归属主仓库

#### Scenario: Domain AGENTS.md is safe as a standalone entry

- **WHEN** 开发者直接把领域子仓库作为工作区打开
- **THEN** 模板 SHALL 按具体动作、目标和范围判断写入授权
- **AND** 仅加载与当前任务直接匹配的领域 rules、skills 和文档

#### Scenario: Domain AGENTS.md preserves extension slots

- **WHEN** init、update 或 domain-init 扩展领域执行契约
- **THEN** 模板 SHALL 保留 `domain`、`routing`、`verification` 和 `project` 用户槽位

---

### Requirement: Domain init SHALL provide platform bootstrap

领域子仓库选择 Claude Code 或 Cursor 时，系统 SHALL 使用共享的 `templates/claude-md.md` 生成平台 bootstrap。

#### Scenario: Domain CLAUDE.md delegates to AGENTS.md

- **WHEN** repoType 为 `domain` 且目标平台包含 Claude Code 或 Cursor
- **THEN** 生成的 `CLAUDE.md` SHALL 包含 `@AGENTS.md` 并渲染项目名称

---

### Requirement: Init SHALL use the domain AGENTS profile for domain sub-repos

当 repoType 为 `domain` 时，init 流程 SHALL 使用领域 AGENTS 模板，并在需要时使用共享平台 bootstrap。

#### Scenario: Domain init writes domain AGENTS.md

- **WHEN** repoType 为 `domain` 且执行 init
- **THEN** 系统 SHALL 使用 `templates/agents-domain-md.md` 写入 AGENTS.md（遵循智能覆写规则）

#### Scenario: Domain init writes domain CLAUDE.md

- **WHEN** repoType 为 `domain` 且执行 init
- **THEN** 系统 SHALL 使用共享的 `templates/claude-md.md` 渲染并写入 CLAUDE.md（遵循智能覆写规则）

#### Scenario: Main repo init still uses main templates

- **WHEN** repoType 为 `main` 且执行 init
- **THEN** 系统 SHALL 继续使用 `templates/agents-md.md` 和 `templates/claude-md.md`
