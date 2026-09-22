# Install devkeel

> 给项目建立 `.harness/` 作为 AI Agent 的 single source of truth — 编排最合适的工具组合，注入领域规范与技能，持续沉淀项目知识。

本文档面向 Coding Agent。按顺序执行以下步骤，即可完成项目的 DevKeel 初始化。

---

## Step 1: 确认目标 Agent 平台

在执行任何初始化写入前，先确认需要为项目启用哪些 Coding Agent 平台。DevKeel 支持多选：

| Agent 平台 | `--targets` 值 | 主要适配位置 |
|------------|----------------|--------------|
| Claude Code | `claude-code` | `.claude/` |
| Codex CLI | `codex` | `.agents/` |
| Cursor | `cursor` | `.cursor/` |
| GitHub Copilot | `copilot` | `.github/copilot-instructions.md` |
| Gemini CLI | `gemini` | `GEMINI.md` |
| OpenCode | `opencode` | `.opencode/` |

### 检测与确认规则

1. 扫描已有平台配置，将检测结果作为推荐选项。
2. 若能识别当前正在执行本文档的 Agent 平台，也将其加入推荐选项。
3. 向用户展示支持列表、检测结果和推荐选项，询问最终启用哪些平台，允许多选。
4. 将用户确认的值保存为 `<targets>`，供 Step 2 使用。已有目录只用于推荐，不得代替用户确认。

| 信号 | 推荐平台 |
|------|----------|
| 存在 `.claude/` 或 `CLAUDE.md` | `claude-code` |
| 存在 `.agents/` | `codex` |
| 存在 `.cursor/` | `cursor` |
| 存在 `GEMINI.md` | `gemini` |
| 存在 `.github/copilot-instructions.md` | `copilot` |
| 存在 `.opencode/` | `opencode` |

询问示例：

> DevKeel 支持 Claude Code、Codex CLI、Cursor、GitHub Copilot、Gemini CLI 和 OpenCode。
>
> 当前检测到：Codex CLI、Cursor。需要为项目启用哪些平台？可多选。

如果未检测到已有配置，也无法识别当前 Agent 平台，则不预设默认值，直接请用户选择。

---

## Step 2: 安装并初始化

前置条件：Node.js >= 20.19.0

```bash

# 新项目，或用户决定保留已有 AGENTS.md
npx devkeel@latest init --name <name> --targets <targets> -y

# 已有 AGENTS.md 且用户同意改造时，移除 -y 进入确认与合并流程
npx devkeel@latest init --name <name> --targets <targets>
```

### 参数规则

#### --name

Agent 应自动推断项目名称，无法确定时再向用户确认：

1. 读取 `package.json` 的 `name` 字段
2. 回退到当前目录名

#### --targets

使用 Step 1 中经用户确认的平台列表，以逗号分隔。不得仅根据已有目录自动增加或删除目标平台。

### AGENTS.md 改造门禁

执行 init 前，检查当前待初始化仓库是否已有 `AGENTS.md`：

1. 没有 `AGENTS.md`：直接初始化。主仓库生成完整 DevKeel 执行契约；git submodule 生成子仓库领域执行契约。
2. 已有 `AGENTS.md`：先完整读取原文件，识别其中的业务职责、技术约束、命令、规则和验证要求。
3. 向用户说明将使用的模板及合并策略，并询问是否改造。
4. 用户同意：不带 `-y` 执行 init，在 CLI 二次确认后把原内容合并进新模板。
5. 用户拒绝：保留原文件，不得添加 `@AGENTS.md`、覆盖或重排内容。

合并规则：

- 已有 DevKeel 分区标记时，只迁移各用户定制区，避免重复复制旧框架。
- 无法识别为 DevKeel 模板时，完整保留原文，并放入新模板的“项目补充与原有约定”区域。
- `-y` 模式无法取得改造确认，因此一律保留已有 `AGENTS.md` 并输出提示。

### 子模块自动检测

`npx devkeel@latest init` 会自动识别仓库角色，并把结果写入 `.harness/config.yml` 的 `project.repoType`：

