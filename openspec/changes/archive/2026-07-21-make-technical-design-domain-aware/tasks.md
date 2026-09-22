# technical-design 领域感知改造实现计划

> **给 agentic 执行器：** 按 Section 的 `> mode:` 标注选择执行模式——
> inline/batch 使用 executing-plans 单 session 执行，isolated 使用
> subagent-driven-development 逐任务执行。mode 边界见下方注释。

**目标：** 将 `technical-design` 改造成领域感知的 D1-D14 设计维度选择器，并更新 superpowers-lite design 路由、模板测试、运行时副本和版本记录。

---

## 覆盖矩阵

| 来源 | 需求点 | 任务 |
|------|--------|------|
| brainstorm §一句话描述 | `technical-design` 从固定 C4/ATAM/STRIDE/SLO 改为领域与触点驱动 | 2.1 |
| brainstorm §需求背景 | 后端方法论不应全局强制，需改为候选工具 | 2.1 |
| brainstorm §项目现状与架构分析 | 修改 `templates/skills/technical-design/SKILL.md` | 2.1 |
| brainstorm §项目现状与架构分析 | 同步 `.harness/skills/technical-design/SKILL.md` | 3.1 |
| brainstorm §项目现状与架构分析 | 更新 `templates/openspec/schemas/superpowers-lite/schema.yaml` | 2.2 |
| brainstorm §项目现状与架构分析 | 更新 `templates/openspec/schemas/superpowers-lite/templates/design.md` | 2.2 |
| brainstorm §项目现状与架构分析 | 参考 `domain-init` 的领域识别与矩阵思想，但不照搬 R1-R23 | 2.1 |
| brainstorm §项目现状与架构分析 | D7 引用 `ui-fidelity-playbook` 且区分有/无设计事实 | 2.1 |
| brainstorm §风险与约束 | 不迁移历史 artifact | 4.1 |
| brainstorm §风险与约束 | 使用 `core / supporting / checklist / skip` 控制篇幅 | 2.1 |
| brainstorm §风险与约束 | 短入口 + 按需 profile + 按需 dimensions，避免上下文膨胀 | 2.1 |
| brainstorm §风险与约束 | profile 只写启用条件和优先级，维度文件是输出契约唯一权威 | 2.1 |
| brainstorm §风险与约束 | D10 不全局强制 STRIDE | 2.1 |
| brainstorm §验收口径 | `copyTemplateSkills` 后复制新的 references 文件 | 1.1, 2.1 |
| brainstorm §验收口径 | schema 不再写死 C4/ATAM/STRIDE/SLO | 1.1, 2.2 |
| brainstorm §验收口径 | design 模板包含“设计维度选择”和 `D03 运行边界与职责归属` | 1.1, 2.2 |
| brainstorm §验收口径 | `technical-design` 明确按需读取参考文件和输出优先级 | 1.1, 2.1 |
| brainstorm §验收口径 | `.harness` 与 `templates` 保持同步 | 3.1 |
| brainstorm §核心功能用例 #1 | 领域感知设计路由 | 2.1 |
| brainstorm §核心功能用例 #2 | 按需加载领域 profile | 2.1 |
| brainstorm §核心功能用例 #3 | 维度选择与输出优先级 | 2.1 |
| brainstorm §核心功能用例 #4 | D03 大白话命名 | 2.1 |
| brainstorm §核心功能用例 #5 | D07 UI/交互设计维度 | 2.1 |
| brainstorm §核心功能用例 #6 | D10 安全 lens 设计维度 | 2.1 |
| brainstorm §核心功能用例 #7 | 模板源与运行时副本同步 | 3.1 |
| brainstorm §需求边界 In Scope | 新增 `dimension-selection.md` | 2.1 |
| brainstorm §需求边界 In Scope | 新增 `domain-profiles/*.md` | 2.1 |
| brainstorm §需求边界 In Scope | 新增 `dimensions/D01-D14*.md` | 2.1 |
| brainstorm §需求边界 In Scope | 更新版本记录 | 3.2 |
| brainstorm §Out of Scope | 不修改 OpenSpec CLI 状态机、schema 解析器或 apply 执行器 | 4.1 |
| brainstorm §Out of Scope | 不新增运行时代码依赖 | 4.1 |
| brainstorm §替代方向 | 不采用按领域完整 design 模板 | 2.1 |
| design §设计维度选择 | D01-D14 维度和优先级落到 references | 2.1 |
| design §架构概览 | `SKILL.md`、`dimension-selection.md`、profile、dimension、schema、design template 的职责边界 | 2.1, 2.2 |
| design §方案对比 | 采用“D1-D14 + profile + dimension 文件”方案 | 2.1 |
| design §关键时序 | 从 brainstorm 输入到按需读取 profile/dimension 再生成 design.md | 2.1 |
| design §模块设计/文件结构 | 创建 `templates/skills/technical-design/references/...` 文件树 | 2.1 |
| design §D07 | D7 输出契约覆盖设计事实、范围、运行边界、状态变体、失真点、验证方式 | 2.1 |
| design §D10 | D10 输出契约和 frontend/backend-api/desktop/cli/sdk lens | 2.1 |
| design §代码设计预览 | 新增 `tests/templates.test.ts` 回归测试 | 1.1 |
| design §schema 文案 | 修改 superpowers-lite schema design 描述 | 2.2 |
| design §design 模板 | 修改 design.md 模板，移除固定 SLO/STRIDE 提示 | 2.2 |
| design §数据设计 | 不新增运行时数据模型，仅新增 Markdown 参考文件 | 4.1 |
| design §兼容性与迁移 | 历史 design 不迁移；未来模板和当前 `.harness` 生效 | 3.1, 4.1 |
| design §验证策略 | 运行 `npm test -- tests/templates.test.ts` 与 `npm run lint` | 4.2 |
| specs | 用户明确跳过 specs；无 WHEN/THEN 契约输入 | out of scope：本期从 brainstorm/design 直接生成 tasks |

