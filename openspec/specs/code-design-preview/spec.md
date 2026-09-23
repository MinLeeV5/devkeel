# Technical Design Output Specification

## Purpose

定义 technical-design 与 Full design artifact 的结果导向输出边界。

## Requirements

### Requirement: Technical design MUST 输出可落地方案

technical-design MUST 根据当前领域和变更触点裁剪内部设计维度，并输出与风险相称的职责、接口/数据/状态、兼容迁移、发布回滚、故障可观测性、验证和关键权衡。D1–D14/profile MUST 仅作为内部方法，不得输出维度矩阵、覆盖证明或 skip 清单。

#### Scenario: 只有部分设计维度相关

- **WHEN** 变更不涉及数据、迁移或外部接口
- **THEN** 设计 SHALL 省略无关章节，不得为了模板完整填充空内容

### Requirement: Code preview MUST 按价值选用

函数签名、伪代码或 diff MAY 在它们能解释关键契约或算法时出现，但 design 模板 MUST NOT 强制固定“代码设计预览”章节。

#### Scenario: 关键算法需要伪代码

- **WHEN** 仅靠 prose 难以表达控制流
- **THEN** design MAY 使用代码块或 Mermaid 辅助说明
