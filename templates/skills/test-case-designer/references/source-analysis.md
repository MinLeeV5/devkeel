# 输入源分析参考

## OpenSpec Spec 文件使用规则

当存在 OpenSpec spec 文件时，测试设计必须遵循以下规则：

### Spec 场景全覆盖

每个 `#### Scenario` 必须映射为至少一条测试用例，不允许遗漏。

### WHEN/THEN 映射

```
spec scenario (WHEN/THEN)
    │
    ├─ WHEN 条件 → 前置条件 + 操作步骤
    │
    └─ THEN 断言 → 预期结果
```

### 溯源标注

当用例直接来源于 spec 场景时，在用例标题末尾标注 `[spec]`。

### Spec 查找流程

1. 检查对话上下文中是否提到了 OpenSpec change 名称
2. 运行 `npx devkeel@latest openspec list --json` 查找活跃的 change
3. 读取 `openspec/changes/<name>/specs/*/spec.md` 中的所有 spec 文件
4. 如果没有找到 spec 文件，仅基于需求文档生成（退化为原有行为）

### 输入合并策略

| 冲突场景 | 处理方式 |
|---------|---------|
| spec 与需求文档描述同一功能 | 以 spec 为准，需求文档作为上下文补充 |
| spec 未覆盖的功能 | 从需求文档中提取边界值、异常场景、隐性场景 |
| 黑盒与白盒输入冲突 | 必须输出"规格与实现差异" |
