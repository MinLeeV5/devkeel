## 一句话描述

全链路补 UI 维度：新增 `figma-fidelity-playbook` skill 作为方法论锚点，`schema.yaml` 五处 instruction + `brainstorm.md`/`design.md` 两份模板补 UI 维度，UI 章节全部可选、分层引用避免误触发；schema version 6 → 7，两份 schema 同步。

## 方案设计

### 架构概览

```mermaid
flowchart TD
  subgraph 新增资产
    FP["figma-fidelity-playbook skill<br/>SKILL.md + 3 references<br/>templates/skills/ + .harness/skills/"]
    VY["versions-yml.yml<br/>注册 figma-fidelity-playbook: 1.0.0"]
  end

  subgraph schema instruction 补 UI（schema.yaml）
    BI["brainstorm<br/>UI 用例 + UI 约束提示"]
    DI["design<br/>UI 设计章节指引 + figma 引用"]
    SI["specs<br/>措辞修正 + 覆盖度自检"]
    TI["tasks<br/>figma 分轮次收敛引用"]
    VI["verify<br/>figma checklist 引用"]
  end

  subgraph 模板补 UI
    BT["brainstorm.md<br/>用例/约束注释补 UI"]
    DT["design.md<br/>新增 UI 设计可选章节"]
  end

  FP -.约束原则.-> BI
  FP -.设计对齐探索.-> DI
  FP -.状态变体.-> SI
  FP -.分轮次收敛.-> TI
  FP -.自验清单.-> VI

  BI --> DI --> SI --> TI --> VI
  BT -.-> BI
  DT -.-> DI

  SYNC["两份 schema 同步<br/>templates/ ↔ openspec/"]
  FP --> SYNC
  BI --> SYNC
  BT --> SYNC
  DT --> SYNC
```

### 方案对比

| 维度 | 方案 A：全链路 + figma 锚点 | 方案 B：只补 design 中段 | 方案 C：只加 specs 覆盖检查 |
|------|------|------|------|
| 源头覆盖 | ✅ brainstorm 补 UI 用例 | ❌ brainstorm 不动 | ❌ brainstorm 不动 |
| 中段承接 | ✅ design UI 章节 | ✅ design UI 章节 | ❌ design 不动 |
| 下游兜底 | ✅ specs 覆盖检查 | ❌ specs 不动 | ✅ specs 覆盖检查 |
| 方法论锚点 | ✅ figma-fidelity-playbook | ⚠️ design instruction 硬写章节结构 | ⚠️ 无方法论 |
| 治本程度 | ✅ 三环节承上启下 | ❌ 中段补丁，源头仍漏 | ❌ 检查对照单薄易走过场 |
| 向后兼容 | ✅ 全可选 | ✅ 可选 | ✅ 可选 |
| 改动范围 | 大（1 skill + 5 instruction + 2 模板） | 中（1 instruction + 1 模板） | 小（1 instruction） |

**采纳方案 A**。理由：真实案例（add-maxone-mobile-login）证明漏 UI 是**链式因果**——brainstorm 源头无 UI 维度 → design 无 UI 章节 → specs 识别时 UI 不显著。只补任一环节都无法阻断链式遗漏。方案 A 三环节全补 + 专用 skill 锚点，是唯一能"承上启下"的治本方案。方案 B/C 治标，且无方法论锚点会导致 design UI 章节结构不一致。

### 模块设计

改动按"1 个新增 skill + 5 处 instruction + 2 份模板 + 版本注册 + 双份同步"组织，各自独立可理解：

| 模块 | 文件 | 改动 | 依赖 |
|------|------|------|------|
| UI 方法论锚点 | `templates/skills/figma-fidelity-playbook/`（+ .harness 副本） | 新增 skill | 无 |
| 版本注册 | `templates/versions-yml.yml` | 注册 figma skill 1.0.0 | figma skill |
| brainstorm instruction | `schema.yaml` brainstorm.instruction | 补 UI 用例/约束提示 | brainstorm.md 模板 |
| brainstorm 模板 | `templates/.../brainstorm.md` | 用例/约束注释补 UI | 无 |
| design instruction | `schema.yaml` design.instruction | 补 UI 章节指引 + figma 引用 | design.md 模板、figma skill |
| design 模板 | `templates/.../design.md` | 新增 UI 设计可选章节 | figma skill 探索维度 |
| specs instruction | `schema.yaml` specs.instruction | 措辞修正 + 覆盖度自检 | brainstorm UI 用例 |
| tasks instruction | `schema.yaml` tasks.instruction | 引用 figma 分轮次收敛 | figma skill |
| verify instruction | `schema.yaml` verify.instruction | 引用 figma checklist | figma skill |
| schema 版本 | `schema.yaml` version | 6 → 7 | 上述内容变更 |
| 双份同步 | `openspec/schemas/superpowers-lite/` | 与 templates/ 一致 | templates/ 改动 |

依赖方向：figma skill 是底层锚点，被 design/specs/tasks/verify instruction 引用；模板改动被对应 instruction 引用；双份同步依赖所有 templates/ 改动完成。

