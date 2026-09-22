## Design Summary

`devkeel init` 命令存在 6 个问题，涵盖功能缺失和缺陷修复：

1. **package.json 模板精简 + setup 脚本**：生成的 package.json 不应包含 main/author/license 字段（当前实现已不含，但已有 package.json 可能需要清理）；scripts 中需增加 setup 脚本，执行 `git submodule update --remote --init ${submoduleName}`
2. **子模块完整初始化**：子模块项目当前只创建 `.harness/skills/.gitkeep` + `.harness/rules/.gitkeep` + `AGENTS.md`，应该执行完整的平台链接（link 到 .claude/.cursor/.agents 等目录）
3. **重新 init 的幂等性**：重新执行 init 时，应先备份并删除已有的 .agents/.claude/.cursor/.github 目录，然后重新 link，避免旧链接残留
4. **codex 平台缺失 agents 链接**：`.agents/` 目录没有 link `.harness/agents`，而 `.claude/` 有。cursor 也可能缺少链接
5. **清理废弃 stage-x skill 文件**：旧版本项目的 `.harness/skills/` 中残留 `stage-*.md` 文件，init/re-init 时应清理
6. **openspec 增量更新**：当 openspec/ 已存在时，应按需增加内容（如 schemas 配置），而非整体跳过

## Alternatives Considered

### 方案 A：最小修复 — 只修 bug，不改流程

- **做法**：仅修复 #4（codex agents 链接缺失）和 #5（stage-x 清理），其余作为后续 change
- **优点**：改动小，风险低，快速交付
- **缺点**：re-init 的幂等性和子模块初始化等核心体验问题未解决，用户需手动处理
- **为何未采用**：这些问题彼此关联（re-init 逻辑涉及链接重建、清理、子模块），拆开反而增加测试复杂度

### 方案 B：全量重写 init — 引入配置驱动的链接矩阵

- **做法**：将平台-目录映射抽取为声明式配置（JSON/YAML），init 根据配置自动生成所有链接，支持插件式扩展
- **优点**：高度可扩展，新增平台无需改代码
- **缺点**：过度抽象，当前只有 5 个平台，配置驱动引入不必要的复杂性
- **为何未采用**：YAGNI — 当前平台数量有限，硬编码 + 清晰的 switch-case 已足够

### 方案 C：渐进增强 — 修复所有 6 个问题，保持现有架构

- **做法**：在现有代码结构上逐项修复，新增 re-init 逻辑（备份 → 删除 → 重建链接），补全缺失链接，增加 stage-x 清理和 openspec 增量更新
- **优点**：解决所有已知问题，改动可控，保持代码结构一致性
- **缺点**：init.ts 会变长，需要更多测试用例
- **为何未采用**：这就是采用的方案

## Agreed Approach

采用**方案 C（渐进增强）**。在现有 `init.ts` + `templates.ts` 架构上逐项修复所有 6 个问题：

1. 修改 `createPlatformLinks`：补全 codex 的 agents 链接，审查所有平台链接完整性
2. 新增 `cleanPlatformDirs` 函数：re-init 时备份 → 删除 → 重建平台目录
3. 新增 `cleanLegacyFiles` 函数：扫描并删除 `stage-*.md` 文件
4. 增强子模块初始化：为选中的子模块也执行平台链接
5. 改进 openspec 逻辑：已存在时增量添加 schemas 和更新 config.yaml
6. 优化 package.json 模板：确保不含多余字段，setup 脚本支持 submodule 初始化

## Key Decisions

| 决策 | 结论 | 理由 |
|------|------|------|
| re-init 时是否自动删除 | 检测到已有内容时询问用户 | 避免误删用户自定义内容 |
| 备份策略 | 重命名为 `.claude.bak`/`.agents.bak` 等 | 简单直观，用户可手动恢复 |
| 子模块链接范围 | 使用与主项目相同的 targets 配置 | 保持一致性 |
| stage-x 清理时机 | init 的链接重建阶段自动执行 | 与 re-init 的"清理旧 → 建新"流程自然融合 |
| openspec 增量更新 | 只补充缺失的 schemas 和配置项 | 不覆盖用户已修改的 config.yaml 内容 |

## Open Questions

- cursor 平台是否需要链接 skills 和 agents（当前只链接 rules）？需确认 Cursor 的目录约定
- 子模块是否需要独立的 openspec 目录？当前设计为共享主项目 openspec
