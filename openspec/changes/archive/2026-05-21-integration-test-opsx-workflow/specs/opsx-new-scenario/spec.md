## ADDED Requirements

### Requirement: opsx:new 工作流验证
测试场景 MUST 验证 `/opsx:new` 在单轮内按以下顺序执行工具调用：

1. Skill tool 触发 `openspec-new-change`
2. Bash 调用含 `openspec new change`
3. Bash 调用含 `openspec status`
4. Bash 调用含 `openspec instructions`
5. 不调用 Write 或 Edit tool

#### Scenario: 正常触发
- **WHEN** 在已 init 的 fixture 项目中执行 prompt `/opsx:new "add-user-auth"`
- **THEN** stream-json 输出中按序包含上述 5 项断言全部通过

#### Scenario: change 目录已创建
- **WHEN** 上述轮次执行完毕
- **THEN** fixture 目录中存在 `openspec/changes/add-user-auth/` 目录

#### Scenario: 不越界创建 artifact
- **WHEN** 上述轮次执行完毕
- **THEN** `openspec/changes/add-user-auth/` 中不存在 `brainstorm.md`、`design.md` 等 artifact 文件
