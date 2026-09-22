## ADDED Requirements

### Requirement: 讨论能力 MUST 以唯一 Harness Brainstorming skill 分发

模板与 dogfood 资产 MUST 只分发一个名为 `brainstorming` 的讨论 skill，不得保留 `grilling`、
`openspec-explore` 或兼容别名。该 skill MUST 标记 Harness 来源和版本 `7.0.0`，其 OpenSpec
能力 SHALL 位于同一 skill 的条件 reference 中；模板与 dogfood 副本必须一致。

#### Scenario: 检查当前受管资产

- **WHEN** 检查模板、dogfood skills 与 builtin versions table
- **THEN** 只 SHALL 存在 `brainstorming@7.0.0` 讨论 skill，且 author 为 `devkeel`

#### Scenario: 初始化新项目

- **WHEN** 用户使用当前模板运行 init
- **THEN** 项目 SHALL 获得 `brainstorming` 及其 OpenSpec reference，不得获得两个旧 skill 目录

## MODIFIED Requirements

### Requirement: 新模板 MUST 排除已退休工作流 skills

模板和 dogfood 资产 MUST NOT 分发或引用 `grilling`、`openspec-explore`、
`systematic-debugging`、`receiving-code-review`、`writing-plans`、`executing-plans`、
`subagent-driven-development`、`requesting-code-review`、`verification-before-completion`、
`finishing-a-development-branch`、`test-driven-development` 与 `using-git-worktrees`。

#### Scenario: 新项目初始化

- **WHEN** 用户使用当前模板运行 init
- **THEN** `.harness/skills` SHALL 不包含上述目录，现行 schema、commands 和 skills SHALL 不引用它们

### Requirement: 保留 skills MUST 使用明确职责

`requirement-analysis` 与 `technical-design` MUST 输出结果导向文档；`brainstorming` MUST 承担
严格只读的事实梳理、方向探索、方案比较、方案检验与结论收束；`human-review` MUST 仅显式调用；
`review-orchestrator` MUST 承担统一代码审查；`commit` MUST 只在用户明确选择交付动作时调用，且
commit、push、PR MUST 分别授权。

#### Scenario: 普通流程完成

- **WHEN** Apply 或 Archive 已完成但用户未选择交付动作
- **THEN** Agent MUST NOT 因“收尾阶段”自动调用 commit、push 或 PR

#### Scenario: 模糊反馈需要澄清方向

- **WHEN** 用户表达评价、建议或可能性，但没有授权修改
- **THEN** Agent SHALL 使用 `brainstorming` 只读推进，不得转入 planning 或实现 skill
