# 产出格式规范

## Rule 格式

```yaml
---
description: <一句话描述，说明何时触发>
globs:
  - "**/*.ts"
  - "**/*.tsx"
---
```

正文要求：
- 每条约定用 `##` 标题
- 每条至少 1 组 ✅/❌ 代码示例
- 约定来源在项目代码中可查证

## Skill 格式

```yaml
---
name: <kebab-case>
description: <一句话描述，含触发词>
metadata:
  author: "domain-init"
  version: "1.0.0"
---
```

正文要求：
- 概述（何时使用、何时不使用）
- Hard Rules（不可违反的约束）
- 工作流程（步骤化）

技能由 `.claude/skills` 与 `.agents/skills` 整目录链接到 `.harness/skills` 后读取，新增或修改本仓库技能无需再次运行 `devkeel sync`；运行中会话是否刷新技能列表按平台行为处理，必要时重开会话。

共享流程写在 `SKILL.md`；Claude Code 原生选项按需要写入 frontmatter，Codex 展示信息和调用策略按需要放在技能包内的 `agents/openai.yaml`。平台执行说明仅在有实际差异时放入 `references/claude-code.md`、`references/codex.md`，入口按平台读取。不要依赖自定义 `triggers` 字段，使用 `description` 表达适用场景；保留手动调用，调用策略不能替代用户授权。

## Agent 格式

```yaml
---
name: <kebab-case>
description: <一句话描述角色和职责。说明何时被调度。>
model: sonnet
---
```

正文要求：
- 角色定义（你是什么、负责什么）
- 强制启动步骤（必须按顺序执行）
- 审查/执行维度（编号列表）
- 输出规则（blocker-first、条数限制、语言）

## 质量标准

| 标准 | 要求 |
|------|------|
| Rule 约定数 | 每条 rule 至少 3 个具体约定 |
| 代码示例 | 每条 rule 至少 1 组 ✅/❌ 示例 |
| 代码依据 | 约定必须能在项目代码中找到出处 |
| Skill 完整性 | 必须有「何时使用」和「Hard Rules」 |
| Agent 完整性 | 必须有「审查维度」和「输出规则」 |
| 禁止理想化 | 不输出与项目实际不符的规范 |
| 参考标杆 | 生成前必须 fetch 对应参考项目 |
