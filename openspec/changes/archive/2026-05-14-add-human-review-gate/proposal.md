## Why

当前 superpowers-bridge schema 的规划阶段缺少统一的人类验收环节。用户在 brainstorm 后需要逐个查看 markdown 文件来理解全貌，且从 plan 到 apply 之间没有显式的人类确认点。增加一个 human-review artifact，在所有规划产出完成后生成一份 HTML 总结文档，让用户可以在浏览器中一次性审阅所有关键信息，确认方向后再进入实现阶段。

## What Changes

**规划阶段出口门禁**
- From: apply.requires 为 `[plan]`，plan 完成后即可直接执行 apply
- To: apply.requires 改为 `[human-review]`，plan 完成后先生成 HTML 验收文档，人类确认后再 apply
- Reason: 在实现前增加一个人类可读的总览验收点
- Impact: 非破坏性，现有 artifact 流程不变，仅在末尾追加一步

**新增 human-review artifact**
- 在 schema.yaml 中新增 `human-review` artifact，依赖 `plan`
- 创建对应的 template 文件 `human-review.md`（instruction 中包含 HTML 生成逻辑）
- artifact 生成一份完整的 HTML 文件，汇总所有规划产出的关键信息

## Capabilities

### 新增能力
- `human-review-gate`: 在 plan 之后、apply 之前的人类验收门禁，生成 HTML 总结文档

### 修改能力
- 无（不修改已有 spec）

## Impact

- **templates/openspec/schemas/superpowers-bridge/schema.yaml**: 新增 artifact 定义，修改 apply.requires
- **templates/openspec/schemas/superpowers-bridge/templates/**: 新增 human-review.md 模板
- **AGENTS.md**: 可能需更新 openspec 变更流程路由说明，增加 human-review 环节的描述
- **已有 skill 文件**: opsx:propose / opsx:continue / opsx:apply 无需修改（它们读取 schema 动态判断）