### 分层引用策略（figma skill 边界处理）

`figma-fidelity-playbook` 自身声明"无 Figma 上下文时不使用"，但规划阶段（brainstorm/design）不一定有 Figma。采用分层引用：

| 阶段 | 引用方式 | 是否需 Figma | 引用 skill 的什么 |
|------|---------|------------|-----------------|
| brainstorm | 约束原则 | 否 | "不只做静态默认态" → UI 用例覆盖状态变体 |
| design | 约束原则 + 条件执行 | 有则执行，无则只引原则 | 探索维度（范围/层次/ownership/高风险点/状态变体）作为 UI 章节结构 |
| specs | 约束原则 | 否 | "不只默认态" → UI 契约覆盖状态变体 |
| tasks | 完整流程引用 | 是（apply 时） | 分轮次收敛（结构→视觉→交互状态） |
| verify | 自验清单 | 是 | references/checklist.md |

这样既织入方法论锚点，又尊重 skill 适用边界，不在无 Figma 阶段误触发完整执行。

### 代码设计预览

#### 1. brainstorm.md 模板注释补 UI

```diff
 ## 核心功能用例

-<!-- What — 按用户可见能力拆分，每个用例包含触发条件和预期行为 -->
+<!-- What — 按用户可见能力拆分，每个用例包含触发条件和预期行为。
+     涉及 UI/交互变更时，须含视觉呈现、视图状态切换、交互形态用例，
+     不只功能流程用例（UI 也是用户可见能力）。 -->

 ## 风险与约束

-<!-- 技术约束、潜在破坏点、向后兼容性、现有测试覆盖情况 -->
+<!-- 技术约束、潜在破坏点、向后兼容性、现有测试覆盖情况。
+     涉及 UI 变更时，纳入设计稿就绪度、视觉规范一致性、桌面/移动兼容等 UI 约束。 -->
```

#### 2. design.md 模板新增「UI 设计」可选章节

在「代码设计预览」与「数据设计」之间插入：

```markdown
### UI 设计

<!-- 可选章节，仅涉及 UI/交互变更时产出。对齐 figma-fidelity-playbook 探索维度。 -->
<!-- - 实现范围：整页/区块/组件/状态变体，不默认整张设计稿都属于当前实现 -->
<!-- - 运行时层次与 ownership：宿主层/页面层/组件层；哪些归当前实现、哪些是上层壳子不重复实现 -->
<!-- - 高风险失真点：容器尺寸/间距节奏/对齐/背景层/资源/状态切换 -->
<!-- - 状态变体清单：默认/loading/empty/error/disabled/切换态 -->
<!-- - 视觉适配策略：移动端适配方式、桌面端兼容保证 -->
<!-- - 设计稿对齐：Figma 来源与节点；有上下文时调用 figma-fidelity-playbook 做设计对齐探索 -->
```

#### 3. schema.yaml — brainstorm instruction 补 UI

在"需求分析完成后，按模板结构整理已确认的需求到 brainstorm.md。"前插入：

```diff
+      涉及 UI/交互变更时，"核心功能用例"须产出 UI/交互用例（视觉呈现、
+      视图状态切换、交互形态），不只功能流程用例；"风险与约束"纳入设计稿
+      就绪度、视觉规范一致性、桌面/移动兼容等 UI 约束。

       需求分析完成后，按模板结构整理已确认的需求到 brainstorm.md。
```

#### 4. schema.yaml — design instruction 补 UI

在"产出结构遵循 design.md 模板。"前插入：

```diff
+      涉及 UI/交互变更时，产出「UI 设计」可选章节，对齐 figma-fidelity-playbook
+      的探索维度（实现范围/运行时层次与 ownership/高风险失真点/状态变体/
+      视觉适配策略）。有 Figma 上下文时调用 figma-fidelity-playbook skill 做
+      设计对齐探索；无 Figma 上下文时只应用其约束性原则，不执行完整流程。

       产出结构遵循 design.md 模板。
```

#### 5. schema.yaml — specs instruction 措辞修正 + 覆盖度自检

```diff
-    description: 定义系统行为的详细规格文件（可选，仅 API/跨系统集成时需要）
+    description: 定义系统行为的详细规格文件（可选，涉及外部契约/跨系统集成/UI 行为契约/安全敏感场景时需要）
```

```diff
       **可选 artifact**：本 artifact 适用于以下场景：
       - 定义外部 API 契约
       - 跨系统集成需要精确的行为约定
       - 需要 WHEN/THEN 格式的可测试场景定义
+      - 涉及 UI 视图状态、视觉适配行为契约时

       对于纯内部实现变更，可跳过本 artifact 直接进入 tasks。
```

```diff
       创建规格文件，定义系统应当做什么（WHAT）。

       按 design.md 中识别的能力，每个创建一个 spec 文件。
       若无 design.md，从 brainstorm.md 的核心用例中提取能力。
+
+      覆盖度自检：识别 capability 后，对照 brainstorm.md 的 In Scope 与核心功能用例
+      逐项确认"已覆盖/已排除"。涉及 UI 变更时，确认 UI 用例有对应 spec，且 UI 行为
+      契约覆盖关键状态变体（不只默认态）。遗漏则补，不得跳过。
```

