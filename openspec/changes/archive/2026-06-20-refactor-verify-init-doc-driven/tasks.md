# verify-init 去 stack-recipes 化改造 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 删 stack-recipes 17 份固定配方，改为 Agent 凭官方文档（WebFetch 必有/context7 可选）+ detection + matrix + 新增 scaffolding-principles 清单自主产出测试脚手架，fetch 全失败诚实降级跳过 config。

**架构：** 纯 skill 模板文本资产改动（templates/skills/verify-init/ + .harness 副本），不涉及 src/ 运行时代码。1 删 + 1 重写 + 1 新增 + 1 同步（SKILL.md），双份副本 diff 校验一致。

**技术栈：** Markdown 模板；校验以 grep/diff/openspec validate 为主。

---

## 1. 删除 stack-recipes 固定配方

- [x] **1.1 删除 stack-recipes/ 全部 17 份配方**
  1. 删除 `templates/skills/verify-init/references/stack-recipes/` 整个目录（含 frontend-react/vue/angular/svelte、backend-node/python/go/java-spring、react-native/flutter/ios-swift/android、cli-node/rust/go、library-node/python 共 17 份）
  2. 确认目录不存在
  > test: test ! -d templates/skills/verify-init/references/stack-recipes && echo "已删除"
  > commit: refactor(verify-init): 删除 stack-recipes 固定配方目录（17 份）

## 2. 重写 frameworks-index 为文档定位方法论

- [x] **2.1 重写 frameworks-index.md（删 URL 表，写定位方法论）**
  1. 重写 `templates/skills/verify-init/references/frameworks-index.md`：删除每框架 URL 表 + context7 库名 + WebFetch 降级 URL 表，改为：
     - 标题改为「官方文档定位方法论」
     - 「定位步骤（从项目现状出发）」：从 manifest 取包名 → 定位官方文档源（context7/WebFetch/WebSearch/GitHub README 按优先级）→ 提取产出要素
     - 「fetch 链（context7 首选非必需）」：context7 可选加速 / WebFetch 内置必有主力 / 全失败见 Hard Rule 4 降级
     - 「质量标准」：来源权威、版本对应、不照搬、降级明确
  2. 确认不含任何「每框架 URL 行」表格，含「定位步骤」和「fetch 链」章节
  > test: grep -q "官方文档定位方法论" templates/skills/verify-init/references/frameworks-index.md && grep -q "定位步骤" templates/skills/verify-init/references/frameworks-index.md && ! grep -q "context7 库名" templates/skills/verify-init/references/frameworks-index.md
  > commit: refactor(verify-init): frameworks-index 改写为官方文档定位方法论

## 3. 新增 scaffolding-principles 清单

- [x] **3.1 新增 scaffolding-principles.md（跨栈通用 checklist）**
  1. 新建 `templates/skills/verify-init/references/scaffolding-principles.md`，含：
     - 「必含项（缺一不可）」：安装命令（检测到的包管理器）/ 配置文件（已存在则跳过）/ 每类测试一个最小示例 / 执行 scripts / 幂等守卫
     - 「跨栈通用注意点（官方文档不会告诉你）」：CI 先 build、覆盖率门槛 ≥80%、e2e trace、API 测试内存优先、mock 边界、执行分层
     - 「产出核对流程」：拉文档→对照必含项→对照跨栈注意点→幂等执行→缺项不编造
  2. 确认文件不含任何具体技术栈的 config 代码块（只有 checklist + 原则）
  > test: test -f templates/skills/verify-init/references/scaffolding-principles.md && grep -q "必含项" templates/skills/verify-init/references/scaffolding-principles.md && grep -q "CI 先 build" templates/skills/verify-init/references/scaffolding-principles.md && ! grep -q "vitest.config" templates/skills/verify-init/references/scaffolding-principles.md
  > commit: feat(verify-init): 新增 scaffolding-principles 脚手架产出清单

## 4. 同步改 SKILL.md

- [x] **4.1 改 Read First 段（删 recipes 引用，加 principles 引用）**
  1. 修改 `templates/skills/verify-init/SKILL.md` 的 Read First 段：
     - 删 `- references/stack-recipes/ — 每技术栈固定配方基线（安装/config/示例/scripts）` 行
     - frameworks-index 描述改为 `官方文档定位方法论 + fetch 链（context7 首选非必需）`
     - 新增 `- references/scaffolding-principles.md — 脚手架产出原则 checklist（必含项 + 跨栈注意点）`
  > test: grep -q "scaffolding-principles.md" templates/skills/verify-init/SKILL.md && ! grep -q "stack-recipes" templates/skills/verify-init/SKILL.md && grep -q "官方文档定位方法论" templates/skills/verify-init/SKILL.md
  > commit: refactor(verify-init): SKILL Read First 引用改为 principles + 定位方法论

