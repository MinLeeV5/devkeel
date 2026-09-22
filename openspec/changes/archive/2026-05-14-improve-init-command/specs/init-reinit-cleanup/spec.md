## ADDED Requirements

### Requirement: Platform link completeness

`createPlatformLinks` SHALL create symlinks for all applicable directories per platform. The codex platform (`.agents/`) MUST link `skills`, `rules`, `agents`, and `commands`（if exists）from `.harness/`.

#### Scenario: codex platform links agents directory
- **WHEN** init is run with codex as target platform
- **THEN** `.agents/agents` MUST be a symlink pointing to `.harness/agents`

#### Scenario: all platform links are consistent
- **WHEN** init is run with claude-code and codex as targets
- **THEN** both `.claude/agents` and `.agents/agents` MUST be symlinks to `.harness/agents`

---

### Requirement: Re-init platform directory cleanup

When platform directories (`.claude/`, `.agents/`, `.cursor/`, `.github/`) already exist during init, the system MUST offer the user an option to backup and rebuild them.

#### Scenario: platform directory exists with old symlinks
- **WHEN** `.claude/` already exists and user runs init
- **THEN** the system SHALL prompt the user whether to backup and rebuild platform directories

#### Scenario: user confirms rebuild
- **WHEN** user confirms rebuild
- **THEN** the system SHALL rename existing directories to `*.bak` suffix, delete originals, and recreate all platform symlinks

#### Scenario: user declines rebuild
- **WHEN** user cancels the rebuild prompt
- **THEN** the system SHALL skip platform link creation and continue with remaining init steps

#### Scenario: backup directory already exists
- **WHEN** `.claude.bak` already exists from a previous backup
- **THEN** the system SHALL overwrite the old backup with the new one

---

### Requirement: Legacy stage file cleanup

During init, the system MUST scan `.harness/skills/` and `.harness/agents/` for files matching the `stage-*.md` pattern and delete them automatically.

#### Scenario: stage files exist in skills directory
- **WHEN** `.harness/skills/` contains `stage-reviewer.md` and `stage-verifier.md`
- **THEN** both files SHALL be deleted during init

#### Scenario: no stage files present
- **WHEN** `.harness/skills/` contains no `stage-*.md` files
- **THEN** init SHALL proceed without any cleanup messages

#### Scenario: stage files in agents directory
- **WHEN** `.harness/agents/` contains `stage-reviewer.md`
- **THEN** the file SHALL be deleted during init

---

### Requirement: Package.json setup script

When generating a new `package.json`, the setup script MUST include submodule initialization before harness setup.

#### Scenario: new project with submodules
- **WHEN** init creates a new package.json
- **THEN** the `setup` script SHALL be `git submodule update --remote --init && npx devkeel setup`

#### Scenario: package.json fields
- **WHEN** init creates a new package.json
- **THEN** the generated JSON MUST NOT contain `main`, `author`, or `license` fields
