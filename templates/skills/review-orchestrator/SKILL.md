---
name: review-orchestrator
description: 当用户要求代码审查、code review 或 CR 时使用。收集实际改动，判定范围和审查模式，按需调度 specialist reviewer，输出阻断优先的统一结论。
metadata:
  author: "devkeel"
  version: "1.1.3"
---

# Review Orchestrator

## 概述

这个 skill 的职责不是直接替代所有审查，而是先做准确定界，再把不同领域的改动交给对应 specialist。

它支持三种审查模式：

- `auto`（默认）
- `fast`
- `deep`

默认产出阻断优先的结论，优先指出：

1. blocker / regression
2. 高风险非阻断
3. 验证缺口
4. 少量可选优化

## Read First

进入本技能后，按需读取：

- `references/diff-collection.md`
- `references/input-template.md`
- `references/mode-strategy.md`
- `references/output-contract.md`

## Hard Rules

1. 先收集 diff，再做审查；禁止凭文件名猜范围。
2. 如果项目有领域 specialist reviewer，优先交给 specialist，不在 orchestrator 里重做同类审查。
3. mixed diff（跨领域改动）需并行调度对应 specialist，再由 orchestrator 归并结果。
4. 只有项目公共部分的改动，orchestrator 才独立完成全部审查。
5. 精确问题使用平台无关、可直接阅读的文本表达，并遵循 `references/output-contract.md`。
6. 默认不做自动修复、不写补丁、不重构代码；该 skill 只负责审查和归并结论。
7. 结论必须阻断优先，不输出大量样式级 nit。
8. 默认模式为 `auto`；先按 `references/mode-strategy.md` 判断是否进入 `fast` 或 `deep`。
9. `fast` 模式只用于小范围、单域、低风险审查；一旦发现高风险信号，必须自动升级到 `deep`。

## 工作流程

### 1. 收集范围

判断本次输入是：

- `current-worktree` — 当前 worktree 的 staged + unstaged 改动
- `staged` — 只审查暂存区
- `range` — 审查 `base..head` 或 commit range

按 `references/diff-collection.md` 收集改动文件列表。

### 2. 判定调度路径

按 `references/mode-strategy.md` 选择审查模式和 specialist 调度策略。

### 3. 执行审查

- 如有 specialist：向 specialist 传递最小化信息（diff spec、changed files、risk hints）
- 项目公共部分：orchestrator 直接审查

### 4. 归并输出

- 合并同一根因的重复 finding
- 优先保留更具体、更高风险的版本
- 控制最终核心 finding 数量（不超过 10 条）
- 明确 residual risk 和验证缺口

## 完成前检查

- 是否已区分不同领域的实际 diff
- 是否对 fast/deep 模式做了正确选择或升级
- 是否把重复 finding 去重
- 是否遵循了阻断优先输出