- [x] **4.2 改流程总览 + Hard Rule 4 + Hard Rule 8**
  1. 流程总览 Phase 3 行改为：`Phase 3: 脚手架 → 定位官方文档 → 照 scaffolding-principles 产出 install/config/example/scripts（幂等）`
  2. Hard Rule 4 改为：`fetch 失败降级不阻塞 — context7 + WebFetch 都失败时，跳过精确 config 产出，只生成 testing 规范 + 验证 agent，log() 提示「未能获取 <框架> 官方文档，config 请手动补」。不凭记忆编造可能过时的 config`
  3. Hard Rule 8 改为：`由 Claude 执行安装命令 — 纯文档驱动，不内置安装脚本；按官方文档 + scaffolding-principles 产出精确命令执行`
  > test: grep -q "定位官方文档" templates/skills/verify-init/SKILL.md && grep -q "跳过精确 config 产出" templates/skills/verify-init/SKILL.md && grep -q "scaffolding-principles 产出精确命令" templates/skills/verify-init/SKILL.md
  > commit: refactor(verify-init): Hard Rule 4/8 + 流程总览适配文档驱动

- [x] **4.3 重写 Phase 3.1-3.3（定位文档 + 照清单产出）**
  1. 修改 `templates/skills/verify-init/SKILL.md` 的 Phase 3：
     - 3.1 从「fetch 增强（可选）」改为「定位官方文档」：读 frameworks-index 方法论，从 manifest 取包名 → context7/WebFetch/WebSearch/GitHub README 找官方文档，提取安装/config schema/示例/scripts/最佳实践
     - 3.2 从「叠加固定基线」改为「照清单产出」：读 scaffolding-principles，对照必含项 + 跨栈注意点核对产出
     - 3.3 从「执行（由 Claude 照配方）」改为「执行（由 Claude 照 principles）」，4 步（安装/写 config/写示例/补 scripts）保留，结尾加 fetch 全失败 → 跳过 1-4 只产 Phase 4
  > test: grep -q "### 3.1 定位官方文档" templates/skills/verify-init/SKILL.md && grep -q "### 3.2 照清单产出" templates/skills/verify-init/SKILL.md && grep -q "### 3.3 执行（由 Claude 照 principles）" templates/skills/verify-init/SKILL.md
  > commit: refactor(verify-init): Phase 3 重写为定位文档+照清单产出

## 5. 同步 .harness 副本与版本校验

- [x] **5.1 同步 templates/ → .harness/ 并校验一致**
  1. 将 `templates/skills/verify-init/` 下改动同步到 `.harness/skills/verify-init/`（删 stack-recipes 目录 + 新增/重写的 references + 改后的 SKILL.md）
  2. diff 校验两份完全一致
  > test: diff -rq templates/skills/verify-init .harness/skills/verify-init && echo "两份一致"
  > commit: chore(verify-init): 同步 templates/ 到 .harness 自用副本

- [x] **5.2 确认版本保持 1.0.0（未发布不 bump）**
  1. 确认 `templates/skills/verify-init/SKILL.md` metadata.version 仍为 `"1.0.0"`
  2. 确认 `templates/versions-yml.yml` 的 verify-init 仍为 `"1.0.0"`
  > test: grep -q 'version: "1.0.0"' templates/skills/verify-init/SKILL.md && grep -q 'verify-init: "1.0.0"' templates/versions-yml.yml
  > commit: （不单独提交，并入 5.1）

## 6. 验证

- [x] **6.1 openspec 结构验证**
  1. 在 harness-cli 根目录运行 `npx devkeel@latest openspec validate --all --json`，确认本 change 未引入新失败（对比 base 与 HEAD 的 failed 项一致，pre-existing spec 缺 Purpose 不计入）
  2. 运行 `npx devkeel@latest openspec status --change refactor-verify-init-doc-driven`，确认 artifact 状态正常
  > test: npx devkeel@latest openspec status --change refactor-verify-init-doc-driven --json | grep -q '"status": "done"'
  > commit: test(verify-init): 去 stack-recipes 化结构验证

- [x] **6.2 lint 与现有测试不受影响**
  1. 运行 `pnpm lint`（tsc --noEmit，确认无类型破坏——本次改 skill 模板资产，预期通过）
  2. 运行 `pnpm test`（确认现有 vitest 套件不受影响）
  > test: pnpm test
  > commit: test(verify-init): 确认去 stack-recipes 改动不影响现有测试

- [x] **6.3 端到端抽查：无悬空引用 + 文档驱动链路完整**
  1. grep 确认 SKILL.md 无任何 `stack-recipes` 残留引用
  2. 抽查链路完整：detection → matrix → frameworks-index 定位方法论 → scaffolding-principles 清单 → 产出
  3. 确认 fetch 链措辞：context7 首选非必需、WebFetch 必有主力、全失败跳过 config
  > test: ! grep -q "stack-recipes" templates/skills/verify-init/SKILL.md && grep -q "context7 首选非必需" templates/skills/verify-init/references/frameworks-index.md && grep -q "WebFetch" templates/skills/verify-init/references/frameworks-index.md
  > commit: test(verify-init): 文档驱动链路端到端抽查
