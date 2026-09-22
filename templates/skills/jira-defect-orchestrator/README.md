# Jira Defect Orchestrator

这是仓库中唯一的 Jira 缺陷编排 Skill。它覆盖 Jira intake、运行态取证、代码修复、验证、Jira 回填和 MR 交付。已授权范围内连续推进，G1／G2／G4 保留证据和范围检查，仅在关键未决事项、范围或风险变化时暂停；Jira 写入与交付动作按对应授权执行。

## 开发者导航

| 位置 | 职责 |
| --- | --- |
| `SKILL.md` | 入口、主流程、不可绕过的边界和 reference 路由 |
| `references/defect-playbook.md` | 各阶段的输入、动作与输出 |
| `references/evidence-playbook.md` | 部署平台、Apollo、数据库和代码证据规范 |
| `references/confirmation-gates.md` | G1～G5 的通过条件、授权复用与必要确认 |
| `references/jira-cli-capabilities.md` | Jira 配置、命令和状态流转方式 |
| `references/comment-*.md` | 评论格式与幂等同步 |
| `references/multi-issue-coordination.md` | 多 issue 协调 |
| `references/e2e-compact-handoff.md` | 前端 E2E 场景的紧凑交接 |
| `scripts/` | 评论渲染、transition 解析、MR 目标检测和本地 CLI setup |

维护时把所有场景都需要的规则留在 `SKILL.md`；只对某类任务有用的步骤放进对应 reference。新增文件后必须从 `SKILL.md` 的路由表可发现，避免在入口和 reference 中重复维护同一规则。

## 本地准备

缺少 `jira-cli` 或认证配置时，在交互式终端执行：

```bash
./.harness/skills/jira-defect-orchestrator/scripts/setup-jira-cli.sh
```

脚本会读取项目根 `.jira.yml`，按需安装 `jira-cli`，引导填写 API token，并运行 `jira init`、`jira me` 和 `jira serverinfo`。完整参数见：

```bash
./.harness/skills/jira-defect-orchestrator/scripts/setup-jira-cli.sh --help
```

## 修改后验证

```bash
python3 /path/to/skill-creator/scripts/quick_validate.py \
  .harness/skills/jira-defect-orchestrator
bash -n .harness/skills/jira-defect-orchestrator/scripts/setup-jira-cli.sh
```

Python 脚本还应逐个执行 `--help`；评论渲染器至少生成一次 compact 示例。
