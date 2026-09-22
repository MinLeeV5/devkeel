## TL;DR

在 openspec superpowers-bridge schema 中增加一个 `human-review` artifact，在 plan 完成后、apply 之前生成一份完整的 HTML 验收文档供人类阅读，作为唯一的规划阶段出口门禁。

## 需求背景

当前 superpowers-bridge schema 的流程中存在过多门禁点：

- brainstorm 阶段：requirement-analysis skill 会逐个提问（交互式门禁）
- /opsx:continue 模式：每次只创建一个 artifact 后 STOP（隐式门禁）
- apply 前：仅检查 `applyRequires: [plan]` 是否 done（自动门禁）
- verify/retrospective：各自有前置检查（实现后门禁）

用户的痛点：
1. 规划阶段的门禁过多，打断了流畅的 artifact 生成流程
2. 缺少一个"人类友好"的总览环节 — 在所有规划产出完成后，用户需要一个地方快速审阅所有交付物的关键信息
3. 当前从 plan 完成到 apply 开始之间没有显式的人类确认点 — 用户可能还没看完规划就被推进到实现阶段

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 项目开发者（主要用户） | 在进入实现前，快速审阅所有规划产出，确认方向正确 |
| 技术负责人 | 通过 HTML 文档审查变更范围和设计决策，无需逐个打开 markdown 文件 |
| AI Agent | 根据 schema 依赖链自动在正确时机生成 review 文档 |

## 核心功能用例

### UC-1: 生成 HTML 验收文档

- **触发条件**: plan artifact 完成（status: done）
- **预期行为**: 自动汇总 brainstorm.md、proposal.md、design.md（如有）、specs/*.md、tasks.md、plan.md 的关键信息，生成一份结构化的 HTML 文档
- **HTML 内容**: 包含变更概述、需求摘要、设计要点、规格清单、任务清单、实现计划，以及各 artifact 之间的关联

### UC-2: 人类验收门禁

- **触发条件**: human-review.html 生成完毕
- **预期行为**: 提示用户在浏览器中打开 HTML 文件进行阅读和验收
- **门禁机制**: 明确告知用户验收完成后需要新开一个会话（/new）再执行 /opsx:apply

### UC-3: 简化其他门禁

- **变更内容**: 在 /opsx:propose 和 /opsx:continue 的流程中，只有 brainstorm 阶段保留交互式门禁（requirement-analysis 的 5W1H 提问），其余 artifact 生成过程无需人工干预
- **human-review 成为规划阶段的唯一出口门禁**: 所有规划产出完成后，人类在此环节一次性审阅

## 需求边界

**In Scope:**
- 在 schema.yaml 中新增 `human-review` artifact 定义
- 创建 HTML 生成模板（artifact template）
- 更新 `apply.requires` 从 `[plan]` 改为 `[human-review]`
- human-review artifact 的 instruction 包含 HTML 生成逻辑和用户提示

**Out of Scope:**
- 不修改 brainstorm 的 requirement-analysis 交互式门禁（保留）
- 不修改 openspec CLI 核心代码（仅通过 schema 和 template 扩展）
- 不引入外部 HTML 模板引擎（使用内联 HTML 生成）
- 不修改 verify/retrospective 的前置检查逻辑（这些在 apply 之后）

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 用 Markdown 而非 HTML | HTML 提供更好的阅读体验（目录导航、折叠面板），Markdown 在浏览器中需要额外渲染 |
| 在 apply skill 中内嵌验收逻辑 | 违反关注点分离，且不可被 schema 依赖链追踪 |
| 使用交互式确认（AskUserQuestion）替代 HTML 文件 | 交互式确认在上下文窗口中占空间，且无法保存供其他人审阅 |
| 自动在 plan 后 pause 等用户输入 | 依赖会话状态，跨会话不可靠；不如显式新开会话 |

## 待确认项

- 无（需求明确，可直接推进）
