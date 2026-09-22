# Full Verification Planning Specification

## Purpose

定义 Full tasks 如何声明最终验证，以及 Verify 如何形成测试报告；测试设计能力不作为固定阶段或 subagent 门禁。

## Requirements

### Requirement: Tasks MUST 汇总 Final Verification

Full `tasks.md` MUST 在结果任务后列出最终代码需要重新执行的 required 与 optional 检查。检查 SHOULD 来自设计风险、规格和任务本地验证，不得无依据追加全量测试、覆盖矩阵或 TC 映射。

#### Scenario: 生成 Full tasks

- **WHEN** Agent 从 design/specs 生成 tasks
- **THEN** Final Verification SHALL 包含可执行命令或操作及 required/optional 分类

### Requirement: Test design MUST 按需调用

`test-case-designer` MAY 在用户显式要求或复杂测试设计确有需要时调用，但 Full design/tasks MUST NOT 固定分派测试 subagent、生成 test-points/test-cases 阶段或要求每个任务引用 TC 编号。

#### Scenario: 普通 Full 规划

- **WHEN** 已有验收和稳定验证方式足以实施
- **THEN** Agent SHALL 直接生成结果任务与 Final Verification，不得自动增加测试设计流程

### Requirement: Verify MUST 生成执行型测试报告

Verify MUST 对 Final Verification 去重并在同一实现指纹上执行，记录每项状态、耗时、摘要和最小失败证据；总体结论 MUST 为 PASS、FAIL 或 BLOCKED。Verify MUST NOT 输出需求到代码证据映射或 completeness/correctness/coherence 评分。

#### Scenario: Required 检查全部通过

- **WHEN** 所有 required 检查已执行并通过
- **THEN** verify.md SHALL 结论为 PASS，并记录未验证的 optional 风险

#### Scenario: Required 检查无法执行

- **WHEN** required 检查因环境、权限或外部依赖无法运行且没有 required 失败
- **THEN** verify.md SHALL 结论为 BLOCKED