#### 6. schema.yaml — tasks instruction 引用 figma

在"若存在 specs/：读取行为契约..."段落后补充：

```diff
+      若 specs 含 UI 行为契约：UI 实现任务引用 figma-fidelity-playbook 的分轮次
+      收敛流程（结构 → 视觉 → 交互状态），不零散修补样式。

       将可用的 artifact 内容传递给 skill 作为拆解输入。
```

#### 7. schema.yaml — verify instruction 补 UI 还原度验证

在第 7 项"延迟验证的覆盖缺口检查"后新增第 8 项：

```diff
+      8. **UI 还原度验证**（涉及 UI 变更时，不涉及则标注 N/A）：
+
+         引用 figma-fidelity-playbook 的 references/checklist.md 作为自验清单，
+         对照 Figma 截图与真实运行容器逐项确认：
+         范围 / 分层 / 结构 / 视觉 / 交互与状态 / 运行时验证。
+         不只凭肉眼接近即声称"已按 Figma 对齐"。
+
+         不涉及 UI 变更的 change 标注 N/A，不阻塞归档。

       verify 可多次重新运行以反映实现改进 —
```

#### 8. figma-fidelity-playbook skill frontmatter 适配

原 skill（源自业务项目）frontmatter 仅有 name/description，嵌入 harness-cli 补 metadata + triggers 以符合 skill-versioning 规范：

```yaml
---
name: figma-fidelity-playbook
description: Use after fetching Figma context when implementing UI from Figma and high visual or interaction fidelity matters. ...（保留原文）
metadata:
  author: "devkeel"
  version: "1.0.0"
triggers: ["figma还原", "按设计稿还原", "高保真对齐", "交互与视觉对齐", "figma fidelity"]
---
```

#### 9. 版本注册

```diff
 # templates/versions-yml.yml
 skills:
   ...
   verify-init: "1.0.0"
+  figma-fidelity-playbook: "1.0.0"
```

```diff
 # templates/openspec/schemas/superpowers-lite/schema.yaml
-name: superpowers-lite
-version: 6
+name: superpowers-lite
+version: 7
```

### 数据设计

本次不引入持久化数据模型，仅模板文本（markdown/yaml）改动：

| 数据 | 位置 | 用途 |
|------|------|------|
| figma skill 内容 | `templates/skills/figma-fidelity-playbook/` | UI 方法论锚点，被 4 处 instruction 引用 |
| UI 章节模板 | `design.md` 模板 | UI 设计决策结构化落点 |
| schema version | `schema.yaml` 顶部 | 内容变更标记，6 → 7 |

## 质量设计

### SLO 指标

不适用。本变更是模板/schema 文本资产改动，无运行时服务、无 QPS/延迟指标。降级为"模板可用性"验证：改动后 `openspec status`/`openspec validate` 仍正常工作（见 tasks 验证步骤）。降级原因：纯文档资产变更，非运行时系统。

### 安全（STRIDE 降级）

STRIDE 威胁模型不适用（无运行时攻击面）。降级为**向后兼容性**分析：所有 UI 维度新增均为可选（模板章节注释提示 + instruction 条件触发"涉及 UI 变更时"），不修改工作流拓扑、不删除/重命名 artifact，非 UI change 行为不变。这是本变更最大的"安全"风险——破坏现有非 UI change 流程——已通过"全可选 + 条件触发"缓解。

### 旁路隔离

`figma-fidelity-playbook` skill 的完整执行（fetch Figma 上下文、分轮次收敛）属于旁路——skill 不可用或无 Figma 上下文时，规划阶段只引用其约束性原则，不阻塞主流程；apply 阶段无 Figma 时 UI 任务仍可按原则拆解。符合"旁路故障不拖垮业务主链路"精神。

## 风险与未决

| 风险 | 缓解 | 状态 |
|------|------|------|
| 双份 schema 不同步 | tasks 强制 diff 校验 templates/ 与 openspec/ 一致 | 已规划，见 tasks 7.x |
| figma skill 内容与业务项目版本漂移 | 本次以 max-one-next 现版为基线嵌入，后续作为 harness 自有 skill 独立维护 | 后续维护项 |
| 覆盖检查增加 specs 阶段负担 | 仅"涉及 UI 变更时"触发对照，非 UI change 不增加步骤 | 已在 instruction 条件化 |
| schema version bump 遗漏 | tasks 明确 6 → 7，test 用 grep 校验 | 已规划 |

无未决问题。

## 完成检查

- [x] technical-design 方法论已等价应用（方案对比 ≥2 候选 + 打分 + 架构概览 Mermaid + 模块设计 + 代码设计预览 + 风险分析）。注：本变更是纯模板/schema 文本资产改动，不涉及运行时架构，C4/STRIDE/量化 SLO 等重型方法论不适用，已手动降级为"方案对比 + 向后兼容性分析 + 旁路隔离"轻量分析，降级原因已说明。
- [x] 存在 ≥ 2 候选方案对比（方案 A/B/C 含 7 维度打分）
