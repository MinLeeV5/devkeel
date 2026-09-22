## ADDED Requirements

### Requirement: Skills SHALL be embedded in templates
harness 模板 MUST 包含以下 8 个 SuperPowers skill 目录，每个目录包含完整的 SKILL.md 及附属引用文件：brainstorming、writing-plans、subagent-driven-development、executing-plans、using-git-worktrees、test-driven-development、requesting-code-review、finishing-a-development-branch。

#### Scenario: devkeel init copies all embedded skills
- **WHEN** 用户执行 `devkeel init`
- **THEN** `.harness/skills/` 中包含上述 8 个 skill 目录，每个目录含 SKILL.md

#### Scenario: devkeel update refreshes embedded skills
- **WHEN** 用户执行 `devkeel update`
- **THEN** `.harness/skills/` 中的嵌入 skill 被更新为最新模板版本

---

### Requirement: Skill metadata SHALL identify source and version
每个嵌入 skill 的 SKILL.md frontmatter MUST 包含 `metadata.author: "superpowers"` 和 `metadata.version: "5.1.0"`。

#### Scenario: metadata present in all embedded skills
- **WHEN** 检查任意嵌入 skill 的 SKILL.md
- **THEN** frontmatter 中存在 `author: "superpowers"` 和 `version: "5.1.0"`

---

### Requirement: References SHALL use bare skill names
所有模板文件中对嵌入 skill 的引用 MUST 使用裸名（如 `brainstorming`），不得使用 `superpowers:` 命名空间前缀。

#### Scenario: AGENTS.md template uses bare names
- **WHEN** 检查 `templates/agents-md.md`
- **THEN** 不存在 `superpowers:brainstorming`，存在 `brainstorming`

#### Scenario: schema.yaml uses bare names
- **WHEN** 检查 `templates/openspec/schemas/superpowers-bridge/schema.yaml`
- **THEN** 不存在任何 `superpowers:` 前缀引用

#### Scenario: skill internal cross-references use bare names
- **WHEN** 在嵌入 skill 文件中 grep `superpowers:`
- **THEN** 结果为空

---

### Requirement: brainstorming skill SHALL exclude visual-companion
嵌入的 brainstorming skill MUST NOT 包含 `visual-companion.md`、`scripts/` 目录，且 SKILL.md 中 MUST NOT 包含 "Visual Companion" section。

#### Scenario: visual-companion files absent
- **WHEN** 检查 `templates/skills/brainstorming/` 目录
- **THEN** 不存在 `visual-companion.md` 和 `scripts/` 目录

#### Scenario: SKILL.md visual companion section removed
- **WHEN** 在 `templates/skills/brainstorming/SKILL.md` 中搜索 "visual-companion" 或 "Visual Companion"
- **THEN** 结果为空

---

### Requirement: Deprecated asset detection SHALL recognize all managed authors
`isHarnessGenerated` 函数 MUST 将包含 `devkeel`、`author: "superpowers"` 或 `author: "openspec"` 的 SKILL.md 识别为 harness 管理的资产，使其在模板移除后能被 `detectDeprecatedAssets` 检测到。

#### Scenario: superpowers-authored skill detected as harness-generated
- **WHEN** 一个 skill 目录的 SKILL.md 包含 `author: "superpowers"`
- **THEN** `isHarnessGenerated` 返回 `true`

#### Scenario: openspec-authored skill detected as harness-generated
- **WHEN** 一个 skill 目录的 SKILL.md 包含 `author: "openspec"`
- **THEN** `isHarnessGenerated` 返回 `true`

#### Scenario: non-harness skill not affected
- **WHEN** 一个 skill 目录的 SKILL.md 不包含 `devkeel`、`author: "superpowers"` 或 `author: "openspec"`
- **THEN** `isHarnessGenerated` 返回 `false`

---

### Requirement: openspec skills SHALL have author metadata
所有 11 个 openspec-* skill 的 SKILL.md frontmatter MUST 包含 `metadata.author: "openspec"`。

#### Scenario: metadata present in all openspec skills
- **WHEN** 检查任意 openspec-* skill 的 SKILL.md
- **THEN** frontmatter 中存在 `author: "openspec"`
