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

出处: `src/` 现有代码风格

## 约定 3: CLAUDE.md 只引用 AGENTS.md

仓库 CLAUDE.md 与分发模板只保留一行 `@AGENTS.md`。项目知识入口由 AGENTS.md 维护。
初始化与同步时保留已有用户自定义内容。

出处: `CLAUDE.md`

## 约定 4: changelog 使用双版本流 JSON 数据源

版本正文唯一写入 `web/public/versions/cli/*.json` 或 `web/public/versions/templates/*.json`，两条流保持独立版本号。React 页面 `web/src/pages/changelog.tsx` 只维护布局、交互和 V1 → V2 静态迁移说明，不手工维护版本正文、latest badge 或 Update Tip。对外 URL 继续保持 `/changelog.html`；不直接编辑或提交 `web/dist/`，也不在项目根目录创建 CHANGELOG.md。JSON schema、human-review 分类和验证流程遵循 `.harness/skills/changelog/`。

出处: `.harness/skills/changelog/`、AGENTS.md 第 6 节资产边界

## 约定 5: 项目知识与任务过程分别维护

当前有效的项目知识写入所属项目 `docs/`；任务讨论、方案与验证记录写入主仓库
`openspec/changes/`；当前能力规范保留在 `openspec/specs/`。docs 引用规范，避免复制正文。
AGENTS 只维护入口与读取条件；rules 保留执行约束，解释和详细示例放入 docs。
实施改变已验证的项目事实时，同步相关文档。配置与 scripts 的参数和门槛以实际文件为准。

出处: AGENTS.md 第 6 节；文档导航见 [docs/README.md](../../docs/README.md)。

## 约定 6: AGENTS.md 为执行契约的唯一权威

多平台的执行规则统一在 AGENTS.md 中定义。CLAUDE.md/GEMINI.md 等通过引用指向 AGENTS.md，不独立维护执行逻辑。

出处: AGENTS.md 开头说明 + CLAUDE.md `@AGENTS.md`
