---
name: openspec-onboard
description: 用真实小型代码任务，分阶段讲解并完成第一轮 OpenSpec 工作流。
license: MIT
metadata:
  author: openspec
  version: "2.4"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

带用户边做边学，完成第一轮真实 OpenSpec cycle。本 skill 保留 OpenSpec 1.12.0 官方 Onboard 的
11 阶段教学、真实任务、轻量讲解和优雅退出；artifact 名称与顺序改为动态 schema 驱动。

## Preflight

```bash
npx devkeel@latest openspec --version
```

CLI 不可用时说明问题并停止。可用时说明教程约需 15～20 分钟；用户可以随时暂停或只查看
命令参考。

## Phase 1：欢迎

说明本轮会：选择真实小任务、简短 Explore、创建 change、逐个理解 planning artifacts、实施
tasks、验证并归档。强调不同 schema 的 artifact 图不同，以 CLI status 为准。

## Phase 2：选择真实任务

只读扫描代码库，寻找 3～4 个适合入门的候选，例如 TODO/FIXME、缺少错误处理或验证、邻近
测试缺口、类型问题和调试残留；查看最近 git 活动帮助判断上下文。每个候选列出位置、
预计范围和适合作为教程的原因，让用户明确选择。

没有明显候选时询问用户想完成的小任务。任务过大时建议切出最小有用部分，但这是软守卫；
用户可以坚持原范围。

## Phase 3：Brainstorming 演示

用 1～2 分钟读取相关入口、邻近测试和直接依赖，说明 topic-only、单题访谈和阶段与关键缺口提示。解释
需求/技术探针只发现下一项 gap，不生成第二套设计。

按官方教学节奏暂停，等待用户确认理解后再创建 change。

## Phase 4：创建 change 与 Living brainstorm

说明 OpenSpec 只在跨会话、交接、并行或审计有价值时持久化。加载并遵循
`openspec-new-change`；默认 Lite，只有显式选择或风险确认才用 Full。New 在同一轮把
已确认上下文写入 Living brainstorm，并继续一个问题，不只创建空脚手架。

创建后展示 status 返回的 `schemaName`、`planningHome`、`changeRoot`、`artifactPaths`、
`actionContext` 和 artifact 顺序。不得展示假想固定目录树。

## Phase 5～8：逐个学习 planning artifacts

先通过 Brainstorming 闭合关键缺口，满足快照确认条件后展示全部 D/A，并由用户明确确认。
然后循环投影每个 Apply 前置 artifact，每一步保持官方 **EXPLAIN → DO → SHOW → PAUSE**：

1. **EXPLAIN**：依据当前 artifact 的 schema `instruction`，用简短中文说明它回答什么问题；
2. **DO**：加载并遵循 `openspec-continue-change`，解析 `context`、`rules`、`template`、
   `resolvedOutputPath` 和 `dependencies`；先读取全部依赖；
3. **SHOW**：简短展示 artifact 与 D/A 来源，不要求通读整份 Markdown；
4. **PAUSE**：普通 Continue 每次最多一个 artifact；只有发现新决定才回到单题访谈。

例如 Lite 常见 brainstorm 与 tasks；Full 可能包含 design/specs/tasks；其他 schema 使用它自己的
artifact 图。不要沿用固定 proposal→specs→design→tasks，也不要为教学虚构 schema 不存在的
artifact。

对实际 artifacts 解释通用概念：

- 目标/范围类：为什么做、改变什么、如何验收；
- specs：可验证的 requirement/scenario 行为；
- design：方案、关键决策与权衡；
- tasks：按 `- [ ]` 跟踪的可实施工作和最终验证。

当 `applyRequires` 全部完成时，展示 status 和 apply-ready 结果，等待用户确认进入实现。

## Phase 9：Apply

解释 Apply 会读取所有 `contextFiles`，按 tasks 实施并即时勾选。用户确认后加载并遵循
`openspec-apply-change`：

- 逐 task 说明正在做什么；
- 轻量引用 artifact 如何影响实现；
- 修改代码、运行邻近验证、真实完成后勾选；
- 遇到不清楚、design 问题、错误或用户中断时暂停。

不要逐行授课，也不要绕过 schema/DevKeel 门禁。

## Phase 10：Verify 与 Archive

实现完成后解释验证和归档的作用：

- Lite：使用 tasks 定义的验证并按 Lite 快速收尾；
- Full：按 Apply 的 review tail、`openspec-verify-change` 和 Full archive 门禁完成；
- 其他 schema：遵循动态 instruction。

归档前展示 artifact/task/spec sync 摘要。加载并遵循 `openspec-archive-change`；不得手工移动
目录。成功后展示由 `planningHome.changesDir` 和 UTC 日期确定的实际 archive 路径。

## Phase 11：复盘与下一步

总结这轮实际经历：Explore、New、planning artifacts、Apply、Verify（如适用）、Archive；说明
同样的 action-based 节奏可用于不同规模 change，artifacts 可在实施中发现问题时更新。

提供简短命令参考：

| 入口 | 用途 |
|------|------|
| `/opsx:explore` | 只思考、调查和澄清 |
| `/opsx:new` / `/opsx:continue` | 建立 Living brainstorm，并在确认后逐个投影 |
| `/opsx:ff` | 显式快速推进，但不跳过用户决定与快照确认 |
| `/opsx:apply` | 实施 tasks |
| `/opsx:verify` | 验证实现与 artifacts |
| `/opsx:sync` | 单独同步 delta specs |
| `/opsx:archive` | 归档完成的 change |

## 优雅退出与守卫

用户暂停时报告 `changeRoot`、当前 status、下一条命令和恢复上下文；工作不会丢失。用户只想看
命令时给出上表并停止。

关键转换遵循 EXPLAIN → DO → SHOW → PAUSE；使用真实任务、轻量讲解、尊重范围选择。不得跳过
实际 schema 阶段、强制 Full、模拟假任务、施压继续，或自动 commit、push、PR。
