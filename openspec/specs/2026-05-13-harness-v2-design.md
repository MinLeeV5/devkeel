# DevKeel v2 设计文档

> 日期：2026-05-13
> 状态：草案
> 历史说明：本文保留当时的 v2 方案快照；当前 OPSX 入口、Living brainstorm 与投影契约以
> `brainstorming-workflow` 和 `opsx-schema-routing` 规格为准。

## 1. 背景与动机

### v1 的问题

DevKeel v1 试图做一个**流程编排引擎**——通过 config.yml 定义每个 stage 的 flow（capability、when 条件、required 标记），用 current.yml 管理状态流转，用 `harness resolve` 在运行时路由到正确的工具和 skill。

实际使用中暴露了根本性矛盾：

1. **与工具运行时冲突** — openspec、omc 各自有完整的流程体系，harness 在它们之上再套一层状态机，三层互相打架
2. **触发不准** — 流程路由依赖 Agent 理解复杂的 capability 映射，经常失准，需要 CLI 强行兜底，越兜越复杂
3. **高 token 消耗** — 大量上下文花在"判断该走哪一步"而非"做实际的事"
4. **与直接使用工具无差异** — 开发者手动触发 openspec/omc 的 skill 就能达到同样效果，只要知道最佳实践

### 真正有价值的是什么

从 example-workspace 项目的实际使用中验证，真正带来价值的是：

- **业务专属 skills** — 沉淀"我们团队怎么做事"（jira-defect-orchestrator、review-orchestrator、项目部署工具 等）
- **Domain rules** — 沉淀"我们的代码标准"（frontend-code-reviewer、gateway-code-reviewer）
- **AGENTS.md 路由表** — 让 Agent 知道"遇到什么任务用什么 skill"
- **跨平台入口统一** — 一份 AGENTS.md 对接 Claude Code / Codex / Cursor

## 2. v2 定位

**项目知识框架** — 回答 Agent 两个问题：

1. 这个项目是什么？（tech stack、conventions）
2. 遇到具体任务该用什么？（skill 路由、rules）

**不再回答"下一步该做什么"** — 流程编排交给 openspec/omc 等工具自身管理。

## 3. 核心架构

### 3.1 三个核心目录

```
.harness/                    # Agent 的能力配置（项目知识框架）
  config.yml                 # 极简项目元信息
  skills/                    # 项目级业务 skills
  rules/                     # 项目级规则
  agents/                    # 自定义 agent 定义

openspec/                    # 所有知识产出的唯一真源
  config.yaml                # schema 默认值、project context、per-artifact rules
  schemas/                   # 自定义 schema（test-case、retro 等）
  changes/                   # 进行中的变更
  specs/                     # 正式规格
  archive/                   # 归档

AGENTS.md                    # 执行契约
```

### 3.2 config.yml（极简）

```yaml
version: "2.0"
project:
  name: my-project
  types: [fullstack]       # backend / frontend / fullstack
targets: [claude-code, codex, cursor]
```

仅声明项目元信息。不包含 stages、flow、capability、when 条件。

### 3.3 AGENTS.md（执行契约）

AGENTS.md 是 Agent 进入项目时的唯一入口，包含：

**路由表** — 任务类型到 skill 的简单映射，自然语言描述：

```markdown
| 任务类型 | Skill |
|----------|-------|
| 需求分析 | requirement-analysis |
| 技术设计 | technical-design |
| 代码审查 | review-orchestrator |
| 提交代码 | commit |
| 环境搭建 | project-setup |
```

**子项目规则** — 进入子目录时读取其 AGENTS.md：

```markdown
若任务进入子项目，必须继续读取对应子项目的 AGENTS.md。
```

**执行基线** — 歧义处理、验证要求、收尾流程。

**跨平台入口及链接规则**：

| 平台 | 入口文件 | 链接方式 |
|------|---------|---------|
| Claude Code | `CLAUDE.md` | `@AGENTS.md` 引用指令，Claude Code 自动加载 |
| Codex CLI | `AGENTS.md` | Codex 原生自动加载 |
| Cursor | `AGENTS.md` | Cursor 原生自动加载 |
| Gemini CLI | `GEMINI.md` | 文件内写明"执行规则见 AGENTS.md"，Gemini 按指示读取 |

