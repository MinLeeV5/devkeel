---
name: doc-maintenance
description: CLI 文档维护与一致性检查流程
metadata:
  version: "1.2.0"
  author: "devkeel"
  domain: cli-node
triggers:
  - 文档维护
  - doc maintenance
  - help 文本
  - 更新文档
---

# 文档维护

## 何时使用

- 新增/修改子命令后，同步 help 文本和 docs 项目说明
- 发版时更新 changelog
- 检查文档与代码实现的一致性

## 流程

### 1. Help 文本一致性检查

运行所有命令的 --help，对比 README 命令说明与 docs/development.md：

```bash
node bin/devkeel.js --help
node bin/devkeel.js init --help
node bin/devkeel.js doctor --help
node bin/devkeel.js update --help
node bin/devkeel.js sync --help
node bin/devkeel.js inject-review --help
node bin/devkeel.js open-review --help
node bin/devkeel.js evidence --help
```

检查点：
- README 与 docs 中列出的命令是否与实际一致
- 选项（--fix, --force, --dry-run）是否都有记录
- 不得只用退出码判断命令存在；未知命令可能退回 root help，必须确认输出的 Usage/Options 属于目标子命令

### 2. 项目知识同步

对比 `src/` 实际目录结构与 `docs/architecture.md`，确认：
- 新增的 commands/lib 文件已记录
- 文件职责描述准确
- 测试入口与环境变化同步 `docs/testing.md`，规则复用已有测试策略
- AGENTS/CLAUDE 只维护文档入口与读取条件，不复制正文
- 当前规范保留在 `openspec/specs/`，任务过程保留在 `openspec/changes/`

### 3. Changelog 维护

按 `.harness/skills/changelog/` 规范，先确认 CLI 或 Templates 独立版本流，再只创建对应文件：

- `web/public/versions/cli/X.Y.Z.json`
- `web/public/versions/templates/X.Y.Z.json`

文件名必须匹配 `versions` 最后一项，group type、label、item 顺序和受限 Markdown 均须通过目录校验。不得编辑旧静态 Changelog HTML、手工 latest/Update Tip 或 `web/dist/`。

创建后执行：

```bash
pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/changelog-data.test.ts
pnpm --dir web build

# 将 STREAM 设为 cli 或 templates，并使用实际版本号
STREAM=cli
VERSION=X.Y.Z
CHANGELOG_JSON="web/public/versions/${STREAM}/${VERSION}.json"
test -f "$CHANGELOG_JSON"
git add "$CHANGELOG_JSON"
git diff --cached --name-only
```

`web build` 内置 public→dist 文件集合与内容校验；只暂存源码 JSON，不暂存 `web/dist/`。

### 4. AGENTS.md 更新

若流程变更影响执行契约（新命令、新 skill、资产路径变化），同步更新 AGENTS.md。

## 检查清单

- [ ] --help 输出与 README、docs 中的说明一致
- [ ] 相关模块职责已在 docs/architecture.md 更新
- [ ] changelog 已更新（如有版本发布）
- [ ] 新版本 JSON 已通过 catalog/data 测试和 web build 一致性校验
- [ ] 暂存区仅包含实际版本流的 `web/public/versions/{cli,templates}/*.json`，不含旧静态 Changelog HTML 或 `web/dist/`
- [ ] AGENTS.md 文档入口有效，docs 与 rules 按职责分离
