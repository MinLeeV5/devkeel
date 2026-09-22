---
name: jira-defect-orchestrator
description: >-
  独立编排 Jira 缺陷的取证、修复、验证、回填与 MR 交付，按决策风险确认。适用于用户提供 Jira URL 或
  issue key，要求结合运行日志、配置、只读业务数据和代码证据处理生产或测试环境缺陷；普通无 Jira
  上下文的调试不使用。
metadata:
  author: "devkeel"
  version: "1.3.1"
---

# Jira Defect Orchestrator

## 目标与边界

把 Jira intake、运行态取证、代码根因、修复验证和交付串成一条可审计的证据闭环，并在关键决策点把控制权交给开发者。

本 Skill 独立负责 Jira 阶段、门禁、评论和状态同步，不依赖其他 Jira 编排 Skill。按需配合：

- 项目已配置的部署与日志工具：读取指定环境的应用、Pod 和历史日志。
- 项目已配置的 Apollo 读取工具：读取同一环境的配置；项目未接入时记录后跳过。
- 目标子项目的调试、实现和测试 Skill：定位代码、实施修复并验证。
- `commit`：仅在用户明确授权提交、push 或创建 MR 后使用。

普通调试没有 Jira URL 或 issue key 时，改用项目调试 Skill；不要为了使用本流程创建 issue。

## 开始前

1. 读取仓库根 `AGENTS.md` 和目标子项目的 `AGENTS.md`；代码、测试和交付只发生在受影响子仓库。
2. 检查项目根 `.jira.yml`，至少包含 `server`、`project`、`component`；需要状态同步时还要有 `transitions.in_progress` 和 `transitions.done`。配置值是目标 status 名，不是 transition action。
3. 依次执行 `command -v jira` 和 `jira me`。任一失败都停止 Jira 流程，并按 [Jira CLI 操作手册](references/jira-cli-capabilities.md) 给出最小修复指引。
4. 有 issue key 时直接查看该 issue；只有没有 key 时才在 `.jira.yml` 限定的 project/component 内查询候选。

## 主流程

```text
setup → intake → triage → investigation → G1
      → [e2e-repro] → fix-plan → G2 → implementation
      → verification → G4 → closure → G5 → done
```

| 阶段 | 必须形成的结果 | 停止条件 |
| --- | --- | --- |
| intake / triage | issue、复现、绝对时间、owner、严重度、证据缺口 | 输入不足以定位环境或现象 |
| investigation | 触发条件、实际路径、错误机制、影响和证据强度 | `G1` 存在会改变修复方向的证据缺口，且无法自主补齐 |
| e2e-repro | 前端回归的 failing case，或明确的自动化 blocker | 已形成可交给 fix-plan 的复现结论 |
| fix-plan | 最小修复方案、真实取舍、回滚边界和验证范围 | `G2` 缺少实现授权，或存在关键方案选择、范围或风险变化 |
| implementation | 在已授权范围内实施，并记录真实 diff | 新证据改变方案或范围；Jira 写入单独检查 `G3` |
| verification | 邻近测试到风险扩展验证的结果与未覆盖项 | `G4` 需要改变验收或接受证据缺口；失败先回到调查或修复 |
| closure | 关闭、观察或退回调查的建议和残余风险 | `G5` 所需条件未满足或最终 Jira 动作尚未授权 |

阶段的输入、动作和输出见 [缺陷处理手册](references/defect-playbook.md)；会话恢复或发生阶段回退时再读
[状态机](references/defect-state-machine.md)。

## 不可绕过的规则

### 证据

1. 先完成 intake，再查询运行态信息；先证据，后判断。
2. 把“昨天”“11:54 左右”等相对时间转换为带日期和时区的绝对时间，并说明推导。
3. 部署平台 的 appId、clusterId 和环境只能来自用户 URL、项目配置或平台返回值，不能按名称猜测。
4. 日志、Apollo 和数据库必须属于同一规范环境；只规范化名称不能证明实体相同。
5. 部署镜像或 commit 必须与本地代码对齐；不能默认当前工作树就是事发版本。
6. 根因至少由日志、数据、代码三类证据中的两类相互印证。不足时标记为候选根因；若数据不可达，允许用“实际路径日志 + 确定性代码机制”形成有边界的结论。
7. 始终区分 `已确认事实`、`假设`、`未知项` 和 `反证`，不把 jira-cli 输出或推断直接写成根因。

运行日志、Apollo、只读数据和凭据边界统一见 [运行态证据手册](references/evidence-playbook.md)。

### 决策门禁

