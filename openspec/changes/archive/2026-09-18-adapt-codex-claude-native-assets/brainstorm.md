# 变更：Codex 与 Claude Code Skills 原生适配

> **状态：** `CONFIRMED` · **确认项：** 11 D / 0 A / 0 O

## ⚡ 30 秒了解

本轮仅适配 Codex 与 Claude Code 的 skills；`.harness/agents` 及其他资产的原生改造移出范围（[D-01](#d-01)、[D-02](#d-02)）。
按官方最佳实践维护共享技能包，保留两端原生发现与手动调用入口（[D-04](#d-04)、[D-05](#d-05)）。
两端 skills 目录继续链接 `.harness/skills`，新增或修改技能无需 `devkeel sync`（[D-06](#d-06)）。
共享正文位于 `SKILL.md`；Claude 配置放 frontmatter，Codex 配置放技能包内的 `agents/openai.yaml`，必要的平台执行差异按需读取（[D-12](#d-12)）。
仅对 skills 受管目标进行整批预检；冲突默认停止，显式强制覆盖前自动备份（[D-09](#d-09)、[D-10](#d-10)、[D-11](#d-11)）。
受管清单识别用户修改，旧链接按归属保守迁移，保留无关内容（[D-13](#d-13)、[D-14](#d-14)）。
用户已确认仅针对 skills 的完整快照；[6 项实施任务](tasks.md)已完成，验证结果见 [validation.md](validation.md)。

## 当前有效决定

### 目标与边界

#### D-01

共享技能内容源，分别适配 Codex 和 Claude Code。

#### D-02

本轮仅处理 skills 的平台适配、必要分发、安全同步和有效性检查；`.harness/agents` 暂不处理，instructions、rules、agents、commands 的独立原生改造不纳入本轮。

### 加载与调用

#### D-04

skills 保留两端原生发现和调用入口，支持用户主动调用。

### 适配依据

#### D-05

skills 应依据各平台的官方最佳实践选择适配方式。

#### D-12

采用共享技能包：共享流程放 `SKILL.md` 正文，Claude Code 专属配置放该文件的 frontmatter，Codex 专属配置放 `agents/openai.yaml`；必要的平台执行差异放 `references/claude-code.md`、`references/codex.md`，由技能入口按需读取。两端 skills 目录继续软链接到 `.harness/skills`，新增技能无需同步。

平台参考文件属于技能指令，不作为平台自动解析的配置；原生扩展共存及实际行为须在两端验证。

技能包内的 `.harness/skills/<skill>/agents/openai.yaml` 是 Codex skill 元数据，属于本轮范围；它与已移出范围的 `.harness/agents` 是不同资产。

### 日常维护体验

#### D-06

新增或修改 `.harness/skills` 后，无需执行 `devkeel sync` 即可被平台读取。

### 同步与覆盖

#### D-09

skills 同步写入前先检查整批目标，仅更新本轮 Harness 受管内容。遇到用户自有的同名内容或被手动修改的受管产物时，默认保留原文件、列出冲突并停止整次同步；不得通过删除整个平台目录完成 skills 同步。

#### D-10

提供用户显式选择的强制覆盖选项，用于处理 skills 同步目标中的冲突。强制覆盖不扩大本轮管理范围。

#### D-11

强制覆盖前自动备份冲突内容，并输出备份位置；备份失败则停止覆盖。

#### D-13

维护 skills 受管清单，记录软链接目标；若实际写入受管文件，则记录其校验值，用于在后续同步时识别用户手动修改。清单范围随本轮收缩，不引入 agent 生成文件管理。

#### D-14

旧 skills 链接只有明确指向本项目 `.harness/skills` 时才自动接管；同名真实目录或归属不明的内容按已确认冲突策略处理，平台目录中的其他资产和无关文件继续保留。

## Agent 自主范围

无。

## 开放问题

无。原 O-01 中尚未决定的 agent 输入格式随范围收缩移出本轮，不代表该方案已获确认。

## 决策变更记录

- 用户最新要求：".harness/agents 目录先不处理吧，只处理 skill 就好了"。据此将 D-02 收缩为 skills，D-01、D-04、D-09、D-10、D-13、D-14 的适用范围同步收缩；不新增其他资产的实施授权。
- 原 D-03（rules 经 AGENTS.md 按需读取）、D-07（生成两端原生 agents）、D-08（OPSX 命令适配）移出本轮有效决定；后续若重启相关工作，需另行对齐范围。
- 原 O-01 的 skills 部分已由 D-12 闭合；其 agent 源格式候选未获确认，现移出本轮。
- 用户确认了收缩后的完整快照：11 D / 0 A / 0 O；状态改为 CONFIRMED，下游尚未生成，保持 NONE。

## 验证映射

以下是已确认行为的验证落点，执行结果见 [validation.md](validation.md)：

- 对照 D-04、D-05、D-12：检查技能入口与原生元数据格式，并在两端验证代表性技能的显式调用、适用时的隐式触发与不应触发场景，确认平台专属配置不破坏共享流程及现有授权边界。
- 对照 D-06、D-12：在已建立目录链接的项目中新增、修改技能，不执行 Harness 同步，验证两端可读取同一份源内容；分别记录目标版本的技能列表刷新行为，不把免同步表述为所有运行中会话即时刷新。
- 对照 D-09 至 D-11、D-13、D-14：验证重复同步、已知旧链接迁移、链接目标被修改、同名真实目录、冲突默认停止、强制覆盖备份和备份失败停止，并检查其他平台内容未被删除或改写。
- 对照 D-02：自审改动与回归结果仅覆盖 skills 及必要分发路径，检查没有引入 `.harness/agents` 或两端 agent 定义的格式转换。

## 实施前核对事实

- [当前平台分发](../../../../src/lib/templates.ts)把 `.harness/` 下的 skills、rules、agents、commands 分别链接到 `.claude/` 与 `.agents/`；没有进行 agent 格式转换。
- [当前 sync](../../../../src/commands/sync.ts)会删除检测到的目标平台目录后重建；[doctor](../../../../src/commands/doctor.ts)的平台检查主要判断目录或链接是否存在。
- 当前 [createPlatformLinks / ensureSymlink](../../../../src/lib/templates.ts)没有记录平台产物的校验值或归属清单，遇到已有目录或链接直接返回；[update](../../../../src/commands/update.ts)的文件 hash 比较用于模板与目标内容差异，不能独立证明平台文件归属或是否相对上次生成结果被手动修改。

### Skills 最佳实践调研（2026-09-18）

- [Agent Skills 标准](https://agentskills.io/specification)定义 `SKILL.md`、`name`/`description`、可选资源目录与渐进加载；`allowed-tools` 的支持因实现而异，不能据字段同名推断权限行为一致。
- [Codex Skills 文档](https://learn.chatgpt.com/docs/build-skills)说明项目发现路径为 `.agents/skills`，支持软链接；CLI/IDE 使用 `$skill` 或 `/skills` 手动选择。`agents/openai.yaml` 提供展示信息、依赖声明和 `policy.allow_implicit_invocation`，后者关闭时仍支持显式调用。
- [Claude Code Skills 文档](https://code.claude.com/docs/en/skills)说明项目路径为 `.claude/skills`，用户通过 `/skill-name` 调用；`disable-model-invocation`、`user-invocable`、参数替换及 `context: fork` 等属于平台扩展。旧 commands 仍可用，新工作更适合采用 skills。
- Claude 的 `context: fork` 创建不包含主会话历史的子代理；推论：依赖热对话的 brainstorming/OPSX 不宜机械套用该选项。`allowed-tools` 涉及工具预批准，不能当作只读权限限制。
- [Anthropic 编写指南](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)建议精简正文、拆分按需参考、使用具体示例与反馈闭环；[OpenAI 近期指导](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)强调简短准确的触发描述、多流程技能使用精简路由、避免无条件加载资料。
- [OpenAI 评估指南](https://developers.openai.com/blog/eval-skills)建议通过运行轨迹和结果验证显式触发、隐式触发及不应触发的场景。适配效果需要在目标平台实际验证，目录存在不等于行为正确；旧博客中的安装路径不覆盖当前产品文档。
- 仓库共 23 个模板技能，入口文件为 45～314 行，已有 references/scripts 拆分基础；[human-review 的 Codex 元数据](../../../../templates/skills/human-review/agents/openai.yaml)已设置 `allow_implicit_invocation: false`，[Jira 技能](../../../../templates/skills/jira-defect-orchestrator/agents/openai.yaml)已有 UI 元数据，现状并非完全没有平台增强。
- [review-orchestrator](../../../../templates/skills/review-orchestrator/SKILL.md)等含非标准 `triggers` 字段，已查标准与两端技能文档未将其定义为原生触发配置；[verify-init](../../../../templates/skills/verify-init/SKILL.md)含 `WebFetch` 等具体工具名，需要避免把某平台工具可用性视为通用事实。
- [commit](../../../../templates/skills/commit/SKILL.md)当前接受用户明确选择交付目标；“用户自然语言明确授权”与“必须手动输入原生技能命令”不是同一行为，平台调用开关应按该契约判断，不能批量开启严格手动模式。
- 本机 Codex npm 包版本为 `0.153.4`，Claude Code 为 `2.1.235`；本轮完成文档与仓库核对，未运行技能行为评估。[现有集成执行器](../../../../tests/integration/lib/run-turn.sh)封装 Claude，Codex 行为验证仍需补齐。
- 两端当前官方文档都明确支持技能目录软链接：[Claude Code 技能发现](https://code.claude.com/docs/en/skills#choose-where-skills-load)、[Codex 本地技能发现](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills)。文件通过链接可读取，与运行中会话是否即时刷新技能列表是不同层面的行为，后者须按目标版本验证。
- 本轮补查 [Codex 主分支的技能解析源码](https://github.com/openai/codex/blob/main/codex-rs/core-skills/src/loader.rs)：frontmatter 使用 Serde 读取名称、描述等字段，未声明 `deny_unknown_fields`，并独立读取 `agents/openai.yaml`。结合 [Serde 未知字段规则](https://serde.rs/container-attrs.html#deny_unknown_fields)，可推断额外的 Claude frontmatter 字段不会仅因未知字段而被该解析器拒绝；这只支持配置共存的可行性，不代表两端会执行相同扩展。未取得与本机版本对应的源码快照，也未作目标版本实测。

## Planning 状态

- **下游状态：** `CURRENT`
- **阻塞原因：** 无；`tasks.md` 已覆盖全部 11 项有效决定，6 项实施任务及必要验证已完成。
- **准备度依据：** 用户已确认完整快照，实施准备度为 100%。技能共享结构、免同步分发、原生调用、冲突保护和归属迁移均有已确认决定及验证落点；此状态表示设计确认完成，不表示实现或目标版本的实际调用验证已完成。
- **投影状态：** `lite` 规划产物 2/2 完成，Apply 任务 6/6 完成；来源覆盖检查无遗漏、冲突或新增语义。
- **迁入来源：** 原记录来自当前对话并逐项确认；用户最新收缩范围后，将原 D-03、D-07、D-08 移出有效决定，原 O-01 剩余部分移出范围，当前共 11 D / 0 A / 0 O。用户已授权保存 Lite 讨论记录。
