## ADDED Requirements

### Requirement: Agent type detection

The setup skill SHALL detect the current Agent type (Claude Code or Codex CLI) before routing to tool-specific installation flows.

#### Scenario: Claude Code environment detected

- **WHEN** `claude --version` returns a valid version string
- **THEN** the skill SHALL identify the Agent type as "Claude Code" and route to the OMC installation flow

#### Scenario: Codex CLI environment detected

- **WHEN** `codex --version` returns a valid version string
- **THEN** the skill SHALL identify the Agent type as "Codex CLI" and route to the OMX installation flow

#### Scenario: Both agents available

- **WHEN** both `claude --version` and `codex --version` return valid version strings
- **THEN** the skill SHALL ask the user which tool to install, or install both if the user confirms

#### Scenario: Neither agent detected

- **WHEN** neither `claude --version` nor `codex --version` returns a valid version string
- **THEN** the skill SHALL inform the user that no supported Agent CLI was found and list the supported options (Claude Code, Codex CLI) without attempting installation

### Requirement: Detection MUST precede tool installation

The Agent type detection step MUST execute before any oh-my tool installation step. The skill SHALL NOT attempt to install OMC in a Codex-only environment or OMX in a Claude-only environment.

#### Scenario: Detection gates installation

- **WHEN** Agent type detection completes with a result of "Claude Code"
- **THEN** only the OMC installation flow SHALL be presented, not the OMX flow

#### Scenario: Detection gates installation for Codex

- **WHEN** Agent type detection completes with a result of "Codex CLI"
- **THEN** only the OMX installation flow SHALL be presented, not the OMC flow

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
