# Diff 收集约定

## 目标

在任何审查开始前，先把输入精确收口为"可审查范围"。

## 支持的输入模式

| 模式 | 说明 | 默认行为 |
| --- | --- | --- |
| `current-worktree` | 审查当前 worktree 的 staged + unstaged 改动 | 用户未指定范围时默认使用 |
| `staged` | 只审查暂存区 | 用户明确要求只看 staged 时使用 |
| `range` | 审查 `base..head` 或 commit range | 用户给了分支、commit 或路径范围时使用 |

## 收集顺序

1. 先解析输入模板中的 `diff_mode / base_ref / head_ref / target_paths`
2. 再确定是否存在显式 range
3. 再区分项目各领域的改动空间
4. 最后判断是否只有配置变化而没有真实文件 diff

## 结果数据结构

推荐在审查内部维护如下逻辑结构：

```text
diff_mode
changed_files[]
context_paths[]
risk_hints[]
```

## 空输入处理

如果改动集合为空：

- 明确返回"无可审查代码改动"
- 不要编造风险点

## 范围收口原则

- 范围越小越好
- specialist 只拿自己领域的文件集合
- 如果 `target_paths` 已提供，优先以它作为二次收口条件
