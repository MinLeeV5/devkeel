# Direct / Harness Lite 工作流优化实现计划

> **给 agentic 执行器：** 按 Section 的 `> mode:` 标注选择执行模式——inline/batch 使用 executing-plans 单 session 执行，isolated 使用 subagent-driven-development 逐任务执行。

**目标：** 交付 direct、`lite`、`full` 三档路由，并安全迁移旧 schema 与受管 skills，使日常任务默认走轻量链路。

**架构：** AGENTS 负责渐进路由，现有 `/opsx:*` 依据上下文选择并服从 change schema，OpenSpec 分别以 lite/full schema 驱动流程。升级路径通过可重入的 legacy migration 先安装新资产、再改 selector、最后删除旧资产。

**技术栈：** TypeScript、Node.js 文件系统、Vitest、OpenSpec YAML schema、Markdown command/skill 模板、Bash 集成场景、React/Vite 文档站。

## Global Constraints

- `full` 保留旧 `superpowers-lite` 的 artifact/apply 语义和版本 `14`；`lite` 从版本 `1` 开始。
- 不新增 `/opsx:*` 命令或 lite 专用 skill；direct 不创建 OpenSpec change。
- lite 不强制 worktree、subagent、TDD、独立 review、commit、verify 或 retrospective。
- 只精确迁移受管的 `superpowers-lite` selector 和已登记退休 skills；用户自定义 schema/skill 不得受影响。
- 不重写历史 change 内容、v1 页面、版本快照或 changelog；只改具有运行语义的 `.openspec.yaml` selector 和现行文档。
- 保留当前工作区已有的 `templates/package.json` 修改，不覆盖、还原或误加入任务提交。

---

## 覆盖矩阵

