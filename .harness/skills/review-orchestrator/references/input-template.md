# 输入模板

## 推荐字段

| 字段 | 是否必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `mode` | 否 | `auto` / `fast` / `deep` | `auto` |
| `scope` | 否 | `auto` 或具体领域 | `auto` |
| `diff_mode` | 否 | `current-worktree` / `staged` / `range` | `current-worktree` |
| `base_ref` | 条件必填 | `diff_mode=range` 时的起点 | - |
| `head_ref` | 条件必填 | `diff_mode=range` 时的终点 | `HEAD` |
| `target_paths` | 否 | 指定只审查某些路径 | 空 |
| `context_paths` | 否 | PRD、设计、计划等辅助文档 | 空 |
| `risk_hints` | 否 | 用户显式提醒的风险点 | 空 |

## 自然语言映射规则

如果用户没有按模板给出，先转换成等价字段，例如：

- "帮我快速看一下这几个文件" → `mode=fast`, `target_paths=[...]`
- "发版前把这一轮都审一下" → `mode=deep`, `diff_mode=current-worktree`

## 缺失处理

- 缺 `mode`：使用 `auto`
- 缺 `scope`：使用 `auto`
- 缺 `base_ref/head_ref` 且用户说"看某个 MR diff"：通过 git 信息推导
