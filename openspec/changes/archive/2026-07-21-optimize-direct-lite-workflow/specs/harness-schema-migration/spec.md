## ADDED Requirements

### Requirement: 内置 schema MUST 使用新身份发布
模板与 dogfood 资产 MUST 包含 `lite` 和 `full`，且不得继续注册或安装 `superpowers-lite`；`full` MUST 保留旧 `superpowers-lite` 的 artifact 与 apply 语义。

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
- **WHEN** selector 或目录名称不严格等于 `superpowers-lite`
- **THEN** update MUST 保持该配置和目录不变

### Requirement: Schema 迁移 MUST 遵循安全顺序
update MUST 先安装并验证 `full`，再精确改写 `config.yaml` 顶层 schema、`settings.json` 的 `defaults.schema` 和所有 `changes/**/.openspec.yaml`，确认旧 selector 清零后才删除旧 schema 目录和旧版本键。

#### Scenario: 迁移 active 与 archived change
- **WHEN** active 或 `changes/archive/**` 的 `.openspec.yaml` 顶层 schema 严格等于 `superpowers-lite`
- **THEN** update SHALL 只把该值改为 `full`，保留文件中其他字段和 artifact 内容

#### Scenario: 元数据无法解析
- **WHEN** 任一候选配置或 change 元数据损坏
- **THEN** update MUST 在删除旧 schema 前失败并给出文件路径，使旧 change 仍可被原 schema 解析

### Requirement: Schema 迁移 MUST 幂等且可恢复
迁移操作 MUST 支持重复执行；部分文件已迁移时 SHALL 从剩余旧引用继续，成功后的再次执行不得产生额外变更。

#### Scenario: 中途写入失败后重跑
- **WHEN** 新 schema 已存在且部分 selector 已更新，但旧 schema 尚未删除
- **THEN** 下一次 update SHALL 完成剩余迁移而不回退已更新文件

#### Scenario: 完整迁移后重跑
- **WHEN** 所有 selector、目录和版本键均已处于目标状态
- **THEN** 迁移 SHALL 返回 no-op

### Requirement: Update MUST 确定性删除本次退休的受管 skills
update MUST 删除旧版本表证明由 Harness 管理的 `brainstorming`、`systematic-debugging` 和 `receiving-code-review` 目录，不得因通用废弃资产确认被拒绝而永久遗留；未被版本表标记为受管的同名用户资产 MUST 保留。

#### Scenario: 旧项目含三项受管 skill
- **WHEN** 旧版本表注册了退休 skill 且对应目录存在
- **THEN** update SHALL 删除这些目录并从新版本表移除键

#### Scenario: 同名目录不是 Harness 受管资产
- **WHEN** 项目版本表从未注册该同名 skill
- **THEN** update MUST NOT 通过本次迁移删除它

### Requirement: 自动提交 MUST 精确包含迁移元数据
当 update 的既有自动提交能力启用时，提交路径 MUST 包含实际改写的 `.openspec.yaml`，但不得 stage 整个 `openspec/changes/` 或带入未参与迁移的用户 artifact 改动。

#### Scenario: 仅一个 active change 被迁移
- **WHEN** update 改写一个 `.openspec.yaml` 且同目录 tasks.md 有用户改动
- **THEN** 自动 stage SHALL 包含该元数据文件且排除 tasks.md

### Requirement: 旧 Full Change MUST 在迁移后保持可执行
从 `superpowers-lite` 改名迁移的已有 change MUST 在 `full` 下保持 status、continue 和 apply 的 artifact 状态与执行语义。

#### Scenario: 迁移未完成的旧 change
- **WHEN** update 改写一个仍有待办任务的旧 change
- **THEN** OpenSpec status 和 apply instructions SHALL 成功，且待办进度与迁移前一致
