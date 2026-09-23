# DevKeel 项目接入指南

本文面向 Coding Agent：为现有项目建立统一执行入口，按需生成项目知识与专属能力，接上可执行反馈。
终端命令负责安装和检查，`domain-init`、`verify-init` 是在 Agent 会话中调用的 Skills。

## 执行范围

- 先读取当前作用域的 `AGENTS.md` 和已有项目文档，确认目标目录、平台与本次写入范围。
- 复用用户在当前会话中已给出的同范围授权；新增平台、子项目或测试基建时，只确认新增部分。
- 已有文件和未提交改动需要保留。先检查冲突再写入，不能用删除整个平台目录或恢复整个 Git 目录的方式接入。
- 初始化不包含自动提交、推送或发布。只有用户明确选择这些动作后才执行。
- 命令失败时保留输出并定位原因；缺少网络、权限或依赖时说明未完成项，不宣称接入成功。

## 1. 确认项目与平台

需要 Node.js >= 20.19.0。项目名称优先读取 `package.json` 的 `name`，否则使用当前目录名。
先查看 Git 状态、子模块和已有入口；检查目录是否为 symlink，避免把共享目标当成本地副本改写。

| 平台 | `--targets` 值 | CLI 检测线索 |
|------|----------------|-------------|
| Claude Code | `claude-code` | `.claude/` |
| Codex CLI | `codex` | `.agents/` 或 `.codex/` |
| Cursor | `cursor` | `.cursor/` |
| GitHub Copilot | `copilot` | `.github/copilot-instructions.md` |
| Gemini CLI | `gemini` | `GEMINI.md` |
| OpenCode | `opencode` | `.opencode/` |

当前 Agent 平台和已有 `CLAUDE.md` 可作为额外推荐线索。向用户展示建议平台；
已有明确选择则直接复用，否则确认后将逗号分隔的值用于 `<targets>`。未发现线索时不预设平台。

CLI 从 Git 子模块关系和 `AGENTS.md` 顶部的 `<!-- harness:domain-agents -->` 标记识别领域子仓库，
其余按主仓库处理。不需要项目类型、平台注册表或 `.harness/config.yml`；旧配置被忽略且不会被改写。

主仓库提供通用 Skills、commands 和 OpenSpec。子仓库维护自己的 docs 与项目专属能力，
初始化时只建立领域执行契约、版本记录、能力目录和平台入口，不复制主仓库通用资产。

## 2. 安装并初始化

DevKeel 发布在公共 npm，可直接运行：

```bash
# 无 AGENTS.md，或用户选择保留已有 AGENTS.md
npx devkeel@latest init --name <name> --targets <targets> -y

# 需要合并已有 AGENTS.md，或交互选择业务子模块
npx devkeel@latest init --name <name> --targets <targets>
```

`<name>`、`<targets>` 是占位符，执行前替换。遵循用户已有 npm 配置；
若当前 registry 无法访问公共包，可在本次命令中显式指定公共 registry，不修改全局配置。

### 已有 AGENTS.md

初始化前完整读取原文件，说明模板与合并范围。用户同意改造时，不带 `-y` 执行，
在 CLI 交互中确认；已有同范围授权无需在对话中重复询问。

- 已有可识别的 DevKeel 分区：保留用户定制区，更新框架内容。
- 其他已有内容：由 CLI 合并保留，不静默丢弃。
- 用户拒绝或使用 `-y`：保留原文件；如仍缺少新入口，在完成报告中说明。

`CLAUDE.md` 的分发模板仅引用 `@AGENTS.md`，已有用户内容保留。
项目背景和命令说明写入 docs，再由 `AGENTS.md` 引用；不另外生成一套平台专属项目文档。

### 技能入口冲突

Codex / Claude Code 的 skills 入口冲突时，CLI 默认保留原件并停止。
先检查原目录或链接的内容，向用户说明要合并的资产和替换范围。
确认替换后，可在原命令上加 `--force`，或对已初始化的项目执行：

```bash
npx devkeel@latest sync --targets <targets> --force
```

CLI 会先备份冲突的技能入口，再建立链接，并输出备份位置。
`.harness/skills-backups/` 中的 `restore.json` 记录原入口路径；`.harness/skills-state.json`
记录受管链接。这些是本地状态，不是待提交的项目知识。

备份不等于内容已经合并：原入口中的自定义技能仍需检查后合并进 `.harness/skills/`。
同名技能逐项比较，不覆盖用户内容。无法判断归属时保留备份并报告待处理项。
`--force` 的入口备份范围是 Codex / Claude skills，不是整个平台目录或所有项目文件。