> AGENTS.md 是唯一执行契约，各平台入口文件仅做引用/转发，不重复内容。

### 3.4 openspec/ 作为知识唯一真源

所有正式产出物（PRD、设计文档、测试用例、决策记录等）统一通过 openspec 管理：

- **生命周期管理** — changes → specs → archive
- **Schema 定制** — 通过自定义 schema 约束不同类型产物的格式
- **Context 注入** — config.yaml 的 context 和 rules 自动注入 AI prompt
- **入 Git** — 团队共享，跨 session 持久化

**openspec/ 由 devkeel init 直接生成，不依赖 openspec CLI 的 `openspec init`。**

生成的目录结构：

```
openspec/
  config.yaml                 # 项目 context、rules、默认 schema
  environment.toml            # openspec 环境配置
  settings.json               # openspec 设置
  schemas/
    superpowers-bridge/       # 默认 schema（内置）
      schema.yaml             # artifact 定义 + apply 流程
      templates/              # 8 个 artifact 模板
        brainstorm.md
        proposal.md
        design.md
        spec.md
        tasks.md
        plan.md
        verify.md
        retrospective.md
  changes/                    # 进行中的变更
  specs/                      # 正式规格
  archive/                    # 归档
```

默认 schema 为 `superpowers-bridge`，config.yaml 自动设置：

```yaml
schema: superpowers-bridge

context: |
  # 由 devkeel init 根据项目元信息自动填充
  Project: {project.name}
  Types: {project.types}

rules:
  proposal: []
  specs: []
```

> 用户可后续添加其他自定义 schema 到 `openspec/schemas/`，或通过 config.yaml 的 `schema` 字段切换默认 schema。

### 3.5 子项目自治

Domain 相关的 rules 和 skills 下沉到各子项目/子模块，不在 .harness/ 集中管理：

```
maxhub-ai-monorepo/          # 前端子模块
  AGENTS.md                   # 前端执行契约
  .harness/skills/            # 前端专属 skills
  .harness/rules/             # 前端代码规范

maxhubone-gateway/            # 后端子模块
  AGENTS.md                   # 后端执行契约
  .harness/skills/            # 后端专属 skills
  .harness/rules/             # 后端代码规范
```

Agent 进入子目录时，自动读取该目录的 AGENTS.md，获取子项目的能力配置。

## 4. v1 → v2 变更清单

### 砍掉

| 组件 | 原因 |
|------|------|
| config.yml 的 stages/flow/capability/when | 流程编排交给工具自身 |
| current.yml 状态流转 | 不再管理阶段状态 |
| `harness resolve` 运行时路由 | 不再做运行时能力匹配 |
| domain/ 目录 | 下沉到子项目自治 |
| wiki/ 作为产物目录 | openspec/ 替代 |
| stage-* 系列 skill | 与方法论 skill（requirement-analysis、technical-design 等）功能重复，直接移除 |
| `harness status` | 无状态可查 |
| `devkeel sync` | 无状态可同步 |

### 保留

| 组件 | 作用 |
|------|------|
| `.harness/` 目录结构 | 项目知识框架的载体 |
| `skills/` | 业务专属 skills 的沉淀 |
| `rules/` | 项目级规则 |
| `agents/` | 自定义 agent 定义 |
| `AGENTS.md` | 执行契约 |
| 跨平台入口文件生成 | CLAUDE.md、GEMINI.md |

### 新增

| 组件 | 作用 |
|------|------|
| openspec/ 集成 | 作为知识产出的唯一真源 |
| 自定义 schema 支持 | 约束不同类型产物的格式 |

## 5. CLI 功能

v2 的 CLI 精简为以脚手架为核心。

### `devkeel init`

目标用户：项目负责人 / Tech Lead，一次性初始化后入 Git，团队 clone 即用。

#### 交互流程

