---
description: "Git 工作流 — commit 消息格式、分支策略和收尾流程"
globs:
  - "**/*"
---

# Git 工作流

## Commit 消息格式

遵循 Conventional Commits：`type(scope): 描述`

| 约定 | 依据 |
|------|------|
| type 小写英文（feat/fix/chore/docs/refactor/test/perf/style） | git log 全量一致 |
| scope 为模块名或子系统名，英文小写 | harness, skills, versions, templates, agents, update, web, schema |
| 描述使用中文，一句话概括变更目的 | 全部历史 commit 均为中文描述 |

```
✅ feat(skills): 新增 domain-init 领域能力生成器
✅ chore(harness): 同步 template skills 到 .harness
✅ docs(rules): 新增 skill 版本管理规范
❌ fix: fix bug
❌ update something
```

## 分支策略

| 约定 | 依据 |
|------|------|
| 默认分支为 `master` | git branch 输出 |
| 功能分支命名 `<context>/<description>` | 现有分支 `codex/tooling-selection-refresh` |
| 小变更（docs、chore）可直接在 master 提交 | git log 中 docs/chore 类型出现在 master |

## 收尾流程

每次工作会话结束时：

1. 执行与改动最接近的质量检查（`pnpm lint`、`pnpm test` 等）
2. 汇报验证结果、未提交状态和可选下一步
3. 只有用户明确选择后才分别执行 commit、push、MR/PR 或清理；默认停止

具体授权边界遵循 `commit` skill：创建 MR/PR 包含必要的提交和推送，合并须明确授权；
单独 commit 不包含 push。收尾或归档本身不触发交付动作。

## .gitignore 管理

| 约定 | 依据 |
|------|------|
| 运行时产物通过 `# harness runtime` 分节管理 | .gitignore + src/lib/gitignore.ts |
| 程序化添加条目使用 `ensureGitignoreEntry()` | src/lib/gitignore.ts |
| 禁止提交 node_modules/、dist/、.env*、.omc/、coverage/ | .gitignore |