| 来源 | 需求点（含场景） | 任务 |
|---|---|---|
| specs/workflow-routing：渐进路由 | 明显 direct；普通非 direct 默认 lite；边界偏 direct | 4.1 |
| specs/workflow-routing：决策门禁 | 自动 lite 先确认关键问题；显式 new 可先建脚手架 | 4.1, 4.2 |
| specs/workflow-routing：full 建议 | 外部消费者 + 可观察契约变化 + 协调成本才建议；仅触及 API/CLI/DB 不足以触发 | 4.1 |
| specs/workflow-routing：direct 升级 | 用户同意时保留调查/代码并只登记已验证工作；拒绝时不扩大范围 | 4.1 |
| specs/workflow-routing：轻量基线 | 普通任务不强制专项 skill；显式原子操作/困难插桩调试仍可路由 | 2.1, 4.1 |
| specs/lite：最小图 | 新建 lite 依次 brief/tasks；applyRequires 只有 tasks；没有其他强制 artifact | 1.2 |
| specs/lite：brief | 覆盖必要内容、默认 500–800 字；约 1200 字仍不清楚则建议 full | 1.2 |
| specs/lite：tasks | 每项含结果/范围/验证；不强制 mode、TDD 微步、commit、矩阵或硬行数 | 1.2 |
| specs/lite：轻量 apply | 普通任务当前 Agent 执行与自审；风险触发一次 review；有测试接缝才按需 TDD | 1.2, 4.3 |
| specs/lite：进度 | 验证失败不勾选；恢复时只读 tasks.md | 1.2, 4.3 |
| specs/lite：归档 | 最后任务完成与 all_done 恢复均自动轻量归档；失败保留 active | 4.3 |
| specs/opsx-schema-routing：创建 | AGENTS 负责显式 schema 覆盖；有普通上下文 lite；无上下文 new full；入口文件不改 | 4.2 |
| specs/opsx-schema-routing：恢复 | lite 按 lite 继续；迁移 full 保持原语义 | 4.2, 4.3, 5.1 |
| specs/opsx-schema-routing：continue | lite planning 完成后提示 apply，不把 artifact complete 当 implementation complete | 4.3 |
| specs/opsx-schema-routing：archive | lite 使用普通 archive；full 保持原归档流程；commands/skills/CLI 不改 | 4.3 |
| specs/opsx-schema-routing：统一入口 | lite 全流程只使用既有 OPSX 命令 | 4.2, 4.3 |
| specs/harness-schema-migration：新身份 | 新 init 只有 lite/full；注册表无旧键；full 语义不变 | 1.1, 1.2, 3.2 |
| specs/harness-schema-migration：探测 | 版本最新但 archive 有旧 selector 仍迁移；自定义 schema 不变 | 3.1, 3.2 |
| specs/harness-schema-migration：安全顺序 | active/archive 精确改写；解析失败时不删除旧 schema | 3.1, 3.2 |
| specs/harness-schema-migration：恢复 | 部分迁移可续跑；完整迁移再次执行为 no-op | 3.1 |
| specs/harness-schema-migration：退休 skills | 旧版本登记的三项必须删除；未登记同名用户资产保留 | 2.1, 3.1, 3.2 |
| specs/harness-schema-migration：精确提交 | stage 实际迁移的 metadata，不带入同目录 tasks 等用户修改 | 3.2 |
| specs/harness-schema-migration：旧 full | 未完成 change 迁移后 status/apply 进度不变 | 3.2, 5.1 |
| specs/embed-superpowers-skills：保留集合 | init/update 提供 8 个 full 依赖 skill 和 grilling | 2.1 |
| specs/embed-superpowers-skills：metadata | 上游来源/版本与 registry 对齐；grilling 有 Harness 元数据 | 2.1 |
| specs/embed-superpowers-skills：引用 | AGENTS 无退休默认路由；full 裸名引用有效；内部相对引用不悬空 | 2.1, 4.1 |
| specs/embed-superpowers-skills：grilling | 显式调用时逐问推进；普通讨论不自动调用 | 2.1, 4.1 |
| specs/embed-superpowers-skills：TDD/review | direct/lite 不因描述误触发；full/SDD 仍可使用 | 2.1 |
| specs/embed-superpowers-skills：移除 brainstorming | 删除模板/dogfood 资产并由自然讨论或显式 grilling 替代 | 2.1, 3.2, 4.1 |
| design：模块边界与 AGENTS 层 all_done 补偿 | AGENTS/schema/OPSX/migration 职责分离；lite all_done 仍能归档 | 1.2, 3.1, 4.3 |
| design：状态与恢复 | `.openspec.yaml`、tasks checkbox、versions 分别保持单一事实源 | 1.2, 3.1, 4.3 |
| design：现行说明一致性 | 现行 Web/安装说明更新，历史页面和版本快照不重写 | 5.2 |
| brainstorm 验收：结构场景 | direct、lite、讨论门禁、中途升级、full 确认、按需 specialist | 4.1, 5.1 |
| brainstorm 验收：模板与 CLI | 双 schema 校验、模板/dogfood 同步、现有 full 可继续/apply | 1.1, 1.2, 5.1, 5.3 |
| brainstorm 验收：升级删除 | config/settings/active/archive/versions 全迁移，旧 schema/skills 删除 | 3.1, 3.2, 5.3 |
| brainstorm Out of Scope | full 内部优化、lite→full 自动迁移、运行时 token/耗时遥测 | out of scope：分别留给后续 change；本期只实现确认后的静态路由与结构测试 |

---

## 1. 双 Schema 与版本注册

> mode: batch

- [x] **1.1 建立 `full` 身份并让内置版本读取支持多个 schema**
  1. 先在 `tests/config.test.ts`、`tests/templates.test.ts`、`tests/release-workflow.test.ts` 增加失败用例：注册表包含 `full: "14"`、不再依赖单个旧名称、分发与 dogfood full schema 内容一致。
  2. 将 `templates/openspec/schemas/superpowers-lite/**` 复制为 `templates/openspec/schemas/full/**`，只改变 schema identity 和必要路径文案，并删除模板中的旧 schema 目录。
  3. 在 `openspec/schemas/full/**` 建立 dogfood 镜像，但暂时保留旧目录供本 change 在迁移任务前继续解析。
  4. 更新 `templates/openspec/config.yaml`、`templates/openspec/settings.json`、`templates/versions-yml.yml`，默认/注册 `full` 并移除模板注册表旧键。
  5. 修改 `src/lib/config.ts` 的 `getBuiltinVersions()`：遍历 `parsed.schemas`，逐项用 `readSchemaVersion(name)` 校准版本，不再硬编码 `superpowers-lite`。
  6. 更新 `.harness/skills/release-workflow/SKILL.md` 中现行 schema 发布示例；不改历史 changelog 或归档 artifact。
  > test: pnpm vitest run tests/config.test.ts tests/templates.test.ts tests/release-workflow.test.ts
  > commit: refactor(schema): 建立 full 身份并泛化版本注册