| 信号 | 行为 |
|------|------|
| 当前目录不是 git submodule | `repoType: main`，安装通用 skills、commands 和 OpenSpec |
| 当前目录是 git submodule | `repoType: domain`，只建立领域承载层，不复制主仓库通用资产 |
| 主仓库 `.gitmodules` 含条目 | 交互提示选择要配置的子模块；`-y` 模式跳过该交互 |

已有配置显式声明 `repoType` 时优先使用该值；否则由 git submodule 关系自动推断。domain 子仓库只创建配置、领域 AGENTS.md、空的 rules/skills/agents 目录和平台链接，不创建 `.harness/commands/` 或 `openspec/`。

### 示例

```bash
# 单仓库
npx devkeel@latest init --name my-app --targets claude-code,cursor -y

# 含子模块的主仓库（不带 -y，交互选择要配置的子模块）
npx devkeel@latest init --name my-platform --targets claude-code,codex

# 也可进入子模块单独执行；CLI 会自动使用 domain profile
cd packages/my-domain
npx devkeel@latest init --name my-domain --targets claude-code,codex -y
```

---

## Step 2.5: 迁移已有项目

> 如果项目是全新的（无任何 AI 平台目录、无文档目录），跳过此步骤直接到 Step 3。

### 2.5.1 识别需要迁移的旧产物

init 完成后，扫描以下可能存在的旧目录：

**知识层目录（需迁移到 `.harness/`）**：

| 旧目录 | 来源平台 | 可能包含的内容 |
|--------|----------|----------------|
| `.agents/` | Codex CLI | rules、skills、agents、templates、mcp.json |
| `.claude/` | Claude Code | rules、skills、agents、settings.json |
| `.codex/` | Codex（旧版） | instructions、rules |
| `.cursor/` | Cursor | rules |
| `.opencode/` | OpenCode | rules、skills、agents |

**文档目录（需迁移到 `openspec/`）**：

| 旧目录 | 典型内容 |
|--------|----------|
| `docs/` | 设计文档、测试文档、架构分析、计划等 |
| `wiki/` | 项目 wiki 知识库 |
| `knowledge/` | 知识沉淀 |

**判断迁移动作**：

| 状况 | 需要的动作 |
|------|-----------|
| 旧目录内有实际内容（rules、skills 等） | 内容迁移到 `.harness/` 对应子目录 |
| 旧目录被 init 替换为空 symlink | 从 git 恢复后再迁移 |
| 存在文档目录 | `npx devkeel@latest migrate <dir>` 或手动分类迁移到 `openspec/` |
| 原有 `AGENTS.md` | 按 Step 2 的改造门禁读取并询问；同意后合并，拒绝或 `-y` 模式保持原文件不变 |
| 原有 `CLAUDE.md` | 保留项目上下文，并确保平台 bootstrap 正确引用 `AGENTS.md` |

### 2.5.2 迁移知识层目录 → `.harness/`

**问题**：init 会把检测到的平台目录（`.agents/`、`.claude/`、`.cursor/` 等）子目录替换为指向 `.harness/` 的 symlink，但**不会自动复制已有内容**到 `.harness/`。

**通用修复步骤**：

```bash
# 1. 确认哪些旧目录有实际内容（被替换为 symlink 前）
#    如果已被替换，从 git 恢复
git status --short | grep "^ D"  # 查看被删除的旧文件

# 2. 恢复被替换的内容（以 .agents/ 为例）
rm -f .agents/rules .agents/skills .agents/agents  # 删除空 symlink
git checkout HEAD -- .agents/

# 3. 对每个有实际内容的旧目录，将项目特有内容复制到 .harness/
```

**按来源目录分别处理**：

#### `.agents/`（Codex 项目最常见）

