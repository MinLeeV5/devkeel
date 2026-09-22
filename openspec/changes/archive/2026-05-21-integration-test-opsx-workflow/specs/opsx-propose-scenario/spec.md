## ADDED Requirements

### Requirement: opsx:propose 工作流验证
测试场景 MUST 验证 `/opsx:propose` 一次性生成所有 planning artifacts 直到 apply-ready。

#### Scenario: 正常触发并生成 artifacts
- **WHEN** 在已 init 的 fixture 项目中执行 prompt `/opsx:propose "add-verbose-flag"`
- **THEN** stream-json 输出中包含：
  - Skill tool 触发 `openspec-propose`
  - Bash 调用含 `openspec new change`
  - Bash 调用含 `openspec status` （至少 2 次）
  - Bash 调用含 `openspec instructions`（至少 1 次）
  - Write 或 Edit tool 被调用（创建 artifact 文件）

#### Scenario: tasks artifact 已生成
- **WHEN** 上述轮次执行完毕
- **THEN** fixture 目录中存在 tasks artifact 文件（路径由 schema 决定）

#### Scenario: 提示 apply
- **WHEN** 所有 applyRequires artifacts 已生成
- **THEN** assistant 输出中包含 `opsx:apply` 或 "implement" 相关提示文本
