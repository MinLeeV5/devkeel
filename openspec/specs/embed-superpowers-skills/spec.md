# Managed Skills Lifecycle Specification

## Purpose

定义 DevKeel 分发 skill 的保留范围、显式触发边界，以及退休托管资产的安全清理、版本解除管理、跨平台识别与重复更新契约。
## Requirements
### Requirement: 新模板 MUST 排除已退休工作流 skills

模板和 dogfood 资产 MUST NOT 分发或引用 `grilling`、`openspec-explore`、
`automated-instrumented-debugging`、`receiving-code-review`、`writing-plans`、`executing-plans`、
`subagent-driven-development`、`requesting-code-review`、`verification-before-completion`、
`finishing-a-development-branch`、`test-driven-development` 与 `using-git-worktrees`。模板和
dogfood 资产 MUST NOT 分发或调用 `architecture-diagram` skill。

#### Scenario: 新项目初始化

- **WHEN** 用户使用当前模板运行 init
- **THEN** `.harness/skills` SHALL 不包含上述目录，现行 schema、commands 和 skills SHALL 不引用它们

### Requirement: 退休清理 MUST 依据版本表直接删除

除非某项迁移另有先安装目标或受管身份门禁，Init/Update MUST 删除版本表已移除的退休 skill
目录。内容修改、额外文件、未知版本、符号链接或同名用户 skill MUST NOT 阻止这类直接清理。

#### Scenario: 版本表移除 skill

- **WHEN** 退休 skill 名称从 builtin versions table 消失
- **THEN** 更新 SHALL 删除对应目录并清理版本键

### Requirement: Debug skill MUST 使用单一系统化入口

模板与 dogfood 资产 MUST 只分发 `systematic-debugging`，不得继续分发
`automated-instrumented-debugging` 别名。TypeScript MUST 按实际运行时复用 JavaScript emitter：
Browser、Electron Renderer/Preload 使用 Web helper，Node.js 与 Electron Main 使用 Node helper；
类型声明或模块适配不得复制 HTTP 协议实现。

#### Scenario: 检查 TypeScript 支持

- **WHEN** TypeScript 项目选择 Debug emitter
- **THEN** skill SHALL 引导其按运行时复用对应 JavaScript helper，不新增 TypeScript emitter

#### Scenario: 迁移旧 Debug skill

- **WHEN** 项目版本表登记 `automated-instrumented-debugging` 且新
  `systematic-debugging` 已成功安装
- **THEN** update SHALL 删除旧受管目录和旧版本键；若旧目录未登记或新安装被跳过，则 SHALL
  保留旧目录

### Requirement: 退休清理 MUST 可重入且路径安全

迁移计划 MUST 在执行前验证目标位于项目根内；重复执行 MUST 为 no-op，不得通过符号链接删除项目外内容。

#### Scenario: 计划后路径逃逸

- **WHEN** 退休目录在 plan 与 apply 之间被替换为指向项目外的符号链接
- **THEN** apply MUST 拒绝删除并保持外部内容完整

### Requirement: 保留 skills MUST 使用明确职责

`requirement-analysis` 与 `technical-design` MUST 支持结果导向文档和 Brainstorming 只读探针模式；
`brainstorming` MUST 承担 topic-only 事实梳理、方向探索、方案比较、方案检验与结论收束，并只在
用户授权的 change-draft 中维护 Living brainstorm；
`review-orchestrator` MUST 承担统一代码审查；`workflow-routing` MUST 只在普通开发的
Direct/Lite/Full 边界不清或出现持久化、治理升级信号时加载；`commit` MUST 只在用户明确选择交付
动作时调用，且 commit、push、PR MUST 分别授权。

#### Scenario: 普通流程完成

- **WHEN** Apply 或 Archive 已完成但用户未选择交付动作
- **THEN** Agent MUST NOT 因“收尾阶段”自动调用 commit、push 或 PR

#### Scenario: 模糊反馈需要澄清方向

- **WHEN** 用户表达评价、建议或可能性，但没有授权修改
- **THEN** Agent SHALL 使用 `brainstorming` 只读推进，不得转入 planning 或实现 skill

#### Scenario: 明确的低风险 Direct

- **WHEN** 当前会话能完成调查、最小修改和邻近验证，且没有持久化或治理信号
- **THEN** Agent SHALL 直接采用 Direct，不加载 `workflow-routing`

### Requirement: Planning skills MUST 优先遵循调用方模板

`requirement-analysis` 与 `technical-design` 收到用户、调用方或 artifact instruction 提供的具体输出结构时 MUST 保留其标题、顺序、必填字段与格式，不得追加自身默认模板章节。只有未提供具体结构时，skill SHALL 读取并按实际复杂度裁剪自身默认模板；单独提供输出路径或内容约束不构成结构模板。

#### Scenario: 调用方提供具体模板

- **WHEN** 调用方给出明确标题、字段或顺序
- **THEN** skill SHALL 只按该模板组织结果，不得混入默认模板的额外章节

#### Scenario: 只提供输出路径

- **WHEN** 调用方指定输出文件但没有提供具体结构
- **THEN** skill SHALL 将默认模板裁剪后写入指定位置

### Requirement: Skill metadata MUST 与版本表一致

所有受管 skill 的 frontmatter metadata.version MUST 与 `versions-yml.yml` 注册值一致；OpenSpec skills MUST 标记 author `openspec`，DevKeel skills MUST 标记真实 DevKeel 来源。

#### Scenario: 发布模板校验

- **WHEN** 检查模板 skill 与版本表
- **THEN** 每个注册 skill SHALL 存在且版本一致，退休 skill SHALL 不再注册

### Requirement: 讨论能力 MUST 以唯一 DevKeel Brainstorming skill 分发

模板与 dogfood 资产 MUST 只分发一个名为 `brainstorming` 的讨论 skill，不得保留 `grilling`、
`openspec-explore` 或兼容别名。该 skill MUST 标记 DevKeel 来源和版本 `8.0.0`，其 OpenSpec
能力 SHALL 位于同一 skill 的条件 reference 中；模板与 dogfood 副本必须一致。

#### Scenario: 检查当前受管资产

- **WHEN** 检查模板、dogfood skills 与 builtin versions table
- **THEN** 只 SHALL 存在 `brainstorming@8.0.0` 讨论 skill，且 author 为 `devkeel`

#### Scenario: 初始化新项目

- **WHEN** 用户使用当前模板运行 init
- **THEN** 项目 SHALL 获得 `brainstorming` 及其 OpenSpec reference，不得获得两个旧 skill 目录