```
$ devkeel init

┌ DevKeel v2 项目初始化
│
◆ 项目名称？
│ > my-project（自动读 package.json / 目录名）
│
◆ 项目类型？
│ ● fullstack
│ ○ frontend
│ ○ backend
│
◆ 目标平台？（多选）
│ ☑ claude-code
│ ☑ codex
│ ☑ cursor
│ ☐ gemini
│
◆ 检测到 openspec/ 目录？
│ → 是：跳过（保留用户已有配置）
│ → 否：直接生成 openspec/ 目录结构（含 superpowers-bridge schema）
│
◆ 是否有 Git submodule？
│ → 是：列出所有子模块，多选"为哪些子模块初始化领域配置？"
│       为选中的子模块生成 AGENTS.md + .harness/skills/ + .harness/rules/
│ → 否：跳过
│
├ 生成文件（主仓库）：
│  ✔ .harness/config.yml
│  ✔ .harness/skills/          (通用基线包)
│  ✔ .harness/rules/           (通用规则)
│  ✔ .harness/agents/          (通用 agent 定义)
│  ✔ AGENTS.md                 (含路由表 + 执行基线)
│  ✔ CLAUDE.md                 (根据 targets，见「跨平台链接规则」)
│  ✔ GEMINI.md                 (根据 targets)
│  ✔ openspec/                 (如未检测到则自动生成)
│
├ 生成文件（选中的子模块）：
│  ✔ {submodule}/AGENTS.md
│  ✔ {submodule}/.harness/skills/   (空目录 + .gitkeep，放领域 skills)
│  ✔ {submodule}/.harness/rules/    (空目录 + .gitkeep，放领域 rules)
│
├ 检测到已有知识产物（wiki/、docs/ 等）？
│ → 是：提示 "运行 devkeel migrate 将已有知识迁移到 openspec/"
│ → 否：跳过
│
└ 完成！下一步：
   1. 编辑 AGENTS.md 补充项目特有的路由规则
   2. 添加业务专属 skills 到 .harness/skills/
   3. 为子模块添加领域 skills/rules 到对应目录
   4. 如有旧知识产物，运行 devkeel migrate 迁移
   5. git add && git commit
```

#### 通用基线包（内置于 CLI npm 包）

init 时自动复制到 `.harness/skills/` 和 `.harness/rules/`：

**通用 Skills：**

| Skill | 说明 |
|-------|------|
| commit | 原子提交规范 |
| automated-instrumented-debugging | 调试方法论 |
| requirement-analysis | 需求分析方法论 |
| technical-design | 技术设计方法论 |
| test-case-designer | 测试用例设计 |
| review-orchestrator | 代码审查编排 |
| defect-orchestrator | 缺陷管理（通用化，支持不同 issue tracker） |
| openspec-explore | OpenSpec 上下文探索 |
| openspec-propose | OpenSpec 变更提议 |
| openspec-apply-change | OpenSpec 变更应用 |
| openspec-archive-change | OpenSpec 变更归档 |

**通用 Agents：**

| Agent | 说明 |
|-------|------|
| code-reviewer | 通用代码审查 agent（领域专属版下沉到子模块） |

**通用 Rules：**

| Rule | 说明 |
|------|------|
| harness-baseline | 执行基线（歧义处理、验证要求、收尾流程） |

#### AGENTS.md 生成内容

基于交互收集的元信息自动生成，完整模板如下：

