## ADDED Requirements

### Requirement: Domain sub-repo init SHALL only copy domain-specific templates

当 repoType 为 `domain` 时，init 流程 SHALL 只将对应领域模板（`templates/domain/<domainType>/`）中的 skills/rules/agents 复制到 `.harness/` 顶层目录。

#### Scenario: Backend domain sub-repo init

- **WHEN** repoType 为 `domain` 且 domainType 为 `backend`
- **THEN** 系统 SHALL 将 `templates/domain/backend/skills/` 复制到 `.harness/skills/`，`templates/domain/backend/rules/` 复制到 `.harness/rules/`，`templates/domain/backend/agents/` 复制到 `.harness/agents/`

#### Scenario: Frontend domain sub-repo init

- **WHEN** repoType 为 `domain` 且 domainType 为 `frontend`
- **THEN** 系统 SHALL 将 `templates/domain/frontend/skills/` 复制到 `.harness/skills/`，`templates/domain/frontend/rules/` 复制到 `.harness/rules/`，`templates/domain/frontend/agents/` 复制到 `.harness/agents/`

---

### Requirement: Domain sub-repo init SHALL NOT copy generic templates

当 repoType 为 `domain` 时，init 流程 SHALL 不执行通用模板复制。

#### Scenario: No generic skills/rules/agents copied

- **WHEN** repoType 为 `domain`
- **THEN** 系统 SHALL 不调用 `copyTemplateSkills()`、`copyTemplateRules()`、`copyTemplateAgents()`、`copyTemplateCommands()`

#### Scenario: No openspec scaffold created

- **WHEN** repoType 为 `domain`
- **THEN** 系统 SHALL 不调用 `copyOpenspecTemplate()` 或 `updateOpenspecIncremental()`，不创建 `openspec/` 目录

#### Scenario: No commands directory copied

- **WHEN** repoType 为 `domain`
- **THEN** 系统 SHALL 不复制 `templates/commands/` 到 `.harness/commands/`

---

### Requirement: Domain sub-repo init SHALL create platform symlinks

当 repoType 为 `domain` 时，init 流程 SHALL 创建平台 symlink，链接 `.harness/` 中的领域内容到对应平台目录。

#### Scenario: Platform links for domain sub-repo

- **WHEN** repoType 为 `domain` 且 targets 包含 `claude-code`
- **THEN** 系统 SHALL 创建 `.claude/skills` → `.harness/skills`、`.claude/rules` → `.harness/rules`、`.claude/agents` → `.harness/agents` 的 symlink

---

### Requirement: Domain sub-repo init SHALL write config.yml

当 repoType 为 `domain` 时，init 流程 SHALL 写入 `.harness/config.yml`，包含 `project.repoType: domain` 和 `project.domainType`。

#### Scenario: Config written for domain sub-repo

- **WHEN** 领域子仓库 init 完成
- **THEN** `.harness/config.yml` SHALL 包含 `version`、`project.name`、`project.types`、`project.repoType: domain`、`project.domainType`、`targets` 字段

---

### Requirement: Main repo batch init SHALL use domain sub-repo logic for submodules

主仓库 init 时批量初始化子模块 SHALL 调用领域子仓库 init 逻辑，而非创建 `.gitkeep` 存根。

#### Scenario: Batch init submodules with domain type selection

- **WHEN** 主仓库 init 选择了子模块并为每个子模块指定了领域类型
- **THEN** 系统 SHALL 对每个子模块执行领域子仓库 init 流程（复制领域模板、写入领域版 AGENTS.md/CLAUDE.md、创建平台 symlink）

#### Scenario: Batch init prompts domain type per submodule

- **WHEN** 主仓库 init 选择了多个子模块
- **THEN** 系统 SHALL 为每个子模块分别提示选择领域类型（backend/frontend/other）

---

### Requirement: Domain sub-repo SHALL support standalone init

领域子仓库 SHALL 支持在子模块目录下直接运行 `devkeel init`，自动识别为领域子仓库并执行领域 init 流程。

#### Scenario: Standalone init in submodule directory

- **WHEN** 用户在无 `.gitmodules` 的子模块目录下运行 `devkeel init`
- **THEN** 系统 SHALL 检测仓库类型为 `domain`，提示确认后执行领域子仓库 init 流程
