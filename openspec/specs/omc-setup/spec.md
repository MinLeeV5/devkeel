## ADDED Requirements

### Requirement: OMC CLI installation

The setup skill SHALL install oh-my-claudecode via npm when it is not present.

#### Scenario: OMC not installed

- **WHEN** `omc --version` fails or returns an error AND Agent type is "Claude Code"
- **THEN** the skill SHALL execute `npm install -g oh-my-claude-sisyphus@latest`

#### Scenario: OMC already installed

- **WHEN** `omc --version` returns a valid version string
- **THEN** the skill SHALL report the installed version and skip npm installation

### Requirement: OMC setup configuration

After installation, the setup skill SHALL guide the user through the complete OMC setup process. The skill MUST distinguish between terminal commands and in-session commands.

#### Scenario: Configure OMC from terminal

- **WHEN** the skill is providing setup instructions for terminal execution
- **THEN** the skill SHALL instruct running `omc setup` from the terminal

#### Scenario: Configure OMC from Claude Code session

- **WHEN** the skill is executing within a Claude Code session
- **THEN** the skill SHALL instruct running `/omc-setup` or `/setup` as an in-session command

### Requirement: OMC teams environment variable

The setup skill SHALL ensure the Claude Code teams feature is enabled by configuring the required environment variable.

#### Scenario: Teams not configured

- **WHEN** `~/.claude/settings.json` does not contain `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in the `env` section
- **THEN** the skill SHALL instruct adding `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"` to the `env` object in `~/.claude/settings.json`

#### Scenario: Teams already configured

- **WHEN** `~/.claude/settings.json` already contains `"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"`
- **THEN** the skill SHALL report teams as already enabled and skip this step

### Requirement: OMC verification

The setup skill MUST verify OMC installation and configuration completeness.

#### Scenario: Verification success

- **WHEN** `omc --version` returns a valid version string after installation and setup
- **THEN** the skill SHALL report OMC as verified and suggest running `/omc-doctor` for health check

#### Scenario: Verification failure

- **WHEN** `omc --version` fails after installation attempt
- **THEN** the skill SHALL report the failure, suggest manual troubleshooting, and list the skill in the "Blocked / Missing" section of the summary

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
