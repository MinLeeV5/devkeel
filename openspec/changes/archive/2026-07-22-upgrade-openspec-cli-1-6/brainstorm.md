# 变更 Brainstorm

## 目标

将 Harness 内置的 `@fission-ai/openspec` 从 1.4.1 升级到 1.6.0，并让现有 11 个
OPSX workflow、模板版本契约与回归测试准确反映新的上游运行时基线。完成后，Harness 的
自定义 Lite/Full schema 能继续工作，同时获得 1.6.0 的校验与归档安全修复。

## 现状与问题

- `package.json` 与 lockfile 精确锁定 OpenSpec 1.4.1，Harness 直接解析依赖包内的
  `bin/openspec.js` 并透传参数。
- 现有 11 个 OpenSpec skills 在 `templates/` 与 `.harness/` 中各有一份，全部声明
  `Requires openspec CLI 1.4.x`、`upstreamVersion/generatedBy: 1.4.1`；上游契约测试也硬锁
  1.4.1。
- Harness Full 使用 `specs/**/*.md`，且以 `brainstorm.md` 而非 `proposal.md` 作为首个
  artifact。1.4.1 的 validate change 解析和嵌套 delta spec 发现与此存在已知偏差。
- 1.6.0 修复了失败 archive 返回成功、过期 MODIFIED 丢失已有 Scenario、requirement reader
  不一致以及 task/spec glob resolution 等问题，直接提升当前工作流的正确性。
- 当前工作区已包含同一批 OPSX skills、commands、schemas 与测试的用户修改；升级必须基于
  当前内容增量完成，不覆盖或回退这些修改。

## 范围与验收

In Scope：

- 将运行时依赖和 lockfile 升级到 OpenSpec 1.6.0，并把 Node engine 声明对齐到依赖实际要求。
- 以 1.6.0 官方 workflow 为新基线，重审现有 11 个本地化 skills；保留 Harness 的 Lite/Full
  路由、门禁、wrapper 命令与 archive 目标冲突预检等明确覆盖。
- 同步 `templates/`、`.harness/`、版本表、兼容元数据与上游契约测试。
- 为运行时与 workflow provenance 的同步升级、上游新增能力的显式排除和 repo-local 写入边界
  增加持久化 OPSX 契约。
- 补充与 Harness 直接相关的 1.6 回归：无 proposal 的自定义 change、嵌套 delta spec、失败
  archive 非零退出码、过期 MODIFIED Scenario 防丢失，以及现有 new/status/instructions 流程。

Out of Scope：

- 不启用或集成 Stores、doctor、context、workset。
- 不新增 `openspec-update-change` 或 `/opsx:update`；该能力留作独立决策与变更。
- 不新增 TRAE、Oh My Pi 平台支持，不运行 `openspec init/update` 覆盖 Harness 自有模板。

验收条件：

- Harness CLI 报告 OpenSpec 1.6.0，两套 schema 均通过验证。
- 现有 11 个 skills 的 provenance、compatibility、本地不变量和上游契约测试一致且可解释。
- 新增的 1.6 关键回归测试通过；聚焦测试、全量测试与 TypeScript lint 通过。
- 最终 diff 经审查无 P0/P1，且未覆盖当前工作区既有修改。

## 方案方向与影响

采用“运行时升级 + 现有 workflow 基线重审”的一次性交付：先对比 1.4.1 与 1.6.0 官方 skill
factory，再逐项判断哪些语义应移植、哪些 Store/workspace 变化应作为 Harness 覆盖记录。优先
修改依赖、测试契约和兼容元数据；只有官方行为变化确实适用于单仓库 Harness 时才调整 skill
正文。schema 已通过 1.6.0 烟测，除测试暴露兼容问题外不做无关改写。

## 约束、风险与决策

- OpenSpec 1.6.0 的 Store root-selection 与 Harness 固定在当前 Harness 根仓库执行的约束不同，
  不直接复制 Store guidance。
- 不复制上游生成器新增的 `allowed-tools: Bash(openspec:*)`，也不改成预批准 Harness 的
  `npx devkeel@latest openspec` wrapper；后者会放行一次可解析远端 `latest` 的命令，继续
  使用平台正常权限控制更安全。
- 1.6.0 的 `actionContext` 固定为 repo-local；删除不可达的 `workspace-planning` 分支，并让 Apply
  以 `allowedEditRoots` 作为版本无关的写入边界。
- 1.6.0 仍可能在发现同日 archive 目标冲突前写入 specs，因此 Harness 现有目标预检继续保留。
- `templates/versions-yml.yml` 是模板资产版本真源；任何 skill 内容变化都同步升级对应版本。
- 不提交、不推送、不创建 PR；这些交付动作需用户另行授权。

## 流程选择

采用 Harness Lite：该升级需要跨依赖、模板和测试的简短持久化协调，但不启用 beta Store、
不改变 Harness 对外 workflow 命名，也没有需要 Full 治理的数据迁移或高风险外部契约变化。
