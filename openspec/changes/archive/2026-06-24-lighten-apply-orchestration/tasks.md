# apply 编排轻量化 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用 subagent-driven-development 逐任务实现本计划。
>
> **本计划遵循新粒度规范（dogfooding）**：task = plan 边界，TDD red/green/commit 缩进为 task 内微步骤，不拆独立 checkbox。每个 Section 用 `> mode:` 标定执行模式。

**目标：** 为 superpowers-lite 的 apply 阶段引入 inline/batch/isolated 三档执行模式（规划期由 tasks.md 模板标定，apply 纯校验执行）+ task 粒度规范，把 20-task tasks.md 的 apply 耗时从 60-90 分钟降到 20-30 分钟。

**架构：** apply instruction 内联三档路由（方案 A，不新建 skill）。inline/batch 复用 executing-plans 单 session 语义，isolated 用 SDD。全量审查随模式分层（inline 跳过 / batch 组尾一次 / isolated 3 轮）。mode 规范沉淀进 tasks.md 模板为单一事实源。

**技术栈：** TypeScript + ESM（harness CLI）、YAML schema、Markdown skill 模板。

**测试基线：**
- 类型检查：`pnpm lint`（tsc --noEmit）
- 单测：`pnpm test`（vitest run）
- schema 校验：`npx devkeel@latest openspec validate --all --json`

---

## 1. schema.yaml 改动

> mode: batch
>
> mode 依据：同一文件（schema.yaml）多段改动强耦合——description、apply 执行器段、全量审查段、version 须一致变更，单 subagent 顺序做保证契约自洽。

**Files:**
- Modify: `templates/openspec/schemas/superpowers-lite/schema.yaml:1-2`（version 8→9）
- Modify: `templates/openspec/schemas/superpowers-lite/schema.yaml:11-12`（description 分层表述）
- Modify: `templates/openspec/schemas/superpowers-lite/schema.yaml:516-683`（apply instruction 三档路由 + 审查分层）
- Test: 人工核对 instruction 文本 + `npx devkeel@latest openspec validate --change lighten-apply-orchestration --json`

- [x] **1.1 version 与 description 改写**
  1. 第 2 行 `version: 8` → `version: 9`
  2. 第 11-12 行改写为分层表述：
     ```
     apply 阶段按「风险×耦合度」选择执行模式（由 tasks.md 模板标定，apply 机械校验）：
     isolated 档使用 subagent-driven-development 逐任务执行，强制 TDD + 全量 code-review；
     inline/batch 档使用 executing-plans 单 session 执行，inline 跳过 TDD/code-review，
     batch 组尾统一验证。
     ```
  3. 保留第 13 行起的"测试策略"段不变（每 task 只跑 test: 字段、全量仅 review-orchestrator 一次）——SDD 既有优化不丢

- [x] **1.2 apply 执行器段加三档路由**
  1. 第 562-604 行"执行器"段，在"记 base SHA"后、调 SDD 前，插入模式读取与校验逻辑：
     - 读 tasks.md 每个 Section 的 `> mode:` 行（必填）
     - mode 缺失 → 停止，提示模板已更新需补标
     - inline 边界硬校验：≤3 文件、无契约变更、无逻辑改动；不符拒绝并提示重新分组
  2. 按模式分支执行：
     - inline → 调 `executing-plans`，单 session 执行该 task，跳过 TDD/code-review
     - batch → 调 `executing-plans`，单 session 顺序执行整组，组内逐 task commit，组尾跑一次测试
     - isolated → 调 `subagent-driven-development`，保留 SDD v6 全部契约（model 分级、reviewer 只读、scratch 走 `.superpowers/sdd/`、progress ledger 断点续跑）
  3. 保留原 SDD v6 执行契约段（第 578-594 行）与测试策略段（第 596-603 行），仅说明其适用于 isolated 档

- [x] **1.3 全量审查段随模式分层**
  1. 第 605-628 行"全量代码审查"段，开头加模式分层说明：
     - inline：跳过全量审查（trivial 无逻辑改动，质量靠边界严格化兜底）
     - batch：组尾跑一次 review-orchestrator(deep)，最多 3 轮 fix
     - isolated：保留完整 3 轮 fix 循环（当前行为不变）
  2. 原循环逻辑（dispatch review-orchestrator + fixer）标注为 batch/isolated 适用

