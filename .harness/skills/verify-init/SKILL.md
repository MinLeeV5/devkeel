---
name: verify-init
description: >-
  扫描项目领域与技术栈，自动检测已有测试框架，经用户确认后增量补齐测试脚手架
  （框架安装+配置+示例+scripts）+ 生成通用 testing 规范 + 生成验证 agent。
  为 test-case-designer 的用例提供可执行落点和自主验证闭环。
  触发词：验证初始化、测试平台搭建、verify-init、搭建测试基建
metadata:
  author: "devkeel"
  version: "1.0.2"
---

# Verify Init — 验证层初始化器

扫描项目 → 识别领域/技术栈 → 搭建测试脚手架 + 通用 testing 规范 + 验证 agent。

**与 domain-init / test-case-designer 的关系：**

- `domain-init` R4 — 扫描**真实代码**生成**项目特定**软规范（mock 策略、覆盖模式等依赖现状的约定）
- `verify-init`（本 skill）— 搭建**可执行测试基建**：框架选型+安装+配置+示例+scripts+**通用结构化**规范+验证 agent
- `test-case-designer` — 从需求/spec 产出测试点+用例**文档**
- 验证 agent（本 skill 产出）— 变更驱动验证闭环的执行端

**互补关系**：verify-init 搭台子（框架+通用规范+执行 agent），test-case-designer 写剧本（用例文档），验证 agent 当演员（执行+判定）。R4 管项目特有的软约定，verify-init 管可执行的结构化基建。

**产出位置：** 项目根（框架配置/示例）+ `.harness/rules/`（规范）+ `.harness/agents/`（验证 agent）

## Read First

按需加载以下参考文档：

- `references/detection-signals.md` — 领域+技术栈+框架已存在检测信号表、降级策略
- `references/stack-matrix.md` — 领域→技术栈→测试框架映射表（v1 四大类）
- `references/frameworks-index.md` — 官方文档定位方法论 + fetch 链（context7 首选非必需）
- `references/scaffolding-principles.md` — 脚手架产出原则 checklist（必含项 + 跨栈注意点）
- `references/output-formats.md` — testing 规范 + test-verifier agent 格式规范

## 何时使用

- 项目已完成 `devkeel init`，需要搭建标准化测试基建
- 接手新项目，需要快速配置测试框架（单测/e2e/API）
- 项目已有部分测试框架，需要增量补齐缺失类型
- 需要「自主验证代码输出」能力时，配套生成验证 agent

何时**不**使用：

- 项目还没 `devkeel init`（先 init 建好 `.harness/`）
- 只想写测试用例文档（用 `test-case-designer`）
- 想改被测代码逻辑（用 executor，验证 agent 不改逻辑）

## Hard Rules

1. **必须先完成检测**（Phase 1），禁止跳过直接安装框架
2. **增量补齐 + 幂等** — 已有框架标记「✅ 已就绪」不重复装，已有配置文件/示例不覆盖
3. **补齐前需用户同意** — 缺失项列入待确认清单，用户勾选后才执行安装（Phase 2 门禁）
4. **fetch 失败降级不阻塞** — 可用的文档查询、网页搜索与页面读取途径均失败时（含 GitHub README 兜底不可达），跳过精确 config 产出，只生成 testing 规范 + 验证 agent，向用户提示「未能获取 <框架> 官方文档，config 请手动补」。不凭记忆编造可能过时的 config
5. **规范与 R4 互补不重叠** — 生成的 testing 规范是通用结构化约定（金字塔/命名/执行/覆盖率），R4 是项目特定软规范（mock 策略/覆盖模式）
6. **格式严格遵循** — 规范/agent 按 `references/output-formats.md` 格式生成
7. **代码依据** — 检测结论必须基于真实项目信号（依赖/config/lockfile/目录），不凭假设
8. **由当前 Agent 执行安装命令** — 纯文档驱动，不内置安装脚本；按官方文档 + scaffolding-principles 产出精确命令执行

## 流程总览

```
Phase 1: 检测       → 领域 + 技术栈 + 已有框架 + 缺口（就绪清单）
Phase 2: 确认       → 用户勾选要补齐项（门禁，补齐前需同意）
Phase 3: 脚手架     → 定位官方文档 → 照 scaffolding-principles 产出 install/config/example/scripts（幂等）
Phase 4: 规范+agent → testing.md + test-verifier.md
Phase 5: 收尾       → 报告 + review 提示 commit
```

---

## Phase 1: 检测

### 1.1 领域与技术栈识别

读取 `references/detection-signals.md` 和 `references/stack-matrix.md`，按信号表扫描项目根目录，推断领域（前端/后端/移动端/CLI/库）+ 具体技术栈（react/vue/express/fastapi/go/spring 等）。

多领域命中取并集（如 Electron = 前端 + 桌面）。所有信号未命中 → 标 `custom:<标签>`，只配基础结构 + 通用规范，不强制装框架。

### 1.2 已有框架检测与就绪清单

对 stack-matrix 推荐的每个框架，检查是否**已存在**：

