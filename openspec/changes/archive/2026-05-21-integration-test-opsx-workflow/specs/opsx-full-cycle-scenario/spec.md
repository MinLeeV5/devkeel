## ADDED Requirements

### Requirement: 多轮 full-cycle 工作流验证
测试场景 MUST 验证 opsx:new → opsx:continue → opsx:apply 的完整多轮链路。

#### Scenario: Turn 1 — opsx:new
- **WHEN** 执行 `/opsx:new "add-dark-mode"`
- **THEN** change 脚手架已创建，Skill + Bash 断言通过（同 opsx-new-scenario）

#### Scenario: Turn 2 — opsx:continue 生成 brainstorm
- **WHEN** 使用 `--continue` 执行 `/opsx:continue integration-test`
- **THEN** stream-json 中包含 Bash 调用 `openspec instructions` 和 Write tool 调用

#### Scenario: Turn 3+ — opsx:continue 生成后续 artifacts
- **WHEN** 重复使用 `--continue` 执行 `/opsx:continue`
- **THEN** 逐步生成 design、proposal、specs、tasks artifacts

#### Scenario: 最终轮 — opsx:apply 调用执行器
- **WHEN** 所有 applyRequires artifacts 就绪后，使用 `--continue` 执行 `/opsx:apply`
- **THEN** stream-json 中包含：
  - Skill tool 触发 `openspec-apply-change`
  - Bash 调用含 `openspec instructions apply`
  - 执行器调用（Bash 含 `omc ralph` 或 Skill 含执行器相关 skill）
