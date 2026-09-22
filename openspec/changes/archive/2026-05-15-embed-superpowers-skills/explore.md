## 调查范围

基于 brainstorm.md，聚焦以下区域：
1. `templates/skills/` — 新 skill 的存放位置
2. `src/lib/templates.ts` — skill 复制与分发逻辑
3. `templates/agents-md.md` + `templates/openspec/schemas/superpowers-bridge/` — 引用变更
4. SuperPowers v5.1.0 skill 源文件结构

## 现有架构

### 模板分发流程

```
templates/skills/         ──(copyTemplateSkills)──→  .harness/skills/
                                                          │
                                                    (createPlatformLinks)
                                                          │
                                          ┌───────────────┼───────────────┐
                                          ▼               ▼               ▼
                                    .claude/skills/  .agents/skills/  (其他平台)
                                      (symlink)       (symlink)
```

关键模块：
- `copyTemplateSkills(targetDir)` — 递归复制 `templates/skills/` 到目标目录
- `createPlatformLinks(projectRoot, targets)` — 为各平台创建 symlink
- `copyDirRecursive(source, target)` — 无条件覆盖复制
- `detectDeprecatedAssets()` — 清理模板中已移除的资产

### 平台支持矩阵

| 平台 | Skills 发现路径 | 链接方式 |
|------|----------------|----------|
| Claude Code | `.claude/skills/` | symlink → `.harness/skills/` |
| Codex | `.agents/skills/` | symlink → `.harness/skills/` |
| Cursor | `.cursor/rules/` | symlink → `.harness/rules/`（仅 rules） |
| Copilot | `@AGENTS.md` 引用 | 文件引用 |
| Gemini | `GEMINI.md` 引用 | 文件引用 |

**注意：** Cursor 只链接 rules，不链接 skills。Copilot/Gemini 通过 AGENTS.md 引导到 `.harness/` 读取。

## 关键代码路径

### 1. Skill 复制 — `src/lib/templates.ts:13-16`

```typescript
export function copyTemplateSkills(targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'skills')
  copyDirRecursive(source, targetDir)
}
```

无条件递归复制，子目录结构原样保留。新增 skill 目录只需放入 `templates/skills/` 即可，无需改代码。

### 2. 废弃资产检测 — `src/lib/templates.ts:242-250`

```typescript
function isHarnessGenerated(entryPath: string): boolean {
  const skillMd = path.join(entryPath, 'SKILL.md')
  if (fs.existsSync(skillMd)) {
    return fs.readFileSync(skillMd, 'utf-8').includes('devkeel')
  }
  ...
}
```

**发现：** 当前只识别包含 `devkeel` 的 skill 为"harness 生成"。如果嵌入的 skill 用 `author: "superpowers"`，将来从模板中移除时，`detectDeprecatedAssets` 不会自动清理它们。

**需要决策：** 是否扩展 `isHarnessGenerated` 检测逻辑，或接受手动清理。

### 3. 引用点汇总

需要修改 `superpowers:` 前缀的文件：
- `templates/agents-md.md` — 1 处
- `templates/openspec/schemas/superpowers-bridge/schema.yaml` — 17 处
- `templates/openspec/schemas/superpowers-bridge/templates/tasks.md` — 1 处
- `templates/openspec/schemas/superpowers-bridge/templates/retrospective.md` — 6 处
- 各嵌入 skill 内部互相引用 — 待统计

### 4. SuperPowers skill 文件结构

| Skill | 文件数 | 需嵌入文件 |
|-------|--------|-----------|
| brainstorming | 3 | SKILL.md, spec-document-reviewer-prompt.md（去掉 visual-companion.md + scripts/） |
| writing-plans | 1 | SKILL.md |
| subagent-driven-development | 4 | SKILL.md, spec-reviewer-prompt.md, implementer-prompt.md, code-quality-reviewer-prompt.md |
| executing-plans | 1 | SKILL.md |
| using-git-worktrees | 1 | SKILL.md |
| test-driven-development | 2 | SKILL.md, testing-anti-patterns.md |
| requesting-code-review | 2 | SKILL.md, code-reviewer.md |
| finishing-a-development-branch | 1 | SKILL.md |

## 测试覆盖

- `tests/` 中有 `templates.test.ts` 覆盖 `copyTemplateSkills`、`createPlatformLinks` 等
- 新增 skill 目录不需要改测试逻辑（递归复制），但应验证复制后文件完整
- 无需新增测试，除非修改 `isHarnessGenerated` 逻辑

## 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| `isHarnessGenerated` 不识别 `author: "superpowers"` | 将来移除 skill 时不会自动清理 | 扩展检测逻辑，增加 `superpowers` 关键字匹配 |
| brainstorming 中 visual-companion 引用残留 | SKILL.md 中有 "Visual Companion" section 和文件引用 | 裁剪时一并删除相关段落 |
| Skill 内部 `superpowers:` 互相引用遗漏 | 运行时找不到 skill | 全量 grep 替换后验证 |
| 模板体积增长 ~83KB | 对 npm 包体积有影响 | 可接受，skill 是文本文件 |
