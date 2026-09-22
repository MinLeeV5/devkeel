## Why

`devkeel init` 存在多个功能缺陷和体验问题：codex 平台缺失 agents 目录链接、重新 init 时旧平台目录残留导致链接失效、子模块只创建最小骨架而未建立平台链接、openspec 已存在时完全跳过而非增量更新。这些问题导致用户在实际使用中需要手动修复链接和目录结构，违背了 harness 作为"一键初始化"工具的设计初衷。

## What Changes

**平台链接完整性**
- From: codex 平台只链接 skills/rules/commands，缺少 agents
- To: codex 平台增加 agents 链接，与 claude-code 保持一致
- Reason: agents 目录包含代码审查等关键 agent 定义，codex 需要访问
- Impact: non-breaking，新 init 自动生效

**Re-init 幂等性**
- From: `symlinkIfMissing` 检测到已存在则跳过，旧链接可能指向错误目标
- To: 检测到已有平台目录时，询问用户是否备份并重建；确认后备份为 `.xxx.bak`，删除原目录，重新创建链接
- Reason: 项目升级或切换平台时，旧链接需要更新
- Impact: non-breaking，需用户确认

**子模块平台链接**
- From: 子模块初始化只创建 `.harness/skills/.gitkeep`、`.harness/rules/.gitkeep`、`AGENTS.md`
- To: 子模块也执行 `createPlatformLinks`，建立与主项目相同的平台目录链接
- Reason: 子模块项目同样需要 AI 工具访问 skills/rules/agents
- Impact: non-breaking，增强功能

**废弃文件清理**
- From: init 不清理旧版本残留的 `stage-*.md` 文件
- To: re-init 时扫描并删除 `.harness/skills/` 和 `.harness/agents/` 下的 `stage-*.md` 文件
- Reason: 旧文件可能被 AI 工具误加载，造成混淆
- Impact: non-breaking，仅删除已废弃文件

**openspec 增量更新**
- From: openspec/ 已存在时整体跳过
- To: 检查并补充缺失内容（schemas 目录、config.yaml 中的 schema 配置）
- Reason: 用户可能从旧版本升级，需要新增的 schemas 配置
- Impact: non-breaking，只添加不覆盖

**package.json 模板优化**
- From: 生成的 package.json 包含 setup 脚本 `npx devkeel setup`
- To: setup 脚本改为 `git submodule update --remote --init && npx devkeel setup`；确认不含 main/author/license 字段
- Reason: setup 应先拉取子模块代码，再执行 harness 初始化
- Impact: non-breaking，仅影响新项目

## Capabilities

### New Capabilities

- `init-reinit-cleanup`: 重新初始化时的平台目录备份、删除、重建机制
- `init-submodule-linking`: 子模块项目的完整平台链接创建
- `init-openspec-incremental`: openspec 目录已存在时的增量内容补充

### Modified Capabilities

_(无现有 spec 的需求变更)_

## Impact

- 受影响代码：`src/commands/init.ts`、`src/lib/templates.ts`
- 新增函数：`cleanPlatformDirs`、`cleanLegacyFiles`、`updateOpenspecIncremental`
- 测试：需新增 re-init、子模块链接、openspec 增量更新的测试用例
- 无外部依赖变更