```bash
# 复制 rules（直接合并，DevKeel 通用 rules 和项目 rules 可以共存）
cp -r .agents/rules/* .harness/rules/ 2>/dev/null

# 复制项目专属 skills（逐个复制，不覆盖 DevKeel 内置 skills）
for skill in .agents/skills/*/; do
  skill_name=$(basename "$skill")
  if [ ! -d ".harness/skills/$skill_name" ]; then
    cp -r "$skill" .harness/skills/
  fi
done

# 复制 agents 定义
cp -r .agents/agents/* .harness/agents/ 2>/dev/null

# 复制其他资产
cp -r .agents/templates .harness/ 2>/dev/null
cp -r .agents/examples .harness/ 2>/dev/null
cp .agents/mcp.json .harness/ 2>/dev/null
```

#### `.claude/`（Claude Code 项目）

```bash
# .claude/ 可能包含 rules、skills、agents（与 .agents/ 结构相同）
# 也可能包含 settings.json（平台配置，不迁移到 .harness/）
cp -r .claude/rules/* .harness/rules/ 2>/dev/null
cp -r .claude/agents/* .harness/agents/ 2>/dev/null

for skill in .claude/skills/*/; do
  skill_name=$(basename "$skill")
  if [ ! -d ".harness/skills/$skill_name" ]; then
    cp -r "$skill" .harness/skills/
  fi
done

# settings.json / settings.local.json 保留在 .claude/ 中，不迁移
```

#### `.codex/`、`.cursor/`

```bash
# .codex/ 可能有 instructions.md 或 rules/
cp -r .codex/rules/* .harness/rules/ 2>/dev/null
# instructions.md 内容应合并到 AGENTS.md

# .cursor/ 可能有 rules/
cp -r .cursor/rules/* .harness/rules/ 2>/dev/null

```

**最后：重建所有平台目录为 symlink**

```bash
# 清理并重建（init 已处理大部分，但需确认状态正确）
rm -rf .agents && mkdir .agents && cd .agents && \
  ln -s ../.harness/rules rules && \
  ln -s ../.harness/skills skills && \
  ln -s ../.harness/agents agents && cd ..

# .claude/ 和 .cursor/ 通常由 init 正确创建为目录+symlink，验证即可
ls -la .claude/rules  # 应为 symlink -> ../.harness/rules
ls -la .cursor/rules  # 应为 symlink -> ../.harness/rules
```

**注意事项**：
- 主仓库中，devkeel init 生成的通用 skills（`commit`、`brainstorming`、`openspec-*` 等）不要覆盖
- domain 子仓库只迁移该项目专属的 rules、skills 和 agents；不要从主仓库复制通用 skills、commands 或 OpenSpec
- 遇到同名冲突时，项目专属内容优先（合并而非覆盖）
- `.claude/settings.json` 和 `.claude/settings.local.json` 是平台配置，不迁移到 `.harness/`，但是要保留在原目录

### 2.5.3 迁移文档目录 → `openspec/`

**适用的源目录**：`docs/`、`wiki/`、`knowledge/` 或任何自定义文档目录。

**方式 A：使用 CLI 批量迁移（推荐）**

```bash
# 支持多个源目录
npx devkeel@latest migrate docs wiki knowledge
```

这会将指定目录整体移动到 `openspec/archive/<dir-name>/`。

**方式 B：手动按语义分类迁移**

根据文档性质分类放置：

| 文档类型 | 目标位置 | 判断标准 |
|----------|----------|----------|
| 测试用例 | `openspec/tests/` | 测试设计、用例矩阵、测试报告 |
| 有效规格 | `openspec/specs/` | 仍在被引用的设计文档、API 文档、流程文档 |
| 历史归档 | `openspec/archive/` | 已完成的计划、旧版本分析、过期文档 |

分类原则：
- **`openspec/specs/`** — 仍然有效、会被引用的规格文档（设计文档、API、业务流程、接入文档）
- **`openspec/tests/`** — 测试用例
- **`openspec/changes/`** — 进行中的变更（由 openspec 工作流产生，不要手动放文件）
- **`openspec/archive/`** — 历史归档，不再活跃但保留参考价值

