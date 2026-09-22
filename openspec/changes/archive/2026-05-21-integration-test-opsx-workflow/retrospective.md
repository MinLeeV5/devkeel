## §0 一句话总结

为 harness 模板产物建立了可手动执行的 shell 集成测试框架，验证 opsx 工作流在 Claude Code 中按设计流程执行。

## §1 交付物

- `tests/integration/` — 完整测试框架（lib/ + scenarios/ + 入口脚本）
- `web/human-review.js` — 附带修复 mermaid 动态渲染问题

## §2 关键决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 测试技术栈 | 纯 shell + jq | 与 superpowers 风格一致，无额外依赖 |
| 多轮方式 | `claude -p --continue` | 保持会话上下文 |
| Fixture | 手动创建而非 `devkeel init` | `@clack/prompts` 在非 TTY 环境崩溃 |
| 断言方式 | Bash 命令 pattern 匹配 | `/opsx:*` 是 command（直接加载）不经过 Skill tool |

## §3 遇到的问题及解法

| 问题 | 原因 | 解法 |
|------|------|------|
| devkeel init TTY 崩溃 | @clack/prompts 需要 TTY | 手动创建 fixture 目录结构 |
| SCRIPT_DIR 被覆盖 | source 时变量污染 | lib 脚本用 `_FIXTURE_LIB_DIR` 避免冲突 |
| macOS 无 timeout | GNU coreutils 工具 | 检测 gtimeout/timeout 可用性，fallback 直接执行 |
| stdin warning 污染 JSON | claude 等 stdin 超时后输出警告 | 添加 `< /dev/null` |
| AskUserQuestion 中断流程 | prompt 描述不充分 | 在 prompt 中附带明确的变更描述 |
| /opsx:new 未识别 | 缺少 .claude/commands symlink | fixture 中添加 commands symlink |

## §4 可改进的点

- 增加 retry 机制应对 LLM 非确定性
- 考虑缓存 fixture（避免每次场景都重建）
- full-cycle 的 apply 阶段可增加 max-turns 以验证执行器触发

## §5 耗时

约 2 小时（含 brainstorm + design + 实现 + 调试 + 验证）
