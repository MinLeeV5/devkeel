## Why

当前 opsx 工作流依赖 SuperPowers 插件提供 8 个 skill，用户需额外安装插件且每次会话被强制注入 ~1,350 tokens 的 meta skill。不同平台（Claude Code / Codex / Cursor）需要不同安装方式，增加了使用门槛。将这些 skill 直接嵌入 harness 模板，用户 init 后即可使用完整工作流，零额外依赖、零平台差异。

## What Changes

**Skill 来源**
- From: 依赖 SuperPowers 插件提供 `superpowers:brainstorming` 等 8 个 skill
- To: `templates/skills/` 直接包含这 8 个 skill，`devkeel init/update` 时复制到项目
- Reason: 消除外部插件依赖，降低使用门槛
- Impact: 非破坏性。已安装 SuperPowers 的用户不受影响（并存）

**Skill 引用前缀**
- From: 模板中使用 `superpowers:brainstorming` 等带命名空间的引用
- To: 使用 `brainstorming` 等裸名引用
- Reason: 项目本地 skill 无命名空间前缀
- Impact: 非破坏性。已 init 的项目需 `devkeel update` 刷新 AGENTS.md 和 schema

**废弃资产检测**
- From: `isHarnessGenerated` 只识别 `devkeel` 标记
- To: 同时识别 `author: "superpowers"` 标记
- Reason: 确保将来移除 skill 时能被自动清理
- Impact: 非破坏性

**brainstorming 裁剪**
- From: 包含 visual-companion.md（11.8 KB）和 scripts/ 目录
- To: 移除 visual-companion 相关文件和 SKILL.md 中对应段落
- Reason: visual-companion 依赖插件运行时脚本，无法作为纯文本 skill 工作
- Impact: 非破坏性。visual-companion 是可选功能

## Capabilities

### 新增能力

- `embed-superpowers-skills`: 将 8 个 SuperPowers workflow skill 嵌入 harness 模板，支持 init 后直接使用完整 opsx 工作流

### 修改能力

- （无已有 spec 需求变更）

## Impact

| 影响范围 | 具体内容 |
|----------|----------|
| 模板资产 | +8 个 skill 目录（~83 KB） |
| 模板引用 | agents-md.md, schema.yaml, tasks.md, retrospective.md 中 `superpowers:` 前缀移除 |
| 源码 | `src/lib/templates.ts` 的 `isHarnessGenerated` 增加一个条件 |
| npm 包体积 | +83 KB（文本文件，压缩后约 20 KB） |
| 现有测试 | 无需修改，`copyDirRecursive` 逻辑不变 |
| 已 init 项目 | 需 `devkeel update` 获取新 skill 和更新后的引用 |
