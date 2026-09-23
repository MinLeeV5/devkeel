# DevKeel

让现有项目成为 AI Agent **能读懂、会执行、可验证**的工程环境。

DevKeel 将项目知识、专业能力与验证方式沉淀进仓库：通过统一入口帮助 Agent 理解项目，
依据真实代码生成项目专属能力，并按任务需要选择 Direct、Lite 或 Full 路径。
CLI 负责初始化、平台适配、检查与更新。

## 解决什么问题

- **项目背景反复解释**：把架构、术语、开发方式与验证说明维护在项目文档中，让 Agent 按任务读取。
- **通用规范与实际代码脱节**：从项目现状提取规则、Skills 和专业角色，复用已有约定并增量补齐缺口。
- **任务大小与流程成本不匹配**：当前会话能完成的任务走 Direct，需要协作记忆或风险治理时再进入 Lite / Full。
- **完成声明缺少证据**：连接测试、类型检查、构建和运行反馈，用可观察结果判断是否完成。

这些资产保存在仓库中，可随代码版本管理，并通过平台入口供不同 Coding Agent 使用。

## 快速开始

需要 **Node.js >= 20.19.0**。在项目根目录执行：

```bash
npx devkeel@latest init
npx devkeel@latest doctor
```

`init` 会询问项目名称和目标平台；检测到 Git 子模块时，可选择为哪些子模块初始化。
已有 `AGENTS.md` 会在确认后合并原内容。初始化建立协作入口，项目知识与验证能力继续按需补齐。

也可以把下面的提示交给 Coding Agent，按[安装指南](web/public/install.md)完成接入：

```text
按照 https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md 完成项目初始化
```

接下来在 Agent 会话中调用 Skills：

| 阶段 | 入口 | 结果 |
|------|------|------|
| 建立入口 | 终端运行 `devkeel init` | 执行契约、通用工作流、平台链接与主仓库 OpenSpec 骨架 |
| 检查资产 | 终端运行 `devkeel doctor` | 检查目录、技能包、平台入口和相关配置 |
| 理解项目 | Agent 调用 `domain-init` | 根据真实代码维护项目 docs、规则、Skills 和专业角色 |
| 补齐反馈 | Agent 按需调用 `verify-init` | 复用已有测试框架，补齐确认的配置、示例、脚本与验证说明 |

Claude Code 可使用 `/domain-init`、`/verify-init`；Codex 可使用 `$domain-init`、`$verify-init`。
它们是 Agent Skills，不是终端子命令。生成内容和测试基建缺口按对应 Skill 的流程确认后写入。
空项目或已有完整能力的项目可暂缓这些步骤。

偏好全局安装时：

```bash
npm install -g devkeel --registry=https://registry.npmjs.org/
devkeel init
devkeel doctor
```

CLI 与 `devkeel-templates` 均发布在公共 npm；初始化和更新会下载模板包。
DevKeel 不采集或上报使用数据，内置 OpenSpec 调用也关闭了遥测。

## 项目知识与专属能力

`domain-init` 扫描技术栈、代码结构、领域术语和团队惯例，基于证据生成或增强项目资产：

- `docs/`：项目背景、架构、开发与验证说明。
- `.harness/rules/`：简短、可执行的约束。
- `.harness/skills/`、`.harness/agents/`：专项方法与专业角色。
- `AGENTS.md`：维护执行入口、任务路由与文档读取条件。

已有同主题内容增量合并，扫描发现的惯例需经确认才能成为约束。
领域能力根据当前项目的技术栈与代码生成。

`verify-init` 检测已有测试基础，只补齐确认的缺口。它与 `domain-init` 维护同一套测试规则与
项目文档，复用已有文件和实际命令；测试配置与依赖写入所属项目。

通用 Skills 还包括需求分析、技术设计、代码审查、测试用例设计、调试、提交与 OpenSpec 工作流。
完整入口见 [Skills 模板](templates/skills/)。

## 渐进工作流

直接描述任务即可。Agent 先调查并对齐方案，复用已有授权，再选择足够完成任务的路径。
代码审查、调试、测试设计等明确操作直接进入对应专项 Skill。

