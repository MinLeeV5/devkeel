---
name: workflow-routing
description: 当已获授权的普通开发请求无法直接判定 Direct、Lite 或 Full，或实施中出现持久化与治理升级信号时使用；明确 Direct 或已由专项 skill 接管的请求不加载。
metadata:
  author: "devkeel"
  version: "1.0.2"
---

# Workflow Routing

为已经获得写入授权、且未由专项 skill 接管的开发请求选择最轻的安全执行路径。本 skill 只做路由
判断与交接；不授予写权限、不创建 change、不生成 artifact，也不实施代码。

## 输入

优先使用当前已确认的目标、范围、验证方式和 D/A 决定。仍存在会改变结构、可观察行为或维护方式的
gap 时，先交给 `brainstorming`；不要用路由选择代替共同设计。

已有 active change 时，按其 `.openspec.yaml` selector 和当前 OPSX skill 继续，不用项目默认 schema
重新分级。用户显式选择 schema 或 `/opsx:*` 入口时，以该选择为准。

## 选择路径

### Direct

当前会话能完成必要调查、最小修改和邻近验证，且没有持久化协调价值时使用 Direct。Direct 与 Lite
边界不明确时偏向 Direct，不创建 OpenSpec change。

### Lite

存在以下任一真实价值且没有 Full 风险时，建议 Lite：

- 跨会话恢复；
- 交接或并行协作；
- 审计或后续治理。

说明具体价值并取得用户同意后，才交给 `openspec-new-change` 创建 Lite change。复杂度、文件数、
模块数、对话长度或交付项数量本身不构成持久化价值。用户拒绝时停在其接受范围，不创建 change，
也不以此为由扩展实现。

### Full

用户可显式选择 Full。否则只有以下任一风险成立时才建议，并必须先说明风险、取得确认：

1. 外部契约风险同时满足：存在外部控制的消费者、可观察契约发生语义或形状变化、因此产生协调、
   版本、迁移或回滚成本；
2. 变更可能造成数据丢失、安全或合规事故、大范围故障等严重后果，且难以通过简单代码回退恢复。

仅触及 API、CLI、数据库或共享代码不等于 Full 风险。用户拒绝建议时继续 Lite，并在 Living
brainstorm 中记录该选择，不建立额外硬门禁。

## 路径升级

### Direct → Lite

实施中出现持久化价值时，先询问是否创建 Lite。用户同意后保留已有调查、代码和验证证据，无损映射
热上下文；只有已有验证支持的工作才可登记完成，不重新讨论已确认决定。

### Lite → Full

在当前 change 原地升级，保留 metadata、Living brainstorm、代码和验证证据。按当前 OPSX skill
切换 selector、补齐 Full `applyRequires` 并重审 tasks；只有当前验证仍支持的任务可保留完成状态。
selector 切换或校验失败时回滚 selector，报告恢复点并停止。

## 最低质量与可选能力

Direct 与 Lite 都必须完成必要调查、最小实现、对应验证、低成本 diff 自审和完成证据。worktree、
实现 subagent、TDD、独立 code review 和 commit 不是默认门禁：

- 有稳定测试接缝或项目明确要求时按需使用 TDD；
- 影响共享核心或跨模块行为、验证较弱、存在明确不确定性、diff 超出已确认范围，或用户/项目要求时，
  使用 `review-orchestrator`；普通路径只做一次审查，修复后仅定向复审阻断项；
- worktree 和实现 subagent 只在用户或项目规则明确要求时使用；commit 仅在用户明确选择后交给
  `commit` skill。

## 输出与交接

只报告选择的路径、决定性依据、仍需的用户确认和下一入口：Direct 交回当前实现；Lite/Full 交给对应
OPSX skill。不要复述 Brainstorming 或 OPSX 内部状态机。
