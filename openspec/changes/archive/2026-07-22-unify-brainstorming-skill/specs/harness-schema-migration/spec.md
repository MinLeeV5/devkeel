## ADDED Requirements

### Requirement: 讨论 skill 迁移 MUST 先安装目标再退休旧入口

Update MUST 将 `brainstorming@7.0.0`、兼容 `/opsx:explore` command、`grilling` 与
`openspec-explore` 的退休及版本状态作为不可部分跳过的一致性边界。新 skill 与 command 有效前，
Update MUST NOT 使旧入口不可用；失败或中断后，已安装资产与 versions MUST 恢复到迁移前的一致
状态，或收敛到完整有效的新状态，不得留下 command 指向缺失 skill、半覆盖目录或错误最新版本。
迁移 MUST 保持项目安全边界外内容完整，并 SHALL 在全部目标有效后支持重复执行 no-op。

#### Scenario: 当前项目含两个旧讨论 skills

- **WHEN** 版本表或受管目录包含 `grilling` 或 `openspec-explore`
- **THEN** Update SHALL 保证 `brainstorming@7.0.0` 与兼容 command 可用后再退休旧入口，并使 versions 与最终资产一致

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

- **WHEN** versions 已注册 7.0.0，但目标 skill 的必需结构、metadata、reference 或 command 缺失或不匹配
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

## MODIFIED Requirements

### Requirement: Update MUST 直接删除本次退休的受管 skills

update MUST 删除旧版本表证明由 Harness 管理的 `grilling`、`openspec-explore`、
`systematic-debugging` 和 `receiving-code-review` 目录；目录内容是否被本地修改、是否存在额外文件或
是否与同名用户资产冲突都不得阻止删除。`grilling` 与 `openspec-explore` 的删除 MUST 服从讨论
skill 迁移的先安装后退休顺序。

#### Scenario: 旧项目含退休受管 skill

- **WHEN** 旧版本表注册了任一退休 skill 且对应目录存在
- **THEN** update SHALL 按适用迁移顺序删除这些目录并从新版本表移除键

#### Scenario: 目录命中退役列表

- **WHEN** 目录名称命中退休 managed skill 列表
- **THEN** update MUST 删除该目录，不再保留同名用户 skill
