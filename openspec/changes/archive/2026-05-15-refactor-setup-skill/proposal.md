## Why

现有 setup skill 承担了过多职责（安装 claude-code CLI、superpowers 插件、harness-cli 自身），其中大部分对目标用户是冗余的 — 用户到达 setup skill 时必然已有 Agent CLI 和 harness。同时只支持 oh-my-claudecode 而不支持 oh-my-codex，且 omc 的配置步骤不完整（缺少 teams 启用和 setup 命令）。harness 定位为平台无关的知识框架，setup skill 应聚焦于"推荐的 AI 工作流增强工具"的自动配置，并在运行时自动识别当前 Agent 类型。

## What Changes

**工具覆盖范围**
- From: 5 个工具（claude-code、openspec、omc、superpowers、harness-cli）+ 2 个项目依赖（node、pnpm）
- To: 3 个工具（openspec、omc、omx）
- Reason: 去除冗余安装指引，聚焦 harness 推荐的工作流增强工具
- Impact: 非破坏性，减少 skill 内容量约 40%

**OMC 配置完整性**
- From: 仅 npm install + 手动 MCP 注册
- To: npm install → omc setup → teams 环境变量 → 验证 → doctor
- Reason: 官方文档要求完整配置链才能正常使用 teams 等核心功能
- Impact: 非破坏性，增强配置完整性

**新增 OMX 支持**
- 新增 oh-my-codex 的检测、安装、配置和验证流程
- 与 OMC 流程对称，通过 Agent 类型检测自动路由

**新增 Agent 类型检测**
- skill 执行时自动检测当前环境是 Claude Code 还是 Codex CLI
- 根据检测结果决定安装 OMC 或 OMX

**tooling-matrix.md 重写**
- 从 7 个条目精简为 3 个（openspec、omc、omx）

**metadata 更新**
- version bump 1.0.0 → 2.0.0（触发增量更新分发）
- description 更新为聚焦推荐库配置

## Capabilities

### 新增能力

- `agent-detection`: Agent 类型自动检测 — 通过环境变量和命令检查判断当前是 Claude Code 还是 Codex CLI，自动路由到对应工具安装流程
- `omx-setup`: oh-my-codex 安装与配置 — 包含 npm 安装、omx setup、omx doctor 验证和可选的 exec 验证

### 修改能力

- `omc-setup`: oh-my-claudecode 配置扩展 — 从仅安装扩展为完整配置链（npm install → omc setup → teams 环境变量 → 验证 → doctor）
- `openspec-setup`: openspec 安装简化 — 从安装+初始化简化为仅安装（项目初始化由 devkeel init 负责）

## Impact

**受影响文件：**

| 文件 | 变更类型 |
|------|----------|
| `templates/skills/setup/SKILL.md` | 重写 |
| `templates/skills/setup/references/tooling-matrix.md` | 重写 |

**不受影响：**
- `src/lib/templates.ts` — 分发管道不变
- `src/commands/init.ts` — 初始化逻辑不变
- 其他 skill 模板 — 无关联
- 测试 — 现有测试仅验证文件存在性，不检查内容

**依赖：**
- npm packages: `oh-my-claude-sisyphus`、`oh-my-codex`、`@fission-ai/openspec`（均为用户安装，非项目依赖）

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-setup-skill
