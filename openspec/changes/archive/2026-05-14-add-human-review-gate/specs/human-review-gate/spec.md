## ADDED Requirements

### Requirement: Human Review Artifact Definition

superpowers-bridge schema SHALL define a `human-review` artifact with the following properties:
- `id`: `human-review`
- `generates`: `human-review.html`
- `requires`: `[plan]`
- The artifact MUST be positioned in the dependency chain after `plan` and before `apply`

#### Scenario: Schema includes human-review artifact
- **WHEN** the superpowers-bridge schema.yaml is loaded
- **THEN** the artifacts list SHALL contain an entry with `id: human-review` that depends on `plan`

#### Scenario: Apply requires human-review
- **WHEN** `apply.requires` is evaluated
- **THEN** it SHALL include `human-review` (replacing the previous `[plan]`)

---

### Requirement: HTML Summary Generation

The `human-review` artifact instruction SHALL direct the agent to generate an HTML file that aggregates key information from all completed planning artifacts (brainstorm.md, proposal.md, design.md if present, specs/*.md, tasks.md, plan.md).

#### Scenario: All planning artifacts exist
- **WHEN** plan artifact is done and human-review is triggered
- **THEN** the generated HTML file SHALL contain sections for: change overview, requirements summary, design highlights (if design.md exists), specification listing, task checklist, and implementation plan

#### Scenario: Design artifact is absent
- **WHEN** design.md does not exist in the change directory
- **THEN** the HTML file SHALL omit the design section and proceed with remaining artifacts without error

#### Scenario: HTML is self-contained
- **WHEN** the HTML file is generated
- **THEN** it SHALL be a single self-contained file with inline CSS (no external dependencies), openable in any browser

---

### Requirement: Human Review Gate Behavior

After generating the HTML file, the artifact instruction SHALL prompt the user to review the document and explicitly instruct them to open a new session before running `/opsx:apply`.

#### Scenario: HTML generated successfully
- **WHEN** human-review.html is written to the change directory
- **THEN** the agent SHALL display the file path and instruct the user to open it in a browser for review

#### Scenario: Post-review guidance
- **WHEN** the user has been shown the review file
- **THEN** the agent SHALL display a message instructing the user to start a new session (`/new`) and then run `/opsx:apply` to begin implementation

#### Scenario: Propose mode stops after human-review
- **WHEN** running in `/opsx:propose` mode and human-review is in `applyRequires`
- **THEN** artifact generation SHALL stop after human-review.html is created (since all `applyRequires` are satisfied)

---

### Requirement: Human Review Template

A template file `human-review.md` SHALL be added to `templates/openspec/schemas/superpowers-bridge/templates/` containing the instruction scaffold for the agent.

#### Scenario: Template exists in schema templates
- **WHEN** the schema templates directory is listed
- **THEN** it SHALL contain `human-review.md`

#### Scenario: Template structure
- **WHEN** the template is read
- **THEN** it SHALL contain placeholder sections corresponding to each planning artifact type
