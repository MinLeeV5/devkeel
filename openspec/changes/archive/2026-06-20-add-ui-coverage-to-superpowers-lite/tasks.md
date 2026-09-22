# superpowers-lite UI 维度覆盖优化 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 为 superpowers-lite schema 规划链路全链路补 UI 维度，新增 figma-fidelity-playbook skill 作为方法论锚点，五处 instruction + 两份模板补 UI，schema version 6 → 7，两份 schema 同步。

**架构：** 纯模板/schema 文本资产改动（templates/skills/ + templates/openspec/schemas/ + openspec/ 副本），不涉及 src/ 运行时代码。figma skill 是底层锚点被 4 处 instruction 引用；模板改动被对应 instruction 引用；双份同步依赖 templates/ 改动完成。

**技术栈：** Markdown 模板 + YAML（schema.yaml / versions-yml.yml）；校验以 grep/diff/openspec validate 为主。

---

## 1. figma-fidelity-playbook skill 新增

- [x] **1.1 新增 skill 到 templates/skills/ 并适配 frontmatter**
  1. 将业务项目（max-one-next）的 `figma-fidelity-playbook/` 复制到 `templates/skills/figma-fidelity-playbook/`（SKILL.md + references/workflow.md + references/traps.md + references/checklist.md，内容保持原样）
  2. 修改 `templates/skills/figma-fidelity-playbook/SKILL.md` frontmatter：保留原 `name`/`description`，新增 `metadata.author: "devkeel"`、`metadata.version: "1.0.0"`、`triggers: ["figma还原", "按设计稿还原", "高保真对齐", "交互与视觉对齐", "figma fidelity"]`（符合 skill-versioning 规范的自有 skill 格式）
  3. 确认 references/ 三个文件（workflow.md / traps.md / checklist.md）内容完整、被 SKILL.md 的 References 段引用
  > test: test -f templates/skills/figma-fidelity-playbook/SKILL.md && grep -q 'author: "devkeel"' templates/skills/figma-fidelity-playbook/SKILL.md && grep -q 'version: "1.0.0"' templates/skills/figma-fidelity-playbook/SKILL.md
  > commit: feat(skills): 新增 figma-fidelity-playbook UI 高保真还原方法论 skill

- [x] **1.2 同步到 .harness/skills/ 并注册版本**
  1. 复制 `templates/skills/figma-fidelity-playbook/` 到 `.harness/skills/figma-fidelity-playbook/`（与现有 skills 同步）
  2. 在 `templates/versions-yml.yml` 的 `skills:` 下新增 `figma-fidelity-playbook: "1.0.0"`（置于 verify-init 之后）
  3. 确认 versions-yml.yml 与 SKILL.md metadata.version 一致（skill-versioning 检查流程）
  > test: diff -rq templates/skills/figma-fidelity-playbook .harness/skills/figma-fidelity-playbook && grep 'figma-fidelity-playbook: "1.0.0"' templates/versions-yml.yml
  > commit: chore(harness): 注册 figma-fidelity-playbook 版本 1.0.0 并同步到 .harness

## 2. brainstorm 模板与 instruction 补 UI

- [x] **2.1 brainstorm.md 模板注释补 UI 维度**
  1. 修改 `templates/openspec/schemas/superpowers-lite/templates/brainstorm.md`：
     - 「核心功能用例」注释补"涉及 UI/交互变更时，须含视觉呈现、视图状态切换、交互形态用例，不只功能流程用例（UI 也是用户可见能力）"
     - 「风险与约束」注释补"涉及 UI 变更时，纳入设计稿就绪度、视觉规范一致性、桌面/移动兼容等 UI 约束"
  2. 同步到 `openspec/schemas/superpowers-lite/templates/brainstorm.md`
  > test: grep -q "视觉呈现" templates/openspec/schemas/superpowers-lite/templates/brainstorm.md && grep -q "设计稿就绪度" templates/openspec/schemas/superpowers-lite/templates/brainstorm.md
  > commit: feat(schema): brainstorm 模板补 UI 维度提示

- [x] **2.2 schema.yaml brainstorm instruction 补 UI**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 brainstorm.instruction：在"需求分析完成后，按模板结构整理已确认的需求到 brainstorm.md。"前插入 UI 用例/约束提示段（见 design.md 代码设计预览 §3）
  > test: grep -q "UI/交互用例" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: feat(schema): brainstorm instruction 补 UI 用例与约束要求

## 3. design 模板与 instruction 补 UI

- [x] **3.1 design.md 模板新增「UI 设计」可选章节**
  1. 修改 `templates/openspec/schemas/superpowers-lite/templates/design.md`：在「代码设计预览」与「数据设计」之间插入「UI 设计」可选章节（含 6 个注释维度：实现范围/运行时层次与 ownership/高风险失真点/状态变体清单/视觉适配策略/设计稿对齐，见 design.md 代码设计预览 §2）
  2. 同步到 `openspec/schemas/superpowers-lite/templates/design.md`
  > test: grep -q "### UI 设计" templates/openspec/schemas/superpowers-lite/templates/design.md && grep -q "figma-fidelity-playbook" templates/openspec/schemas/superpowers-lite/templates/design.md
  > commit: feat(schema): design 模板新增 UI 设计可选章节

