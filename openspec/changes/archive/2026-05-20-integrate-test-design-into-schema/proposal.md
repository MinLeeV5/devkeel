## Why

superpowers-bridge schema 当前缺乏系统化的测试设计能力。design 阶段只有技术方案（technical-design），没有测试策略；apply 阶段的 TDD 是代码级测试先行，但缺少业务级测试用例作为断言来源；verify 阶段只验证实现一致性，不报告测试覆盖状况。同时项目存在两个功能重叠的测试 skill（test-case-designer、generate-test-cases），用户选择困难且维护成本高。现在整合可以形成 TP → TC → 自动化测试 → 测试报告的完整闭环。

## What Changes

**schema design instruction**
- From: 仅调用 technical-design skill
- To: 并行起 subagent 调用 test-case-designer（fast 模式）产出 test-points.md
- Reason: 测试设计应与技术方案同步产出，不阻塞流程
- Impact: 非破坏性，design.md 不受影响，新增 test-points.md 为可选产物

**schema tasks instruction**
- From: 无编排约束
- To: 强制两阶段编排（Phase 1 测试用例落地 → Phase 2 功能实现引用 TC）
- Reason: 确保 TDD 的 RED 步骤有具体的 TC 编号作为断言来源
- Impact: 非破坏性，向后兼容（无 test-points.md 时退化为原有行为）

**verify.md 模板**
- From: §1-§7 + Overall Decision
- To: §1-§8 + Overall Decision（新增 §8 测试报告）
- Reason: 验证环节需要输出测试覆盖映射和通过率
- Impact: 非破坏性，新增章节

**human-review 模板 + JS**
- From: Dashboard 无测试覆盖信息
- To: Dashboard 新增测试覆盖卡片（解析 test-points.md 统计 TP 数量和状态）
- Reason: 评审人需要在 human-review 中判断覆盖完整性
- Impact: 非破坏性，无 test-points.md 时卡片不渲染

**test-case-designer skill**
- From: 单模式（三阶段门禁），无 platform 参数，无 OpenSpec 集成
- To: 双模式（full + fast），platform 参数，OpenSpec spec 直接映射，Agent 接口
- Reason: 合并两个 skill 的优势，支持 schema 内 subagent 调用和独立人工调用
- Impact: 破坏性版本升级（1.0.0 → 2.0.0），产出格式保持兼容

## Capabilities

### 新增能力

- `schema-test-integration`: schema 各环节的测试设计集成（design instruction、tasks instruction、verify 模板、human-review 模板+JS）
- `unified-test-designer`: 统一的 test-case-designer skill（双模式 + platform + Agent 接口）

### 修改能力

（无已有 spec 需要修改）

## Impact

| 受影响区域 | 文件 | 变更类型 |
|-----------|------|---------|
| schema 定义 | `templates/openspec/schemas/superpowers-bridge/schema.yaml` | 修改 design/tasks instruction |
| verify 模板 | `templates/openspec/schemas/superpowers-bridge/templates/verify.md` | 新增 §8 |
| human-review 模板 | `templates/openspec/schemas/superpowers-bridge/templates/human-review.md` | 新增测试覆盖区域 |
| 前端 JS | `web/human-review.js` | 新增 `buildTestCoverageCard()` |
| skill 定义 | `templates/skills/test-case-designer/SKILL.md` | 重写 2.0.0 |
| skill 引用 | `templates/skills/test-case-designer/references/*.md` | 扩展 |
| 删除 skill | `templates/skills/generate-test-cases/` | 整个目录删除 |
| 版本记录 | `templates/versions-yml.yml` | 更新 test-case-designer 版本 |
| 已部署 schema | `openspec/schemas/superpowers-bridge/schema.yaml` | 同步模板变更 |

---

## 下一步

/opsx:continue integrate-test-design-into-schema
