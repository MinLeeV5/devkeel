---
description: "编辑纪律 — 最小改动原则和 surgical changes 约定"
globs:
  - "**/*"
---

# 编辑纪律

## 最小改动原则

| 约定 | 依据 |
|------|------|
| 只改与目标直接相关的内容，不顺手清理无关问题 | AGENTS.md 第 3 节第 3 条 |
| 默认选择最小、最容易验证的方案 | AGENTS.md 第 3 节第 2 条 |
| 流程仪式感与风险成正比——低风险任务直接执行，不走 openspec | AGENTS.md 第 4 节 L1 |

## 验证先于声明

| 约定 | 依据 |
|------|------|
| 在声称完成前必须提供可观察的验证证据 | AGENTS.md 第 3 节第 4 条 + 第 5 节 |
| 不要把"理论上应该可行"表述成"已经完成验证" | AGENTS.md 第 5 节 |
| 歧义或风险不低时，先显式写出关键假设与未知项 | AGENTS.md 第 3 节第 1 条 |

## 架构隔离

| 约定 | 依据 |
|------|------|
| 每个命令一个文件（src/commands/），不混合命令逻辑 | [架构约束](architecture-constraints.md) + 实际目录结构 |
| 纯逻辑模块在 src/lib/（无 I/O 副作用优先），与命令层分离 | [架构约束](architecture-constraints.md) |
| 涉及子模块实现时进入子项目目录处理，不把子项目细节写回主仓库 | AGENTS.md 第 4 节 L0 |

## 文档产出边界

| 约定 | 依据 |
|------|------|
| 所有知识产出写入 openspec/，不写入 docs/ | AGENTS.md 第 8 节资产位置表 |
| brainstorm 阶段绝不写入 docs/ | AGENTS.md 第 4 节 brainstorm 收敛标准 |
| 不主动创建 README 或文档文件，除非明确要求 | AGENTS.md 默认执行基线 |
