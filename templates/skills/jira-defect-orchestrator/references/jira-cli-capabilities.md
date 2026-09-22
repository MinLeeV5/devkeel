# Jira CLI 操作手册

## 固定上下文

从项目根 `.jira.yml` 读取：

```yaml
server: https://your-jira-instance.com
project: YOUR_PROJECT_KEY
component: YOUR_COMPONENT
auth_type: bearer
transitions:
  in_progress: "In Progress"
  done: "Done"
```

- `server`、`project`、`component` 是必填项。
- `transitions.*` 保存目标 status 名；不能把它们直接当作 transition action。
- `component` 不是 jira-cli 全局配置项，查询时必须显式传入。
- 认证优先使用 `JIRA_CONFIG_FILE`、`JIRA_AUTH_TYPE` 和 `JIRA_API_TOKEN`，不得回显 token。

## Setup Gate

在任何 issue 查询前依次执行：

```bash
test -f .jira.yml
command -v jira
jira me
```

任一失败都停止 Jira 工作流。缺少 jira-cli 或认证配置时，引导开发者在交互式终端运行：

```bash
./.harness/skills/jira-defect-orchestrator/scripts/setup-jira-cli.sh
```

脚本支持 `--profile`、`--config-file` 和 `--skip-init`，详情用 `--help` 查看。token 模式不需要额外的 `jira login` 命令。

## 取证命令

有 issue key 时直接查看：

```bash
jira issue view <ISSUE-KEY>
```

没有 key 时才在固定 project/component 内列候选：

```bash
jira issue list \
  -p <project> \
  -C <component> \
  --order-by updated \
  --reverse
```

多 issue 也要先缩小范围；除非用户明确要求，不跨 project 大范围查询。

## 评论

先在本地生成内容，核对对应评论授权后再回填 Jira：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/render_jira_comment.py \
  --stage investigation \
  --fact "已确认复现路径稳定" \
  --hypothesis "问题可能由状态同步竞态触发" \
  --unknown "尚未拿到事发请求的完整链路" \
  --next-action "补充 trace 证据" \
  --output /tmp/jira-comment.md

jira issue comment add <ISSUE-KEY> --template /tmp/jira-comment.md
```

检查点通过且已授权的 Jira 评论使用 `--compact`，只保留标题和 1～3 条事实：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/render_jira_comment.py \
  --stage gate-pass-sync \
  --compact \
  --compact-title 根因分析 \
  --fact "已确认当前首选根因成立" \
  --output /tmp/jira-g1-comment.md
```

评论超时、结果不确定或会话恢复时，先按 `comment-sync-idempotency.md` 回读并语义判重，不能直接重试。

## 状态流转

Jira 的 action 和目标 status 可能不同。每次流转前先只读解析：

```bash
python3 ./.harness/skills/jira-defect-orchestrator/scripts/resolve_jira_transition.py \
  <ISSUE-KEY> \
  --target-status "<.jira.yml 中的目标状态>"
```

只有对应流转已授权、返回 `matched=true` 且 `to_status` 与目标一致时，才使用脚本返回的 action：

```bash
transition_action="$(python3 \
  ./.harness/skills/jira-defect-orchestrator/scripts/resolve_jira_transition.py \
  <ISSUE-KEY> \
  --target-status "<目标状态>" \
  --format action)"

jira issue move <ISSUE-KEY> "$transition_action"
```

解析失败时展示 `available_transitions` 中的 `action → to_status` 映射并停止。不要调用 `jira issue move` 探测，不猜近义状态。

## 操作边界

本 Skill 默认只使用：

- `issue list`、`issue view`
- `issue comment add`
- `issue move`、`issue assign`

不默认创建或删除 issue，也不做跨项目扫描。评论、move 和 assign 均受主 Skill 的 Gate 与授权约束。
