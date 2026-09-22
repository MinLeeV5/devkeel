## ADDED Requirements

### Requirement: Track command execution

CLI SHALL asynchronously report a telemetry event after each command execution completes, containing: projectId, command name, success boolean, duration in ms, CLI version, and ISO timestamp.

#### Scenario: Successful command execution
- **WHEN** a user runs `devkeel init` and the command completes successfully
- **THEN** a telemetry event is sent with `command: "init"`, `success: true`, and measured duration

#### Scenario: Failed command execution
- **WHEN** a command exits with code 1
- **THEN** a telemetry event is sent with `success: false`

#### Scenario: Network failure
- **WHEN** the telemetry endpoint is unreachable
- **THEN** the event is silently discarded and CLI exits normally without error

### Requirement: Track skill usage

CLI SHALL report a telemetry event when a skill is invoked, including the skill name in the event payload.

#### Scenario: Skill invocation
- **WHEN** a user triggers a skill (e.g., domain-init) through harness
- **THEN** a telemetry event is sent with `skill: "domain-init"`

### Requirement: Anonymous project identification

CLI SHALL generate a UUID v4 as project identifier on first telemetry event if none exists, persist it in config.yml under `telemetry.id`, and include it in all subsequent events.

#### Scenario: First run without existing ID
- **WHEN** `telemetry.id` is absent from config.yml
- **THEN** a new UUID v4 is generated, written to config.yml, and used in the event

#### Scenario: Subsequent run with existing ID
- **WHEN** `telemetry.id` exists in config.yml
- **THEN** the existing ID is used without modification

### Requirement: Opt-out mechanism

CLI MUST NOT send telemetry events when the user has opted out via environment variable `HARNESS_NO_TELEMETRY=1` or when `CI=true` is set.

#### Scenario: Environment variable opt-out
- **WHEN** `HARNESS_NO_TELEMETRY=1` is set
- **THEN** no HTTP request is made and `track()` returns immediately

#### Scenario: CI environment
- **WHEN** `CI=true` is set
- **THEN** no HTTP request is made

### Requirement: Non-blocking execution

Telemetry MUST NOT block the CLI main process. The fetch call SHALL be fire-and-forget without awaiting the response.

#### Scenario: Slow endpoint
- **WHEN** the telemetry endpoint takes >5s to respond
- **THEN** the CLI process exits normally without waiting for the response