- [x] **1.2 新增最小 `lite` schema 与 brief/tasks 模板**
  1. 在 `tests/templates.test.ts`、`tests/openspec.test.ts` 增加失败用例，断言 lite 只有 brief/tasks、依赖图和 `apply.requires/tracks` 正确、模板不含强制 planning/TDD/review/worktree/subagent/commit 指令。
  2. 新建 `templates/openspec/schemas/lite/schema.yaml`、`templates/openspec/schemas/lite/templates/brief.md`、`templates/openspec/schemas/lite/templates/tasks.md`，实现 specs 中的篇幅、字段、验证与暂停规则。
  3. 新建对应的 `openspec/schemas/lite/**` dogfood 镜像，并在 `templates/versions-yml.yml` 注册 `lite: "1"`。
  4. 用 OpenSpec CLI fixture 验证 `brief -> tasks`、`applyRequires=["tasks"]`、contextFiles 只含 brief/tasks，以及 tasks 未完成/全完成状态。
  > test: pnpm vitest run tests/templates.test.ts tests/openspec.test.ts tests/release-workflow.test.ts
  > commit: feat(schema): 新增 lite 最小工作流

## 2. Skill 资产轻量化

> mode: batch

- [x] **2.1 新增显式 grilling，退休三项 skill，并收窄 full 专用触发**
  1. 在 `tests/templates.test.ts`、`tests/config.test.ts` 写失败用例：新增 grilling；模板不再包含 brainstorming/systematic-debugging/receiving-code-review；TDD/requesting review 元数据版本与注册表一致；SDD 相对引用仍有效。
  2. 新建 `templates/skills/grilling/SKILL.md` 与 `.harness/skills/grilling/SKILL.md`，保留 Matt Pocock 版本的逐次单问原则，标记 Harness 维护的派生来源、`version: "1.0.0"` 和仅显式触发。
  3. 从 `templates/skills/` 删除 `brainstorming/`、`systematic-debugging/`、`receiving-code-review/`；dogfood 旧目录暂留给第 3 节验证真实升级清理。
  4. 修改模板与 dogfood 的 `test-driven-development/SKILL.md`、`requesting-code-review/SKILL.md` description，将触发收窄为 full schema 明确调用或用户显式调用，版本设为 `6.0.3-harness.1`。
  5. 更新 `templates/versions-yml.yml`：新增 grilling、更新两项版本、删除三项退休键；保留 writing-plans、executing-plans、SDD、worktree、verification、finishing 等 full 依赖。
  6. 增加 active 资产引用检查，排除 v1/history/changelog，确保无退休 skill 默认引用且 `.superpowers` gitignore 仍保留。
  > test: pnpm vitest run tests/templates.test.ts tests/config.test.ts tests/gitignore.test.ts
  > commit: refactor(skills): 精简默认技能并新增显式 grilling

## 3. 幂等升级迁移

> mode: isolated