1. `G1 / G2 / G4` 是证据与范围检查点；满足条件后简短报告并继续，不因到达阶段而等待回复。
2. 复用用户已经明确给出的目标、方案和动作授权。明确要求实现或修复时，可在该范围内连续调查、修改、测试与按需审查；只要求诊断时不修改代码。
3. 存在关键未决事项、范围或风险变化、验收调整或需要接受证据缺口时，才提出具体决定并暂停依赖该决定的工作；可独立推进的已授权工作继续。
4. `G1` 的证据不足时继续补证；不能用用户认可代替根因证据。`G4` 必须有实际验证支持，用户接受风险也不能把未执行或失败的检查改报为通过。
5. Jira 评论、状态、指派与关闭分别核对对应授权。`G1 / G2 / G4` 通过不自动授权 Jira 写入，`G3 / G5` 已有明确且仍有效的授权时不重复询问。
6. Jira 同步与本地推进分别记录；未获写入授权或同步失败时保留待同步摘要，继续不依赖该同步的已授权本地工作，不把 Jira 收尾标为完成。

Gate 的确认语义和开发者可读的决策卡格式以 [确认门禁](references/confirmation-gates.md) 为唯一权威。

### Jira、数据与交付安全

1. 不回显 token、密码、完整 JDBC URL、用户隐私或完整内部标识；不得把秘密写入仓库、Jira 或 MR。
2. 数据库只允许 `SELECT`、`SHOW`、`DESCRIBE` 和普通 `EXPLAIN`。范围查询必须有 tenant/owner 边界、索引时间范围和 `LIMIT`；生产明细默认 `LIMIT <= 100`。
3. 每次 `jira issue move` 前用 `scripts/resolve_jira_transition.py` 把目标 status 解析为当前可用 action。解析失败时展示 `action → status` 映射并停止，不猜近义状态。
4. owner 明确后、修改代码前运行 `scripts/detect_mr_target.py --repo <affected-repo>`，记录目标分支、来源和置信度；交付前再运行一次并比较结果。
5. 只修改受影响子仓库；不提交父仓中被配置为 `ignore = all/dirty` 的 submodule 指针，也不夹带无关工作区改动。
6. commit、push、MR 前重新读取当前作用域的提交规范；“准备 MR”或“给出 MR 方案”不构成执行授权。

## Jira 同步

- 评论优先用 `scripts/render_jira_comment.py` 生成；Gate 评论只保留一个标题和 1～3 条关键事实。
- 有对应评论授权时，在 `G1 / G2 / G4` 回填最小根因、方案或验证结论；没有授权时只准备摘要，不因每个检查点重复请求写入。
- 将 issue 推进到 `transitions.in_progress` 仍需对应状态操作授权，通过 `G3` 核对后再解析 action；根因检查通过不会自动触发流转。
- `G5`：条件满足且最终评论、状态或关闭动作分别在授权范围内时，执行对应收尾；可把检查结论合并进最终 closure comment，避免重复评论。
- 评论结果不确定或会话恢复时先回读，不能盲目重试；语义相同则记为 `skipped_duplicate`。
- Jira 评论或状态操作失败时明确报告控制面失败，保留待同步结果；本地修复与验证结果独立报告，不伪装成 Jira 已同步或关闭。

评论结构见 [评论模板](references/comment-templates.md)；重试、恢复或可能重复时再读
[评论同步幂等](references/comment-sync-idempotency.md)。

## 按需参考

只读取当前场景需要的文档：

| 场景 | 读取 |
| --- | --- |
| Jira 配置、命令、评论或状态操作 | `references/jira-cli-capabilities.md` |
| 标准阶段执行 | `references/defect-playbook.md` |
| 会话恢复、阶段跳转或回退 | `references/defect-state-machine.md` |
| 部署平台、Apollo、数据库或线上版本取证 | `references/evidence-playbook.md` |
| 到达 `G1 ~ G5` | `references/confirmation-gates.md` |
| 准备生成摘要或执行已授权评论回填 | `references/comment-templates.md` |
| 评论重试、恢复或结果不确定 | `references/comment-sync-idempotency.md` |
| 两个以上 issue，或明确同类/关联/重复 | `references/multi-issue-coordination.md` |
| 前端用户可感知回归进入 E2E Repro | `references/e2e-compact-handoff.md` |

普通单缺陷不加载多缺陷文档；首次且结果确定的评论写入不加载幂等文档。

## 输出

先给当前结论，再按需列出 `已确认事实 / 假设与反证 / 未知项 / 建议下一步`，省略空章节和重复信息。检查通过时简短报告并继续；只有需要用户决定时才输出决策卡。

**让证据决定根因，让场景化 reference 承载细节，让开发者保留关键决策权。**
