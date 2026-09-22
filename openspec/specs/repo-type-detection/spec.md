## ADDED Requirements

### Requirement: System SHALL auto-detect repo type based on .gitmodules

系统在 init 流程启动时 SHALL 检查项目根目录是否存在 `.gitmodules` 文件且包含至少一个子模块条目，以此推断仓库类型。

#### Scenario: Project has .gitmodules with submodules

- **WHEN** 项目根目录存在 `.gitmodules` 且文件中包含至少一个 `[submodule "..."]` 条目
- **THEN** 系统 SHALL 推断仓库类型为 `main`

#### Scenario: Project has no .gitmodules

- **WHEN** 项目根目录不存在 `.gitmodules` 文件
- **THEN** 系统 SHALL 推断仓库类型为 `domain`

#### Scenario: Project has empty .gitmodules

- **WHEN** 项目根目录存在 `.gitmodules` 但文件为空或不含子模块条目
- **THEN** 系统 SHALL 推断仓库类型为 `domain`

---

### Requirement: System SHALL prompt user to confirm detected repo type

系统 SHALL 在交互提示阶段向用户展示自动检测的仓库类型，并允许用户更改。

#### Scenario: User accepts detected type

- **WHEN** 系统检测到仓库类型并提示用户确认
- **THEN** 用户可选择接受检测结果，系统 SHALL 使用该类型继续流程

#### Scenario: User overrides detected type

- **WHEN** 系统检测到仓库类型为 `domain`，但用户选择 `main`
- **THEN** 系统 SHALL 使用用户选择的 `main` 类型继续流程

---

### Requirement: Config SHALL include repoType field

`HarnessConfig` 接口和 `.harness/config.yml` 文件 SHALL 包含 `project.repoType` 字段，值为 `main` 或 `domain`。

#### Scenario: New init writes repoType to config

- **WHEN** init 完成仓库类型确认
- **THEN** 系统 SHALL 将 `project.repoType` 写入 `.harness/config.yml`

#### Scenario: Existing config without repoType

- **WHEN** 读取已有 config.yml 且缺少 `project.repoType` 字段
- **THEN** 系统 SHALL 正常运行不报错（向后兼容）

---

### Requirement: Domain sub-repo SHALL specify domainType

当仓库类型为 `domain` 时，系统 SHALL 提示用户选择领域类型（`backend` / `frontend` / `other`），并写入 `project.domainType` 字段。

#### Scenario: User selects backend domain type

- **WHEN** repoType 为 `domain` 且用户选择 `backend`
- **THEN** 系统 SHALL 将 `project.domainType: backend` 写入 config.yml

#### Scenario: Main repo does not prompt for domainType

- **WHEN** repoType 为 `main`
- **THEN** 系统 SHALL 不提示选择 domainType，config.yml 中不包含该字段