---

## 1. 回归测试先行

> mode: batch

- [x] **1.1 为技术设计领域感知改造添加模板回归测试**
  1. 修改 `tests/templates.test.ts`，在 `copyTemplateSkills` 分组中新增测试 `should copy domain-aware technical-design references`，断言 `copyTemplateSkills(target)` 后存在：
     - `technical-design/references/dimension-selection.md`
     - `technical-design/references/domain-profiles/frontend.md`
     - `technical-design/references/domain-profiles/desktop.md`
     - `technical-design/references/dimensions/D03-runtime-boundaries.md`
     - `technical-design/references/dimensions/D10-security-privacy.md`
     - `technical-design/SKILL.md` 包含 `领域识别`、`维度选择`、`core / supporting / checklist / skip`
  2. 在 `copyOpenspecTemplate` 分组中新增测试 `should route design through domain-aware dimensions instead of fixed backend methods`，断言 `schema.yaml` 包含 `领域识别 + D1-D14 设计维度选择`、`core / supporting / checklist / skip`、`D03 运行边界与职责归属`，且不包含旧文案 `design 使用 technical-design（C4/ATAM/STRIDE/SLO）`。
  3. 同一测试中断言 `templates/design.md` 包含 `### 设计维度选择`、`core / supporting / checklist / skip`、`D03 运行边界与职责归属`，且不包含固定章节标题 `SLO 指标` 和旧提示 `有安全风险时用 STRIDE 或自由格式分析`。
  4. 执行 `npm test -- tests/templates.test.ts`，确认新增测试因文件/文案尚未实现而失败，失败点应指向缺失 references 或旧 schema/template 文案。
  > test: npm test -- tests/templates.test.ts
  > commit: test(technical-design): 添加领域感知模板回归测试

## 2. 模板源改造

> mode: batch