## 3. 整理已有资产

初始化保留的已有目录可能仍包含独立资产。只处理本次确认的平台和项目：

| 内容 | 处理方式 |
|------|----------|
| 项目背景、架构、开发与验证说明 | 在所属项目 docs 中维护；复用已有文件和链接 |
| 平台目录中的项目 rules / skills / agents | 比较同主题内容，合并到 `.harness/` 对应目录 |
| 平台设置、MCP 配置、凭据与其他用户文件 | 保留原位置；不作为通用知识迁移 |
| 当前能力规范 | 维护在主仓库 `openspec/specs/` |
| 单次任务讨论、方案、任务与验证记录 | 维护在主仓库 `openspec/changes/` |
| 已完成的历史任务资料 | 仅在确认归档范围后复制归档，核对结果并保留来源 |

`docs/` 是当前项目知识的位置，不应为安装 DevKeel 整体搬走或删除。
已有 wiki 等知识目录先建立读取入口，按确认范围逐步整理。

CLI 保留的既有 rules / agents 目录不一定已成为受管链接。完成内容合并后，再处理具体入口，
保留原目录作为备份，并运行 `sync --targets <targets>`。不要直接删除整个 `.agents/`、`.claude/`
或其他平台目录，也不要通过 `git checkout` 丢弃未提交内容。

## 4. 检查入口

```bash
npx devkeel@latest doctor
```

根据实际结果处理问题：

| 问题 | 处理 |
|------|------|
| 缺失受管链接 | 保留现有文件，尝试 `doctor --fix` |
| 同名 skills 目录或错误链接 | 按第 2 节检查、确认并备份处理，不反复运行 `doctor --fix` |
| 整个平台入口已删除 | 用 `sync --targets <targets>` 重新建立 |
| rules / agents 目录缺失 | 核对资产来源；可先建立空目录，再按需生成领域内容，不编造通用规则填充 |
| CLAUDE.md 缺少引用 | 保留已有内容，补齐已授权的 `@AGENTS.md` 入口 |
| 子模块未接入 | 按第 5 节在 init 中选择或进入该子模块初始化 |

`doctor` 检查静态资产和配置，不会证明业务测试通过，也不会自动完成领域扫描。
主仓库还应确认内置 OpenSpec 可用：

```bash
npx devkeel@latest openspec list
```

OpenSpec 已内置，无需单独安装。检查失败时报告具体缺口；子仓库不创建自己的 OpenSpec。

## 5. 子项目接入（按需）

根项目与子项目使用相同的知识分类，分别维护自己的 docs、约束、能力和验证说明。
Git 子模块可以在主仓库交互式 `init` 中选择；`-y` 跳过该选择。
也可以在明确的业务子模块目录执行：

```bash
npx devkeel@latest init --name <submodule-name> --targets <targets>
npx devkeel@latest doctor
```

空子模块先确认需要拉取的范围，再初始化 Git 子模块。只为已授权的业务子项目接入，
不递归改写所有子目录。普通子项目的知识生成也需指定目标，不能把主包技术栈套到所有子项目。

通用 `domain-init`、`verify-init` 与 OpenSpec Skills 留在主仓库；从主仓库会话调用，
将扫描和写入目标指向子项目。代码修改与测试在子项目目录执行，任务过程在主仓库 OpenSpec 协调。
子仓库独立检出时可由已有领域 AGENTS 标记识别；无法定位主仓库时先确认任务文档位置。

### 已有共享知识子模块或平台根目录链接

如果 `.harness/`、`openspec/` 自身是 Git 子模块，或平台根目录链接到其他仓库，
先检查链接目标、子模块状态和未提交内容，说明实际写入的仓库与范围。
确认前不把它当成普通本地目录覆盖，也不自动将 `.agents/` 整体重指向 `.harness/`。

需要恢复时，以当前 diff 和具体备份为依据逐项恢复，保留与本次接入无关的改动。
用户选择提交时，在实际所属仓库提交，再更新父仓库的子模块指针；推送仍需明确授权。

## 6. 生成项目知识与专属能力（按需）

已有代码的项目可调用 `domain-init`。先说明扫描目标与产出范围，用户选择后按 Skill 流程执行；
空项目或本轮只建立入口时可暂缓。