```markdown
# AGENTS.md — Agent 执行契约

本文件是项目统一的执行契约，负责说明读取顺序、路由、验证与收尾要求。

说明：
- 对 Claude Code：CLAUDE.md 是自动加载入口，通过 @AGENTS.md 导入本文件
- 对 Codex CLI / Cursor：本文件自动加载
- 对 Gemini CLI：GEMINI.md 是自动加载入口，应引导到本文件
- 无论物理入口是什么，执行规则都以本文件为准

## 1. 适用范围

本文件作用于仓库根目录，以及未被更深层 AGENTS.md 覆盖的目录。

若任务进入以下子项目，必须继续读取对应子项目的 AGENTS.md：

- {submodule-1}/
- {submodule-2}/

## 2. 阅读顺序

1. 当前作用域生效的 AGENTS.md
2. .harness/rules/、.harness/skills/ 中与任务相关的内容
3. CLAUDE.md（若平台自动加载）
4. openspec/ 中与任务直接相关的 specs 和 changes
5. 若任务落入子项目，继续读取子项目自己的 AGENTS.md

优先级：用户当前明确要求 > 更小作用域 AGENTS.md > 当前 AGENTS.md > CLAUDE.md

## 3. 默认执行基线

无论是否命中专项 skill，默认都遵循以下基线：

- 歧义或风险不低时，先显式写出关键假设与未知项
- 默认选择最小、最容易验证的方案
- 只改与目标直接相关的内容，不顺手清理无关问题
- 在声称完成前提供可观察的验证证据

## 4. 路由表

开始任务前，按下表选择对应 skill；未命中时按默认执行基线推进。

| 任务类型 | Skill | 备注 |
|----------|-------|------|
| 需求分析 / PRD | requirement-analysis | |
| 方案设计 / API 设计 | technical-design | |
| 代码审查 | review-orchestrator | |
| 测试用例设计 | test-case-designer | |
| 缺陷管理 | defect-orchestrator | |
| 调试排错 | automated-instrumented-debugging | |
| 原子提交 | commit | |
| 知识管理 / 变更流程 | openspec-* | 探索、提议、应用、归档 |
| 未命中以上 | 按默认执行基线推进 | |

<!-- 项目专属 skill 请在此处补充，例如：
| 环境搭建 | project-setup | |
| 部署 | project-deploy | |
-->

技能选择优先级：项目专属 skill > 通用 skill。
涉及子模块实现时，应进入子项目目录处理，不把子项目实现细节写回主仓库。

## 5. 验证要求

- 优先运行与改动最接近的验证命令，再按需扩大范围
- 如果依赖、环境或外部服务缺失导致无法验证，要明确说明阻塞点
- 不要把"理论上应该可行"表述成"已经完成验证"

## 6. 输出风格

- 面向工程师读者，优先给结论、边界、依据
- 需要对比、清单或多维信息时，优先使用表格或列表
- 需要表达结构或流程时，优先使用 Mermaid，而不是长段 prose

## 7. 收尾要求

结束一次工作会话时，只有 git push 成功后，这次工作才算真正完成。

强制流程：

1. 执行与改动最接近的质量检查
2. 调用 commit skill 完成原子化提交
3. 执行：
   git pull --rebase → git push → git status
4. 确认代码已提交并推送

## 8. 资产位置

| 资产 | 路径 |
|------|------|
| 配置 | .harness/config.yml |
| Skills | .harness/skills/ |
| Rules | .harness/rules/ |
| Agents | .harness/agents/ |
| 知识产出 | openspec/ |

## 9. 项目补充

<!-- 项目特有的约束、背景、注意事项写在此处 -->
```

> init 时根据实际情况填充：子模块列表（§1）、项目专属 skill 行（§4 注释区）、资产路径（§8）。

#### 分发与更新

- v2 阶段：通用基线包内置在 CLI 的 npm 包中，`devkeel init` 时直接 copy
- 后续可调整为独立 Git 仓库（submodule 引入），方便跟踪上游更新

**版本管理**：

所有通用 skill、agent、rule 和 openspec schema 均带版本号，记录在 `.harness/versions.yml`：

```yaml
# .harness/versions.yml（devkeel init 自动生成，devkeel update 时对比）
harness: "2.0.0"                    # DevKeel CLI 版本
skills:
  commit: "1.0.0"
  automated-instrumented-debugging: "1.0.0"
  requirement-analysis: "1.0.0"
  technical-design: "1.0.0"
  test-case-designer: "1.0.0"
  review-orchestrator: "1.0.0"
  defect-orchestrator: "1.0.0"
  openspec-explore: "1.0.0"
  openspec-propose: "1.0.0"
  openspec-apply-change: "1.0.0"
  openspec-archive-change: "1.0.0"
agents:
  code-reviewer: "1.0.0"
rules:
  harness-baseline: "1.0.0"
schemas:
  superpowers-bridge: "1.0.0"       # openspec schema 版本
```

