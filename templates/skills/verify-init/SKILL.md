---
name: verify-init
description: >-
  扫描项目领域与技术栈，自动检测已有测试框架，经用户确认后增量补齐测试脚手架
  （框架安装+配置+示例+scripts）+ 维护测试规则与项目文档 + 生成验证 agent。
  为 test-case-designer 的用例提供可执行落点和自主验证闭环。
  触发词：验证初始化、测试平台搭建、verify-init、搭建测试基建
metadata:
  author: "devkeel"
  version: "2.0.0"
---

# Verify Init — 验证层初始化器

扫描项目 → 识别领域/技术栈 → 搭建测试脚手架 + 测试规则与项目文档 + 验证 agent。

**与其他能力的关系：**

- `domain-init` R4 从代码和既有约定提取测试知识与约束；本 skill 补齐已确认的可执行测试基建。
- 两者按主题复用同一套测试规则与文档，增量维护，不分别生成通用版和项目版。
- `test-case-designer` 产出用例文档；验证 agent 执行已有测试，报告覆盖缺口，补测试交给实施流程。

**产出位置：** 配置归属目录（依赖/config/示例/scripts）、当前项目 `docs/`（测试说明）、
`.harness/rules/`（简短约束）、`.harness/agents/`（验证角色）；AGENTS 维护入口和读取条件。

## Read First

按需加载以下参考文档：

- `references/detection-signals.md` — 领域+技术栈+框架已存在检测信号表、降级策略
- `references/stack-matrix.md` — 领域→技术栈→测试框架映射表（v1 四大类）
- `references/frameworks-index.md` — 官方文档定位方法论 + fetch 链（context7 首选非必需）
- `references/scaffolding-principles.md` — 脚手架产出原则 checklist（必含项 + 跨栈注意点）
- `references/output-formats.md` — 测试规则、文档与 test-verifier agent 格式规范

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
2. **增量补齐 + 幂等** — 已有框架标记「已存在」并核对可用性，不重复装，已有配置文件/示例不覆盖
3. **补齐前需用户同意** — 缺失项列入待确认清单，用户勾选后才执行安装（Phase 2 门禁）
4. **fetch 失败降级不阻塞** — 文档查询、网页搜索、页面读取及官方仓库 README 均失败时，
   跳过安装/config/示例/scripts，只维护有本地证据的规则、文档和 agent。提示
   「未能获取 <框架> 官方文档，config 请手动补」，不凭记忆编造 config
5. **与 R4 共用资产** — 先读取适用 AGENTS、已有测试规则和文档；同主题增量更新，不因文件名
   不同新建副本。命令和门槛以实际 scripts、配置及已确认要求为据，不套用固定比例或覆盖率
6. **根/子项目同规则** — 分别识别配置归属、运行目录和领域，知识写入各自 docs；根项目维护
   共享入口与跨项目验证。workspace 依赖装到实际 owner，不能仅按主包技术栈覆盖子项目
7. **格式严格遵循** — 规则/文档/agent 按 `references/output-formats.md` 格式生成
8. **代码依据** — 检测结论必须基于真实项目信号（依赖/config/lockfile/目录），不凭假设
9. **由当前 Agent 执行安装命令** — 纯文档驱动，不内置安装脚本；按官方文档 + scaffolding-principles 产出精确命令执行

## 流程总览

```
Phase 1: 检测       → 领域 + 技术栈 + 已有框架 + 缺口（就绪清单）
Phase 2: 确认       → 用户勾选要补齐项（门禁，补齐前需同意）
Phase 3: 脚手架     → 定位官方文档 → 照 scaffolding-principles 产出 install/config/example/scripts（幂等）
Phase 4: 知识与约束 → 共用测试规则 + docs 测试说明 + 验证 agent + AGENTS 入口
Phase 5: 收尾       → 报告 + review 提示 commit
```

---

## Phase 1: 检测

### 1.1 领域与技术栈识别

读取 `references/detection-signals.md` 和 `references/stack-matrix.md`，先定位当前作用域、
已有规则和 docs，再按信号表扫描目标目录，推断领域与具体技术栈。

多领域命中取并集（如 Electron = 前端 + 桌面）。所有信号未命中 → 标 `custom:<标签>`，只整理已确认的基础结构与项目事实，不强制装框架。

### 1.2 已有框架检测与就绪清单

对 stack-matrix 推荐的每个框架，检查是否**已存在**：

- **依赖痕迹** — `package.json` / `pyproject.toml` / `go.mod` / `pom.xml` 中是否声明
- **配置文件** — `vitest.config.*` / `playwright.config.*` / `pytest.ini` / `conftest.py` / `jest.config.*` / `tsconfig` test 字段
- **锁文件痕迹** — `pnpm-lock.yaml` / `package-lock.json` 中的包名
- **目录结构** — `tests/` / `e2e/` / `__tests__/` / `test/` / `__snapshots__/`

输出就绪清单：

| 作用域 / 配置归属 | 测试类型 | 框架 | 状态 | 依据 / 运行目录 |
|------------------|----------|------|------|-----------------|
| 当前项目或子项目 | 单元 / e2e / API | 实际框架或候选 | 已存在 / 待补齐 / 已验证可运行 | manifest、config、scripts |

依赖、配置或目录存在只证明检测到资产；只有运行成功才标记“已验证可运行”。
分别识别子项目与共享配置，不把 root lockfile 中的包名等同于所有子项目均已就绪。

