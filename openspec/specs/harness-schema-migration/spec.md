# DevKeel Schema Migration Specification

## Purpose

规定内置 schema 从 `superpowers-lite`、`harness-lite`、`harness-full` 迁移到 `lite` 与 `full` 时的发现、安全改写、资产清理和可恢复性要求。
## Requirements
### Requirement: 内置 schema MUST 使用新身份发布
模板与 dogfood 资产 MUST 包含 `lite` 和 `full`，且不得继续注册或安装 `superpowers-lite`、`harness-lite` 或 `harness-full`；旧 selector 迁移到 `full` 后 MUST 保留已有 artifact 状态与任务进度，但执行采用新的 Full Apply，并通过明确 no-backfill 规则兼容已经越过的旧 planning artifact。

#### Scenario: 全新初始化
- **WHEN** 用户在新项目执行 `devkeel init`
- **THEN** `openspec/schemas/` SHALL 包含两个新 schema，不包含 `superpowers-lite`

#### Scenario: 检查版本注册
- **WHEN** 读取模板和项目 `.harness/versions.yml`
- **THEN** schemas SHALL 注册 `lite` 与 `full`，且没有旧键

### Requirement: Update MUST 探测所有旧 selector
`devkeel update` MUST 扫描 OpenSpec config、settings、active/archive change 元数据、旧 schema 目录和版本注册；即使组件版本已经最新，只要存在旧引用或退休受管资产也不得提前返回。

#### Scenario: 版本已最新但 archive 仍引用旧 schema
- **WHEN** `.harness/versions.yml` 已是新版本但归档 change 的 `.openspec.yaml` 仍为 `superpowers-lite`
- **THEN** update MUST 生成并执行迁移计划

#### Scenario: 用户具有自定义 schema
- **WHEN** selector 或目录名称不严格等于 `superpowers-lite`、`harness-lite` 或 `harness-full`
- **THEN** update MUST 保持该配置和目录不变

### Requirement: Schema 迁移 MUST 遵循安全顺序
update MUST 先安装并验证对应的目标 schema（`lite` 或 `full`），再精确改写 `config.yaml` 顶层 schema 和所有 `changes/**/.openspec.yaml`，确认旧 selector 清零后才删除旧 schema 目录和旧版本键。

#### Scenario: 迁移 active 与 archived change
- **WHEN** active 或 `changes/archive/**` 的 `.openspec.yaml` 顶层 schema 严格等于 `superpowers-lite`
- **THEN** update SHALL 只把该值改为 `full`，保留文件中其他字段和 artifact 内容

#### Scenario: 元数据无法解析
- **WHEN** 任一候选配置或 change 元数据损坏
- **THEN** update MUST 在删除旧 schema 前失败并给出文件路径，使旧 change 仍可被原 schema 解析

### Requirement: Schema 简称迁移 MUST 保留流程选择

`harness-lite` MUST 改为 `lite`，`harness-full` MUST 改为 `full`；已有 `lite`、`full` 和自定义 selector MUST 保持不变。全新项目默认 `lite`，更新不得将已有 Full 流程改为 Lite。

#### Scenario: 迁移旧品牌 selector
- **WHEN** 根配置或 active/archive change 使用 `harness-lite` 或 `harness-full`
- **THEN** update SHALL 改为相应简称，保留 YAML 注释、其他字段和 artifact 进度，并在旧引用清零后清理旧 schema 目录

#### Scenario: 新名称与自定义 schema 冲突
- **WHEN** 项目存在未登记为受管且内容不同于分发模板的 `lite` 或 `full` 目录
- **THEN** init/update MUST 在覆盖资产前停止，保留目录及 selector，并提示先重命名自定义 schema

### Requirement: Schema 迁移 MUST 幂等且可恢复
迁移操作 MUST 支持重复执行；部分文件已迁移时 SHALL 从剩余旧引用继续，成功后的再次执行不得产生额外变更。

#### Scenario: 中途写入失败后重跑
- **WHEN** 新 schema 已存在且部分 selector 已更新，但旧 schema 尚未删除
- **THEN** 下一次 update SHALL 完成剩余迁移而不回退已更新文件

#### Scenario: 完整迁移后重跑
- **WHEN** 所有 selector、目录和版本键均已处于目标状态
- **THEN** 迁移 SHALL 返回 no-op

### Requirement: Update MUST 按资产迁移约束清理退休的受管 skills

update MUST 删除旧版本表证明由 DevKeel 管理的 `grilling`、`openspec-explore`、
`automated-instrumented-debugging` 和 `receiving-code-review` 目录。`grilling` 与
`openspec-explore` 的删除 MUST 服从讨论 skill 迁移的先安装后退休顺序；
`automated-instrumented-debugging` 的删除 MUST 等到 `systematic-debugging` 已安装，并且旧版本键
证明旧目录受管。未登记的同名 Debug 目录 MUST 保留。

#### Scenario: 旧项目含退休受管 skill

- **WHEN** 旧版本表注册了任一退休 skill 且对应目录存在
- **THEN** update SHALL 按适用迁移顺序删除这些目录并从新版本表移除键

#### Scenario: 目录命中退役列表

- **WHEN** `automated-instrumented-debugging` 目录存在但旧版本表未登记该 skill
- **THEN** update MUST 保留该目录，即使新 `systematic-debugging` 已安装

#### Scenario: 用户跳过新 Debug skill

- **WHEN** 旧版本表登记 `automated-instrumented-debugging`，但用户跳过
  `systematic-debugging` 更新
