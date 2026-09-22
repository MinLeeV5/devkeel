## ADDED Requirements

### Requirement: Submodule platform linking

When submodules are selected during init, the system MUST create platform-specific symlinks in each submodule directory, using the same targets as the main project.

#### Scenario: submodule with claude-code target
- **WHEN** init is run with claude-code target and a submodule is selected
- **THEN** the submodule directory SHALL contain `.claude/skills`, `.claude/rules`, `.claude/agents` symlinks pointing to the submodule's `.harness/` directories

#### Scenario: submodule with multiple targets
- **WHEN** init is run with claude-code and codex targets and a submodule is selected
- **THEN** the submodule SHALL have both `.claude/` and `.agents/` directories with appropriate symlinks

#### Scenario: submodule harness directories exist
- **WHEN** submodule's `.harness/skills/` and `.harness/rules/` already exist (created earlier in init flow)
- **THEN** `createPlatformLinks` SHALL create symlinks pointing to these existing directories

#### Scenario: submodule AGENTS.md creation
- **WHEN** a submodule is initialized
- **THEN** the submodule MUST have an `AGENTS.md` file at its root (existing behavior, preserved)
