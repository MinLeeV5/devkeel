## ADDED Requirements

### Requirement: Openspec incremental update

When `openspec/` directory already exists during init, the system MUST incrementally add missing content instead of skipping entirely.

#### Scenario: schemas directory missing
- **WHEN** `openspec/` exists but `openspec/schemas/` does not
- **THEN** the system SHALL copy the schemas directory from templates

#### Scenario: schemas subdirectory missing
- **WHEN** `openspec/schemas/` exists but `openspec/schemas/superpowers-bridge/` does not
- **THEN** the system SHALL copy the `superpowers-bridge` schema from templates

#### Scenario: config.yaml missing schema field
- **WHEN** `openspec/config.yaml` exists but does not contain a `schema:` field
- **THEN** the system SHALL add the `schema: superpowers-bridge` field to config.yaml

#### Scenario: config.yaml already complete
- **WHEN** `openspec/config.yaml` already contains `schema:` field and all schemas are present
- **THEN** the system SHALL not modify any existing files

#### Scenario: subdirectories missing
- **WHEN** `openspec/` exists but `changes/`, `specs/`, or `archive/` subdirectories are missing
- **THEN** the system SHALL create the missing subdirectories with `.gitkeep` files