| Agent | 调用方式 |
|-------|----------|
| Claude Code | `/domain-init` |
| Codex | `$domain-init` |
| 其他平台 | 使用当前平台的 Skill 入口调用 `domain-init` |

Skill 从真实代码、配置和已确认约定提取事实，经用户 Review 后分类维护：

- 当前项目 `docs/`：背景、架构、开发、验证与必要解释。
- `.harness/rules/`：简短执行约束；观察到的惯例不自动成为硬要求。
- `.harness/skills/`、`.harness/agents/`：项目专属方法与专业角色。
- `AGENTS.md`：维护路由和实际存在的文档读取入口。

已有同主题内容合并增强，不机械创建重复文档。根项目维护自身和跨项目知识，
子项目维护所属领域知识，专属能力由实际技术栈与代码决定。

## 7. 补齐验证反馈（按需）

需要建立或补齐测试能力时调用 `verify-init`；已有完整反馈的项目无需重复安装框架。
Claude Code 使用 `/verify-init`，Codex 使用 `$verify-init`，其他平台使用对应 Skill 入口。

按 Skill 流程执行：

1. 检测实际依赖、配置、scripts、锁文件与 CI，核对已有框架是否可用。
2. 列出缺口，由用户确认本轮补齐项后再安装或写配置。
3. 按框架官方文档增量补齐配置、示例与脚本，依赖写入实际所属项目。
4. 在项目 docs 维护测试说明，复用已有测试规则和验证角色，由 AGENTS 建立读取入口。
5. 运行最接近的验证，记录命令、工作目录、结果与未覆盖部分。

`domain-init` 与 `verify-init` 共用同一套测试文档和规则。已有 `testing-strategy.md` 等文件继续复用，
不另建一份固定名称的 `testing.md`，也不套用未经确认的覆盖率门槛。
`test-case-designer` 负责用例设计，验证 Agent 执行已有验证并报告覆盖缺口。

不能获取框架官方依据时，不凭记忆安装或生成配置；仅维护有本地证据的知识并报告未完成项。

## 8. 开始日常协作

描述任务后，Agent 默认从最轻的充分路径开始：

| 路径 | 场景 |
|------|------|
| 专项 Skill | 审查、调试、测试设计、提交等明确操作 |
| Direct | 当前会话可完成调查、方案对齐、实施与验证 |
| Lite | 需要跨会话恢复、交接或审计，确认后用 OpenSpec 保存共同设计与任务 |
| Full | 用户选择，或外部契约协调、严重且难回退的风险成立，经确认后使用完整编排 |

OpenSpec 用于需要持久化的协作。`/opsx:new` 默认创建 Lite，`/opsx:continue` 继续讨论或逐步生成产物，
`/opsx:ff` 是用户显式选择的快速入口，仍需确认关键设计。具体流程加载已安装的 Skill 与 schema，
不在安装时创建示范 change。

开发先调查并对齐方案，已有同范围确认直接复用。工作树、子代理、TDD 与独立审查按风险和任务要求使用。
归档不自动授权提交、推送或 PR。

## 完成报告

结束前检查改动和相关链接，再报告：

- 已接入的项目、平台与实际写入路径。
- 原内容的保留、合并和备份位置，仍待处理的冲突。
- doctor / OpenSpec 检查结果；实际执行的业务验证另列，不用静态检查替代。
- domain-init / verify-init 已完成、跳过或待确认的部分。
- 平台会话中的 Skills 是否可发现；必要时重开会话验证，不能仅凭链接存在宣称可用。

仅在用户明确选择后提交或推送；按实际文件选择范围，排除本地备份、状态文件和无关改动。

## 更新与维护

```bash
# 查看模板更新计划
npx devkeel@latest update --dry-run

# 使用最新 CLI 执行项目模板更新
npx devkeel@latest update
```

CLI 与模板独立发布。`devkeel update` 也会获取模板，但不会升级全局 CLI。
全局 CLI 可通过 `npm install -g devkeel@latest --registry=https://registry.npmjs.org/` 单独升级。

普通更新中，“全部更新”会覆盖待更新组件的本地修改；需要逐项跳过时选择“逐个确认”。
`update --force` 强制覆盖受管组件，退役的受管 Skill 目录及其中自定义内容可能被删除。
更新前检查计划和本地改动；技能入口冲突仍按第 2 节通过 sync 的备份流程处理。

当前知识维护在所属项目 docs，能力在 `.harness/`，任务过程在主仓库 OpenSpec。
安装指南不替代各项目 AGENTS、Skill 与 schema 中的执行约束。
