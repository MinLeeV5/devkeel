# update template version/beta 实现计划

> **给 agentic 执行器：** 按 Section 的 `> mode:` 标注选择执行模式——inline/batch 使用 executing-plans 单 session 执行，isolated 使用 subagent-driven-development 逐任务执行。mode 边界见下方注释。

**目标：** 让 `devkeel update` 支持指定模板版本，并支持 `--beta` 自动选择最新 beta 模板版本。

---

## 覆盖矩阵

| 来源 | 需求点 | 任务 |
|------|--------|------|
| brainstorm In Scope | `devkeel update` 支持 `--template-version <version>` | 1.1, 1.2 |
| brainstorm In Scope | `devkeel update` 兼容可选位置参数 `<template-version>` | 1.2 |
| brainstorm In Scope | `devkeel update --beta` 扫描 npm versions 并选择最新 beta | 1.1, 1.2 |
| brainstorm 风险与约束 | `--beta` 与显式模板版本冲突时阻止执行 | 1.1 |
| brainstorm 风险与约束 | 测试不依赖真实 npm registry | 1.1 |
| design 命令契约 | 默认稳定版 update 行为保持不变 | 1.1, 1.2 |
| design 模块设计 | 参数解析在 `src/index.ts`，npm 输出解析在 `templates-cache` | 1.1, 1.2 |
| design 失败路径 | 非法 semver 在 `npm pack` 前失败 | 1.1 |
| specs/templates-cache | 默认更新 latest stable | 1.1 |
| specs/templates-cache | option 指定模板版本 | 1.1, 1.2 |
| specs/templates-cache | 位置参数指定模板版本 | 1.2 |
| specs/templates-cache | 多 beta 选择最高 semver | 1.1 |
| specs/templates-cache | 无 beta 时输出 `TemplatesFetchError` | 1.1 |
| specs/templates-cache | beta 与显式模板版本同时传入时拒绝执行 | 1.1 |

---

## 1. 模板版本选择与 update 参数接线

> mode: batch

- [x] **1.1 缓存层支持稳定版、显式版本和 beta 版本选择**
  1. 写测试：`tests/templates-cache.test.ts` 增加 `selectLatestBetaVersion`、`resolveTemplatesCacheVersion` 相关用例，覆盖：
     - `['1.2.3-beta.1', '1.2.3-beta.2', '1.2.4-alpha.1']` 选择 `1.2.3-beta.2`
     - `['1.2.9-beta.9', '1.3.0-beta.1']` 选择 `1.3.0-beta.1`
     - 无 beta 返回 `null`
     - `{ version: '1.2.3', beta: true }` 抛出 `TemplatesFetchError`
     - 显式非法版本抛出 `TemplatesFetchError`
  2. 运行 RED：`pnpm vitest run tests/templates-cache.test.ts`
  3. 实现：`src/lib/templates-cache.ts`
     - 新增 `EnsureTemplatesCacheOptions`
     - `ensureTemplatesCache(options?)` 根据 `version`、`beta` 或默认 stable 解析目标版本
     - 新增 npm versions 查询与 semver beta 排序纯函数
     - 缓存命中按目标版本目录判断
  4. 运行 GREEN：`pnpm vitest run tests/templates-cache.test.ts`
  > test: pnpm vitest run tests/templates-cache.test.ts
  > commit: feat(update): 支持模板版本选择

- [x] **1.2 update 命令暴露模板版本参数和 beta 参数**
  1. 写测试：`tests/update.test.ts` 增加纯函数用例，覆盖：
     - option 版本优先于空位置参数
     - 位置参数能解析为 `templateVersion`
     - 位置参数和 option 同值允许
     - 位置参数和 option 不同值报错
  2. 运行 RED：`pnpm vitest run tests/update.test.ts`
  3. 实现：
     - `src/commands/update.ts` 导出并使用 update 参数归一化 helper，`runUpdate` 接收 `templateVersion` 和 `beta`
     - `src/index.ts` 为 `update` 添加 `[template-version]`、`--template-version <version>`、`--beta`
     - spinner 文案包含目标来源：稳定版、指定版本或 beta
  4. 运行 GREEN：`pnpm vitest run tests/update.test.ts tests/templates-cache.test.ts`
  > test: pnpm vitest run tests/update.test.ts tests/templates-cache.test.ts
  > commit: feat(update): 暴露模板版本参数

- [x] **1.3 文档与全量验证**
  1. 更新 `README.md` 的 `devkeel update` 示例，加入：
     - `devkeel update --template-version 1.2.3`
     - `devkeel update 1.2.3-beta.1`
     - `devkeel update --beta`
  2. 执行 `pnpm vitest run tests/templates-cache.test.ts tests/update.test.ts`
  3. 执行 `pnpm lint`
  4. 确认 openspec 状态 apply tasks 全部完成
  > test: pnpm vitest run tests/templates-cache.test.ts tests/update.test.ts && pnpm lint
  > commit: docs(update): 补充模板版本更新用法
