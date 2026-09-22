## Why

当前 `devkeel init` 对所有仓库执行统一流程，存在三个痛点：(1) CLAUDE.md / AGENTS.md 被无条件覆写，用户精心编写的项目描述丢失；(2) 无主仓库/领域子仓库的概念区分，领域子仓库被塞入不需要的通用模板和 openspec 脚手架；(3) 子模块初始化只创建空存根，领域规范形同虚设。团队在多仓库场景下使用 harness-cli 已成常态，需要 init 命令具备仓库类型感知能力。

## What Changes

**CLAUDE.md / AGENTS.md 写入行为**
- From: `fs.writeFileSync` 无条件覆写，任何已有内容被丢弃
- To: 智能覆写 — 检测是否有非模板内容，有则只确保 `@AGENTS.md` 引用存在，无则覆写为最新模板
- Reason: 保护用户已编写的项目描述和自定义配置
- Impact: 非破坏性，影响所有使用 init 的用户

**仓库类型检测与 config 扩展**
- From: config.yml 只有 `project.types`（frontend/backend/other），无仓库角色概念
- To: 新增 `project.repoType`（main/domain）和 `project.domainType`（领域子仓库专用），基于 `.gitmodules` 自动检测 + 用户确认
- Reason: 驱动后续 init 流程分支
- Impact: 非破坏性，config schema 向后兼容（新字段可选）

**领域子仓库 init 流程**
- From: 子模块 init 只创建 `.gitkeep` 存根 + 空白 AGENTS.md
- To: 完整的领域 init — 复制对应领域模板（skills/rules/agents）到 `.harness/`，写入领域版 AGENTS.md / CLAUDE.md，创建平台 symlink，不落通用模板和 openspec
- Reason: 让领域子仓库拥有与技术栈匹配的 AI 协作规范
- Impact: 非破坏性，仅影响新 init 的子仓库

**子模块批量 init 交互**
- From: 只选择哪些子模块要 init
- To: 选择子模块后，还需为每个子模块选择领域类型（backend/frontend/other）
- Reason: 不同子模块可能属于不同技术领域
- Impact: 非破坏性，增加一步交互

## Capabilities

### 新增能力

- `smart-file-write`: CLAUDE.md / AGENTS.md 智能覆写机制 — 对比模板内容判断是否有用户自定义内容，决定覆写或保留
- `repo-type-detection`: 仓库类型自动检测与交互确认 — 基于 .gitmodules 推断 main/domain，扩展 config schema
- `domain-subrepo-init`: 领域子仓库 init 流程 — 只落领域模板，不含通用模板和 openspec，支持主仓库批量入口和独立 init 入口
- `domain-templates`: 领域子仓库的 AGENTS.md / CLAUDE.md 模板 — 精简版执行契约，适配领域子仓库场景

### 修改能力

（无已有 spec 需要修改）

## Impact

| 影响范围 | 说明 |
|----------|------|
| `src/commands/init.ts` | 主要改动文件 — 流程分支、交互提示、子模块处理重构 |
| `src/lib/templates.ts` | 新增 `hasUserContent()`、`writeSmartFile()`，修改 `createPlatformLinks()` |
| `src/lib/detect.ts` | 新增 `detectRepoType()` |
| `src/lib/config.ts` | `HarnessConfig` 接口扩展 `repoType`、`domainType` 字段 |
| `templates/` | 新增 `agents-md-domain.md`、`claude-md-domain.md` |
| `tests/` | 需要补充仓库类型检测、智能覆写、领域 init 的测试用例 |
| 已有用户 | 向后兼容 — 已有 config.yml 缺少新字段时 init 正常运行 |
