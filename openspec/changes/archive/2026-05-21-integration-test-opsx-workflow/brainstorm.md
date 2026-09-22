## TL;DR

为 harness 模板产物（skills/rules/agents）建立集成测试，验证 opsx 工作流在 Claude Code 中按设计流程正确执行。

## 需求背景

devkeel init 部署到项目的 openspec skills（opsx:new、opsx:propose、opsx:continue、opsx:apply 等）是核心交付物。当前缺乏自动化手段验证这些 skill 被触发后是否按 schema 定义的流程推进（调用正确的 openspec CLI 命令、按依赖顺序生成 artifact、apply 时调用 omc ralph 等）。

参考 [superpowers/tests/skill-triggering](https://github.com/obra/superpowers) 的黑盒测试方案，用 `claude -p` 执行 prompt 并解析 `stream-json` 输出做事件序列断言。

## 目标用户与角色

- **harness 维护者**：变更 skill/rule 后手动跑测试，确认不回归
- **贡献者**：理解 opsx 工作流预期行为

## 核心功能用例

### 场景 1: opsx:new

触发：用户发送 `/opsx:new "add-feature-x"`

期望事件序列：
1. Skill tool 调用 `opsx:new`
2. Bash 调用 `openspec new change "add-feature-x"`
3. Bash 调用 `openspec status --change "add-feature-x"`
4. Bash 调用 `openspec instructions brainstorm --change "add-feature-x"`
5. 无 Write/Edit tool（不应自动填写 artifact）
6. assistant 输出包含等待用户指令的文本

### 场景 2: opsx:propose

触发：用户发送 `/opsx:propose "add-verbose-flag"`

期望事件序列：
1. Skill tool 调用 `opsx:propose`
2. Bash 调用 `openspec new change`
3. 依次生成所有 planning artifacts（Write/Edit tool 创建 brainstorm.md、design.md 等）
4. 最终产出完整的 tasks artifact

### 场景 3: full-cycle (new → continue → apply)

多轮链路：
- Turn 1: `/opsx:new` → 创建 change 脚手架
- Turn 2: `/opsx:continue` → 生成 brainstorm artifact
- Turn 3: `/opsx:continue` → 生成 design artifact
- Turn N: `/opsx:apply` → 断言调用了 `omc ralph` 或类似执行器

### 场景 4: brainstorm → opsx 转换

触发：用户描述一个新功能需求（不用 /opsx 命令）

期望行为：
- 进入 brainstorm 讨论
- 在收敛标准满足前不自动创建 change
- 收敛后建议 `/opsx:new`

## 需求边界

**In Scope:**
- opsx:new 流程断言
- opsx:propose 流程断言
- 多轮 full-cycle 断言（new → continue → apply）
- 断言粒度：工具名 + 参数 pattern

**Out of Scope:**
- CLI 本身的单元测试（已有 vitest 覆盖）
- skill 内容质量评估（LLM 输出非确定性）
- CI 自动化（手动触发）
- 非 opsx 类 skill（commit、review 等暂不测）

## 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 多轮方式 | `claude -p --continue` | 保持会话上下文 |
| Fixture 项目 | React TODO app + `devkeel init` | 贴近真实用户场景 |
| 断言方式 | shell + jq 解析 stream-json 事件序列 | 轻量、与 superpowers 风格一致 |
| 位置 | `tests/integration/` | 与现有 vitest 单测分离 |
| 触发方式 | 手动 `./run-all.sh` | token 消耗大，不适合 CI |

## 依赖

| 依赖 | 状态 |
|------|------|
| `claude` CLI with `-p --continue --verbose --output-format stream-json` | ✅ 已验证可用 |
| `openspec` CLI 全局安装 | ✅ 就绪 |
| `jq` | ✅ 就绪 |
| `harness` CLI（本项目构建产物） | 需 `pnpm build` 后可用 |

## 待确认项

无（已在 brainstorm 阶段逐项确认）。
