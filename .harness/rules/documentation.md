# 文档规范

## 约定 1: CLI help 文本使用中文简短描述

每个 `.command()` 和 `.option()` 的 `.description()` 使用中文，一句话说明功能，不超过 20 个字。

出处: `src/index.ts` — `'初始化 .harness/ 配置'`、`'检查配置完整性'`、`'更新 harness 内置资产'`

```typescript
// ✅ 正确
.command('init').description('初始化 .harness/ 配置')
.option('--fix', '自动修复可修复的问题')

// ❌ 错误
.description('Initialize the harness configuration directory')
.description('初始化项目的 .harness/ 配置目录，包含 rules、skills、agents 等子目录...')
```

## 约定 2: 代码中默认不写注释

除非 WHY 不可从代码推断，否则不添加注释。JSDoc、块注释、行尾注释均不使用。

出处: `src/` 全部文件几乎无注释；CLAUDE.md 明确要求"default to writing no comments"

## 约定 3: CLAUDE.md 结构保持稳定

CLAUDE.md 包含固定章节：Project、Commands、Architecture、Tech Stack。通过 `@AGENTS.md` 引用执行契约。内容变更时保持此结构。

出处: `CLAUDE.md`

## 约定 4: changelog 使用双版本流 JSON 数据源

版本正文唯一写入 `web/public/versions/cli/*.json` 或 `web/public/versions/templates/*.json`，两条流保持独立版本号。React 页面 `web/src/pages/changelog.tsx` 只维护布局、交互和 V1 → V2 静态迁移说明，不手工维护版本正文、latest badge 或 Update Tip。对外 URL 继续保持 `/changelog.html`；不直接编辑或提交 `web/dist/`，也不在项目根目录创建 CHANGELOG.md。JSON schema、human-review 分类和验证流程遵循 `.harness/skills/changelog/`。

出处: `.harness/skills/changelog/`、AGENTS.md 第 8 节资产表

## 约定 5: 知识产出写入 openspec/，不写入 docs/

所有设计文档、方案分析、需求记录统一归入 `openspec/` 目录。禁止产出到 `docs/`。

出处: AGENTS.md 第 8 节 — `知识产出 → openspec/`

## 约定 6: AGENTS.md 为执行契约的唯一权威

多平台的执行规则统一在 AGENTS.md 中定义。CLAUDE.md/GEMINI.md 等通过引用指向 AGENTS.md，不独立维护执行逻辑。

出处: AGENTS.md 开头说明 + CLAUDE.md `@AGENTS.md`
