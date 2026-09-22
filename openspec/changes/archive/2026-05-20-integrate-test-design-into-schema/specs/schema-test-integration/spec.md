### Requirement: design-instruction-subagent

schema design artifact 的 instruction SHALL 在调用 technical-design 之后（或并行）起 subagent 调用 test-case-designer skill 产出 test-points.md。

- subagent 使用 fast 模式
- 输入为 brainstorm.md + explore.md
- 产出写入 `openspec/changes/<name>/test-points.md`
- subagent 不阻塞 design 主流程
- 若 test-case-designer skill 不可用，跳过并在 human-review 中标注

#### Scenario: design 阶段并行产出测试点

WHEN design artifact 开始执行
AND test-case-designer skill 可用
THEN 起 subagent 并行调用 test-case-designer（mode=fast）
AND 产出 test-points.md 到 change 目录
AND design.md 产出不受 subagent 完成与否的影响

#### Scenario: skill 不可用时优雅降级

WHEN design artifact 开始执行
AND test-case-designer skill 不可用
THEN 跳过测试点产出
AND 在 human-review HTML 中标注"测试点未产出"

---

### Requirement: tasks-instruction-phased-ordering

schema tasks artifact 的 instruction SHALL 强制 tasks.md 按两阶段编排。

- Phase 1: 测试用例落地（产出 test-cases.md）
- Phase 2: 功能实现（每个任务的 RED 步骤引用 TC 编号）
- Phase 2 不得在 Phase 1 完成前开始执行

#### Scenario: tasks.md 包含两阶段结构

WHEN tasks artifact 生成时
AND test-points.md 存在
THEN tasks.md MUST 包含 Phase 1（测试用例落地）和 Phase 2（功能实现）
AND Phase 2 每个任务的 RED 步骤 MUST 引用至少一个 TC 编号

#### Scenario: 无 test-points.md 时退化

WHEN tasks artifact 生成时
AND test-points.md 不存在
THEN tasks.md 按原有单阶段方式编排（向后兼容）

---

### Requirement: verify-template-section-8

verify.md 模板 SHALL 在 §7 之后、Overall Decision 之前新增 §8 测试报告。

#### Scenario: verify 产出测试报告

WHEN verify artifact 执行时
AND test-cases.md 存在于 change 目录
THEN verify.md §8 MUST 包含 TP 覆盖映射表（TP → 自动化测试 → 覆盖状态）
AND MUST 包含测试执行摘要（通过率、覆盖率、缺口列表）

#### Scenario: 无 test-cases.md 时 §8 标记 N/A

WHEN verify artifact 执行时
AND test-cases.md 不存在
THEN verify.md §8 标注"N/A — 本次变更未产出测试用例"

---

### Requirement: human-review-test-coverage

human-review 模板 SHALL 新增测试覆盖区域，human-review.js SHALL 解析 test-points.md 渲染覆盖率卡片。

#### Scenario: Dashboard 展示测试覆盖卡片

WHEN human-review.html 在浏览器中打开
AND test-points.md 已被 inject-review 注入
THEN Dashboard 区域 MUST 展示测试覆盖卡片
AND 卡片包含：TP 总数、已覆盖数、未覆盖数、待确认数

#### Scenario: 无 test-points.md 时卡片不渲染

WHEN human-review.html 在浏览器中打开
AND 无 test-points.md 注入
THEN Dashboard 不展示测试覆盖卡片（静默跳过）
