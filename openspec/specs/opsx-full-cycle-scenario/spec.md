# OPSX Full Cycle Scenario Specification

## Purpose

定义 Full 生命周期场景必须覆盖的强制规划、当前 Agent 实施、最终 Review、验证报告和归档门禁。

## Requirements

### Requirement: Full planning MUST 在 tasks 处交给 Apply

场景 MUST 依次生成 brainstorm、design、delta specs 与 tasks，并在 tasks 完成后停止 planning；verify 与 retrospective MUST NOT 在实现前生成。

#### Scenario: Continue 到达 Apply 边界

- **WHEN** 所有 Full planning artifacts 已生成
- **THEN** 下一步 SHALL 为 `/opsx:apply`，即使 verify 拓扑为 ready

### Requirement: Full Apply MUST 使用当前 Agent 和一次最终 Review

场景 MUST 验证当前 Agent 顺序实施结果任务、完成邻近验证，并在所有任务结束后只调用一次 `review-orchestrator`；不得触发旧执行器、worktree、实现 subagent、逐任务 commit 或 branch-finishing workflow。

#### Scenario: 实现任务完成

- **WHEN** Apply 到达最终闭环
- **THEN** 所有 task SHALL 有本地验证证据，最终 Review SHALL 只以 P0/P1 阻断

### Requirement: Verify MUST 生成测试报告

Review 通过后，场景 MUST 走统一 Verify 路径，在最终代码上执行 Final Verification，并生成带实现指纹、Final Review provenance 和 PASS/FAIL/BLOCKED 结论的 `verify.md`。

#### Scenario: 独立 Verify 没有 Review

- **WHEN** `/opsx:verify` 未经 Apply 最终 Review 独立运行
- **THEN** 报告 SHALL 标记 `Final Review: NOT_RUN`，普通 Archive MUST NOT 接受该 PASS

### Requirement: Full Archive MUST 执行闭环门禁

普通 Archive MUST 要求新鲜 PASS 与 `P0/P1 CLEAR`，生成 retrospective 并默认同步 specs。显式 force MUST 逐项记录用户选择、所有绕过门禁及观察证据、剩余风险和恢复动作，并只映射为 OpenSpec 支持的 `-y --no-validate`，不得传递字面 `--force`。

#### Scenario: 验证后实现发生变化

- **WHEN** 实现指纹在 Verify 后改变
- **THEN** 普通 Archive MUST 拒绝旧 PASS 并要求重新 Verify

#### Scenario: Archive 目标已存在

- **WHEN** OpenSpec 按 UTC 日期计算出的归档目标已经存在
- **THEN** Archive MUST 在同步主 specs 前停止，不得依赖官方命令写入 specs 后才报告冲突

#### Scenario: Archive CLI 失败后重试

- **WHEN** Full Archive 已生成 retrospective，但 CLI 验证、同步或移动失败且 change 仍 active
- **THEN** 下一次 Archive MUST 重新执行全部门禁并基于当前状态覆盖 retrospective 后重试，已有 retrospective MUST NOT 自身阻断归档

#### Scenario: Archive 成功

- **WHEN** Full change 通过门禁并归档
- **THEN** Agent SHALL 默认停止，只询问用户是否另行 commit、push、PR 或清理