```bash
# 示例：手动迁移
mkdir -p openspec/specs openspec/tests openspec/archive openspec/changes

# 测试文档
mv docs/测试文档/* openspec/tests/ 2>/dev/null
mv docs/test* openspec/tests/ 2>/dev/null

# 有效设计文档
mv docs/设计文档 openspec/specs/design 2>/dev/null
mv docs/接入文档 openspec/specs/ 2>/dev/null
mv docs/业务流程 openspec/specs/ 2>/dev/null

# 历史归档
mv docs/plans openspec/archive/plans 2>/dev/null
mv docs/v1* docs/v2* openspec/archive/ 2>/dev/null

# wiki 内容
mv wiki/* openspec/archive/wiki/ 2>/dev/null

# 确认无遗漏后删除空目录
rmdir docs wiki 2>/dev/null
```

### 2.5.4 合并 AGENTS.md / CLAUDE.md

init 会在改造前读取并询问用户；只有用户同意才合并。主仓库使用完整执行契约模板，子仓库使用领域执行契约模板。

**AGENTS.md 合并要点**：
1. 主仓库保留全局执行基线、任务分流、OpenSpec 路由和子仓库索引。
2. 子仓库重点保留业务职责、技术栈、模块边界、领域 Rules/Skills 路由和本地验证命令，不重复完整 DevKeel 路由。
3. 将所有 `.agents/rules/`、`.claude/rules/` 的引用路径统一为 `.harness/rules/`（或保留旧路径，因为 symlink 兼容）。
4. 主仓库文档引用更新为 `openspec/`；子仓库说明 OpenSpec change 和知识产出统一归属主仓库。
5. 原文件内容必须进入相应 `<!-- harness:user:* -->` 定制区，不得静默丢弃。

**CLAUDE.md 合并要点**：
1. 确保首行是 `@AGENTS.md`
2. 保留项目概览、技术栈、常用命令等上下文信息
3. 将文档和规则路径引用更新为新结构

---

## Step 3: 验证

```bash
npx devkeel@latest doctor
```

所有检查项应通过。如有失败，执行 `npx devkeel@latest doctor --fix` 自动修复。

> main 仓库会检查 OpenSpec、commands 和子模块路由；domain 子仓库只检查领域承载层，不要求存在这些主仓库资产。OpenSpec 已作为 DevKeel 的依赖内置，无需单独安装。

### 常见 doctor 问题与修复

| 问题 | 原因 | 修复 |
|------|------|------|
| `.harness/rules/` 目录为空 | 迁移时未复制项目 rules | 从 git 恢复并复制 |
| symlink 断裂 | 目标目录不存在 | 确保 `.harness/` 下对应目录存在 |
| `CLAUDE.md` 缺少 `@AGENTS.md` 引用 | init 未正确写入或被覆盖 | 手动在首行添加 `@AGENTS.md` |
| submodule 未配置 | 未运行 `npx devkeel@latest submodule add` | 执行提示的命令（可选） |

---

## Step 4: 定制项目信息

init 只生成框架，需要补充项目特有信息才能让 Agent 真正有效工作。

### 4.1 编辑根仓库 AGENTS.md 第 9 节

找到 `<!-- harness:user:project -->` 标记，在其中补充：

```markdown
## 9. 项目补充

<!-- harness:user:project -->

### 命令

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm test` | 运行测试 |
| `pnpm lint` | 代码检查 |
| `pnpm build` | 构建产物 |

### 架构

简述项目目录结构和关键模块职责（从实际代码推断）。

### 约束

- 项目特有的技术约束
- 团队规范
- 外部依赖说明

<!-- /harness:user:project -->
```

Agent 应从 `package.json` scripts、项目目录结构、README 等现有信息自动推断填充。

### 4.2 编辑子仓库 AGENTS.md 领域区

子仓库使用 `agents-domain-md.md`，应重点补充：

- `harness:user:domain`：业务职责、技术栈、模块边界和上下游关系
- `harness:user:routing`：任务信号到领域 Rules/Skills 的触发矩阵
- `harness:user:verification`：开发、构建、测试、lint 命令和 Definition of Done
- `harness:user:project`：原项目 AGENTS.md 中迁移保留的业务约定

子仓库不复制完整的 Direct/Lite/Full 和 OpenSpec 路由；这些由主仓库 AGENTS.md 统一负责。

### 4.3 编辑 CLAUDE.md

默认内容为 `@AGENTS.md` + 项目标题。建议补充为：

```markdown
@AGENTS.md