- [x] **2.1 重写 `technical-design` 模板源并新增领域感知 reference 文件树**
  1. 替换 `templates/skills/technical-design/SKILL.md`，保留 frontmatter 的 `name` 和 triggers，将 `metadata.version` 更新为 `1.2.0`。
  2. 在 `SKILL.md` 中删除“强制设计规范（评审红线）”的全局强制表述，改为：
     - 先读取 `references/dimension-selection.md`
     - 识别领域标签和变更触点
     - 只读取命中的 `references/domain-profiles/*.md`
     - 只读取最终选中的 `references/dimensions/Dxx-*.md`
     - 用 `core / supporting / checklist / skip` 控制 design.md 输出深度
  3. 创建 `templates/skills/technical-design/references/dimension-selection.md`，内容包含领域标签、变更触点、profile 合并规则、优先级合并规则、按需加载要求；不写 D10/D8 等维度输出契约。
  4. 创建 `templates/skills/technical-design/references/domain-profiles/` 下 8 个文件：`frontend.md`、`backend.md`、`desktop.md`、`mobile.md`、`cli.md`、`sdk.md`、`devops.md`、`custom.md`。每个文件使用表格字段 `维度 / 策略 / 默认优先级 / 触发条件 / 输出深度`。
  5. 创建 `templates/skills/technical-design/references/dimensions/` 下 14 个文件：
     - `D01-scope-goals.md`
     - `D02-architecture-boundaries.md`
     - `D03-runtime-boundaries.md`
     - `D04-flows-failures.md`
     - `D05-contracts.md`
     - `D06-data-state.md`
     - `D07-ui-interaction.md`
     - `D08-performance-resource.md`
     - `D09-reliability-recovery.md`
     - `D10-security-privacy.md`
     - `D11-observability-diagnostics.md`
     - `D12-compatibility-migration.md`
     - `D13-verification.md`
     - `D14-risks-decisions.md`
  6. 在 `D03-runtime-boundaries.md` 中使用标题 `D03 运行边界与职责归属`，说明“模块运行在哪里、谁负责什么、不负责什么”。
  7. 在 `D07-ui-interaction.md` 中引用 `ui-fidelity-playbook`，明确有设计事实时用于高保真对齐；无设计事实时只输出 UI 意图、组件边界、状态矩阵、适配策略和待补事实。
  8. 在 `D10-security-privacy.md` 中只写启用后的输出契约和 frontend/backend-api/desktop/cli/sdk lens；完整 STRIDE 只作为高风险触发工具。
  9. 执行 `npm test -- tests/templates.test.ts`，确认 `copyTemplateSkills` 相关测试通过或只剩 schema/template 文案测试失败。
  > test: npm test -- tests/templates.test.ts
  > commit: feat(technical-design): 建立领域感知设计维度参考体系

- [x] **2.2 更新 superpowers-lite design schema 与模板**
  1. 修改 `templates/openspec/schemas/superpowers-lite/schema.yaml`：
     - 顶部 description 中把 `design 使用 technical-design（C4/ATAM/STRIDE/SLO）` 改为 `design 使用 technical-design（领域识别 + D1-D14 设计维度选择 + core / supporting / checklist / skip 输出深度控制）`
     - design artifact description 改为 `使用领域识别 + D1-D14 设计维度选择的技术方案设计（可选）`
     - design instruction 中要求使用 `technical-design` 的领域感知流程，并输出“设计维度选择”
     - 涉及 UI/交互时的提示改为引用 D07 和 `ui-fidelity-playbook`，使用“运行边界与职责归属”表述
  2. 修改 `templates/openspec/schemas/superpowers-lite/templates/design.md`：
     - 新增 `### 设计维度选择`
     - 将固定 `### SLO 指标`、`### 安全`、`### 旁路隔离` 改为 `## 质量与专项设计` 下的按需说明
     - 完成检查改为：已调用 technical-design、已列出维度选择、已按优先级控制输出、D03 命名已使用、D07/D10 等按需维度已说明
  3. 执行 `npm test -- tests/templates.test.ts`，确认新增模板测试通过。
  > test: npm test -- tests/templates.test.ts
  > commit: feat(openspec): 更新 design artifact 的领域感知路由

## 3. 同步运行时副本与版本

> mode: batch

