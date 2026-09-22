## TL;DR

将 SuperPowers v5.1.0 中 opsx 流程依赖的 8 个 skill 嵌入 harness 模板，使项目 init 后即可直接使用完整工作流，无需额外安装 SuperPowers 插件。

## 需求背景

当前 harness 的 opsx 工作流（superpowers-bridge schema）依赖 SuperPowers 插件提供的 8 个 skill。用户必须：
1. 安装 SuperPowers Claude Code 插件（且不同平台需要不同的安装方式）
2. 插件会强制注入 hook 和 `using-superpowers` meta skill，每次会话消耗 ~1,350 tokens
3. 插件加载全部 14 个 skill 的元数据到 available skills 列表，但实际只用到 8 个

痛点：
- 安装门槛高，多平台适配复杂
- 强制注入带来不必要的 context 开销
- 无法精确控制加载哪些 skill

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 项目开发者 | init 后直接可用，不需要额外安装步骤 |
| 多平台用户（Claude Code / Codex / Cursor / Gemini CLI） | 统一体验，不用按平台装不同插件 |
| 已装 SuperPowers 的用户 | 不会冲突，项目本地 skill 优先 |

## 核心功能用例

### UC1: 项目初始化后 skill 直接可用
- 触发：`devkeel init` 或 `devkeel update`
- 行为：8 个 skill 被复制到 `.harness/skills/`，通过现有 symlink 机制分发到各平台目录
- 预期：在任意支持的平台上，skill 立即可通过 Skill 工具调用

### UC2: 工作流引用无需命名空间前缀
- 触发：AGENTS.md 中引用 skill
- 行为：引用从 `superpowers:brainstorming` 变为 `brainstorming`（裸名）
- 预期：agent 直接找到项目本地 skill，无歧义

### UC3: 与已安装的 SuperPowers 插件共存
- 触发：用户同时装了 SuperPowers 插件
- 行为：available skills 列表中并存 `brainstorming`（本地）和 `superpowers:brainstorming`（插件）
- 预期：agent 按 "项目本地优先" 规则调用本地版本，无冲突

## 需求边界

**In Scope:**
- 嵌入 8 个 skill：brainstorming、writing-plans、subagent-driven-development、executing-plans、using-git-worktrees、test-driven-development、requesting-code-review、finishing-a-development-branch
- 从 brainstorming 中移除 visual-companion.md（及 SKILL.md 中相关段落）
- 所有模板文件中 `superpowers:` 前缀引用改为裸名
- 每个 skill metadata 标注 `author: "superpowers"`, `version: "5.1.0"`

**Out of Scope:**
- 不嵌入 `using-superpowers` meta skill（这是插件级 bootstrap，不属于工作流）
- 不嵌入其他 6 个未使用的 skill（dispatching-parallel-agents、receiving-code-review、verification-before-completion、systematic-debugging、writing-skills、finishing-a-development-branch 之外的）
- 不修改 `src/lib/templates.ts` 分发逻辑（现有机制已覆盖）
- 不处理 SuperPowers 插件卸载引导（留给用户自行决定）
- 不实现自动化上游同步（手动 cherry-pick）

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 作为 peerDependency 声明 SuperPowers | 仍需安装插件，不解决 context 开销问题 |
| 只嵌入核心 2 个（brainstorming + writing-plans） | 执行阶段链断裂，subagent-driven-development 等找不到 |
| 加 `harness:` 前缀避免冲突 | 增加引用长度，且项目本地本身已有优先级机制 |
| 自动化 diff 上游 | 过度工程，更新频率低，手动同步更实际 |

## 待确认项

无 — 所有设计决策已在 brainstorming 对话中确认。