# 项目名称

项目一句话描述。

## Commands

常用命令表（与 AGENTS.md 第 9 节一致）。

## Architecture

关键目录和模块说明。

## Tech Stack

技术栈列表。
```

---

## Step 5: 提交到 Git

以下命令适用于 main 仓库：

```bash
git add .harness/ AGENTS.md openspec/ .gitignore
# 查看并提交本次实际生成的平台入口文件和链接目录
git status --short
```

根据所选平台，将实际存在的 `CLAUDE.md`、`GEMINI.md`、`.agents/`、`.claude/`、`.cursor/`、`.opencode/` 以及旧 `docs/` 的删除等变更一并 add，然后提交：

```bash
git commit -m "chore(devkeel): 初始化 DevKeel 知识框架"
```

domain 子仓库只提交自己的 `.harness/config.yml`、`.harness/versions.yml`、领域 AGENTS.md、项目专属 rules/skills/agents 和平台链接，不应提交通用 commands 或 `openspec/`。

**迁移项目的提交策略**：
- 如果是从已有 `.agents/` 迁移，建议单个 commit 包含所有迁移变更
- commit message 建议：`chore(devkeel): 迁移至 DevKeel V2 + openspec 结构`

---

## Step 6: 确认 OpenSpec 可用

本步骤只在 main 仓库执行。domain 子仓库的变更管理统一使用 main 仓库的 OpenSpec。

OpenSpec 已内置为 DevKeel 依赖，验证调用正常：

```bash
npx devkeel@latest openspec list
```

> 若该命令正常输出，说明 OpenSpec 工具链已就绪。后续变更管理（`/opsx:*` 系列 skill）依赖此能力。

OpenSpec 不是每个任务的必经步骤。Agent 会按最小必要流程选择：

- **Direct**：当前会话可以完成调查、实现和验证，不创建 change
- **Lite**：需要跨会话恢复或轻量协作，主链为 `brainstorm → tasks → apply → 快速归档`
- **Full**：用户显式选择，或外部消费者、可观察契约变化、协调成本三项风险同时成立并经用户确认后启用

`/opsx:new` 会创建 change 并进入一次一题的 Living brainstorm；`/opsx:continue` 在确认前继续访谈、确认后每次投影一个 artifact；只有用户显式调用 `/opsx:ff` 才会快速投影全部 Apply 前置 artifacts，而且不会替用户确认设计。入口默认使用 `lite`，也可以显式指定 `full`。Direct / Lite 默认不强制 worktree、subagent、TDD、独立 code review 或自动 commit；这些能力由 full schema、实际风险或用户显式要求按需启用。

---

## Step 7: 子仓库初始化

> 仅当项目含 git submodules（`.gitmodules` 有条目）时执行。单仓库项目跳过本步，直接到 Step 8。

**核心原则：主仓库框架全部就绪后，再处理子仓库。** 子仓库使用 `repoType: domain`，只承载业务、技术、验证约束和项目专属能力。通用 skills、commands 与 OpenSpec 由主仓库统一提供。

### 7.1 为每个业务子模块执行 init

```bash
# 获取子模块列表
git submodule status
```

推荐在主仓库执行不带 `-y` 的 init，并在交互列表中选择业务子模块。CLI 会为所选子模块写入 domain 配置、领域 AGENTS.md、空的 rules/skills/agents 目录和平台链接。

如果主仓库 init 使用了 `-y`，或只需补一个子模块，也可以进入子模块单独执行：

```bash
cd <submodule-path>
npx devkeel@latest init --name <submodule-name> --targets <targets> -y
# ... 执行 Step 2.5 迁移（如有旧产物）...
# ... 执行 Step 4 定制 AGENTS.md / CLAUDE.md ...
git add . && git commit -m "chore(devkeel): 子模块初始化"
cd ..
```

如果子仓库已有 `AGENTS.md`，先读取并按 Step 2 的改造门禁询问用户：同意改造时移除 `-y`，让 CLI 使用领域模板合并原内容；拒绝时保留原文件并继续初始化其他资产。

初始化后的子仓库边界应为：

```text
<submodule>/
├── .harness/
│   ├── config.yml             # project.repoType: domain
│   ├── versions.yml           # 只跟踪 harness core；资产版本表为空
│   ├── rules/                 # 仅项目领域 rules
│   ├── skills/                # 仅项目领域 skills
│   └── agents/                # 仅项目领域 agents
├── AGENTS.md                  # 领域执行契约
└── 无 .harness/commands/、无 openspec/
```

`domain-init`、`verify-init`、`commit` 和 `openspec-*` 等通用 skill 保留在主仓库。需要为子仓库生成领域资产时，从主仓库会话调用这些共享 skill，并把工作目录/目标指定到子仓库；不要把 skill 本体复制进子仓库。

### 7.2 提交子模块指针

```bash
# 回到仓库根目录，更新子模块指针
git add <submodule-paths>
git commit -m "chore(devkeel): 子模块完成 DevKeel 初始化"
```

---

## Step 8: 领域能力生成

> 询问用户：是否执行 `/domain-init` 对项目进行深度扫描，自动生成项目专属的 rules、skills 和 agents？

**推荐执行的场景：**
- 项目已有一定规模（非空项目）
- 希望 Agent 深度理解项目编码规范和架构模式

**可跳过的场景：**
- 全新空项目，还没有代码
- 只需要基础框架，后续再逐步补充
- 迁移项目已有完善的 rules（Step 2.5 已迁移）

如果用户同意，执行流程：

### 8.1 主仓库

在仓库根目录执行：

```
/domain-init
```

domain-init 会扫描项目代码，识别技术栈、框架版本、测试/构建/lint 工具链，自动生成：
- `.harness/rules/` — 从代码中提取的编码规范
- `.harness/skills/` — 项目专属能力
- `.harness/agents/` — 专属 Agent 定义

### 8.2 子仓库（如有）

在主仓库会话调用共享的 `/domain-init`，将扫描目标指定为对应子仓库。生成的项目专属 rules、skills 和 agents 写入子仓库 `.harness/`，但 `/domain-init` skill 本体仍只保留在主仓库。

### 8.3 提交领域产出

```bash
git add .harness/
git add <submodule-paths>  # 子模块内的 .harness/ 变更
git commit -m "chore(devkeel): 生成领域能力规范"
```

---

## Step 9: 测试基建初始化

> 询问用户：是否执行 `/verify-init` 搭建标准化测试基建，让 Agent 能自主验证代码输出？

**推荐执行的场景：**
- 项目已有一定规模，需要单元/e2e/API 测试框架
- 接手的项目已有部分测试框架，需要增量补齐缺失类型
- 希望 Agent 具备「自主验证代码输出」能力（配套生成验证 agent）

**可跳过的场景：**
- 全新空项目，还没有被测代码
- 已有完善的测试框架和验证闭环
- 只需要写测试用例文档（直接用 `test-case-designer`）

如果用户同意，执行流程：

### 9.1 主仓库

在仓库根目录执行：

```
/verify-init
```

verify-init 会扫描项目领域与技术栈、自动检测已有测试框架，增量补齐缺失的测试基建，并生成：
- 项目根 — 测试框架安装 + 配置 + 示例 + scripts（如 `vitest.config.ts`、`tests/example.test.ts`、`test` 脚本）
- `.harness/rules/testing.md` — 通用结构化 testing 规范（测试金字塔、命名、覆盖率、执行约定）
- `.harness/agents/test-verifier.md` — 验证执行 agent，变更驱动验证闭环的执行端

**流程：**
1. 检测已有框架 → 输出就绪清单（✅ 已就绪 / ➕ 待补齐）
2. 用户勾选要补齐的框架（门禁，补齐前需同意）
3. 定位官方文档 → 产出 install/config/example/scripts（幂等，已存在不覆盖）
4. 生成 testing 规范 + 验证 agent

**与 domain-init / test-case-designer 的关系：**
- `domain-init` R4 — 扫描真实代码生成项目特定软规范（mock 策略、覆盖模式）
- `verify-init`（本步）— 搭建可执行测试基建：框架选型 + 安装 + 通用结构化规范 + 验证 agent
- `test-case-designer` — 从需求/spec 产出测试点 + 用例文档
- 验证 agent — 变更驱动验证闭环的执行端

### 9.2 子仓库（如有）

在主仓库会话调用共享的 `/verify-init`，将扫描和脚手架目标指定为对应子仓库，流程与 Step 8.2 相同。测试规范和验证 agent 属于该领域时写入子仓库；通用 `/verify-init` skill 不复制。

### 9.3 验证并提交

```bash
# 运行最接近的验证命令确认脚手架可用（如 pnpm test）
pnpm test

