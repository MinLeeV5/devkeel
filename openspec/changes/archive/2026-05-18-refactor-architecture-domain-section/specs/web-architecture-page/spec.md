## ADDED Requirements

### Requirement: Domain-init flow visualization SHALL be the primary content of the domain pack section

The architecture page's domain pack section SHALL prominently display the domain-init four-phase workflow (识别 → Baseline → 增强 → 收尾) as its primary visual element.

#### Scenario: User views domain pack section
- **WHEN** a user scrolls to the domain pack section
- **THEN** the first visual element after the title MUST be the domain-init flow diagram showing four phases

### Requirement: Frontend/backend examples SHALL be presented as output samples

The existing frontend and backend domain pack cards SHALL be retained but repositioned as "产出示例" (output samples) of what domain-init generates.

#### Scenario: User sees domain pack cards
- **WHEN** a user views the frontend/backend cards
- **THEN** they MUST be labeled as example outputs of domain-init, not as standalone "domain packs"

### Requirement: Section SHALL explain domain-init vs harness-init distinction

The section MUST include a brief explanation of how `domain-init` (project-specific scanning) differs from `devkeel init` (generic template distribution).

#### Scenario: User reads the section
- **WHEN** a user reads the domain pack section
- **THEN** they MUST find a clear comparison between devkeel init and domain-init
