# 嵌入 SuperPowers Skills 实现计划

> **给 agentic 执行器：** 使用 subagent-driven-development
> 按任务逐个实现本计划。

**目标：** 将 SuperPowers v5.1.0 的 8 个 workflow skill 嵌入 harness 模板，使 init 后项目直接可用。

**架构：** 纯模板资产变更 + 引用替换 + 一行检测逻辑扩展。无新模块、无 API 变更。`templates/skills/` 新增 8 个目录，所有 `superpowers:` 前缀引用替换为裸名。

**技术栈：** TypeScript, 文件系统操作, YAML, Markdown

---

## 1. 嵌入 Skill 文件

- [x] **1.1 复制 brainstorming skill（含裁剪）**
  1. 从 SuperPowers v5.1.0 缓存复制 `brainstorming/SKILL.md` 和 `brainstorming/spec-document-reviewer-prompt.md` 到 `templates/skills/brainstorming/`
  2. 删除 SKILL.md 中 "## Visual Companion" section（从 `## Visual Companion` 到下一个同级标题前）
  3. 删除 SKILL.md checklist 中 "Offer visual companion" 相关步骤和 process flow 中的 visual companion 节点
  4. 删除 SKILL.md 中对 `visual-companion.md` 和 `scripts/` 的文件引用
  5. 替换 SKILL.md frontmatter 的 metadata 为 `author: "superpowers"`, `version: "5.1.0"`
  6. 替换文件内所有 `superpowers:` 前缀引用为裸名
  7. 验证：确认目录不含 `visual-companion.md` 和 `scripts/`
  > commit: feat(templates): embed brainstorming skill from superpowers v5.1.0

- [x] **1.2 复制 writing-plans skill**
  1. 复制 `writing-plans/SKILL.md` 到 `templates/skills/writing-plans/`
  2. 替换 frontmatter metadata
  3. 替换文件内所有 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed writing-plans skill from superpowers v5.1.0

- [x] **1.3 复制 subagent-driven-development skill**
  1. 复制 `subagent-driven-development/` 全部 4 个文件到 `templates/skills/subagent-driven-development/`
  2. 替换 SKILL.md frontmatter metadata
  3. 替换所有文件内 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed subagent-driven-development skill from superpowers v5.1.0

- [x] **1.4 复制 executing-plans skill**
  1. 复制 `executing-plans/SKILL.md` 到 `templates/skills/executing-plans/`
  2. 替换 frontmatter metadata
  3. 替换文件内所有 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed executing-plans skill from superpowers v5.1.0

- [x] **1.5 复制 using-git-worktrees skill**
  1. 复制 `using-git-worktrees/SKILL.md` 到 `templates/skills/using-git-worktrees/`
  2. 替换 frontmatter metadata
  3. 替换文件内所有 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed using-git-worktrees skill from superpowers v5.1.0

- [x] **1.6 复制 test-driven-development skill**
  1. 复制 `test-driven-development/` 全部 2 个文件到 `templates/skills/test-driven-development/`
  2. 替换 SKILL.md frontmatter metadata
  3. 替换所有文件内 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed test-driven-development skill from superpowers v5.1.0

- [x] **1.7 复制 requesting-code-review skill**
  1. 复制 `requesting-code-review/` 全部 2 个文件到 `templates/skills/requesting-code-review/`
  2. 替换 SKILL.md frontmatter metadata
  3. 替换所有文件内 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed requesting-code-review skill from superpowers v5.1.0

- [x] **1.8 复制 finishing-a-development-branch skill**
  1. 复制 `finishing-a-development-branch/SKILL.md` 到 `templates/skills/finishing-a-development-branch/`
  2. 替换 frontmatter metadata
  3. 替换文件内所有 `superpowers:` 前缀引用为裸名
  > commit: feat(templates): embed finishing-a-development-branch skill from superpowers v5.1.0

## 2. 更新模板引用

- [x] **2.1 更新 agents-md.md**
  1. 将 `superpowers:brainstorming` 替换为 `brainstorming`
  2. 验证：grep 确认无 `superpowers:` 残留
  > commit: refactor(templates): remove superpowers prefix from agents-md references

- [x] **2.2 更新 superpowers-bridge schema.yaml**
  1. 将所有 `superpowers:` 前缀引用替换为裸名（约 17 处）
  2. 更新 description 中的说明文字（不再区分 "依赖 Superpowers skills"）
  3. 验证：grep 确认无 `superpowers:` 残留
  > commit: refactor(templates): remove superpowers prefix from schema references

- [x] **2.3 更新 superpowers-bridge 子模板**
  1. `templates/openspec/schemas/superpowers-bridge/templates/tasks.md` — 替换引用
  2. `templates/openspec/schemas/superpowers-bridge/templates/retrospective.md` — 替换引用
  3. 验证：grep 确认无 `superpowers:` 残留
  > commit: refactor(templates): remove superpowers prefix from schema sub-templates

## 3. 扩展检测逻辑

- [x] **3.1 更新 isHarnessGenerated**
  1. 修改 `src/lib/templates.ts` 中 `isHarnessGenerated` 函数
  2. 增加条件：`content.includes('author: "superpowers"') || content.includes('author: "openspec"')`
  3. 验证：`pnpm lint` 通过
  4. 验证：`pnpm test` 通过
  > commit: feat(detect): recognize superpowers and openspec authored skills in deprecation detection

- [x] **3.2 给 openspec skills 补充 metadata**
  1. 给 11 个 openspec-* skill 的 SKILL.md frontmatter 添加 `metadata:\n  author: "openspec"`
  2. 涉及文件：openspec-apply-change、openspec-archive-change、openspec-bulk-archive-change、openspec-continue-change、openspec-explore、openspec-ff-change、openspec-new-change、openspec-onboard、openspec-propose、openspec-sync-specs、openspec-verify-change
  3. 验证：grep 确认 11 个文件都包含 `author: "openspec"`
  > commit: chore(templates): add author metadata to openspec skills

## 4. 全量验证

- [x] **4.1 集成验证**
  1. `pnpm build` — 构建通过
  2. `pnpm lint` — 类型检查通过
  3. `pnpm test` — 全部测试通过
  4. grep 全项目确认 `superpowers:` 只出现在非模板文件（如 openspec/changes/ 中的分析文档）
  5. `node bin/devkeel.js init --dry-run`（如支持）或手动验证模板完整性
  > commit: 无（验证步骤）
