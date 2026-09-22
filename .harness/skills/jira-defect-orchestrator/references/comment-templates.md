# Comment Templates

## 评论结构

调查与检查点的完整结构（更适合本地分析草稿）：

1. `阶段`
2. `已确认事实`
3. `假设`
4. `未知项 / 缺失证据`
5. `建议下一步`

补充规则：

- 若某个章节没有内容，则整段标题和正文都不输出
- 不再输出 `- 无`
- 只有存在待决定事项时，才使用 confirmation gates 定义的决策说明；检查通过不要求确认卡

Jira 实际回填默认使用精简结构：

1. 一个显式的关键信息标题
2. 该标题下的关键事实

Jira 精简结构规则：

- 不写 `阶段`
- 不写 `建议下一步`
- 不写 `需要人工确认`
- 关键信息标题优先使用：
  - `根因分析`
  - `方案设计`
  - `已验证`
  - `关闭结论`
- 若要表达方案选择、验证通过、状态建议等内容，写进对应标题下的关键事实

## 何时回填评论

下表只定义有对应评论授权时的同步时机，不授予写入权限。缺少授权时准备摘要，不因阶段推进重复请求写入；用户明确要求同步作为下一步前置条件时，保留该依赖。

| 阶段 | 是否建议回填 | 目的 |
| --- | --- | --- |
| `intake` | 可选 | 记录缺证据点 |
| `triage` | 可选 | 记录真假缺陷、风险判断 |
| `investigation` | 建议 | 记录根因方向和缺口 |
| `gate-pass-sync` | 建议 | 在 `G1 / G2 / G4 / G5` 检查通过且有授权时回填最小结论 |
| `fix-plan` | 建议 | 记录方案与验证矩阵 |
| `verification` | 建议 | 记录验证结果 |
| `closure` | 按授权执行 | 记录最终结论和状态建议 |

## Gate Pass 最小评论

`gate-pass-sync` 保留为渲染脚本的阶段标签，不表示必须人工确认。已授权的检查点评论应尽量短，只保留最关键的信息：

- 一个显式的关键信息标题
- 该标题下的 1 到 3 条关键事实

推荐：

- `G1`：标题用 `根因分析`，记录证据支持的根因；仅在实际发生时记录状态变化
- `G2`：标题用 `方案设计`，记录方案 A / B / C 中的选定方案与关键措施
- `G4`：标题用 `已验证`，记录验证范围与关键通过结果
- `G5`：标题用 `关闭结论`，可把门禁通过信息并入最终 closure comment

同步边界：

- `G1` 评论不自动触发进行中流转；只有对应状态操作已获授权时，才用 `resolve_jira_transition.py` 解析 action 并执行
- `G2 / G4` 默认只补评论，其他状态或指派变化仍受 `G3` 约束
- `G5` 逐 issue 形成最终结论；关闭、观察或退回由已经确认的 closure 决策决定
- 多缺陷任务的主 issue 与关联 issue 回写范围以多缺陷 reference 为准
- 写入结果不确定、会话恢复或可能重复时，先按评论幂等 reference 回读再写入
- 语义重复而跳过写入属于成功同步；评论或状态操作失败必须报告控制面失败，并保留待同步摘要；不阻断无依赖的已授权本地工作

## 渲染脚本

使用：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/render_jira_comment.py --help
```

最小示例：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/render_jira_comment.py \
  --stage closure \
  --compact \
  --compact-title 关闭结论 \
  --fact "问题已在本地复现并通过修复后回归验证" \
  --fact "受影响模块为前端录音状态同步" \
  --fact "历史版本存在状态竞争窗口"
```

门禁通过后的最小示例：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/render_jira_comment.py \
  --stage gate-pass-sync \
  --compact \
  --compact-title 根因分析 \
  --fact "已确认当前首选根因为前端撤销链路缺少重复点击保护" \
  --fact "issue 已处于处理中，无需重复状态流转"
```