- [x] **3.2 schema.yaml design instruction 补 UI 章节指引**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 design.instruction：在"产出结构遵循 design.md 模板。"前插入 UI 章节指引段（涉及 UI 时产出 UI 设计章节 + 对齐 figma-fidelity-playbook 探索维度 + 有/无 Figma 上下文的分层引用，见 design.md 代码设计预览 §4）
  > test: grep -q "figma-fidelity-playbook" templates/openspec/schemas/superpowers-lite/schema.yaml && grep -q "UI 设计" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: feat(schema): design instruction 补 UI 章节指引与 figma 引用

## 4. specs instruction 修正与覆盖度自检

- [x] **4.1 specs description 与适用场景修正**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 specs artifact：
     - description 改为"定义系统行为的详细规格文件（可选，涉及外部契约/跨系统集成/UI 行为契约/安全敏感场景时需要）"
     - instruction 适用场景新增"涉及 UI 视图状态、视觉适配行为契约时"
  > test: grep -q "UI 行为契约" templates/openspec/schemas/superpowers-lite/schema.yaml && ! grep -q "仅 API/跨系统集成时需要" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: feat(schema): specs 措辞修正，不再排斥 UI 行为契约

- [x] **4.2 specs 覆盖度自检机制**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 specs.instruction：在"按 design.md 中识别的能力，每个创建一个 spec 文件。...若无 design.md，从 brainstorm.md 的核心用例中提取能力。"后新增"覆盖度自检"段（对照 brainstorm In Scope + 核心用例逐项确认已覆盖/已排除；涉及 UI 时确认 UI 用例有对应 spec 且覆盖状态变体；遗漏则补，见 design.md 代码设计预览 §5）
  > test: grep -q "覆盖度自检" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: feat(schema): specs 新增 capability 覆盖度自检机制

## 5. tasks 与 verify instruction 引用 figma

- [x] **5.1 tasks instruction 引用 figma 分轮次收敛**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 tasks.instruction：在"若存在 specs/：读取行为契约，将 WHEN/THEN 场景作为 TDD 的 RED 步骤输入"段后新增 UI 任务拆解指引（specs 含 UI 契约时引用 figma-fidelity-playbook 分轮次收敛：结构 → 视觉 → 交互状态，见 design.md 代码设计预览 §6）
  > test: grep -A2 "分轮次收敛" templates/openspec/schemas/superpowers-lite/schema.yaml | grep -q "figma-fidelity-playbook"
  > commit: feat(schema): tasks instruction 引用 figma 分轮次收敛流程

- [x] **5.2 verify instruction 补 UI 还原度验证**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 的 verify.instruction：在第 7 项"延迟验证的覆盖缺口检查"后新增第 8 项"UI 还原度验证"（涉及 UI 变更时引用 figma-fidelity-playbook references/checklist.md 对照 Figma 截图 + 真实运行容器逐项确认；不涉及则 N/A，见 design.md 代码设计预览 §7）
  > test: grep -q "UI 还原度验证" templates/openspec/schemas/superpowers-lite/schema.yaml && grep -q "references/checklist.md" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: feat(schema): verify instruction 补 UI 还原度验证项

## 6. schema 版本与双份同步

- [x] **6.1 schema version bump 6 → 7**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml` 顶部 `version: 6` 为 `version: 7`（skill-versioning 规范：内容变更必须 +1）
  > test: grep -E "^version: 7$" templates/openspec/schemas/superpowers-lite/schema.yaml
  > commit: chore(schema): superpowers-lite version bump 6 → 7

- [x] **6.2 同步 templates/ → openspec/ 并校验一致**
  1. 将 `templates/openspec/schemas/superpowers-lite/` 下改动同步到 `openspec/schemas/superpowers-lite/`（schema.yaml + templates/brainstorm.md + templates/design.md）
  2. diff 校验两份完全一致
  > test: diff -rq templates/openspec/schemas/superpowers-lite openspec/schemas/superpowers-lite && echo "两份一致"
  > commit: chore(schema): 同步 superpowers-lite 到 openspec 自用副本

## 7. 验证

- [x] **7.1 openspec 结构验证**
  1. 在 harness-cli 根目录运行 `npx devkeel@latest openspec validate --all --json`，确认所有项 `valid: true`
  2. 运行 `npx devkeel@latest openspec status --change add-ui-coverage-to-superpowers-lite`，确认 artifact 状态正常
  > test: npx devkeel@latest openspec validate --all --json | grep -q '"valid": true'
  > commit: test(schema): superpowers-lite UI 维度结构验证

- [x] **7.2 lint 与现有测试不受影响**
  1. 运行 `pnpm lint`（tsc --noEmit，确认无类型破坏——本次改模板资产，预期通过）
  2. 运行 `pnpm test`（确认现有 vitest 套件不受影响）
  > test: pnpm test
  > commit: test(schema): 确认 UI 维度改动不影响现有测试

- [x] **7.3 端到端抽查：UI 维度衔接**
  1. 抽查 figma-fidelity-playbook SKILL.md 被设计稿对齐章节引用链路完整（design 模板 → design instruction → figma skill）
  2. 抽查覆盖度自检在 specs instruction 中可被 openspec instructions 命令返回
  3. 确认非 UI change 不会被强制触发 UI 章节（instruction 均为"涉及 UI 变更时"条件触发）
  > test: grep -c "涉及 UI" templates/openspec/schemas/superpowers-lite/schema.yaml（≥4，确认条件触发而非强制）
  > commit: test(schema): UI 维度全链路衔接端到端抽查
