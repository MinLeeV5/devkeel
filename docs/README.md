# 项目知识

这里维护当前有效的项目知识。按任务选择相关文档，不要求每次读取全部内容。

| 场景 | 文档 |
|------|------|
| 理解项目目标与资产分层 | [项目概览](project.md) |
| 判断模块职责、调整依赖 | [架构说明](architecture.md) |
| 开发、构建和本地运行 | [开发指南](development.md) |
| 选择验证范围、定位测试入口 | [测试说明](testing.md) |
| 理解构建与发布产物 | [构建与发布说明](building.md) |
| 理解规则中的代码模式 | [规则示例](examples/coding-standards.md)，其他示例从对应规则进入 |

执行契约见 [AGENTS.md](../AGENTS.md)，简短约束位于 [.harness/rules/](../.harness/rules/)。
当前能力规范保留在 [openspec/specs/](../openspec/specs/)，任务过程保留在
[openspec/changes/](../openspec/changes/)。文档引用规范，避免重复维护其正文。

根项目和子项目使用相同分层：知识在各自 docs 中维护，跨项目通过链接关联。实施改变已验证
的项目事实时，同步对应文档；未落成的方案继续留在任务文档中。