- [x] **3.1 实现可测试的 legacy migration 计划与安全执行原语**
  1. 在 `tests/update.test.ts` 写 RED 用例覆盖：config/settings/active/archive selector、旧目录、版本已最新仍探测、部分迁移续跑、二次 no-op、损坏 YAML/JSON 不删旧目录、自定义 schema/skill 不变、受管退休 skill 被识别。
  2. 在 `src/lib/update.ts` 定义 `LegacyMigrationPlan`、`planLegacyMigrations(projectRoot)`、`applyLegacyMigrations(projectRoot, plan)`；预解析全部目标，只精确修改 schema 值，采用临时文件 + rename，返回实际 `changedPaths`。
  3. 迁移扫描 `openspec/changes/**/.openspec.yaml`（含 archive）并兼容旧 `openspec/archive/**/.openspec.yaml`；把旧 selector/目录/受管退休资产纳入待更新判断。
  4. 删除旧 schema 的门禁必须同时验证 `full/schema.yaml` 可解析且重扫后无旧 selector；失败时保留旧目录以便重跑。
  > test: pnpm vitest run tests/update.test.ts
  > commit: feat(update): 增加幂等旧 schema 与技能迁移原语

- [x] **3.2 将迁移接入 update/init、精确 stage，并迁移仓库 dogfood 状态**
  1. 在 `tests/update.test.ts` 与 `tests/templates.test.ts` 写 RED 用例：migration plan 非空绕过 early return；顺序为同步新 schema → 改 metadata → 删除旧资产 → 写 versions；自动 stage 仅加入实际 `.openspec.yaml`；已有项目 init 使用同一迁移。
  2. 修改 `src/commands/update.ts`、`src/commands/init.ts`、`src/lib/templates.ts`：在新 schema 就绪后调用统一迁移，避免通用 deprecated prompt 决定本次确定性清理。
  3. 扩展 `collectCommitStagePaths()` 接口以接收迁移返回路径，逐文件 stage metadata，不加入整个 `openspec/changes/`。
  4. 将根 `openspec/config.yaml`、`openspec/settings.json`、所有 `openspec/changes/**/.openspec.yaml` 的严格旧 selector 迁移为 `full`；同步 `.harness/versions.yml`，删除根 `openspec/schemas/superpowers-lite/` 与三项退休 dogfood skill。
  5. 运行迁移 fixture 两次确认第二次 no-op，并验证当前 active full change 的 status/apply instructions 仍可读取原 tasks 进度。
  > test: pnpm vitest run tests/update.test.ts tests/templates.test.ts tests/config.test.ts
  > commit: feat(update): 接入安全迁移并清除旧受管资产

## 4. 三档路由与 Schema-aware OPSX

> mode: batch

- [x] **4.1 重写 AGENTS 的 direct/lite/full 路由和升级门禁**
  1. 新建 `tests/workflow-routing.test.ts` 写失败断言，覆盖 direct 无 artifact、默认 lite、边界偏 direct、full 三条件与确认、direct 中途升级、显式 L0、普通调试不自动插桩、普通讨论不自动 brainstorming/grilling。
  2. 修改 `templates/agents-md.md`：移除旧规模评分和 OpenSpec 一律强制规则，写入渐进路由、外部契约定义、决策门禁与 direct/lite 最低基线。
  3. 使用现有 user slot 合并机制同步根 `AGENTS.md`，保留 `harness:user:*` 内容；明确 auto-routed lite 的创建方式和 lite→full 本期只建议新 change。
  > test: pnpm vitest run tests/templates.test.ts tests/workflow-routing.test.ts
  > commit: refactor(routing): 启用 direct lite full 渐进分流

- [x] **4.2 由 AGENTS 为 new/propose/ff 动作按上下文选择 schema**
  1. 通过 AGENTS 静态/集成断言覆盖：显式 schema 优先，有普通上下文传 `--schema lite`，无上下文 new 传 full，full 风险先确认。
  2. 保持 `templates/commands/opsx/*`、`templates/skills/openspec-*`、dogfood 镜像及 OpenSpec CLI 内容不变，由 AGENTS 的更高层契约覆盖通用入口中的默认流程描述。
  3. 保持对应 skill 原版本：`new/propose/ff/onboard/apply/archive` 为 `1.0`，`continue` 为 `1.1`；版本表不得因 Harness 路由变化升级。
  4. onboard 保持上游通用内容，不在本期顺带修复其演示流程。
  > test: pnpm vitest run tests/templates.test.ts && bash tests/integration/run-scenario.sh opsx-new && bash tests/integration/run-scenario.sh opsx-propose
  > commit: feat(opsx): 按上下文选择 lite 或 full schema

