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

### Requirement: Domain sub-repo init SHALL preserve scope in its execution contract

领域子仓库 init SHALL 生成带顶部 `<!-- harness:domain-agents -->` 标记的 AGENTS.md 和平台入口，不生成 `.harness/config.yml`。项目领域由 Agent 从代码与项目知识中识别。

#### Scenario: Domain sub-repo initialization

- **WHEN** 领域子仓库 init 完成
- **THEN** AGENTS.md SHALL 保留领域标记，平台链接 SHALL 按本次选择建立
- **AND** 系统 SHALL 不写入 `repoType`、`domainType` 或 `targets` 配置字段

---

### Requirement: Main repo batch init SHALL use domain sub-repo logic for submodules

主仓库 init 时批量初始化子模块 SHALL 调用领域子仓库 init 逻辑，而非创建 `.gitkeep` 存根。

#### Scenario: Batch init selected submodules

- **WHEN** 主仓库 init 选择了子模块
- **THEN** 系统 SHALL 对每个子模块执行领域子仓库 init 流程（准备领域能力目录、写入领域版 AGENTS.md/CLAUDE.md、创建平台 symlink）

#### Scenario: Batch init infers project domains

- **WHEN** 主仓库 init 选择了多个子模块
- **THEN** 系统 SHALL 不收集或持久化领域类型，由 Agent 按各子项目代码和知识识别领域

---

### Requirement: Domain sub-repo SHALL support standalone init

领域子仓库 SHALL 支持在子模块目录下直接运行 `devkeel init`，自动识别为领域子仓库并执行领域 init 流程。

#### Scenario: Standalone init in submodule directory

- **WHEN** 用户在无 `.gitmodules` 的子模块目录下运行 `devkeel init`
- **THEN** 系统 SHALL 从 Git 子模块关系检测仓库类型为 `domain`，执行领域子仓库 init 流程
