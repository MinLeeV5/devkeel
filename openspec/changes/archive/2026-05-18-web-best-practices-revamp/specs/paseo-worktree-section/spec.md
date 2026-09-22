## Summary

重写 `web/best-practices.html` 的 "Worktree + Setup" section，从占位符变为 Paseo 工具推荐的完整内容。

## Requirements

1. **Paseo 简介** — 一句话说明是什么（coding agent 运行时管理平台）
2. **支持的 Agent 列表** — Claude Code、Codex、OpenCode、pi，使用 badge/tag 形式展示
3. **paseo.json 配置示例** — 展示 worktree + setup 组合用法：
   ```json
   {
     "worktree": {
       "setup": "npm ci\ncp \"$PASEO_SOURCE_CHECKOUT_PATH/.env\" .env",
       "teardown": "rm -rf .cache"
     },
     "scripts": {
       "test": { "command": "npm test" },
       "web": { "command": "npm run dev", "type": "service", "port": 3000 }
     }
   }
   ```
4. **工作流说明** — 创建 worktree → setup 自动执行 → agent 开始工作 → 审查 diff → 合并/归档
5. **移动端能力** — 从任何设备驱动 agent，移动端可看 diff、发起任务
6. **外链** — 链接到 https://paseo.sh/docs 和 https://paseo.sh/docs/worktrees
7. **视觉** — 可引用 paseo.sh 官网图片（logo、OG image），使用图文混排布局

## Acceptance Criteria

- Section 包含完整的 Paseo 介绍内容（非占位符）
- 包含至少一个 paseo.json 代码示例
- 列出 4 个支持的 agent（Claude Code、Codex、OpenCode、pi）
- 包含指向 paseo.sh/docs 的外链
- 复用现有 CSS class，不新增样式
- HTML 结构有效，浏览器无渲染错误
