## 一句话描述

新增 `verify-init` skill：扫描项目领域与技术栈，搭建可执行测试脚手架（框架选型+安装+配置+示例+scripts）+ 生成通用 testing 规范 + 生成验证 agent，为 `test-case-designer` 的用例提供可执行落点和自主验证闭环。

## 需求背景

当前 harness 工具链已有「设计测试用例」的能力（`test-case-designer` skill），但缺少「把用例落到可执行测试代码 + 自主验证代码输出」的基建。具体痛点：

- **测试基建空白** — 新项目/接手项目没有统一的测试框架配置，每个项目自己摸索 vitest / playwright / pytest 选型，配置质量参差
- **用例文档与可执行代码脱节** — `test-case-designer` 产出 TC 编号 + 步骤 + 预期的文档，但没有配套的测试框架让这些用例变成可跑的代码
- **无自主验证闭环** — AI 完成代码变更后，缺少一个能「跑对应测试 → 解析结果 → blocker-first 回报」的执行端 agent

参考 `domain-init`（领域能力生成器）的成功模式，做一个对称的「验证层初始化器」，搭好测试平台后，`test-case-designer` 写剧本、验证 agent 当演员。

## 项目现状与架构分析

### harness-cli 仓库架构

```
src/commands/    命令层（薄，只做交互编排）
src/lib/         纯逻辑层（厚，无 I/O 副作用优先）
templates/       init 时复制到目标项目的模板资产
  skills/        各 skill 的 SKILL.md + references
  versions-yml.yml   所有模板资产版本唯一权威来源
bin/devkeel.js   入口转发
```

### 受影响区域

| 区域 | 改动 | 说明 |
|------|------|------|
| `templates/skills/verify-init/` | 新增 | skill 主体：SKILL.md + references |
| `templates/versions-yml.yml` | 修改 | 注册 `verify-init: "1.0.0"` |

### 关键参考 skill 现状

| skill | 结构 | 复用点 |
|-------|------|--------|
| `domain-init` | SKILL.md + references/（5 文件）+ scripts/ | 分阶段流程、detection-signals 思路、project-index 对照表机制、output-formats 格式 |
| `test-case-designer` | SKILL.md + references/（3 文件） | full/fast 双模式、领域检测信号表、测试维度矩阵 |
| `automated-instrumented-debugging` | SKILL.md + references/ | 「证据先行」输出哲学、4 阶段循环 |

### 核心调用链

```
用户运行 /verify-init
  → Phase 1 检测（读 detection-signals.md + stack-matrix.md，扫描项目）
  → Phase 2 用户确认（就绪清单勾选，门禁）
  → Phase 3 脚手架（读 frameworks-index.md fetch 增强 + stack-recipes/<stack>.md 基线，由 Claude 执行安装+配置+示例+scripts）
  → Phase 4 规范+agent（按 output-formats.md 生成 .harness/rules/testing.md + .harness/agents/test-verifier.md）
  → Phase 5 收尾（报告 + review 提示 commit）
```

## 风险与约束

| 风险/约束 | 说明 | 缓解 |
|---------|------|------|
| 框架选型主观性 | 不同团队偏好不同（Jest vs vitest、Cypress vs Playwright） | v1 固定主推选型，支持「自动识别，覆盖不同技术栈，提供最合适框架」；用户可取消勾选 |
| 网络依赖 | frameworks-index 的 context7/WebFetch 增强在离线环境失效 | 固定配方基线（stack-recipes）做兜底，fetch 失败降级不阻塞，呼应「防御式存在性检查 + 静默降级」哲学 |
| 覆盖用户已有配置 | 项目已有 vitest.config 等被覆盖 | 增量补齐 + 幂等：每步 existsSync 守卫，已存在标记「✅ 已就绪」不重复装，补齐前需用户同意 |
| 技术栈覆盖不全 | v1 只覆盖主流四大类，冷门栈缺失 | custom 降级路径：只配基础结构 + 通用规范，不强制装框架，提示用户手动指定 |
| 与 R4 重叠 | domain-init 的 R4 也生成测试策略 | 职责互补：R4 管项目特定软规范（依赖真实代码扫描），verify-init 管可执行结构化基建（框架+通用规范+agent） |
| 纯文档驱动一致性 | 由 Claude 执行安装命令而非脚本，不同技术栈命令差异大 | stack-recipes 每栈一份完整配方（含精确安装命令、配置文件内容、示例代码），Claude 照配方执行 |

**向后兼容性**：纯新增 skill + versions-yml 注册一行，不修改任何现有 skill/命令/lib 逻辑，无破坏性。

**现有测试覆盖**：本 skill 是模板资产，不涉及 src/ 代码改动，现有 vitest 测试套件不受影响。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| AI Coding Agent（主要） | 运行 verify-init 搭测试基建；后续 test-verifier agent 自主验证代码输出 |
| 项目工程师（次要） | 接手新项目时一键搭建标准化测试平台；review 生成的配置和规范 |
| test-case-designer（下游消费方） | 依赖 verify-init 搭好的框架把用例文档落地为可执行测试 |

## 核心功能用例

### 用例 1：自动检测领域与技术栈
- **触发**：用户运行 `/verify-init`
- **行为**：扫描 package.json / pyproject.toml / go.mod / pom.xml 等信号，识别领域（前端/后端/移动端/CLI/库）+ 具体技术栈（react/vue/express/fastapi/go/spring 等）
- **预期**：输出领域+技术栈检测结果，供后续阶段使用

