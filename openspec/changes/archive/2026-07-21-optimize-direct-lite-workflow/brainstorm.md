## 一句话描述

将 Harness 的默认开发编排重构为 `direct`、`lite`、`full` 三档，让大多数日常需求以最少必要流程完成，同时保留复杂需求的完整治理能力。

## 需求背景

当前默认 OpenSpec / `superpowers-lite` 流程把需求分析、技术设计、细粒度计划、worktree、TDD、多轮审查、验证和回顾串成重链路。对于能力较强的模型和普通开发任务，这些固定步骤带来的上下文、模型调用和等待成本大于收益。目标不是取消工程质量，而是把规划、测试、审查和提交从“默认必做”改为“按协调需要和风险触发”。

## 项目现状与架构分析

- `templates/agents-md.md` 目前按规模信号把任务路由为直接执行或 OpenSpec，并把外部契约等场景一律设为 OpenSpec 强制条件；brainstorm 还会自动调用重型 skill。
- `templates/openspec/schemas/superpowers-lite/` 实际包含 brainstorm、design、specs、tasks、human-review、apply、verify、retrospective，并在 apply 中编排 worktree、执行器分档、TDD 和多轮 review，因此名称虽为 lite，语义已是 full。
- `/opsx:new|continue|ff|propose|apply` 保持 OpenSpec 上游通用实现；Harness 的 schema 选择和生命周期覆盖由 AGENTS 路由与 schema instructions 承担。
- `src/commands/update.ts` 与 `src/lib/templates.ts` 当前只同步模板中存在的 schema，不会删除废弃 schema，也不会改写 active/archive change 的 `.openspec.yaml`；`src/lib/config.ts`、版本注册表和多组测试还直接引用 `superpowers-lite`。

## 风险与约束

- `superpowers-lite` 必须硬改名为 `full`，不保留兼容别名；`devkeel update` 需原子地迁移默认配置、settings、全部 active/archive change 元数据和版本注册，再删除旧 schema 目录与旧版本键，同时保持既有 full change 的流程语义。
- 用户自定义 schema 和内容不可被误删；迁移只匹配受管的精确旧名称。即使内置版本已经最新，只要检测到遗留引用也必须执行迁移。
- direct 到 lite 的升级不能丢弃已有调查与代码；只有完成对应验证的工作才可在 tasks 中标记完成。lite 到 full 的自动迁移本期不做，发现风险时暂停并建议另建 full change。
- 工作区已有的用户改动必须保留。所有路由与轻量化行为需要结构化场景测试，而不是依赖运行时遥测或模型调用次数上限。

## 目标用户与角色

- 日常开发者：希望小修复和普通功能快速落地，不为低风险工作维护冗余 artifact。
- 复杂变更负责人：需要在外部协作、兼容、迁移或高风险场景继续使用完整流程。
- Harness 维护者：需要稳定的模板升级、旧资产清理和可回归的双 schema 契约。
- Agent：需要清晰、渐进且允许用户覆盖的路由规则，而不是依赖文件数或机械评分。

## 核心功能用例

1. 明显无需持久化协调的任务直接执行；不明确但也无 full 风险时默认进入 `lite`，边界情况偏向 direct。
2. 自动进入 lite 前若仍有会改变范围、方案或验收的问题，Agent 先讨论到确认；显式 `/opsx:new` 可先创建脚手架。lite 仅生成 `brief.md -> tasks.md`，apply 成功后轻量自动归档，失败或暂停则保留 active change 以便恢复。
3. lite apply 由当前 Agent 直接执行，并始终做邻近验证和低成本 diff 自审；TDD、独立 code review、worktree、subagent 和 commit 仅在风险、项目约束或用户授权时触发。任务只有在其验证通过后才能勾选。
4. `/opsx:*` 对用户保持统一且内容不修改：显式指定 schema 时服从用户；`/opsx:new` 有上下文时由 AGENTS 在 lite/full 间判断，无上下文时默认 full；已有 change 按其 schema 正常 continue/apply。
5. 仅当存在外部控制的消费者、可观察契约语义或形状变化，并产生协调、版本、迁移或回滚成本时，才建议 full，且须用户确认。单纯修改 API、CLI 或数据库代码不自动等同于 full。
6. `devkeel update` 将旧 `superpowers-lite` 安装完整迁移到 `full`，同步新增 `lite`，删除旧受管资产；迁移后旧 full change 仍可继续和 apply。

## 需求边界

**In Scope:**

- 新增 `lite` schema 及简洁的 brief、tasks 和 apply/归档契约。
- 将现有 `superpowers-lite` 全量重命名为 `full`，并更新 AGENTS 路由、schemas、版本表、文档和测试引用；OpenSpec commands/skills 及 CLI 保持原样。
- 重写默认任务路由；加入 direct 运行基线、升级确认门禁和外部契约判定。
- 新增显式轻量 `grilling` skill；移除 `brainstorming`、`systematic-debugging`、`receiving-code-review`，将 TDD 与 `requesting-code-review` 收窄为 full 或显式触发。
- 为初始化、更新迁移、双 schema、命令恢复和 lite 生命周期补齐测试。

**Out of Scope:**

- 继续优化 `full` 内部 artifact 或执行器；本期只保持其既有语义。
- lite change 自动升级/转换为 full change。
- 基于耗时、token 或模型调用次数的运行时遥测和硬限制。
- 新增 `/opsx:lite` 等命令或独立 lite skill；继续复用现有 `/opsx:*`。

## 探索过的替代方向

- 继续以任务规模或可独立交付项计分：判断容易受拆分方式影响，且不能直接反映是否需要跨会话协调，因此改为“持久化协调需要 + 风险信号”。
- direct 也透明创建 OpenSpec：会重新引入管理成本，因此 direct 保持无 artifact，只有 lite/full 使用 OpenSpec。
- 为旧 schema 保留别名：会长期增加分支和认知负担，因此采用一次性硬迁移与旧资产删除。
- lite 固定执行 TDD、review 或 commit：对多数任务成本过高，改为最低验证基线加风险触发。

## 验收标准

- 场景测试证明：简单任务不创建 change；普通非 direct 任务进入 lite；关键问题确认后才产物化；lite 只有 brief/tasks，支持断点恢复，验证失败不归档，成功后自动归档。
- direct 中途复杂化会先询问升级；外部协调风险只建议 full 并等待确认；无上下文 `/opsx:new` 默认 full。
- `devkeel update` 能在版本已最新或旧引用位于 archive 时仍完成迁移，并确认旧 schema 目录、旧版本键及受管旧 skill 已删除。
- 旧 full change 迁移后可继续/apply；lite apply 不强制 TDD、独立 review、worktree、commit 或 subagent，风险场景可按需触发 specialist。
- schema 校验、模板与 dogfood 同步检查、CLI 单元测试和双 schema 集成场景全部通过。
