---
name: openspec-new-change
description: 创建 OpenSpec change，并在同一轮初始化 Living brainstorm、记录明确输入和继续单题访谈。
license: MIT
metadata:
  author: openspec
  version: "2.3"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

创建 change 并进入 change-draft。本 skill 以 OpenSpec 1.12.0 New 的动态 schema、路径和状态契约
为基线；DevKeel 把“只建脚手架”扩展为“初始化 Living brainstorm 后继续访谈”。

## 1. 确认主题与 schema

输入必须足以给 change 命名。若连主题都不能确定，只问“你想构建或修复什么？”，不得创建。
主题清楚后派生 kebab-case 名称。

显式 schema 选择优先；否则默认 `lite`。只有用户显式选择 Full，或 Agent 按 AGENTS.md
说明治理/高风险理由并得到确认，才用 `full`。文件数、模块数和文档篇幅不是 Full 信号。

## 2. 创建或恢复

先检查 active changes。同名不存在时运行：

```bash
npx devkeel@latest openspec new change "<name>" --schema <schema>
```

同名且 selector 一致时转为 Continue；selector 冲突时停止，不得覆盖。已确认 Lite→Full 时在原
change 修改 selector，并保留 `<!-- harness:lite-to-full-promotion -->` 与全部现有文件；status
失败时回滚。完成 Full 投影和 tasks 重审后才写
`<!-- harness:full-tasks-reconciled -->`。

## 3. 读取动态 instruction

```bash
npx devkeel@latest openspec status --change "<name>" --json
npx devkeel@latest openspec instructions brainstorm --change "<name>" --json
```

以 `schemaName`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext`、
`resolvedOutputPath`、`template` 和 schema `instruction` 为准，不猜固定路径。

## 4. 初始化 Living brainstorm

加载并遵循 `brainstorming` 的 change-draft 流程：

- 从当前热对话迁入全部有效 D/A/O；没有历史决定时，把用户本次明确且无歧义的输入写为首个
  D-*，不将 Agent 推测伪装成决定；
- 状态为 DRAFT；阶段按现有证据与关键缺口判断；下游状态为 NONE；
- 使用最小模板，不扩写 use case、架构、风险或候选大全；
- 写入后运行 `brainstorming/scripts/planning-state.mjs <resolvedOutputPath>`，无效则修正并停止。

创建 `brainstorm.md` 后 OpenSpec 会把它显示为 done，但这不表示用户已确认，也不允许生成下游。

## 5. 输出与停止

简短报告 change、schema、位置、迁入的 D/A/O 数量及阶段与关键缺口。有 gap 时在同一轮只询问当前最高价值
的一项；已闭合时进入 Brainstorming 快照确认。不得展示整份模板，不提示用户立即 Apply，也不得
创建 design/specs/tasks。

用户本次明确调用 `/opsx:new` 已授权创建 change 和 Living brainstorm；不授权实现代码、FF、
archive、commit 或 delivery。