- [x] **1.4 验证 schema 改动**
  1. 运行 `npx devkeel@latest openspec validate --change lighten-apply-orchestration --json`，确认 `valid: true`
  2. 人工核对 apply instruction 三档分支文本无遗漏

> test: npx devkeel@latest openspec validate --change lighten-apply-orchestration --json
> commit: feat(schema): apply 引入三档执行模式路由与审查分层

---

## 2. tasks artifact instruction 强化

> mode: inline
>
> mode 依据：schema.yaml 单文件单段改动（tasks artifact 的 instruction），无契约变更、无逻辑改动。方案 D：不改 writing-plans SKILL.md（避免 fork 外部 skill 导致升级冲突），改用 instruction 覆盖其 Task Structure 示范。

**Files:**
- Modify: `templates/openspec/schemas/superpowers-lite/schema.yaml:144`（tasks artifact instruction 格式硬约束）

- [x] **2.1 tasks instruction 加格式硬约束**
  1. 在 tasks artifact instruction 的"按模板结构组织产出"处，加格式硬约束（覆盖 writing-plans SKILL.md 的 Task Structure 示范）：task = plan 边界，TDD red/green/commit 是 task 内缩进编号微步骤，不得写成独立 `- [ ]` checkbox；每 Section 须标 `> mode:`
  2. writing-plans SKILL.md 保持 6.0.3 原样不动（零 fork，官方升级无冲突）
  3. versions-yml.yml 的 writing-plans 保持 6.0.3，仅 superpowers-lite 升 8→9

- [~] **2.2 跑 writing-plans 验证 instruction 覆盖力（移 verify）**
  - 用强化后的 instruction 跑一次 writing-plans 生成测试 tasks.md，确认产出是 plan 边界格式（非 step 级 checkbox）
  - 本 change 用旧 apply 执行，无法用新 instruction 自验证；verify 阶段人工核查或在后续 change 验证
  - 若压不住 step 级格式，退路是回退到直接改 writing-plans SKILL.md（恢复 Section 2 原方案）

> test: npx devkeel@latest openspec validate --changes lighten-apply-orchestration --json
> commit: feat(schema): tasks instruction 强化格式硬约束覆盖 writing-plans 示范

---

## 3. tasks.md 模板改动

> mode: inline
>
> mode 依据：单文件模板调整（templates/tasks.md），无契约变更、无逻辑改动，仅结构示范。满足 inline 边界。

**Files:**
- Modify: `templates/openspec/schemas/superpowers-lite/templates/tasks.md`

- [x] **3.1 模板增加 mode 标注与边界规范**
  1. 在每个 Section 标题下加 `> mode:` 必填行，附 mode 边界注释块：
     ```markdown
     ## 1. <!-- 功能组名称 -->

     > mode: batch  <!-- 必填：inline | batch | isolated。边界见下方注释 -->

     <!--
       mode 边界（mode 规范唯一事实源，apply 仅机械校验，不判模式）：
       - inline：≤3 文件、无契约变更、无逻辑改动（装依赖/typo/纯验证）
       - batch：强耦合组，满足任一：同一子项目目录 / Files 文件重叠 ≥1 / test: 命令同构建栈
                慢测试栈识别：test: 含 @SpringBootTest、mvn、-Dtest=、integration 关键词
       - isolated：破坏性重构/迁移，或需并行无依赖分支
     -->

     - [ ] **1.1 任务描述**（task = plan 边界，可独立验证的交付物）
       1. 写测试：`path/to/test.ts` — 验证 XX 场景   <!-- 缩进微步骤，非独立 checkbox -->
       2. 实现：`path/to/module.ts`
       3. 验证：`pnpm vitest run path/to/test.ts`
       > test: pnpm vitest run path/to/test.ts
       > commit: feat(scope): 中文描述
     ```
  2. 模板顶部"给 agentic 执行器"提示更新：从"使用 subagent-driven-development 逐任务实现"改为"按 Section 的 mode 标注选择执行模式"
  3. 粒度示范对齐 Section 2 的 writing-plans Task Structure 改写（task = plan 边界，TDD 缩进化）

- [x] **3.2 验证模板可用**
  1. 用改后模板对照本 tasks.md 自身——本文件已遵循新模板（每 Section 有 mode 标注、task 为 plan 边界、TDD 缩进化），即 dogfooding 验证
  2. 运行 `npx devkeel@latest openspec validate --change lighten-apply-orchestration --json` 确认模板改动未破坏 schema 解析

