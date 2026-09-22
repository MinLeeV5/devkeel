## MODIFIED Requirements

### Requirement: Skills SHALL be embedded in templates
harness 模板 MUST 包含以下 11 个 SuperPowers skill 目录，每个目录包含完整的 SKILL.md 及附属引用文件：brainstorming、writing-plans、subagent-driven-development、executing-plans、using-git-worktrees、test-driven-development、requesting-code-review、finishing-a-development-branch、systematic-debugging、verification-before-completion、receiving-code-review。

#### Scenario: devkeel init copies all embedded skills
- **WHEN** 用户执行 `devkeel init`
- **THEN** `.harness/skills/` 中包含上述 11 个 skill 目录，每个目录含 SKILL.md 及其附属引用文件

#### Scenario: devkeel update refreshes embedded skills
- **WHEN** 用户执行 `devkeel update`
- **THEN** `.harness/skills/` 中的嵌入 skill 被更新为最新模板版本

---

### Requirement: Skill metadata SHALL identify source and version
每个嵌入 skill 的 SKILL.md frontmatter MUST 包含 `metadata.author: "superpowers"` 和 `metadata.version: "6.0.3"`。

#### Scenario: metadata present in all embedded skills
- **WHEN** 检查任意嵌入 skill 的 SKILL.md
- **THEN** frontmatter 中存在 `author: "superpowers"` 和 `version: "6.0.3"`

---

### Requirement: References SHALL use bare skill names
所有模板文件中对嵌入 skill 的引用 MUST 使用裸名（如 `brainstorming`），不得使用 `superpowers:` 命名空间前缀。

#### Scenario: AGENTS.md template uses bare names
- **WHEN** 检查 `templates/agents-md.md`
- **THEN** 不存在 `superpowers:brainstorming`，存在 `brainstorming`

#### Scenario: schema.yaml uses bare names
- **WHEN** 检查 `templates/openspec/schemas/superpowers-lite/schema.yaml`
- **THEN** 不存在任何 `superpowers:` 前缀引用

#### Scenario: skill internal cross-references use bare names
- **WHEN** 在嵌入 skill 文件中 grep `superpowers:`
- **THEN** 结果为空
