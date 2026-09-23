# Repository context detection

## Requirements

### Requirement: CLI SHALL infer repository scope without project configuration

`init`、`update` 和 `doctor` SHALL 使用相同的仓库角色识别规则，不读取或生成 `.harness/config.yml`，不提示用户填写或确认 `repoType`。

#### Scenario: Git submodule

- **WHEN** Git 确认当前项目属于 superproject
- **THEN** 系统 SHALL 按领域子仓库处理，即使尚未创建 AGENTS.md

#### Scenario: Standalone domain checkout

- **WHEN** 当前项目不是 Git 子模块，但 `AGENTS.md` 顶部具有 `<!-- harness:domain-agents -->` 标记
- **THEN** 系统 SHALL 按领域子仓库处理，保持领域模板和资产范围

#### Scenario: Main repository

- **WHEN** 当前项目既不是 Git 子模块，也没有 AGENTS 领域标记
- **THEN** 系统 SHALL 按主仓库处理，不以是否存在 `.gitmodules` 作为子仓库依据

#### Scenario: Legacy project configuration

- **WHEN** 项目存在旧 `.harness/config.yml`，包括损坏内容或与当前上下文冲突的字段
- **THEN** 系统 SHALL 忽略且不改写该文件，不据此改变角色或目标平台

### Requirement: CLI SHALL infer platform targets from existing entries

CLI SHALL 从 `.claude/`、`.agents/` 或 `.codex/`、`.cursor/`、`.opencode/`、`.github/copilot-instructions.md` 和 `GEMINI.md` 识别平台。

#### Scenario: Initialization or synchronization

- **WHEN** 用户运行 `init` 或 `sync`
- **THEN** 交互选择 SHALL 默认选中已识别平台，或使用 `--targets` 指定本次操作的平台
- **AND** 系统 SHALL 不持久化平台选择到项目配置文件

#### Scenario: Platform repair

- **WHEN** 平台目录存在，但受管 skills 链接缺失
- **THEN** `doctor --fix` SHALL 根据检测到的平台补齐链接，保留现有冲突保护

#### Scenario: All platform signals removed

- **WHEN** 某个平台的全部入口和目录均不存在
- **THEN** 系统 SHALL 不从旧 config 推断该平台，用户可通过 `sync --targets` 重建入口