### 用例 2：检测已有测试框架并生成就绪清单
- **触发**：检测完成后
- **行为**：对每个推荐框架，检查依赖/config/lockfile 痕迹判断是否已存在，生成「✅ 已就绪 / ➕ 待补齐」清单
- **预期**：清单含测试类型、推荐框架、状态、依据

### 用例 3：用户确认补齐范围
- **触发**：展示就绪清单后
- **行为**：用户勾选要补齐的框架（默认全勾缺失项，可取消）、补充上下文、确认是否生成规范+agent
- **预期**：用户明确确认后才进入执行；全空时跳到只补规范/agent 或直接收尾

### 用例 4：搭建测试脚手架
- **触发**：用户确认后
- **行为**：按确认清单逐项执行——查 frameworks-index fetch 框架最新文档增强配置 → 叠加 stack-recipes 固定基线 → 安装依赖（Claude 执行）→ 写配置文件 → 写示例测试 → 更新 package.json scripts
- **预期**：每步幂等（existsSync 守卫），fetch 失败降级固定配方不阻塞

### 用例 5：生成 testing 规范与验证 agent
- **触发**：脚手架完成后（或用户仅选规范/agent 时）
- **行为**：按 output-formats.md 格式，生成 `.harness/rules/testing.md`（通用结构化规范，半固定模板按技术栈微调）+ `.harness/agents/test-verifier.md`（验证闭环执行端）
- **预期**：已存在则提示合并而非覆盖

### 用例 6：变更驱动验证（验证 agent 职责）
- **触发**：AI 完成代码变更后调度 test-verifier
- **行为**：识别变更范围 → 映射测试类型（单测/e2e/API）→ 判断是否补回归测试 → 收窄 scope 跑对应 script → 解析结果 → blocker-first 回报
- **预期**：区分真实回归 vs 测试过时/环境问题；e2e 失败重试 1 次仍失败才报

## 需求边界

**In Scope:**
- 新增 `verify-init` skill（SKILL.md + 5 个 references + 17 个 stack-recipes）
- 覆盖主流四大类技术栈的测试框架映射（前端 4 + 后端 4 + 移动端 4 + CLI/库 6，按 stack-matrix）
- 固定配方基线 + frameworks-index 对照表（context7 优先 → WebFetch 降级）增强机制
- 生成通用 testing 规范（`.harness/rules/testing.md`）
- 生成验证 agent（`.harness/agents/test-verifier.md`，变更驱动验证闭环）
- 自动检测 + 用户确认入口模式
- 增量补齐、补齐前用户同意、幂等不覆盖
- 在 `versions-yml.yml` 注册 `verify-init: "1.0.0"`

**Out of Scope:**
- 不生成 CI 集成片段（只配 package.json scripts，CI 由用户自己接入）
- 不写测试用例（那是 test-case-designer 的职责）
- 不改被测代码逻辑（那是 executor 的职责）
- 不替代 domain-init 的 R4 测试策略（R4 管项目特定软规范，本 skill 管通用结构化基建）
- 不内置安装脚本（纯文档驱动，由 Claude 照 stack-recipes 执行）
- v1 不覆盖冷门领域（Rust 系统/C++/DevOps/桌面等，custom 降级处理）

## 探索过的替代方向

| 替代方向 | 取舍 |
|---------|------|
| **产出边界仅脚手架**（不含规范+agent） | 否决。用户明确选「脚手架+规范+验证 agent」，要支持「自主验证输出的代码」闭环 |
| **领域全覆盖**（对齐 domain-init 全部领域） | 否决。第一版工作量大，冷门领域降级为通用建议质量难保证。选「主流四大类」 |
| **纯动态配置**（只靠对照表 fetch 文档生成配置） | 否决。离线/网络受限直接瘫、可复现性差、质量下限无保证。选「固定基线 + 对照表增强 + 降级」混合模式 |
| **TC 文档驱动翻译**（验证 agent 把 test-case-designer 的 TC 文档翻译成可执行测试） | 否决。「文档→代码」翻译质量难保证且与 apply 阶段重叠。选「变更驱动验证」—— agent 接收变更+验证目标，跑对应测试 |
| **内置脚本封装安装**（scripts/setup-vitest.mjs 等） | 否决。违反项目 YAGNI 纯逻辑哲学，各技术栈命令差异大维护成本高。选「纯文档驱动」 |
| **Jest 默认选型**（前端单测用 Jest） | 否决。2026 主流是 vitest（Vite 原生、更快），Jest 仅作老项目降级 |

## 待确认项

无。brainstorming 阶段已通过 11 轮结构化澄清确认全部关键决策：产出边界（脚手架+规范+验证 agent）、领域范围（主流四大类）、已有框架处理（增量补齐+用户同意）、与 R4 关系（互补职责不同）、验证 agent 职责（执行+判定闭环）、命名（verify-init）、前端选型（vitest+Playwright）、后端覆盖（自动识别多技术栈）、实现机制（纯文档驱动）、衔接机制（变更驱动验证）、产出位置（标准 harness 布局）、CI（只配 scripts）、入口模式（自动检测+用户确认）、对照表增强（固定基线+fetch 增强+降级）。