# 提交测试基建产出
git add .harness/rules/testing.md .harness/agents/test-verifier.md
git add <测试配置/示例文件>  # 如 vitest.config.ts tests/ 等
git commit -m "chore(devkeel): 初始化测试基建与验证 agent"
```

---

## 附录 A: 迁移速查表

| 场景 | 命令 / 动作 |
|------|-------------|
| 项目已有 `.agents/rules/` | Step 2.5.2：恢复 → 复制到 `.harness/rules/` → 重建 symlink |
| 项目已有 `.claude/rules/` 或 `.claude/skills/` | Step 2.5.2：同上，按 `.claude/` 小节处理 |
| 项目已有 `.codex/` | Step 2.5.2：提取 rules/instructions 合并到 `.harness/` |
| 项目已有 `docs/` | Step 2.5.3：`npx devkeel@latest migrate docs` 或手动分类 |
| 项目已有 `wiki/` | Step 2.5.3：`npx devkeel@latest migrate wiki` 或手动归档到 `openspec/archive/wiki/` |
| `.claude` / `.cursor` 原来是 symlink 到 `.agents` | init 会覆盖为目录 + 内部 symlink，如内容丢失需从 git 恢复 |
| `.mcp.json` 原来在 `.agents/` 下 | 复制到 `.harness/mcp.json`，根目录创建 symlink |
| init 后 `npx devkeel@latest doctor` 报 symlink 断裂 | 确保 `.harness/` 下目标目录存在 |
| init 后 `.agents/rules/` 为空 | 需要手动完成 Step 2.5.2 |
| 业务子模块需要各自 init | Step 7：交互选择子模块，或进入子模块执行 init；自动使用 `repoType: domain` |
| 子模块出现 `commit`、`openspec-*` 等通用 skills | 删除这些主仓库模板副本，只保留项目专属 rules/skills/agents，并确认 `repoType: domain` |
| 多个旧目录有重复 rules | 合并时去重，优先保留内容最完整的版本 |
| `.harness/` 或 `openspec/` 本身是 submodule | 附录 C：在 submodule 内部提交，仓库根目录更新指针 |

## 附录 B: 最终目录结构参考

```
project/
├── .harness/                  # 知识层主目录（git tracked）
│   ├── config.yml
│   ├── versions.yml
│   ├── rules/                 # 编码规范
│   ├── skills/                # 通用 + 项目专属 skills
│   ├── agents/                # Agent 定义
│   ├── commands/              # 命令定义（如 opsx）
│   ├── templates/             # 模板文件
│   └── mcp.json               # MCP 配置
├── .agents/                   # Codex 兼容层（symlinks）
│   ├── rules -> ../.harness/rules
│   ├── skills -> ../.harness/skills
│   └── agents -> ../.harness/agents
├── .claude/                   # Claude Code 兼容层（symlinks）
│   ├── rules -> ../.harness/rules
│   ├── skills -> ../.harness/skills
│   └── agents -> ../.harness/agents
├── .cursor/                   # Cursor 兼容层（symlink）
│   └── rules -> ../.harness/rules
├── .opencode/                 # OpenCode 兼容层（symlinks）
│   ├── rules -> ../.harness/rules
│   ├── skills -> ../.harness/skills
│   └── agents -> ../.harness/agents
├── .mcp.json -> .harness/mcp.json
├── openspec/                  # 文档层
│   ├── specs/                 # 有效规格文档
│   ├── tests/                 # 测试用例
│   ├── changes/               # 进行中的变更
│   └── archive/               # 历史归档
├── AGENTS.md                  # 执行契约
├── CLAUDE.md                  # Claude Code bootstrap
└── GEMINI.md                  # Gemini CLI bootstrap（如需要）