| 路径 | 适用情况 | 协作方式 |
|------|----------|----------|
| **Direct** | 当前会话可完成改动与验证 | 对齐方案、实施、邻近验证与 diff 自审，不创建 OpenSpec change |
| **Lite** | 跨会话恢复、交接或审计需要保存过程 | 用 OpenSpec 保存共同设计与任务，实施验证后轻量归档 |
| **Full** | 用户选择，或已确认的外部契约协调、严重且难回退的风险 | 完整设计、规格、任务、审查、验证与回顾归档 |

Lite / Full 的升级需要说明价值或风险并取得确认。文件数和技术复杂度本身不决定路径。
工作树、实现子代理、TDD 和提交按任务需要使用，归档不自动授权 commit、push 或 PR。

需要持久化协作时，常用入口为：

| 入口 | 用途 |
|------|------|
| `/opsx:new` | 创建 change，开始共同设计；默认使用 Lite |
| `/opsx:continue` | 继续讨论，确认后逐步生成规划产物 |
| `/opsx:ff` | 显式选择快速生成规划产物，仍需确认关键设计 |
| `/opsx:apply` | 根据已确认的任务实施 |
| `/opsx:verify` | 核对实现与产物，生成验证报告 |
| `/opsx:archive` | 满足当前 schema 的收尾条件后归档 |

上表使用支持 slash commands 的平台写法；其他平台可调用对应的
[OpenSpec Skills](templates/skills/openspec-new-change/SKILL.md)。
共同设计保存在 `brainstorm.md`，后续产物从已确认决定生成。详细门禁由当前 Skill 和
[Lite / Full schemas](templates/openspec/schemas/)维护。

## 资产分层与平台支持

接入并生成项目知识后，各类资产按职责维护：

```text
your-project/
├── AGENTS.md                 # 执行契约、路由与读取条件
├── docs/                     # 当前有效的项目知识
├── .harness/
│   ├── versions.yml          # 受管资产版本
│   ├── rules/                # 项目约束
│   ├── skills/               # 通用与项目专属能力
│   ├── agents/               # 专业角色
│   └── commands/             # 主仓库的命令入口
└── openspec/                 # 主仓库的协作记录
    ├── schemas/              # Lite / Full 工作流定义
    ├── specs/                # 当前能力规范
    └── changes/              # 讨论、设计、任务与验证过程
```

项目知识由项目维护；通用工作流由模板分发。`docs/` 与项目专属规则、角色按需生成，
不应将目录骨架视为已经完成项目分析或测试验证。

| 平台 | CLI 建立的入口 |
|------|----------------|
| Claude Code | `.claude/skills`、`rules`、`agents`、`commands` 链接及 `CLAUDE.md` |
| Codex CLI | `.agents/skills`、`rules`、`agents`、`commands` 链接 |
| Cursor | `.cursor/rules` 链接及 `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` 引用入口 |
| Gemini CLI | `GEMINI.md` 引用入口 |
| OpenCode | `.opencode/skills`、`rules`、`agents`、`commands` 链接 |

链接指向 `.harness/` 的对应子目录；`commands` 仅在源目录存在时建立。
平台的发现与加载方式各有差异，目录链接和 `doctor` 检查不能代替实际会话验证。
新增共享技能通常无需重新同步，运行中的 Agent 可能需要重开会话刷新技能列表。

根项目与子项目使用相同知识分层，各自维护 docs 和项目专属能力。
Git 子模块初始化时不复制主仓库通用 Skills、commands 或 OpenSpec；从主仓库调用共享 Skills，
将目标指向子项目，代码与验证在子项目执行，任务过程在主仓库协调。

## CLI 命令

