# 实现任务

## Task 1: 重写 test-case-designer skill

- [x] 重写 `templates/skills/test-case-designer/SKILL.md` 为 2.0.0
  - 合并 generate-test-cases 的 platform 参数、OpenSpec spec 映射、操作步骤规范、隐性场景识别、自检 checklist
  - 保留 test-case-designer 的三阶段门禁（Mode A: full）、黑盒+白盒联合、TP 追溯体系、四视角检查
  - 新增 Mode B: fast（一次性产出，自检后输出）
  - 新增 Agent 接口（subagent 调用默认 fast）
  - 新增共享层：参数定义、输入源分析、覆盖模型
  - 更新 metadata.version 为 "2.0.0"

- [x] 扩展 `templates/skills/test-case-designer/references/source-analysis.md`
  - 新增 OpenSpec spec 文件使用规则（spec 场景全覆盖、WHEN/THEN 映射、`[spec]` 溯源标注）
  - 新增 spec 查找流程

- [x] 扩展 `templates/skills/test-case-designer/references/output-contract.md`
  - 新增 fast 模式的输出格式（Markdown 表格，含平台标签）
  - 新增 platform 参数对产出路径的影响
  - 新增 schema 流程内产出路径（`openspec/changes/<name>/`）

- [x] 删除 `templates/skills/generate-test-cases/` 目录

- [x] 更新 `templates/versions-yml.yml`
  - test-case-designer 版本更新为 "2.0.0"
  - 移除 generate-test-cases 条目（若存在）

commit: `feat(skills): test-case-designer 2.0.0 — 合并双模式 + platform + Agent 接口`

## Task 2: schema design instruction 改造

- [x] 修改 `templates/openspec/schemas/superpowers-bridge/schema.yaml` 的 design artifact instruction
  - 在 technical-design 调用段落之后追加"测试设计（并行）"段落
  - 内容：确认 skill 可用 → subagent fast 模式 → 产出 test-points.md → 不阻塞主流程 → 不可用时跳过

- [x] 同步修改 `openspec/schemas/superpowers-bridge/schema.yaml`（已部署版本）

commit: `feat(schema): design 阶段并行产出 test-points.md`

## Task 3: schema tasks instruction 改造

- [x] 修改 `templates/openspec/schemas/superpowers-bridge/schema.yaml` 的 tasks artifact instruction
  - 新增编排约束：当 test-points.md 存在时，tasks.md 必须分 Phase 1（测试用例落地）和 Phase 2（功能实现引用 TC）
  - 新增退化规则：无 test-points.md 时按原有方式编排

- [x] 同步修改 `openspec/schemas/superpowers-bridge/schema.yaml`（已部署版本）

commit: `feat(schema): tasks 两阶段编排约束`

## Task 4: verify.md 模板新增 §8

- [x] 修改 `templates/openspec/schemas/superpowers-bridge/templates/verify.md`
  - 在 §7 和 Overall Decision 之间插入 §8 测试报告
  - 包含：TP 覆盖映射表、测试执行摘要、缺口分析
  - 无 test-cases.md 时标注 N/A

- [x] 同步修改 `openspec/schemas/superpowers-bridge/templates/verify.md`（已部署版本）

commit: `feat(schema): verify 模板新增 §8 测试报告`

## Task 5: human-review 模板新增测试覆盖区域

- [x] 修改 `templates/openspec/schemas/superpowers-bridge/templates/human-review.md`
  - 在输出结构表中新增测试覆盖区域（§01 和实现任务之间）
  - 调整后续编号
  - 新增 Dashboard 卡片规格（`data-card="test-coverage"`）

- [x] 同步修改 `openspec/schemas/superpowers-bridge/templates/human-review.md`（已部署版本）

commit: `feat(schema): human-review 模板新增测试覆盖区域`

## Task 6: human-review.js 新增解析逻辑

- [x] 在 `web/human-review.js` 中新增 `buildTestCoverageCard()` 函数
  - 查找 `script[data-artifact="test-points"]`
  - 正则统计 `#### TP-` 数量（总 TP 数）
  - 正则统计覆盖状态（已覆盖/未覆盖/待确认）
  - 渲染到 `[data-card="test-coverage"]` 元素
  - 无 test-points 注入时静默跳过

- [x] 在 `DOMContentLoaded` 回调中调用 `buildTestCoverageCard()`

commit: `feat(web): human-review.js 解析 test-points 渲染覆盖率卡片`

## Task 7: 版本号与同步

- [x] 更新 `package.json` version（patch bump，因为是功能新增但不破坏已有行为）
- [x] 同步 `.harness/skills/test-case-designer/` 为新版本内容

commit: `chore: 版本同步`

## Task 8: 领域自适应测试维度矩阵

- [x] 创建 `templates/skills/test-case-designer/references/testing-dimension-matrix.md`
  - 领域检测信号表（8 大领域 × 检测信号）
  - 基础维度 T1-T5（所有领域均启用）
  - 领域专项维度 T6-T25（●/○/— 矩阵）
  - 使用规则（需求驱动 + 矩阵辅助、多领域并集、auto 检测逻辑）
  - 每个维度的扫描模板（正向/边界/异常/交叉）

- [x] 更新 `templates/skills/test-case-designer/SKILL.md` 参数章节
  - `platform` 参数改为 `domain`（默认 `auto`）
  - 向后兼容：frontend/backend/all 仍可用
  - 共享层"覆盖模型"整合矩阵的基础/专项维度
  - 新增 "Read First" 引用 testing-dimension-matrix.md
  - 明确层次关系：需求是唯一来源，矩阵是分析透镜

- [x] 同步 `.harness/skills/test-case-designer/`

commit: `feat(skills): test-case-designer 领域自适应维度矩阵`

---

## 下一步

/opsx:continue integrate-test-design-into-schema