- [x] **3.1 同步 `.harness/skills/technical-design` 当前运行时副本**
  1. 删除或覆盖 `.harness/skills/technical-design/SKILL.md`，使其内容与 `templates/skills/technical-design/SKILL.md` 一致。
  2. 将 `templates/skills/technical-design/references/` 下新增的 `dimension-selection.md`、`domain-profiles/`、`dimensions/` 同步到 `.harness/skills/technical-design/references/`。
  3. 使用 `diff -ru templates/skills/technical-design .harness/skills/technical-design` 检查两棵目录一致；若存在仅路径或换行差异，修正后重跑。
  4. 执行 `npm test -- tests/templates.test.ts`，确认同步不影响模板复制测试。
  > test: diff -ru templates/skills/technical-design .harness/skills/technical-design && npm test -- tests/templates.test.ts
  > commit: chore(technical-design): 同步当前运行时 skill 副本

- [x] **3.2 更新 technical-design 版本记录**
  1. 修改 `templates/versions-yml.yml`，将 `skills.technical-design` 从 `"1.1.0"` 更新为 `"1.2.0"`。
  2. 修改 `.harness/versions.yml`，将 `skills.technical-design` 从 `1.1.0` 更新为 `1.2.0`。
  3. 使用 `rg -n "technical-design:.*1\\.1\\.0|version: \"1\\.1\\.0\"" templates/skills/technical-design .harness/skills/technical-design templates/versions-yml.yml .harness/versions.yml` 检查不再残留旧版本。
  4. 执行 `npm test -- tests/templates.test.ts`，确认版本更新不影响模板测试。
  > test: rg -n "technical-design:.*1\\.1\\.0|version: \"1\\.1\\.0\"" templates/skills/technical-design .harness/skills/technical-design templates/versions-yml.yml .harness/versions.yml; test $? -eq 1 && npm test -- tests/templates.test.ts
  > commit: chore(technical-design): 提升领域感知版本号

## 4. 收尾验证

> mode: inline

- [x] **4.1 范围与兼容性自查**
  1. 执行 `git diff --name-only`，确认改动范围只包含：
     - `tests/templates.test.ts`
     - `templates/skills/technical-design/**`
     - `.harness/skills/technical-design/**`
     - `templates/openspec/schemas/superpowers-lite/schema.yaml`
     - `templates/openspec/schemas/superpowers-lite/templates/design.md`
     - `templates/versions-yml.yml`
     - `.harness/versions.yml`
     - `openspec/changes/make-technical-design-domain-aware/**`
  2. 执行 `git diff -- openspec/changes -- ':!openspec/changes/make-technical-design-domain-aware/**'`，确认没有迁移历史 artifact。
  3. 执行 `rg -n "design 使用 technical-design（C4/ATAM/STRIDE/SLO）|SLO 指标|有安全风险时用 STRIDE" templates/openspec/schemas/superpowers-lite templates/skills/technical-design .harness/skills/technical-design`，确认旧固定路由文案不在目标文件中残留；若 `D10-security-privacy.md` 中出现 STRIDE，必须是按需触发说明而不是全局强制。
  > test: git diff --name-only && git diff -- openspec/changes -- ':!openspec/changes/make-technical-design-domain-aware/**' && ! rg -n "design 使用 technical-design（C4/ATAM/STRIDE/SLO）|SLO 指标|有安全风险时用 STRIDE" templates/openspec/schemas/superpowers-lite templates/skills/technical-design .harness/skills/technical-design
  > commit: chore(technical-design): 完成领域感知范围自查

- [x] **4.2 运行最终验证**
  1. 执行 `npm test -- tests/templates.test.ts`，期望 Vitest 退出码为 0。
  2. 执行 `npm run lint`，期望 TypeScript 检查退出码为 0。
  3. 执行 `npx devkeel@latest openspec status --change "make-technical-design-domain-aware"`，确认 `tasks` 已完成，`apply` 所需规划已满足。
  4. 若任一命令失败，修复失败点后重新运行完整命令，不用旧输出证明完成。
  > test: npm test -- tests/templates.test.ts && npm run lint && npx devkeel@latest openspec status --change "make-technical-design-domain-aware"
  > commit: test(technical-design): 通过领域感知设计改造验证
