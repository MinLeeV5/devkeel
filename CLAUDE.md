@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

devkeel — 项目知识框架 CLI，为项目建立统一的 AI 协作规范（.harness/ 作为 single source of truth），通过 symlink 分发到 Claude Code / Cursor / Codex / Copilot 等平台目录。

## Commands

```bash
pnpm build          # tsup 构建 ESM → dist/
pnpm dev            # watch 模式开发
pnpm lint           # tsc --noEmit 类型检查
pnpm test           # vitest run
pnpm test:watch     # vitest watch
node bin/devkeel.js # 本地运行 CLI（不需要全局安装）
```

单个测试文件：`pnpm vitest run tests/config.test.ts`

## Architecture

```
src/index.ts          Commander 注册所有子命令（init/doctor/update/submodule/migrate）
src/commands/         每个命令一个文件，交互 UI 用 @clack/prompts
src/lib/              纯逻辑模块（无 I/O 副作用的优先）
  config.ts           .harness/config.yml 读写与校验
  templates.ts        模板复制、symlink 创建、.gitignore 管理
  agents-md.ts        根/子仓库 AGENTS 模板选择与原内容合并
  detect.ts           环境检测（git、package.json、已有资产）
  migrate.ts          旧产物迁移到 openspec/archive/
  gitignore.ts        .gitignore 条目管理
templates/            init 时复制到目标项目的模板资产
  skills/agents/rules/commands/domain/openspec/
  agents-md.md / agents-domain-md.md
bin/devkeel.js        npm bin 入口，直接 import dist/index.js
```

关键设计：
- ESM-only（type: module），构建目标 node20
- 模板引擎是简单的 `{{VAR}}` 替换（renderTemplate）
- 平台链接策略：symlink → junction（Windows）→ copy 降级
- config.yml 版本当前为 `2.0`

## Tech Stack

- TypeScript + ESM, tsup 构建
- Commander (CLI) + @clack/prompts (交互式 UI)
- yaml 包做 YAML 序列化
- vitest 测试
- pnpm 包管理