> test: npx devkeel@latest openspec validate --change lighten-apply-orchestration --json
> commit: feat(templates): tasks.md 模板增加 mode 标注与粒度规范

---

## 4. 版本一致性校验

> mode: inline
>
> mode 依据：单文件 versions-yml.yml 的版本号校对，无契约变更、无逻辑改动。

**Files:**
- Modify: `templates/versions-yml.yml:38`（superpowers-lite schema 版本同步）

- [x] **4.1 superpowers-lite schema 版本同步**
  1. versions-yml.yml 第 38 行 `superpowers-lite: "8"` → `superpowers-lite: "9"`
  2. 按 skill-versioning 规范：schema.yaml 的 version 与 versions-yml.yml 的 schemas 条目一致
  3. 核对：schema.yaml 第 2 行 `version: 9` 与 versions-yml.yml 第 38 行 `superpowers-lite: "9"` 一致

- [x] **4.2 全量版本一致性校验**
  1. 运行 `npx devkeel@latest doctor` 确认无版本不一致告警
  2. 核对 Section 2.3 的 writing-plans 双处版本（SKILL.md + versions-yml.yml）已同步

> test: npx devkeel@latest doctor
> commit: chore(versions): 同步 superpowers-lite schema 至 v9

---

## 5. 验证

> mode: inline
>
> mode 依据：纯验证步骤，无代码改动。
>
> 注：本 change 是改 apply 自身的元变更，用旧 apply 跑本 change 无法验证新 apply 行为。运行 apply 验证类步骤用 `[~]` 标记，指向 verify 阶段人工核查。

**Files:**
- Test: 项目根目录运行质量检查命令

- [x] **5.1 类型检查与单测**
  1. 运行 `pnpm lint`（tsc --noEmit），Expected: 无错误
  2. 运行 `pnpm test`（vitest run），Expected: 全部 PASS
  3. 本 change 仅改模板/schema 文本（非 TS 源码），lint/test 应零影响

> test: pnpm lint && pnpm test
> commit: chore: 验证 lint 与单测通过

- [~] **5.2 新 apply 行为验证（元变更，移 verify 人工核查）**
  - 本 change 用旧 apply 执行，无法用新 apply 自验证三档路由、inline 边界校验、审查分层
  - verify 阶段人工重点核查：
    1. apply instruction 三档分支文本完整（schema.yaml 第 562-628 行）
    2. mode 缺失/inline 越界的停止逻辑存在
    3. tasks.md 模板 mode 边界注释含慢测试栈关键词与 batch 分组阈值
    4. 版本号三处一致（schema.yaml:2、versions-yml.yml:38、writing-plans SKILL.md:6 与 versions-yml.yml:33）
  - 若条件允许，后续可另起 change 用新 apply 跑一份测试用 tasks.md 验证三档路由实际行为

> commit: test: 标注新 apply 行为验证移至 verify 人工核查

---

## 自检清单

**Spec 覆盖（对照 brainstorm.md In Scope 6 项）：**
- 三档执行模式 inline/batch/isolated，按风险×耦合度驱动 → Section 1.2 ✅
- isolated 降为 opt-in，触发条件改为高风险可逆性需求 → Section 1.2 ✅
- inline 跳过 TDD/code-review，改 description 分层表述 → Section 1.1 ✅
- inline 边界由 tasks.md 模板注释定义，apply 忠实执行不校验选择 → Section 1.2 + Section 3.1 ✅
- tasks.md task 粒度规范（task = plan 边界，TDD 缩进化）→ Section 2.1 + Section 3.1 ✅
- 人工验证类步骤用 [~] 标记指向 verify → Section 5.2 ✅

**dogfooding 验证：**
- 本 tasks.md 自身遵循新粒度规范：task = plan 边界（5 个 Section，每个 1-2 个 plan 级 task，非 step 级）✅
- 每 Section 标 mode（batch×1 + inline×3 + 验证 Section）✅
- TDD red/green/commit 缩进为 task 内微步骤，无独立 checkbox ✅
- 元变更验证用 [~] 指向 verify ✅

**版本一致性（两处，零 fork）：**
- schema.yaml:2 `version: 9` ↔ versions-yml.yml:38 `superpowers-lite: "9"` ✅（Section 4.1）
- writing-plans SKILL.md 保持 6.0.3 原样（方案 D 不改，零 fork）✅