### `devkeel update`

对比当前项目的 `.harness/versions.yml` 与 CLI 内置的最新版本，增量更新：

```
$ devkeel update

┌ DevKeel 更新检查
│
├ 对比 .harness/versions.yml 与 CLI 内置版本
│
│  Skills：
│    commit                           1.0.0 → 1.1.0  ⬆
│    requirement-analysis             1.0.0 = 1.0.0  ✓
│    review-orchestrator              1.0.0 → 1.2.0  ⬆
│    ...
│  Schemas：
│    superpowers-bridge               1.0.0 → 1.1.0  ⬆
│  Rules：
│    harness-baseline                 1.0.0 = 1.0.0  ✓
│
◆ 确认更新以上组件？(Y/n)
│
├ 更新文件：
│  ✔ .harness/skills/commit/          (1.0.0 → 1.1.0)
│  ✔ .harness/skills/review-orchestrator/  (1.0.0 → 1.2.0)
│  ✔ openspec/schemas/superpowers-bridge/  (1.0.0 → 1.1.0)
│  ✔ .harness/versions.yml           (已更新)
│
└ 完成！运行 git diff 查看变更，确认后提交。
```

**更新策略**：

- 只更新通用基线组件，不触碰用户自定义的 skills/rules/schemas
- 用户如果修改了通用 skill 的内容（本地定制），update 时提示冲突，由用户选择覆盖或跳过
- `devkeel update --force` 强制覆盖所有通用组件
- `devkeel update --dry-run` 仅显示差异，不执行更新

### `devkeel submodule`

为已有子模块补充领域配置（init 时未选中、或后续新增子模块时使用）：

```
$ devkeel submodule add maxhub-ai-monorepo

┌ 为子模块 maxhub-ai-monorepo 初始化领域配置
│
├ 生成文件：
│  ✔ maxhub-ai-monorepo/AGENTS.md
│  ✔ maxhub-ai-monorepo/.harness/skills/   (.gitkeep)
│  ✔ maxhub-ai-monorepo/.harness/rules/    (.gitkeep)
│
└ 完成！将领域 skills 和 rules 放入对应目录即可。
```

### `devkeel migrate`

将已有知识产物（wiki/、docs/ 等）迁移到 openspec/ 归档目录，保留原始格式作为历史参考。

```
$ devkeel migrate docs/

┌ 知识产物迁移
│
├ 扫描 docs/ 发现 12 个文件
│
├ 迁移到 openspec/archive/migrated/：
│  ✔ docs/prd-ai-meeting.md → openspec/archive/migrated/prd-ai-meeting.md
│  ✔ docs/design-asr.md → openspec/archive/migrated/design-asr.md
│  ✔ ...（共 12 个文件）
│
└ 完成！旧产物已归档。
   后续新需求请通过 openspec 流程产出结构化 specs。
```

**策略**：

- 不做格式转换、不做分类，全部原样归档到 `openspec/archive/migrated/`
- 旧知识保留可查，新知识走 openspec 正式流程产出结构化 specs
- 支持指定多个源目录：`devkeel migrate docs/ wiki/`

### `devkeel doctor`（可选保留）

检查项目配置健康度：

- .harness/ 目录结构是否完整
- AGENTS.md 是否存在
- 跨平台入口文件是否与 targets 配置一致
- openspec/ 是否已初始化

不再检查 stage 流转状态。

## 6. 设计原则

1. **约定优于配置** — AGENTS.md 用自然语言描述路由，不需要结构化的 capability 映射
2. **工具自治** — openspec 管知识产出流程，omc 管执行编排，harness 不越界
3. **子项目自治** — domain 知识跟着代码走，不集中管理
4. **极简元信息** — config.yml 只放真正需要机器读取的项目元信息
5. **零运行时状态** — 没有 current.yml，没有状态流转，没有运行时路由

## 7. v1 → v2 代码迁移计划

### 7.1 Commands

v1 有 12 个命令，v2 保留 5 个：

