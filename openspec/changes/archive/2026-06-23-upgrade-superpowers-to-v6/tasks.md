# superpowers v6.0.3 升级与 schema 配套 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 将 9 个 superpowers skill 升级到 v6.0.3、嵌入 2 个新 skill、配套修改 superpowers-lite schema apply 步骤 3/4 并同步版本。

**架构：** 改动全部落在模板资产层（templates/skills/、templates/openspec/schemas/、templates/versions-yml.yml），src/ 命令层零改动。v6 源已 clone 到 /tmp/superpowers-v6/skills/。

**技术栈：** TypeScript ESM 模板项目，vitest 测试，无构建依赖变更。

---

## 1. skill 资产升级

- [x] **1.1 升级 9 个 superpowers skill 到 v6.0.3**
  1. 对每个 skill（brainstorming、executing-plans、finishing-a-development-branch、requesting-code-review、subagent-driven-development、systematic-debugging、test-driven-development、using-git-worktrees、writing-plans）：删除 `templates/skills/<name>/` 旧目录
  2. 从 `/tmp/superpowers-v6/skills/<name>/` 复制全部文件到 `templates/skills/<name>/`
  3. 在每个 SKILL.md frontmatter 注入 `metadata:` 块：`author: "superpowers"` + `version: "6.0.3"`（v6 上游无 version 字段，按 embed spec 要求用 release tag 作版本号）
  4. 验证：`ls templates/skills/subagent-driven-development/` 含 task-reviewer-prompt.md、implementer-prompt.md、scripts/
  > test: pnpm vitest run tests/templates.test.ts
  > commit: feat(skills): 升级 9 个 superpowers skill 到 v6.0.3

- [x] **1.2 brainstorming 专项处理（排除 visual-companion）**
  1. 删除 `templates/skills/brainstorming/visual-companion.md`
  2. 删除 `templates/skills/brainstorming/scripts/` 目录
  3. 从 `templates/skills/brainstorming/SKILL.md` 移除 "Visual Companion" section 及 spec-document-reviewer-prompt.md 若仅服务 visual companion 则一并移除（保留若服务 spec review）
  4. 验证：`grep -ri "visual-companion\|Visual Companion" templates/skills/brainstorming/` 为空
  > test: pnpm vitest run tests/templates.test.ts
  > commit: fix(skills): brainstorming 排除 visual-companion 附属文件

- [x] **1.3 清理 superpowers: 命名空间前缀残留**
  1. 在 `templates/skills/` 全目录将 `superpowers:<skill-name>` 替换为裸名 `<skill-name>`（涉及 executing-plans、systematic-debugging、subagent-driven-development 等）
  2. 验证：`grep -rn "superpowers:" templates/skills/` 输出为空
  > test: pnpm vitest run tests/templates.test.ts
  > commit: fix(skills): 清理 superpowers 命名空间前缀残留

- [x] **1.4 新增 2 个 skill（verification-before-completion、receiving-code-review）**
  1. 从 `/tmp/superpowers-v6/skills/verification-before-completion/` 复制到 `templates/skills/verification-before-completion/`
  2. 从 `/tmp/superpowers-v6/skills/receiving-code-review/` 复制到 `templates/skills/receiving-code-review/`
  3. 两个 SKILL.md frontmatter 注入 `metadata:` 块：`author: "superpowers"` + `version: "6.0.3"`
  4. 验证：`ls templates/skills/ | grep -E "verification-before-completion|receiving-code-review"` 均存在
  > test: pnpm vitest run tests/templates.test.ts
  > commit: feat(skills): 嵌入 verification-before-completion 与 receiving-code-review

## 2. schema 配套修改

