## Why

harness 模板部署的 opsx skills 是核心交付物，但缺乏自动化验证手段确认它们在 Claude Code 中按设计流程执行。当 skill 内容变更后无法快速发现行为回归。参考 superpowers 项目的 skill-triggering 测试方案，建立黑盒集成测试框架，让维护者可手动验证工作流正确性。

## What Changes

**测试基础设施**
- From: 无集成测试，仅 vitest 单元测试覆盖 CLI lib 层
- To: `tests/integration/` 下提供 shell 脚本测试框架，可验证 opsx skill 的工具调用事件序列
- Reason: skill 行为变更后需要回归验证
- Impact: 非破坏性，纯新增，不影响现有代码

## Capabilities

### 新增能力

- `integration-test-framework`: 基于 stream-json 的事件提取与断言库（setup-fixture / run-turn / extract / assert）
- `opsx-new-scenario`: 验证 /opsx:new 工作流的完整事件序列
- `opsx-propose-scenario`: 验证 /opsx:propose 一次性生成所有 artifact 的流程
- `opsx-full-cycle-scenario`: 验证 new → continue → apply 多轮链路

### 修改能力

（无）

## Impact

- 新增 `tests/integration/` 目录及脚本
- 不修改 `src/`、`templates/`、现有测试
- `.gitignore` 可能需要排除测试运行产物（`/tmp/harness-integration-*`）
