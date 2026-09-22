## Context

`devkeel init` 是 `devkeel` CLI 的核心命令，负责在项目中初始化 `.harness/` 配置目录，并为各 AI 平台（claude-code、copilot、codex、cursor、gemini）创建 symlink。当前实现在首次 init 场景下工作正常，但在以下场景存在问题：

- **re-init**：平台目录已存在时 `symlinkIfMissing` 直接跳过，无法更新旧链接
- **子模块**：只创建最小骨架（.gitkeep + AGENTS.md），不建立平台链接
- **codex 链接不完整**：缺少 agents 目录的 symlink
- **openspec 增量**：已存在时完全跳过，无法补充新版本引入的 schemas

核心文件：
- `src/commands/init.ts`（186 行）— 初始化流程编排
- `src/lib/templates.ts`（153 行）— 模板复制、symlink 创建

## Goals / Non-Goals

**Goals:**

- 修复 codex 平台 agents 链接缺失
- 实现 re-init 的幂等性：备份 → 删除旧目录 → 重建链接
- 子模块执行完整平台链接（复用 `createPlatformLinks`）
- re-init 时清理 `stage-*.md` 废弃文件
- openspec 已存在时增量补充 schemas 和配置
- package.json 的 setup 脚本支持 submodule 初始化

**Non-Goals:**

- 不重构 init 为配置驱动架构（YAGNI）
- 不改变 `.harness/` 的目录结构
- 不为子模块创建独立的 openspec 目录
- 不处理 cursor 平台的 skills/agents 链接（cursor 目前仅约定 rules）

## Decisions

### D1: 平台链接矩阵

完整的平台-目录 symlink 映射：

| 平台 | 目录 | skills | rules | agents | commands |
|------|------|--------|-------|--------|----------|
| claude-code | `.claude/` | ✓ | ✓ | ✓ | ✓（如存在） |
| codex | `.agents/` | ✓ | ✓ | **✓（新增）** | ✓（如存在） |
| cursor | `.cursor/` | ✗ | ✓ | ✗ | ✗ |
| copilot | `.github/` | — | — | — | — |
| gemini | — | — | — | — | — |

cursor 只链接 rules 是因为 Cursor 仅从 `.cursor/rules/` 读取规则文件，不支持 skills/agents 目录。

### D2: re-init 清理流程

```
检测到平台目录已存在？
  ├─ 否 → 正常创建链接
  └─ 是 → 询问用户"是否备份并重建？"
       ├─ 取消 → 跳过链接步骤
       └─ 确认 →
            1. 将 .claude → .claude.bak（如 .bak 已存在则覆盖）
            2. 删除 .claude
            3. 重新执行 createPlatformLinks
```

备份使用 `fs.renameSync`，简单直观。仅备份平台目录（.claude/.agents/.cursor/.github），不备份 .harness/。

### D3: 子模块初始化增强

在子模块初始化阶段，除当前的 `.harness/` 骨架外，追加：

1. 读取主项目的 targets 配置
2. 对子模块路径调用 `createPlatformLinks(subPath, targets)`
3. 子模块的 `.harness/` 目录已在当前流程中创建

### D4: stage-x 清理

在 re-init 的链接重建之前，扫描 `.harness/skills/` 和 `.harness/agents/` 下匹配 `stage-*.md` 模式的文件，直接删除（无需询问，因为这些文件在新模板中已不存在）。

### D5: openspec 增量更新

当 `openspec/` 已存在时：

1. 检查 `openspec/schemas/` 是否存在 → 不存在则从模板复制
2. 检查 `openspec/config.yaml` 是否包含 `schema:` 字段 → 不包含则追加
3. 不覆盖已存在的 config.yaml 内容，只补充缺失项

### D6: package.json setup 脚本

```json
{
  "scripts": {
    "setup": "git submodule update --remote --init && npx devkeel setup"
  }
}
```

将 submodule 初始化放在 harness setup 之前，确保子模块代码已拉取。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| re-init 备份覆盖用户自定义内容 | 询问用户确认；.bak 保留最后一次备份 |
| 子模块的 `.harness/` 目录可能与主项目冲突 | 子模块有独立的 `.harness/` 目录，不共享 |
| stage-x 清理误删用户自建的 stage- 开头文件 | `stage-*.md` 是旧版本特有命名约定，新版不使用此前缀 |
| openspec 增量逻辑与未来版本格式不兼容 | 使用防御性检查（检测字段存在性），不假设固定结构 |
