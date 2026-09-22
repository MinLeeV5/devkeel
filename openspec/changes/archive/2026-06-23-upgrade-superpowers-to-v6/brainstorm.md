## 一句话描述

将 `templates/skills/` 下 9 个 superpowers-authored skill 从 v5.1.x 升级到上游 v6.0.3，新增嵌入 2 个 skill（verification-before-completion、receiving-code-review），并配套修改 superpowers-lite schema 的 apply 阶段以适配 v6 新契约。

## 需求背景

harness V2 把流程编排交给 OpenSpec + SuperPowers + OMC 三者协作，superpowers-lite schema 通过嵌入上游 SuperPowers 的核心 workflow skill 作为方法论执行器。当前嵌入的 9 个 skill 停留在 v5.1.x（2026-05），上游已于 2026-06-16 发布 v6.0.0（大版本，SDD review 流重构、厂商中立化、worktree 路径迁移），并在 6.0.2/6.0.3 修复安装与 SDD scratch 路径问题。

v6.0.0 的 SDD 重构是核心收益：evals 显示在同等质量下速度约 2×、token 消耗约 -50%。继续停在 v5.1.x 意味着 apply 阶段执行器用着过时且更贵的 review 流。同时本地存在一处违反 embed spec 的残留（systematic-debugging 有 2 处 `superpowers:` 前缀），升级时一并清理。

## 项目现状与架构分析

受影响区域集中在模板资产层，不涉及 `src/` 命令层逻辑：

| 模块 | 路径 | 职责 |
|---|---|---|
| 嵌入 skill | `templates/skills/<9 个>/SKILL.md` | superpowers-authored workflow skill，`metadata.author: "superpowers"` |
| schema | `templates/openspec/schemas/superpowers-lite/schema.yaml` | apply 阶段 instruction，调用上述 skill 作为执行器 |
| 版本权威 | `templates/versions-yml.yml` | 所有模板资产版本 single source of truth |
| 版本读取 | `src/lib/config.ts` `readSchemaVersion()` | 从 schema.yaml 读 version 覆盖 versions-yml.yml |

核心调用链（apply 阶段）：schema 步骤 3 调 `subagent-driven-development` 逐 task 执行 → 步骤 4 dispatch `review-orchestrator(deep)` 全量审查 → 步骤 5 verify/archive。

当前 9 个 skill 版本：brainstorming=5.1.1，其余 8 个=5.1.0。schema version=7。本地 `.harness/` 副本滞后（schema=6、brainstorming=5.1.0），属 update 未同步，不在本次范围。

## 风险与约束

| 风险 | 约束/缓解 |
|---|---|
| SDD v6 review 流与 schema 步骤 4 review-orchestrator 职责重叠 | 采用分层互补：SDD whole-branch review=代码质量层，review-orchestrator(deep)=架构/规范层，明文写入 schema 消歧 |
| v6 SDD 新增附属文件（task-reviewer-prompt.md、scripts/）需一并带入 | 升级时整体替换 skill 目录，不只替换 SKILL.md |
| `.superpowers/sdd/` scratch 目录需 gitignore | 随 skill 带入的 self-ignoring 机制 + 确认 .gitignore 覆盖 |
| 外部 skill 版本格式保留上游风格 | verification-before-completion / receiving-code-review 按 v6 实际 metadata 注册，不强制三段式 |
| `superpowers:` 前缀清理可能漏网 | 升级后 grep 校验清零 |
| 现有测试可能 hardcode 旧版本号 | 升级后跑 `pnpm test`，按失败项修测试断言 |
| `using-superpowers` 与 harness AGENTS.md 路由冲突 | 明确排除，不嵌入 |

向后兼容性：skill 升级对 `devkeel init`/`devkeel update` 用户是透明的资产更新，无 CLI 接口变更。schema version 7→8 是内容变更，触发 update 检测。

## 目标用户与角色

| 角色 | 关注点 |
|---|---|
| harness 维护者 | skill 与上游同步、schema instruction 自洽、版本号一致 |
| harness 使用者（项目接入方） | apply 阶段执行更快更省 token、review 闭环更严格 |
| AI 执行器（apply 时的 agent） | instruction 无歧义、model 声明明确、断点续跑可用 |

## 核心功能用例

**UC1 — skill 全量升级**：维护者执行升级后，9 个 skill 的 SKILL.md + 附属文件与上游 v6.0.3 一致，metadata.version 反映 v6 实际版本，`superpowers:` 前缀残留清零。

**UC2 — 新 skill 嵌入**：verification-before-completion、receiving-code-review 进入 `templates/skills/`，在 versions-yml.yml 注册，被 schema 的 verify/archive 与 fixer 环节引用。

**UC3 — schema apply 步骤 3 适配 v6**：instruction 明确要求每次 dispatch 声明 model、reviewer 只读、禁止压制 severity、scratch 走 `.superpowers/sdd/`、progress ledger 支持断点续跑。

**UC4 — schema apply 步骤 4 分层互补**：instruction 明文区分 SDD whole-branch review（代码质量层）与 review-orchestrator(deep)（架构/规范层），消除双重全量审查的歧义。

**UC5 — 版本同步与验证**：schema.yaml version=8、versions-yml.yml `schemas.superpowers-lite="8"`、11 个 skill 版本两处一致；`pnpm lint` + `pnpm test` 通过。

## 需求边界

**In Scope:**
- `templates/skills/` 下 9 个 superpowers skill 升级到 v6.0.3（含附属文件）
- 新增 `templates/skills/verification-before-completion/`、`templates/skills/receiving-code-review/`
- `templates/openspec/schemas/superpowers-lite/schema.yaml` apply 步骤 3/4 instruction 修改 + version 7→8
- `templates/versions-yml.yml` 版本同步（9 升级 + 2 新增 + schema 7→8）
- 清理 `superpowers:` 前缀残留
- 修复因版本号变更失败的测试断言

**Out of Scope:**
- `src/` 命令层逻辑改动（无 CLI 接口变更）
- `web/` 文档与 changelog（按发布流程另行处理）
- 非 superpowers skill（domain-init、changelog、commit 等自有 skill）
- `using-superpowers` / `dispatching-parallel-agents` / `writing-skills` 三个未嵌入 skill
- `.harness/` 本地副本同步（由用户后续 `devkeel update` 触发）
- 上游 v6 的 brainstorming visual companion（web server，与 harness 无关）

## 探索过的替代方向

| 方向 | 取舍 |
|---|---|
| SDD 不升级 reviewer，只采 v6 非审查改动 | 放弃 v6 最大收益（token -50%、速度 2×），否决 |
| SDD 接管全部审查，移除步骤 4 review-orchestrator | 失去项目自有 review-orchestrator 的多维深度审查 + harness 工具链集成，否决 |
| 步骤 4 双重审查全开 | token 成本最高，且职责重叠产生歧义，否决 |
| 纳入 dispatching-parallel-agents 用于步骤 4 fixer 并行 | 面窄但为可选项浪费 token，用户决定不纳入 |
| 纳入 using-superpowers | 与 harness AGENTS.md L0/L1 路由 + .harness/ single source of truth 架构冲突，明确排除 |

## 待确认项

无。范围、步骤 4 分层互补方案、纳入 skill 清单、验收标准均已在前置对话确认。
