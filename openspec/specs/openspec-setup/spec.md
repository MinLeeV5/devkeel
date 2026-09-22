## ADDED Requirements

### Requirement: openspec CLI installation

The setup skill SHALL detect whether openspec is installed and install it if missing.

#### Scenario: openspec not installed

- **WHEN** `openspec --version` fails or returns an error
- **THEN** the skill SHALL execute `npm install -g @fission-ai/openspec@latest` and verify with `openspec --version`

#### Scenario: openspec already installed

- **WHEN** `openspec --version` returns a valid version string
- **THEN** the skill SHALL report the installed version and skip installation

### Requirement: openspec MUST NOT perform project initialization

The setup skill SHALL NOT run `openspec init` or `openspec update` as part of the setup flow. Project-level initialization is the responsibility of `devkeel init`.

#### Scenario: Skip project initialization

- **WHEN** openspec CLI is installed or has just been installed
- **THEN** the skill SHALL proceed to the next tool without running `openspec init` or `openspec update`

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