---

## Phase 2: 用户确认

### 2.1 展示就绪清单

向用户展示 Phase 1 的就绪清单，用户可以：

1. **勾选/取消** — 选择要补齐的框架（默认全勾缺失项，可取消）
2. **补充上下文** — 对特定框架补充说明（如「e2e 只覆盖关键路径」「API 测试用内存数据库」）
3. **确认规则/文档/agent 更新** — 展示目标文件、读取入口及增量变化，可取消。
   新门槛、mock 策略或执行方式须明确确认，已有同范围授权复用

### 2.2 门禁

**用户明确确认后才进入 Phase 3。** 没有待补齐项时：

- 仅更新规则/文档/agent（若用户勾选）→ 直接 Phase 4
- 无需补齐且不更新规则/文档/agent → 直接 Phase 5 提示无需操作

---

## Phase 3: 脚手架

按确认清单逐项执行。对每个要补齐的框架，定位其官方文档并照清单产出，不依赖任何固定配方基线。

### 3.1 定位官方文档

读取 `references/frameworks-index.md`，从 manifest 取包名，通过可用的文档查询、页面读取
或网页搜索定位官方文档，必要时回退到官方仓库 README。提取安装、配置、示例与执行入口，
核对版本。需要平台工具说明时，Claude Code 只读 [Claude 参考](references/claude-code.md)，
Codex 只读 [Codex 参考](references/codex.md)。

### 3.2 照清单产出

读取 `references/scaffolding-principles.md`，核对配置归属、已有资产与必要增量：安装命令 / config / 可运行示例 / 执行入口 / 幂等守卫。缺项不编造，标 TODO 交还用户。

### 3.3 执行（由当前 Agent 照 principles）

1. **安装依赖** — 使用检测到的包管理器，在实际配置 owner 中执行官方命令；已声明依赖
   核对版本与可用性，不重复声明
2. **写配置文件** — 按官方文档 schema 写入框架约定 config（已存在则跳过或提示合并）
3. **示例测试** — 为本次补齐项提供最小可跑示例；已有同类测试时复用，不额外凑示例
4. **执行入口** — 沿用实际 scripts 或原生命令；缺失才补齐，记录运行目录，不改写已有命令语义

**幂等**：每步先 `existsSync` 守卫，已存在不覆盖。

**fetch 全失败降级**：所有可用的文档读取途径均失败时，跳过上面 1-4 步，向用户提示「未能获取 `<框架>` 官方文档，config 请手动补」，只按本地证据维护 Phase 4 规则、文档与 agent，并标明缺失能力。

---

## Phase 4: 规则、文档与验证 agent

按 `references/output-formats.md` 维护：

1. **共用规则** — 复用现有测试 rule，仅保留执行约束和适用条件。缺失时才创建
   `.harness/rules/testing.md`；不按模板追加测试比例、覆盖率门槛或不存在的命令。
2. **测试文档** — 增量维护已有测试说明，缺失时创建 `docs/testing.md`。记录框架现状、配置
   归属、运行目录、实际命令入口、环境准备和排障说明；原理和详细示例放在文档中。
3. **验证 agent** — 维护 `.harness/agents/test-verifier.md`，复用已有角色内容。通过 AGENTS
   入口定位规则和测试文档，再核对 scripts/config；执行已有测试、报告覆盖缺口，不新增或
   修改测试、不改被测逻辑。TC 预期作为验证目标，缺可执行落点则交给实施流程。
4. **读取入口** — 项目知识入口复用 AGENTS 的 `project` 槽位，测试说明与验证角色分别更新
   `verification`/`routing` 槽位，仅放链接和读取条件。保留既有用户内容与执行契约；旧
   `domain` 内容合并到 `project`，不另建领域知识槽位。
   已填槽位删除成对的 `harness:user` 边界注释与已用完的占位提示，保留正文及相邻框架内容；
   未填槽位保留占位。标记已清理时按章节更新，不重加标记或重复入口。

根项目与子项目采用相同的维护流程。先写目标文档并核对来源与链接，再替换旧说明；迁移有效
约束时保留触发条件。差异超出 Phase 2 的确认范围时，只对新增决定重新对齐。

---

## Phase 5: 收尾

### 5.1 输出报告

输出本次生成的完整清单（类型 / 文件 / 状态 / 新增 vs 跳过），分别标记已存在、新增、已验证可运行和降级；附验证证据，不能混用检测与验证状态。

### 5.2 验证

在对应运行目录执行本次补齐项的最小验证，核对文档中的命令入口和链接。缺少依赖、环境或
权限时明确报告未验证，不把“文件存在”当作可运行证据；必要验证通过后不无理由扩大范围。

### 5.3 commit 提示

提示用户 review 生成内容后 commit。不碰 symlink（脚手架位于配置归属目录，知识在 `docs/`，规则/agent 在 `.harness/`，平台链接由 `devkeel init` 负责）。

---

## 通用能力沉淀

在 Phase 2 交互中，如果发现某个技术栈的测试配置具有跨项目通用性：

- 标记为「候选跨栈注意点」
- 建议用户后续 PR 到 devkeel 的 `templates/skills/verify-init/references/scaffolding-principles.md`（补充跨栈通用注意点，而非写死具体栈配方）
- **不自动操作**，只做建议