- [x] **2.1 修改 superpowers-lite schema apply 步骤 3 适配 SDD v6**
  1. 编辑 `templates/openspec/schemas/superpowers-lite/schema.yaml` apply 步骤 3「执行器」instruction
  2. 新增 v6 契约表述：每次 dispatch subagent 必须显式声明 model（机械任务廉价模型/判断任务标准模型/whole-branch review 最强模型）；task reviewer 只读工作区不修改代码；禁止 dispatch 时告知 reviewer 跳过 finding 或预判 severity；SDD scratch（task brief、review package、progress ledger）走 `.superpowers/sdd/`；apply 启动先读 progress ledger 断点续跑；review package 通过 scripts/review-package 写文件传递
  3. 保留现有「测试策略（覆盖 TDD 全量测试）」内容不变
  4. 验证：`grep -n "声明 model\|reviewer 只读\|progress ledger\|\.superpowers/sdd" templates/openspec/schemas/superpowers-lite/schema.yaml` 均命中
  > test: pnpm vitest run tests/templates.test.ts
  > commit: feat(schema): apply 步骤 3 适配 SDD v6 新契约

- [x] **2.2 修改 apply 步骤 4 为分层互补并明文化**
  1. 编辑 schema apply 步骤 4「全量代码审查」instruction
  2. 开头新增分层说明：SDD v6 whole-branch review 已完成代码质量层审查（spec 符合性 + 代码质量），本步骤 review-orchestrator(deep) 聚焦架构/规范层（分层越界/依赖方向、CLI 接口与文件系统安全、harness 工具链一致性），两者职责正交不重复
  3. 保留现有循环逻辑（最多 3 轮 review-fix）不变
  4. 验证：`grep -n "代码质量层\|架构/规范层\|正交" templates/openspec/schemas/superpowers-lite/schema.yaml` 命中
  > test: pnpm vitest run tests/templates.test.ts
  > commit: feat(schema): apply 步骤 4 与 SDD v6 review 分层互补明文化

- [x] **2.3 schema version 7→8**
  1. 编辑 `templates/openspec/schemas/superpowers-lite/schema.yaml` 顶部 `version: 7` → `version: 8`
  2. 验证：`grep -m1 "^version:" templates/openspec/schemas/superpowers-lite/schema.yaml` 为 `version: 8`
  > test: pnpm vitest run tests/config.test.ts
  > commit: chore(schema): superpowers-lite 版本 7 升 8

## 3. 版本同步与验证

- [x] **3.1 同步 versions-yml.yml**
  1. 编辑 `templates/versions-yml.yml` skills 段：9 个 superpowers skill 版本改为 `"6.0.3"`
  2. skills 段新增 `verification-before-completion: "6.0.3"` 和 `receiving-code-review: "6.0.3"`
  3. schemas 段 `superpowers-lite: "7"` → `"8"`
  4. 验证：11 个 skill 的 versions-yml.yml 版本与各自 SKILL.md metadata.version 一致；schema 版本与 schema.yaml 一致
  > test: pnpm vitest run tests/config.test.ts
  > commit: chore(versions): 同步 11 个 skill 与 superpowers-lite schema 版本

- [x] **3.2 .gitignore 补 .superpowers/sdd 条目**
  1. 编辑 `.gitignore`，在 `# harness runtime` 分节或合适位置新增 `.superpowers/` 条目（SDD v6 scratch 目录）
  2. 验证：`grep -n "\.superpowers" .gitignore` 命中
  > test: pnpm vitest run tests/templates.test.ts
  > commit: chore(gitignore): 忽略 .superpowers/sdd 运行时目录

- [x] **3.3 全量验证**
  1. 运行 `pnpm lint`（tsc --noEmit）确认无类型错误
  2. 运行 `pnpm test` 确认全部测试通过，若有测试因版本号或 skill 数量变更失败则修复断言
  3. 运行 `grep -rn "superpowers:" templates/skills/ templates/openspec/schemas/superpowers-lite/schema.yaml` 确认前缀残留清零
  4. 运行 `grep -c "6.0.3" templates/versions-yml.yml` 确认 11 个 skill + 无遗漏
  5. 验证：lint 和 test 均通过，grep 校验全部符合预期
  > test: pnpm lint && pnpm test
  > commit: test(versions): 修复 v6 升级后的测试断言