- **THEN** update MUST 保留旧目录和旧版本键

### Requirement: 自动提交 MUST 精确包含迁移元数据
当 update 的既有自动提交能力启用时，提交路径 MUST 包含实际改写的 `.openspec.yaml`，但不得 stage 整个 `openspec/changes/` 或带入未参与迁移的用户 artifact 改动。

#### Scenario: 仅一个 active change 被迁移
- **WHEN** update 改写一个 `.openspec.yaml` 且同目录 tasks.md 有用户改动
- **THEN** 自动 stage SHALL 包含该元数据文件且排除 tasks.md

### Requirement: 旧 Full Change MUST 在迁移后保持可执行
从 `superpowers-lite` 改名迁移的已有 change MUST 在 `full` 下保持 status、continue 和 apply instructions 可用、保留已有 artifact 与任务进度，并采用新 Full Apply；不得因缺少新流程引入前已越过的 planning artifact 而追溯阻断。

#### Scenario: 迁移未完成的旧 change
- **WHEN** update 改写一个仍有待办任务的旧 change
- **THEN** OpenSpec status 和 apply instructions SHALL 成功，待办进度与迁移前一致，且 Apply SHALL 忽略旧 mode/commit 编排字段并使用当前 Agent 执行器

### Requirement: 讨论 skill 迁移 MUST 先安装目标再退休旧入口

Update MUST 将模板版本表中注册的当前 `brainstorming`、兼容 `/opsx:explore` command、`grilling` 与
`openspec-explore` 的退休及版本状态作为不可部分跳过的一致性边界。新 skill 与 command 有效前，
Update MUST NOT 使旧入口不可用；失败或中断后，已安装资产与 versions MUST 恢复到迁移前的一致
状态，或收敛到完整有效的新状态，不得留下 command 指向缺失 skill、半覆盖目录或错误最新版本。
迁移 MUST 保持项目安全边界外内容完整，并 SHALL 在全部目标有效后支持重复执行 no-op。

#### Scenario: 当前项目含两个旧讨论 skills

- **WHEN** 版本表或受管目录包含 `grilling` 或 `openspec-explore`
- **THEN** Update SHALL 保证当前注册版本的 `brainstorming` 与兼容 command 可用后再退休旧入口，并使 versions 与最终资产一致

#### Scenario: 项目含旧 Superpowers Brainstorming

- **WHEN** 项目注册或安装旧 `brainstorming@6.0.3`
- **THEN** Update MUST 完整替换同名受管目录，不得保留其额外文件、固定流程、设计文档、commit
  或 `writing-plans` 交接行为

#### Scenario: 新目标安装或校验失败

- **WHEN** 新 brainstorming 的必需文件、metadata、版本或 OpenSpec reference 安装或校验失败
- **THEN** Update MUST 停止 consolidation，并保持旧受管目录与 versions 文件字节不变

#### Scenario: Command 切换失败

- **WHEN** `/opsx:explore` command 的写入、校验或替换失败
- **THEN** Update MUST 恢复迁移前的 skill、command、旧目录和 versions，使旧入口仍然可用

#### Scenario: 进程在目录切换期间中断

- **WHEN** 下次 update 发现上次迁移留下的不完整目标或恢复状态
- **THEN** Update MUST 先恢复一致状态再重新规划，或在新目标已完整有效时只完成剩余清理

#### Scenario: 版本最新但目标结构损坏

- **WHEN** versions 已注册模板版本表中的当前版本，但目标 skill 的必需结构、metadata、reference 或 command 缺失或不匹配
- **THEN** Update MUST 仍生成 required migration 并修复目标，不得提前返回 no-op

#### Scenario: 目标或父路径不安全

- **WHEN** skill 或 command 的目标或父路径通过 symlink 逃逸项目安全边界
- **THEN** Update MUST 在替换或删除前失败，并保持项目外内容与 versions 完整

#### Scenario: 混合状态恢复并收敛

- **WHEN** 上次迁移中断后，新 skill 或部分旧目录已经处于目标状态
- **THEN** Update SHALL 根据实际资产与版本恢复或完成剩余迁移，全部结构有效后的再次执行 MUST 为 no-op

#### Scenario: 同轮跳过无关组件

- **WHEN** 用户完成必需 discussion skill 迁移，但跳过另一项普通受管组件更新
- **THEN** Update MUST 只提交实际成功项的版本变化，被跳过组件 SHALL 保留原版本并在下次 update 继续提示

### Requirement: AGENTS 框架更新 MUST 独立保持可重试

Update MUST 将当前 `AGENTS.md` 框架与模板保留用户区后的渲染结果进行比较，并 SHALL 把框架漂移
作为独立更新信号。用户拒绝或跳过框架更新 MUST NOT 将其记录为已应用；即使 versions 与其他
受管资产均已最新，下一次 update 也 MUST 越过 no-op 早退并允许重新应用框架。框架未应用时，
Update MUST NOT 声称 brainstorming 自动路由已生效。

#### Scenario: 用户首次拒绝框架更新

- **WHEN** skill consolidation 已成功提交，但用户拒绝应用新的 AGENTS 框架
- **THEN** Update SHALL 保留用户的 AGENTS 内容并报告自动路由尚未生效

#### Scenario: 版本最新后再次更新

- **WHEN** versions 已最新但 AGENTS framework content 仍与当前模板渲染结果不同
- **THEN** Update MUST 再次提供框架更新，不得输出所有组件均为最新后直接退出
