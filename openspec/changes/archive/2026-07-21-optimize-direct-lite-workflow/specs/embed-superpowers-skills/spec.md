## MODIFIED Requirements

### Requirement: Skills SHALL be embedded in templates
harness 模板 MUST 保留 full 流程仍依赖的 8 个 SuperPowers skill 目录及其完整引用文件：writing-plans、subagent-driven-development、executing-plans、using-git-worktrees、test-driven-development、requesting-code-review、finishing-a-development-branch、verification-before-completion；模板 MUST 另包含 Harness 维护的轻量 `grilling` skill。

#### Scenario: devkeel init copies retained embedded skills
- **WHEN** 用户执行 `devkeel init`
- **THEN** `.harness/skills/` 中包含上述 8 个 SuperPowers skill 和 `grilling`，且 full schema 的内部引用文件均存在

#### Scenario: devkeel update refreshes embedded skills
- **WHEN** 用户执行 `devkeel update`
- **THEN** 保留的嵌入 skill 与 `grilling` SHALL 更新到模板注册版本

### Requirement: Skill metadata SHALL identify source and version
每个保留的上游 skill 的 SKILL.md frontmatter MUST 使用其真实来源 author，并使 `metadata.version` 与 `versions-yml.yml` 注册值一致；`grilling` MUST 标记为 Harness 维护的轻量派生 skill 并具有独立版本。

#### Scenario: retained skill metadata matches registry
- **WHEN** 检查任一保留 skill 的 SKILL.md 和模板版本表
- **THEN** author SHALL 标明来源，且 metadata.version MUST 与注册版本相同

#### Scenario: grilling metadata present
- **WHEN** 检查 `templates/skills/grilling/SKILL.md`
- **THEN** frontmatter SHALL 包含 Harness author、独立 version 和仅显式调用的触发描述

### Requirement: References SHALL use bare skill names
所有 active 模板文件对保留 skill 的引用 MUST 使用裸名，不得使用 `superpowers:` 命名空间前缀，也不得引用已退休 skill。

#### Scenario: active AGENTS template contains no retired default route
- **WHEN** 检查 `templates/agents-md.md`
- **THEN** 不存在对 `brainstorming`、`systematic-debugging` 或 `receiving-code-review` 的默认路由

#### Scenario: full schema uses valid bare names
- **WHEN** 检查 `templates/openspec/schemas/full/schema.yaml`
- **THEN** 所有 skill 引用 SHALL 使用裸名，且对应 skill 文件存在

#### Scenario: skill internal cross-references remain valid
- **WHEN** 检查保留 skill 的相对引用和 `superpowers:` 前缀
- **THEN** 不存在命名空间前缀或悬空相对引用

## ADDED Requirements

### Requirement: Grilling MUST 只按用户显式意图触发
`grilling` skill MUST 提供短小、逐问逐答的方案压力测试流程，但不得成为 direct、lite、普通讨论或 full artifact 的默认依赖。

#### Scenario: 用户显式调用 grilling
- **WHEN** 用户输入 `$grilling` 或明确要求使用 grilling
- **THEN** Agent SHALL 调用该 skill 并一次只推进一个关键问题

#### Scenario: 用户进行普通设计讨论
- **WHEN** 用户未显式要求 grilling
- **THEN** Agent MUST 使用自然讨论或所选 schema 规则，不得自动调用 grilling

### Requirement: TDD 与 requesting review MUST 收窄触发范围
`test-driven-development` 和 `requesting-code-review` 的 skill 描述 MUST 限制为 `full` 明确调用或用户显式调用；`requesting-code-review` MUST 暂时保留，以满足 `subagent-driven-development` 的现有依赖。

#### Scenario: 普通 direct 或 lite 请求
- **WHEN** schema 和用户均未明确要求上述 skill
- **THEN** Agent MUST NOT 因 skill 描述的广泛匹配而自动调用它们

#### Scenario: full isolated 执行
- **WHEN** full schema 或 SDD 明确引用 TDD/requesting review
- **THEN** 两个 skill SHALL 仍可用且内部引用完整

## REMOVED Requirements

### Requirement: brainstorming skill SHALL exclude visual-companion

**Reason**: `brainstorming` skill 整体退休，普通讨论改为自然收敛，深度压力测试由显式 `grilling` 承担，因此其内部裁剪规则不再有意义。

**Migration**: 删除模板与 dogfood 的 `brainstorming` 目录和 AGENTS 默认引用；需要深度讨论时由用户显式调用 `grilling`。
