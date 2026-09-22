## Why

当前 `web/best-practices.html` 中"实践指南"章节与 harness-cli 本身功能重复，"Worktree + Setup"章节只是占位符。需要精简冗余内容并填充实际有价值的工具推荐。

## What Changes

1. 删除"实践指南"section（4 个 pillar cards）
2. 重写"Worktree + Setup"section 为 Paseo 工具推荐
3. 调整 Hero 描述文案

## Capabilities

### remove-practice-guide

删除实践指南 section（L111-L139），调整 Hero 描述。

### paseo-worktree-section

重写 Worktree + Setup section，包含：
- Paseo 简介与支持的 Agent 列表
- paseo.json 配置示例（worktree + setup）
- 移动端能力介绍
- 外链到 paseo.sh/docs

## Impact

- 用户可见变更：页面内容更新
- 无 API/数据变更
- 无破坏性变更
- 不影响其他页面