| 命令 | 用途 | 常用选项 |
|------|------|----------|
| `devkeel init` | 初始化协作资产和平台入口 | `--name`、`--targets`、`-y`、`--force` |
| `devkeel doctor` | 检查协作资产 | `--fix` |
| `devkeel sync` | 按所选平台同步入口 | `--targets`、`--force` |
| `devkeel update` | 更新当前项目受管模板资产 | `--dry-run`、`--force`、`--beta`、`--template-version` |
| `devkeel evidence` | 收集 OpenSpec change 的实现证据 | `--change <name>`、`--json`、`--write-base` |
| `devkeel openspec <命令>` | 调用内置 OpenSpec CLI | 如 `list`、`status`、`validate` |
| `devkeel -V` | 查询 CLI 与模板的发布渠道版本 | 默认 `latest`，可加 `--beta` |

`-V` 查询发布渠道，不能用来判断全局 CLI 是否已升级；网络不可用时可能回退到本地信息。
其他参数见对应命令的 `--help`。

```bash
devkeel init --name my-project --targets claude-code,codex -y
devkeel sync --targets claude-code,codex
devkeel doctor --fix
devkeel evidence --change my-change --json
devkeel openspec list
```

`init -y` 保留已有 `AGENTS.md`，并跳过子模块选择；项目名称与平台可通过参数显式提供。
`evidence --write-base` 会写入基线快照，其余证据查询用于读取当前状态。

Codex / Claude Code 的 skills 入口冲突时，默认保留原件并停止。
确认替换后，可使用 `init --force` 或 `sync --force`，CLI 会先备份并输出位置。
备份位于 `.harness/skills-backups/`，受管链接记录位于 `.harness/skills-state.json`，均为本地状态。
这些选项只处理对应技能入口，不应删除整个平台目录来修复冲突。

### 更新 CLI 与模板

两者独立发布、独立升级：

```bash
# 升级全局 CLI 程序
npm install -g devkeel@latest --registry=https://registry.npmjs.org/

# 更新当前项目的模板资产
devkeel update --dry-run
devkeel update

# 或临时使用最新 CLI 执行模板更新
npx devkeel@latest update
```

普通更新可选择“全部更新”或“逐个确认”。**“全部更新”会覆盖待更新组件中的本地修改；
“逐个确认”才提供逐项跳过或覆盖选择。** `--force` 强制覆盖全部受管组件。
模板更新可能删除已退役的受管 Skill 目录，目录内的自定义内容也会被删除；更新前应检查待更新项。

```bash
devkeel update --beta                       # beta 渠道模板
devkeel update --template-version 1.2.3     # 指定模板版本
devkeel update 1.2.3-beta.1                 # 也支持位置参数
```

`--beta` 与指定版本不能同时使用。`update` 不会升级全局 CLI；
Codex / Claude skills 链接冲突应先通过 `sync` 处理，`update --force` 不替代入口备份流程。

## 自动识别，无需项目配置文件

CLI 从实际平台入口、Git 子模块关系和已有 `AGENTS.md` 识别操作范围：

- `init`、`sync` 默认选中检测到的平台，可交互调整或通过 `--targets` 指定本次目标。
- Git 子模块，或 `AGENTS.md` 顶部带 `<!-- harness:domain-agents -->` 标记的项目，按领域子仓库处理。
- 平台目录仍在时，`doctor --fix` 可补齐缺失的受管链接；整个入口已删除时，用 `sync --targets <平台>` 重建。
- 旧 `.harness/config.yml` 被忽略，可自行删除；资产版本由 `.harness/versions.yml` 跟踪，
  OpenSpec 保留自己的 `openspec/config.yaml`。

子模块在 `init` 中初始化、在 `doctor` 中检查，无需注册。旧 `submodule`、`migrate` 命令已移除。
当前项目知识继续维护在 docs，历史任务产物按需显式复制归档。

## 开发与文档

```bash
pnpm install
pnpm build
node bin/devkeel.js --help
```

- [项目文档](docs/README.md)：项目概览、架构、开发与验证入口。
- [开发指南](docs/development.md)：CLI 开发命令与约定。
- [测试说明](docs/testing.md)：CLI、模板与 Web 的验证范围。
- [构建与发布](docs/building.md)：构建产物与发布边界。
- [源码与问题反馈](https://github.com/MinLeeV5/devkeel)。

## 许可证

采用 [MIT](LICENSE) 许可证。第三方依赖与嵌入的 Skills 保留各自的许可证和来源标注。