- **依赖痕迹** — `package.json` / `pyproject.toml` / `go.mod` / `pom.xml` 中是否声明
- **配置文件** — `vitest.config.*` / `playwright.config.*` / `pytest.ini` / `conftest.py` / `jest.config.*` / `tsconfig` test 字段
- **锁文件痕迹** — `pnpm-lock.yaml` / `package-lock.json` 中的包名
- **目录结构** — `tests/` / `e2e/` / `__tests__/` / `test/` / `__snapshots__/`

输出就绪清单：

| 测试类型 | 推荐框架 | 状态 | 依据 |
|---------|---------|------|------|
| 单元测试 | vitest | ✅ 已就绪 / ➕ 待补齐 | 依赖/config/lockfile 依据 |
| e2e | Playwright | ... | ... |
| API 测试 | supertest | ... | ... |

---

## Phase 2: 用户确认

### 2.1 展示就绪清单

向用户展示 Phase 1 的就绪清单，用户可以：

1. **勾选/取消** — 选择要补齐的框架（默认全勾缺失项，可取消）
2. **补充上下文** — 对特定框架补充说明（如「e2e 只覆盖关键路径」「API 测试用内存数据库」）
3. **确认规范/agent 生成** — 默认生成 testing 规范 + 验证 agent，可取消

### 2.2 门禁

**用户明确确认后才进入 Phase 3。** 全空（项目已就绪）时：

- 仅生成规范/agent（若用户勾选）→ 直接 Phase 4
- 全部已就绪且不补规范/agent → 直接 Phase 5 提示无需操作

---

## Phase 3: 脚手架

按确认清单逐项执行。对每个要补齐的框架，定位其官方文档并照清单产出，不依赖任何固定配方基线。

### 3.1 定位官方文档

读取 `references/frameworks-index.md`，按定位方法论从 manifest 取包名，通过当前可用的文档查询、页面读取和网页搜索找到官方文档，必要时回退到官方仓库 README。提取安装命令、config schema、示例、scripts、最佳实践，确认文档版本对应当前安装版本。需要平台工具说明时，Claude Code 只读 [Claude 参考](references/claude-code.md)，Codex 只读 [Codex 参考](references/codex.md)。

### 3.2 照清单产出

读取 `references/scaffolding-principles.md`，对照必含项 + 跨栈注意点核对产出：安装命令（检测到的包管理器）/ config 文件（已存在则跳过或提示合并）/ 每类测试一个最小示例 / scripts / 幂等守卫。缺项不编造，标 TODO 交还用户。

### 3.3 执行（由 Claude 照 principles）

1. **安装依赖** — 按官方文档精确的包管理器命令执行（pnpm/npm/pip/uv/go get/cargo add/maven），已声明依赖跳过安装只确认版本
2. **写配置文件** — 按官方文档 schema 写入框架约定 config（已存在则跳过或提示合并）
3. **写示例测试** — 每个测试类型一个最小可跑示例（如 `tests/example.test.ts`、`e2e/smoke.spec.ts`），让用户能立刻跑通
4. **更新 scripts** — 补 `test` / `test:unit` / `test:e2e` / `test:api` / `test:coverage`（已有则不覆盖）

**幂等**：每步先 `existsSync` 守卫，已存在不覆盖。

**fetch 全失败降级**：所有可用的文档读取途径均失败时，跳过上面 1-4 步，向用户提示「未能获取 `<框架>` 官方文档，config 请手动补」，只产 Phase 4 规范 + agent。

---

## Phase 4: 规范 + 验证 agent

### 4.1 生成 testing 规范

按 `references/output-formats.md` 格式，写入 `.harness/rules/testing.md`：

- 通用结构化约定（非项目特定）：测试金字塔比例、文件命名、目录组织、断言风格、mock 边界、覆盖率门槛、执行约定、测试独立性、失败可诊断
- 半固定模板，按检测到的技术栈微调（如 Python 项目命名换 `test_*.py`、Go 换 `_test.go`）
- 已存在则提示合并而非覆盖（幂等）

### 4.2 生成验证 agent

按 `references/output-formats.md` 格式，写入 `.harness/agents/test-verifier.md`：

- 角色：验证执行者，不写用例、不改被测逻辑
- 强制启动步骤：确认验证目标 → 识别变更范围 → 映射测试类型 → 判断补回归 → 收窄 scope 跑测试 → 解析结果 → blocker-first 回报
- 与 test-case-designer 衔接：不直接消费 TC 文档，把 TC 预期结果当验证目标断言

---

## Phase 5: 收尾

### 5.1 输出报告

输出本次生成的完整清单（类型 / 文件 / 状态 / 新增 vs 跳过），标记「✅ 已就绪」「➕ 新增」「⚠️ 降级（fetch 失败）」。

### 5.2 验证提示

提示用户运行最接近的验证命令（如 `pnpm test`）确认脚手架可用。

### 5.3 commit 提示

提示用户 review 生成内容后 commit。不碰 symlink（脚手架在项目根，规范/agent 在 `.harness/`，平台链接由 `devkeel init` 负责）。

---

## 通用能力沉淀

在 Phase 2 交互中，如果发现某个技术栈的测试配置具有跨项目通用性：

- 标记为「候选跨栈注意点」
- 建议用户后续 PR 到 devkeel 的 `templates/skills/verify-init/references/scaffolding-principles.md`（补充跨栈通用注意点，而非写死具体栈配方）
- **不自动操作**，只做建议