submodule/                     # domain profile
├── .harness/
│   ├── config.yml             # project.repoType: domain
│   ├── versions.yml           # core only
│   ├── rules/                 # 项目领域资产
│   ├── skills/                # 项目领域资产
│   └── agents/                # 项目领域资产
├── AGENTS.md                  # 领域执行契约
└── CLAUDE.md                  # 平台 bootstrap（如需要）
```

---

## 附录 C: 高级配置 — 知识层作为 submodule

> 非默认配置。仅当需要跨仓库共享 `.harness/` 或 `openspec/` 时阅读。

`.harness/` 和 `openspec/` 可被配置为独立 git submodule（便于跨仓库共享知识层）：

```gitmodules
[submodule ".harness"]
    path = .harness
    url = git@gitlab.example.com:team/project-harness.git
    branch = harness-v2

[submodule "openspec"]
    path = openspec
    url = git@gitlab.example.com:team/project-openspec.git
    branch = openspec-v2
```

### ⚠️ 核心风险：init 覆盖 submodule 目录

如果 `.harness/` 或 `openspec/` 已是 submodule，`npx devkeel@latest init` 可能写入新文件、覆盖已有 `config.yml`/`versions.yml`、破坏 submodule git 状态。init 前必须检查：

```bash
git submodule status | grep -E "\.harness|openspec"
git submodule update --init .harness openspec
cd .harness && git status && cd ..
cd openspec && git status && cd ..
```

### 迁移注意事项

1. **先 init 子模块再迁移内容**：确保 submodule 已 clone 并切到正确分支
   ```bash
   git submodule update --init .harness openspec
   ```
2. **在 submodule 内部提交**：迁移到 `.harness/` 或 `openspec/` 的内容在对应 submodule 内部 commit + push，而非仓库根目录
   ```bash
   cd .harness && git add . && git commit -m "chore: 迁移项目知识" && git push && cd ..
   cd openspec && git add . && git commit -m "chore: 迁移项目文档" && git push && cd ..
   ```
3. **仓库根目录更新 submodule 指针**：子模块提交后，仓库根目录更新指针
   ```bash
   git add .harness openspec
   git commit -m "chore: 更新 .harness/openspec 子模块指针"
   ```
4. **避免在仓库根目录直接修改 submodule 内容**：所有对 `.harness/` 和 `openspec/` 的修改都在对应子模块工作目录内进行

### init 已覆盖 submodule 的恢复

```bash
cd .harness && git status
# 方式 A：覆盖内容是想要的（首次初始化），直接提交
git add . && git commit -m "chore: devkeel init" && git push
# 方式 B：覆盖了不该覆盖的内容，恢复
git checkout -- .
```

### 已有 `.agents` 是 symlink 到 submodule

某些项目已有 `.claude -> .agents` 或 `.agents -> some-submodule` 的 symlink 结构。init 时需要：

1. 先记录原始 symlink 指向
2. init 会覆盖 symlink，如果内容丢失需要从 submodule 恢复
3. 确认最终 `.agents/` 的 symlink 指向 `.harness/` 而非旧路径

---

## 完成

至此项目已具备完整的 AI 协作基础设施。Agent 打开项目时会自动读取 AGENTS.md 执行契约和 `.harness/` 下的知识资产。
