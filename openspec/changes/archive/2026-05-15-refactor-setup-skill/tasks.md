# Setup Skill 重构实现计划

> **给 agentic 执行器：** 使用 superpowers:subagent-driven-development
> 按任务逐个实现本计划。

**目标：** 将 setup skill 从全工具链安装器重构为 openspec/OMC/OMX 推荐库自动配置器

**架构：** 纯模板内容变更。重写 `templates/skills/setup/SKILL.md` 和 `references/tooling-matrix.md`，不涉及 TypeScript 代码修改。模板分发管道（copyDirRecursive）保持不变。

**技术栈：** Markdown（SKILL.md 模板格式）

---

## 1. tooling-matrix.md 重写

- [x] **1.1 重写 tooling-matrix.md，精简为 3 个工具**
  1. 读取当前文件：`templates/skills/setup/references/tooling-matrix.md`
  2. 删除全部现有条目（claude、openspec、omc、superpowers、harness-cli、node、pnpm）
  3. 写入新的 AI 工具链表格，仅含 3 行：
     - `openspec` | 知识产出 CLI | `openspec --version` | `npm install -g @fission-ai/openspec@latest`
     - `oh-my-claudecode` | Claude Code 多 agent 编排 | `omc --version` | `npm install -g oh-my-claude-sisyphus@latest`
     - `oh-my-codex` | Codex CLI 工作流增强 | `omx --version 2>/dev/null` | `npm install -g oh-my-codex`
  4. 删除"项目依赖"表格段落
  5. 验证：`cat templates/skills/setup/references/tooling-matrix.md` 确认格式正确
  > commit: refactor(setup-skill): rewrite tooling-matrix to 3 recommended tools

## 2. SKILL.md metadata 与框架段落

- [x] **2.1 更新 SKILL.md metadata 段落**
  1. 读取当前文件：`templates/skills/setup/SKILL.md`
  2. 修改 metadata：
     - `description`: "推荐库自动配置 — 检测 Agent 类型，安装并配置 openspec、oh-my-claudecode / oh-my-codex。"
     - `version`: "2.0.0"
     - `triggers`: 保持 `["setup", "环境搭建", "onboarding", "安装工具"]`
  3. 保留 Overview、Hard Rules、Read First、Route 段落不变
  4. 验证：确认 metadata YAML 格式正确
  > commit: refactor(setup-skill): update metadata and bump version to 2.0.0

## 3. Agent 检测与 Baseline 段落

- [x] **3.1 重写 Collect Baseline Facts 段落**
  1. 定位 SKILL.md 中 `### 1. Collect Baseline Facts` 段落
  2. 替换检测命令为：
     ```bash
     openspec --version 2>/dev/null || echo "openspec: not found"
     claude --version 2>/dev/null && echo "agent: claude-code" || true
     codex --version 2>/dev/null && echo "agent: codex" || true
     omc --version 2>/dev/null || echo "omc: not found"
     omx --version 2>/dev/null || echo "omx: not found"
     ```
  3. 在检测命令后新增 Agent 类型判断指引段落：
     - claude 存在 → Agent = Claude Code → 走 OMC 流程
     - codex 存在 → Agent = Codex CLI → 走 OMX 流程
     - 两者都有 → 询问用户或全部安装
     - 都没有 → 报告无支持 Agent，列出选项
  4. 验证：检查 Markdown 语法和缩进
  > commit: feat(setup-skill): add agent type detection logic

## 4. openspec 安装段落

- [x] **4.1 简化 openspec 安装段落**
  1. 定位 SKILL.md 中 openspec 安装段落
  2. 重写为仅含安装和验证：
     - 安装：`npm install -g @fission-ai/openspec@latest`
     - 验证：`openspec --version`
  3. 删除项目初始化步骤（不再执行 `openspec init`）
  4. 验证：确认段落简洁
  > commit: refactor(setup-skill): simplify openspec to install-only

## 5. OMC 完整配置段落

- [x] **5.1 重写 oh-my-claudecode 安装与配置段落**
  1. 定位 SKILL.md 中 OMC 段落
  2. 添加前置条件说明：仅在 Agent 类型为 Claude Code 时执行
  3. 重写为完整配置流程：
     - 安装：`npm install -g oh-my-claude-sisyphus@latest`
     - 配置（终端）：`omc setup`
     - 配置（会话内）：`/omc-setup` 或 `/setup`
     - teams 启用：检查并写入 `~/.claude/settings.json` 的 `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"`
     - 验证：`omc --version`
     - 健康检查：建议运行 `/omc-doctor`
  4. 删除旧的"手动 MCP 注册"方式
  5. 验证：对照 specs/omc-setup/spec.md 确认所有 requirement 已覆盖
  > commit: feat(setup-skill): complete OMC configuration with teams and setup

## 6. OMX 安装与配置段落

- [x] **6.1 新增 oh-my-codex 安装与配置段落**
  1. 在 OMC 段落之后新增 OMX 段落
  2. 添加前置条件说明：仅在 Agent 类型为 Codex CLI 时执行
  3. 编写完整配置流程：
     - 安装：`npm install -g oh-my-codex`
     - 配置：`omx setup`
     - 健康检查：`omx doctor`
     - 可选执行验证：`omx exec --skip-git-repo-check -C . "Reply with exactly OMX-EXEC-OK"`
     - 说明 exec 验证为非阻塞，失败时建议检查 `codex login status`
  4. 验证：对照 specs/omx-setup/spec.md 确认所有 requirement 已覆盖
  > commit: feat(setup-skill): add OMX installation and configuration

## 7. 清理废弃段落

- [x] **7.1 删除不再需要的段落**
  1. 删除 "Claude Code CLI" 安装段落（`npm install -g @anthropic-ai/claude-code`）
  2. 删除 "superpowers (Claude Code 插件)" 段落
  3. 删除 "superpowers (Codex CLI)" 段落
  4. 删除 "Verify Project-Level Setup" 段落（harness 初始化检测）
  5. 删除 "Platform-Specific Linking" 段落（由 devkeel init 负责）
  6. 验证：确认无残留引用，段落编号连贯
  > commit: refactor(setup-skill): remove deprecated tool sections

## 8. 最终验证

- [x] **8.1 运行测试确认模板分发不受影响**
  1. 执行：`pnpm test`
  2. 确认 `templates.test.ts` 通过（copyTemplateSkills 正常工作）
  3. 确认 `update.test.ts` 通过（增量更新逻辑正常）
  4. 手动检查 SKILL.md 整体结构完整、段落编号连贯、Markdown 语法正确
  > commit: N/A（验证步骤，无代码变更）

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