- [x] **4.3 由 schema 与 AGENTS 处理 lite 计划、恢复与自动归档**
  1. 为 AGENTS/schema 与集成 fixture 写场景：pending tasks 由当前 Agent 实施；验证失败不勾选；最后任务和 `all_done` 恢复都调用普通 `openspec archive -y`；归档失败保留 active；full 路径不变。
  2. 不修改 `continue/apply/archive` commands、对应 skills、OpenSpec CLI 或其注册版本；模板与 dogfood 恢复为上游原内容。
  3. 在 lite schema apply 指令中固定：当前 Agent、逐项验证后勾选、cheap diff self-review、风险才调用 `review-orchestrator`、commit 默认关闭；不得写额外进度文件。
  4. 对 `schemaName === "lite" && state === "all_done"` 在 AGENTS 建立补偿规则；手动 archive 同样使用普通 archive，不执行 full 门禁。
  > test: pnpm vitest run tests/templates.test.ts tests/openspec.test.ts && bash tests/integration/run-scenario.sh opsx-lite-cycle
  > commit: feat(opsx): 完成 lite apply 恢复与自动归档

## 5. 集成回归与现行文档

> mode: batch

- [x] **5.1 建立双 schema 的结构化端到端场景**
  1. 更新 `tests/integration/scenarios/opsx-new/scenario.sh`、`opsx-propose/scenario.sh`，新增 `tests/integration/scenarios/opsx-lite-cycle/scenario.sh` 与 explicit-full 场景，避免继续断言固定重型执行器。
  2. 覆盖 direct 不建 change、讨论确认后建 lite、brief/tasks、apply 断点、失败留 active、成功归档、中途升级确认、外部契约 full 建议、无上下文 new full 和显式 schema override。
  3. 为迁移 fixture 增加旧 active full change 的 continue/apply 兼容场景；现有 `opsx-full-cycle` 明确使用 `full`，保留 full 回归而不承接 lite 断言。
  > test: pnpm vitest run tests/integration-scenarios.test.ts tests/openspec.test.ts（`run-all.sh` 由用户手动验证）
  > commit: test(opsx): 覆盖 direct lite full 与迁移恢复场景

- [x] **5.2 同步现行 Web 与安装说明，保留历史快照**
  1. 更新 `web/src/pages/architecture.tsx`、`capability-inventory.tsx`、`home/QuickStartSection.tsx`、`workflow/CodePhase.tsx`、`workflow/SpecPhase.tsx`、`workflow/ThreeLayerModel.tsx`、`workflow/SceneLookupSection.tsx`，用三档路由和 lite 主链替换旧规模评分/强制 Superpowers 描述。
  2. 更新 `web/install.md`、`web/public/install.md`、`web/public/sharing.html` 中现行能力说明；不修改 `web/src/pages/v1-*`、`web/public/versions/**` 和 changelog snapshots。
  3. 运行 active-path 引用扫描，确认现行模板/页面没有 `superpowers-lite` 或三项退休 skill 的运行时引用。
  > test: pnpm --dir web test && pnpm --dir web build
  > commit: docs(workflow): 更新 direct lite full 现行说明

## 6. 最终验证

> mode: inline

- [x] **6.1 验证 schema、模板、迁移、CLI 与文档整体一致**
  1. 严格校验当前 OpenSpec change 与 lite/full schema，确认五份 delta spec 可应用且双 schema 合法。
  2. 运行根项目类型检查、全量 Vitest 和构建，检查失败摘要后再决定是否扩大修复范围。
  3. 运行 Web 测试/构建和 OPSX 场景契约/语法测试；复查 `git diff --check`、模板/dogfood 一致性、旧 selector/旧受管资产清零。`run-all.sh` 由用户手动验证。
  4. 确认 `templates/package.json` 的会话前用户修改仍被保留且未被本任务意外覆盖。
  > test: OpenSpec change + lite/full schema 校验；pnpm lint/test/build；pnpm --dir web test/build；git diff --check
  > commit: test(workflow): 验证轻量工作流与升级兼容