| 命令 | 行数 | v2 处置 | 说明 |
|------|------|---------|------|
| `init` | 187 | **重写** | 交互流程全改：极简元信息、openspec/ 直接生成、submodule 领域配置、通用基线包 |
| `doctor` | 229 | **简化** | 去掉 stage/flow 检查，仅检查目录结构、AGENTS.md、跨平台入口、openspec/ |
| `update` | 154 | **重写** | 新增 versions.yml 版本对比 + 增量更新 + 冲突检测 |
| `submodule` | 154 | **保留** | 功能不变，为子模块生成领域配置 |
| `migrate` | — | **新增** | 旧产物搬运到 openspec/archive/migrated/（从 lib/migrate 提升为独立命令） |
| `sync` | 129 | 砍掉 | 无状态可同步 |
| `status` | 104 | 砍掉 | 无 current.yml |
| `resolve` | 105 | 砍掉 | 无 capability 路由 |
| `continue` | 55 | 砍掉 | 无阶段流转 |
| `checkpoint` | 35 | 砍掉 | 无数据点采集 |
| `retro` | 39 | 砍掉 | openspec schema retrospective 覆盖 |
| `artifact` | 105 | 砍掉 | openspec 自身管理产物 |
| `setup` | 213 | 砍掉 | 改为通用 skill（见 7.4） |

### 7.2 Lib

v1 有 14 个库模块，v2 保留 6 个：

| 模块 | 行数 | v2 处置 | 说明 |
|------|------|---------|------|
| `config` | 482 | **大幅简化** | 只解析极简 config.yml + versions.yml，砍掉 stages/flow/capability 解析 |
| `detect` | 89 | **保留** | 检测项目类型、submodule、openspec 目录 |
| `gitignore` | 38 | **保留** | openspec gitignore 管理 |
| `templates` | 59 | **重写** | 模板内容全部替换为 v2（AGENTS.md、config.yml、openspec/ 等） |
| `manifest` | 121 | **重写** | 改为 versions.yml 版本管理（组件版本对比、冲突检测） |
| `migrate` | 181 | **重写** | 简化为旧产物原样搬运到 openspec/archive/migrated/ |
| `merge` | 361 | 砍掉 | stage flow 合并逻辑 |
| `resolve` | 290 | 砍掉 | capability 路由逻辑 |
| `symlink` | 175 | 砍掉 | 不再需要 symlink 分发 |
| `adapter` | 162 | 砍掉 | 跨平台入口由 init 直接生成，不需要适配器 |
| `artifact` | 159 | 砍掉 | openspec 管理 |
| `scenario` | 131 | 砍掉 | 场景路由判断 |
| `retro` | 131 | 砍掉 | |
| `codex-adapter` | 90 | 砍掉 | Codex 直接读 AGENTS.md |

### 7.3 Templates（内置于 CLI npm 包）

| 模板 | 说明 |
|------|------|
| `agents.md` | AGENTS.md 完整 9 section 模板 |
| `config.yml` | 极简 v2 config |
| `versions.yml` | 组件版本清单 |
| `claude.md` | CLAUDE.md（`@AGENTS.md` 引用） |
| `gemini.md` | GEMINI.md（引用 AGENTS.md） |
| `openspec/` | 完整 openspec 目录模板，含 superpowers-bridge schema + 8 个 artifact 模板 |
| `skills/*` | 通用基线 skills（11 个） |
| `agents/*` | 通用基线 agents（code-reviewer） |
| `rules/*` | 通用基线 rules（harness-baseline） |

### 7.4 通用基线包新增

| 资产 | 说明 |
|------|------|
| `skills/setup/` | 安装配置 skill — 检测并安装 openspec、oh-my-claudecode / oh-my-codex、superpowers 等工具，由 AI Agent 执行而非固定脚本 |

### 7.5 代码量预估

- v1：约 3978 行
- v2：预估约 1200–1500 行（砍掉约 60%）
- 净删除模块：16 个文件（7 commands + 8 libs + index.ts 简化）
- 重写模块：6 个文件（3 commands + 3 libs）
- 保留模块：3 个文件（detect、gitignore、submodule）
- 新增模块：1 个文件（commands/migrate）
