## ADDED Requirements

### Requirement: OMX CLI installation

The setup skill SHALL install oh-my-codex via npm when it is not present.

#### Scenario: OMX not installed

- **WHEN** `omx --version` fails or is not found AND Agent type is "Codex CLI"
- **THEN** the skill SHALL execute `npm install -g oh-my-codex`

#### Scenario: OMX already installed

- **WHEN** OMX is already available (command found)
- **THEN** the skill SHALL report the installed version and skip npm installation

### Requirement: OMX setup configuration

After installation, the setup skill SHALL run the OMX setup process to install prompts, skills, AGENTS scaffolding, and hooks.

#### Scenario: Run OMX setup

- **WHEN** OMX has been installed or is already present
- **THEN** the skill SHALL instruct running `omx setup` to complete configuration

### Requirement: OMX health verification

The setup skill MUST verify OMX installation health using the official doctor command.

#### Scenario: Doctor check passes

- **WHEN** `omx doctor` completes without critical errors
- **THEN** the skill SHALL report OMX as verified

#### Scenario: Doctor check fails

- **WHEN** `omx doctor` reports errors
- **THEN** the skill SHALL display the errors and list OMX in the "Blocked / Missing" section of the summary

### Requirement: OMX execution verification

The setup skill SHALL offer an optional execution verification step to confirm Codex can make authenticated model calls.

#### Scenario: Execution verification succeeds

- **WHEN** `omx exec --skip-git-repo-check -C . "Reply with exactly OMX-EXEC-OK"` returns successfully
- **THEN** the skill SHALL report execution capability as verified

#### Scenario: Execution verification fails

- **WHEN** the exec command fails (auth issues, provider config problems)
- **THEN** the skill SHALL report the failure as a non-blocking warning and suggest checking `codex login status` and provider configuration

#### Scenario: User skips execution verification

- **WHEN** the user declines or skips the execution verification step
- **THEN** the skill SHALL proceed to the summary without marking OMX as blocked

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
