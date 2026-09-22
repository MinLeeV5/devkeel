## TL;DR

将 setup skill 从"全工具链安装器"重构为"推荐库自动配置器"，聚焦 openspec、oh-my-claudecode (OMC)、oh-my-codex (OMX) 三个工具的检测、安装与完整配置，运行时自动识别当前 Agent 类型（Claude Code / Codex CLI）以选择对应的 oh-my 系列工具。

## 需求背景

**当前痛点：**

1. 现有 setup skill 承担了过多职责 — 从 claude-code CLI 安装到 superpowers 插件再到 harness-cli 自身，大部分对目标用户是冗余的
2. SuperPowers 已内置到 harness 模板中，不需要额外安装步骤
3. 只支持 oh-my-claudecode，不支持 oh-my-codex — 使用 Codex CLI 的用户无法获得对应的编排层
4. omc 的安装说明不完整 — 缺少 `omc setup` 后续配置和 teams 环境变量等关键步骤
5. skill 没有运行时检测能力 — 无法判断当前在 Claude Code 还是 Codex CLI 中执行

**触发原因：**

harness 定位为平台无关的知识框架，setup skill 应该只负责配置"harness 推荐的 AI 工作流增强工具"，而不是安装基础 Agent CLI。

## 目标用户与角色

| 角色 | 描述 | 关注点 |
|------|------|--------|
| Claude Code 用户 | 已安装 claude-code CLI，使用 harness 管理项目知识 | omc 安装 + 完整配置（含 teams 启用） |
| Codex CLI 用户 | 已安装 codex CLI，使用 harness 管理项目知识 | omx 安装 + 完整配置（含 doctor 验证） |
| 双平台用户 | 同时使用 Claude Code 和 Codex CLI | 两者都安装并配置 |

**共同前提**：所有用户已经安装了某个 Agent CLI（claude 或 codex），并且已经运行过 `devkeel init`（因为 skill 随 harness 模板分发）。

## 核心功能用例

### UC-1: Agent 类型自动检测

**触发条件**：setup skill 被调用时
**预期行为**：
- 检测当前运行环境变量和可用命令，判断是 Claude Code 还是 Codex CLI
- 若为 Claude Code → 推荐安装 oh-my-claudecode
- 若为 Codex CLI → 推荐安装 oh-my-codex
- 若无法确定或两者都有 → 询问用户选择，或全部安装

**检测策略**：
- Claude Code 环境：存在 `CLAUDE_CODE_*` 环境变量，或 `claude --version` 可用
- Codex CLI 环境：存在 `CODEX_*` 环境变量，或 `codex --version` 可用

### UC-2: openspec 安装与配置

**触发条件**：`openspec --version` 检测失败
**预期行为**：
1. `npm install -g @fission-ai/openspec@latest`
2. 验证：`openspec --version`，不需要做初始化

### UC-3: oh-my-claudecode (OMC) 安装与完整配置

**触发条件**：Agent 类型为 Claude Code 且 `omc --version` 检测失败
**预期行为**：
1. 安装：`npm install -g oh-my-claude-sisyphus@latest`
2. 配置：在 Claude Code 会话内运行 `/omc-setup` 或从终端运行 `omc setup`
3. 启用 teams：确保 `~/.claude/settings.json` 中有 `"env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }`
4. 验证：`omc --version`
5. 健康检查：建议用户运行 `/omc-doctor`

### UC-4: oh-my-codex (OMX) 安装与完整配置

**触发条件**：Agent 类型为 Codex CLI 且 `omx` 不可用
**预期行为**：
1. 安装：`npm install -g oh-my-codex`
2. 配置：运行 `omx setup`
3. 健康检查：运行 `omx doctor`
4. 验证执行能力：`omx exec --skip-git-repo-check -C . "Reply with exactly OMX-EXEC-OK"`

### UC-5: 路由保留（Full / Partial / Troubleshoot）

**触发条件**：用户调用 setup 时的意图不同
**预期行为**：
- **Full Setup**：按 tooling-matrix 逐项检测 → 补齐
- **Partial Install**：用户指定只装某个工具 → 只执行该工具的流程
- **Troubleshoot**：诊断特定工具问题 → 修复 → 验证

## 需求边界

**In Scope:**

- openspec CLI 的安装和项目级初始化/更新
- oh-my-claudecode (OMC) 的安装、setup 配置、teams 启用
- oh-my-codex (OMX) 的安装、setup 配置、doctor 验证
- Agent 类型运行时检测逻辑
- tooling-matrix.md 同步更新（反映新的工具列表）
- SKILL.md 的 metadata（description、triggers）更新

**Out of Scope:**

- Claude Code CLI 安装 — 用户自行负责基础 Agent 的安装
- Codex CLI 安装 — 同上
- harness-cli 安装 — 使用 setup skill 的用户必然已有 harness
- SuperPowers 安装 — 已内置到 harness 模板
- 项目依赖（node/pnpm）安装 — 由项目自身管理
- Platform-Specific Linking（.claude/skills 等 symlink）— 由 `devkeel init` 负责

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 保留 claude-code/codex CLI 安装指引 | 放弃 — 用户到达 setup skill 时必然已有 Agent CLI，多余的说明只增加噪声 |
| 将 omc 和 omx 合并到一套安装流程 | 放弃 — 两者的包名、配置命令、验证方式完全不同，合并只会增加条件分支复杂度 |
| 用统一的安装脚本替代 skill 指令 | 放弃 — skill 的价值在于可交互路由和智能诊断，脚本做不到 |
| 让 skill 自行修改 settings.json 启用 teams | 采纳 — teams 是 omc 的核心功能，自动化配置体验更好 |
| 在 skill 里集成 openspec init | 采纳 — 虽然 devkeel init 也会触发，但单独运行 setup 时应能完成完整配置 |

## 待确认项

1. **OMC 插件安装 vs npm 安装**：OMC 支持两种安装路径（marketplace plugin 和 npm global）。skill 应该推荐哪种？建议：npm 路径更通用，plugin 路径可作为备选
—— 按你的建议来执行
2. **OMX 的 `--madmax --high` 启动参数**：是否需要在 skill 中推荐默认启动方式？建议：不涉及，setup 只管安装配置，启动方式由用户自行选择
—— 按你的建议来执行
3. **OMC/OMX 版本固定**：是否需要固定到特定版本号？建议：不固定，使用 `@latest`
—— 按你的建议来执行

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
