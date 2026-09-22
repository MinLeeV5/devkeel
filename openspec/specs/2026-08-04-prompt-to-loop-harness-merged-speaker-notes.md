# 《从 Prompt 到 Loop：从开源 Skills 到 DevKeel》合并发言稿

> 版本：2026-08-04
> 正文时长：约 32–33 分钟；Q&A：10 分钟
> 配套页面：`web/public/sharing.html`。
> 案例说明：手机登录对话与命令输出均为教学示意；两页真实项目案例来自已检查的仓库结构与提交事实。

## 01. 从 Prompt 到 Loop（1 分钟）

今天不讲一组 Prompt 技巧，而是讲 AI Agent 的工程环境。我们会用“给现有登录页增加手机号验证码登录”这个普通需求，观察 Prompt、Context、DevKeel、Loop 分别解决什么问题。

四个概念不是替代关系。每一阶段都有交付物，也有明确的完成信号；达到信号之后，暴露出的下一类问题才推动系统继续升级。

**转场：** 当 Agent 已经会写代码，交付为什么仍然不稳定？

## 02. 瓶颈移到了工程系统（1.3 分钟）

现在更常见的瓶颈不是模型不会生成代码，而是目标没有可验收边界、项目知识没有被正确提供、完成声明没有可复核证据。

“Agent 能写代码”和“团队能稳定交付”是两件事。模型能力只是变量之一，结果还取决于它工作的环境。

**转场：** 先把这些问题放进一张四阶段地图。

## 03. 四次升级（1.2 分钟）

- Prompt 解决“我有没有把任务说清楚”。
- Context 解决“Agent 是否知道完成任务所需的项目事实”。
- DevKeel 解决“Agent 是否会按项目方式执行并交出证据”。
- Loop 解决“这次反馈是否会改变下一次执行”。

到了 Loop，仍然需要好 Prompt。后面的能力是在前面之上补齐，不是把前一阶段丢掉。

**转场：** 固定同一个需求，只改变 Agent 的工作环境。

## 04. 同一个手机登录案例（1.2 分钟）

案例是一个已有密码登录的成熟 Web 项目。短信发送和验证码登录接口已经存在，我们只改前端，需要处理切换、校验、倒计时、重复点击、错误态、成功跳转、组件复用和测试。

后面 Prompt 基本不变。真正变化的是 Agent 能看到什么、必须遵守什么，以及如何证明完成。

**转场：** 从最熟悉的 Prompt Engineering 开始。

## 05. Prompt：把任务说清楚（1.4 分钟）

一条可交付的 Prompt 至少要有目标、约束和输出：新增什么用户能力，哪些边界不能越过，最终要交代码、测试、说明还是验证结果。

这阶段的交付物就是 **任务 Prompt**。它不是一句灵感，而是一份可以逐项检查的输入。

**Prompt 的 DONE WHEN：** 做什么、不做什么、交什么，都能被检查。

**转场：** 只给这条 Prompt，看看 Agent 的完成声明。

## 06. Prompt-only 案例切片（1.5 分钟）

左边是演示对话。回答听起来完整：新增组件、接了接口、补了测试。但右边显示，项目组件是否复用、关键状态是否覆盖、测试命令是否真实执行，都没有证据。

这里要建立一个区分：Agent 的总结是调查线索，不是验收证据。

**转场：** Prompt 已经合格，为什么仍然做不对项目？

## 07. 交接：Prompt → Context（1.5 分钟）

左侧是 Prompt 阶段的交付物：目标、约束和输出已经清楚。中间上半部分给出完成信号；下半部分则显示它的能力边界：`AuthTabs` 在哪里、短信错误码怎样映射、应该跑什么测试，Prompt 本身并不知道。

因此下一阶段不是继续无限扩写 Prompt，而是交给 **Context**。Context 的目标产物是一张 `AGENTS.md` 项目地图，指向代码、契约、规范与验证入口。

**核心句：** Prompt 定义任务；Context 把任务锚定到项目现实。

## 08. Context：把正确的信息放进有限窗口（1.4 分钟）

Context Engineering 的关键词不是“更多”，而是“最小、相关、高信号”。代码、契约、规范和证据先成为候选事实，再按任务阶段筛选、压缩和注入；执行反馈又会刷新下一轮选择。

Context 不是一次性的资料包，而是一条动态编排链。

**转场：** 给 Agent 加上项目事实，再看同一句 Prompt。

## 09. Context 案例切片（1.5 分钟）

Agent 现在知道应该复用 `AuthTabs` 和 `TextField`，知道接口、成功路由与测试栈，产出明显更接近项目。

但新的成本出现了：这些信息是谁找的、何时更新、下次还能不能找到？如果仍靠工程师在聊天里手工拼装，质量会随人和时间漂移。

**转场：** Context 让 Agent 看懂项目，但还没有让交付可重复。

## 10. 交接：Context → DevKeel（1.7 分钟）

Context 阶段的交付物是 `AGENTS.md` 项目地图。它保持短小，按任务指向登录实现、短信契约、前端规则和验证入口。

**Context 的 DONE WHEN：** Agent 能定位并按需加载完成任务所需的事实。

它仍然回答不了三个系统问题：谁选择 Direct、Lite、Full；谁执行授权和质量门禁；谁判断完成并留下证据。DevKeel 接手的正是“编排、约束、证据”。

这里的设计不是从零开始。调研看的不是 Skill 数量，而是它们什么时候触发、怎样组合、状态放在哪里、怎样自证，以及怎样安全演进。Agent Skills 提供轻量格式，Superpowers 提供强流程纪律，Matt Skills 提供可编辑、可组合的能力系统；Harness Engineering 则把问题提升到项目执行环境。

DevKeel 吸收这些启发，但不照搬完整流程：保留关键调查、授权、实现和验证门禁，让质量动作与任务风险相称；再把路由、规则、OpenSpec 状态和验证入口放回具体仓库的 ownership 与作用域中。外部方案是设计启发，不冒充仓库历史依赖。

**转场：** 设计来源明确了，回到 DevKeel 本身，看它如何形成可靠执行环境。

## 11. DevKeel：可靠执行环境（1.5 分钟）

DevKeel 不是另一份 Prompt 模板。最小模型是：

- 编排决定走哪条路；
- 约束决定什么不能做；
- 验证决定何时才算完成。

三者共同产生可靠执行。工程师也从逐句指导 Agent，转向设计环境、意图与反馈条件。

这三种能力各有明确承接物：`devkeel init` 后由 `AGENTS.md` 承接范围、授权、路由和停止条件；`/domain-init` Skill 从代码提炼 `.harness/` 下的 rules、skills 与 agents；`/verify-init` Skill 补齐测试脚手架、验证规则与 verifier，留下可复跑的完成信号。

它们汇聚为 Agent-ready Repository，才让可靠执行成为团队可以重复使用的默认环境。

**转场：** 下一页的 V1 → V2，讲的是这套脚手架中 Route 编排策略如何演进。

## 12. Route：从固定全流程到风险分级（1 分钟）

DevKeel V1 默认把 brainstorm、design、specs、tasks、apply、verify、retrospective 和 archive 串成完整链路。V2 保留“先澄清、再实施、验证后完成”的工程底线，但不再让每个任务支付相同流程成本。

**转场：** 流程可以变短，选择依据不能消失。

## 13. Direct / Lite / Full 路线图（1.1 分钟）

- Direct：当前会话能够完成必要调查、最小修改和邻近验证。
- Lite：需要简短持久化协调，但没有高后果风险。
- Full：存在真实外部契约协调成本，或变更本身高风险且难以回退。

边界不清时偏向 Direct；Lite 发现风险可以原地升级 Full。

## 14. Rules：从真实代码提炼执行条件（1.3 分钟）

`domain-init` 先识别领域和技术栈，再沿入口与直接依赖扫描真实代码，最后把稳定事实提炼成 `rules / skills / agents`，由 `AGENTS.md` 负责发现和路由。

这里不是自动生成一堆模板。人工审查确认事实、ownership、作用域和命令后，项目知识才被持久化。

## 15. Verify：先建立反馈，再要求自证完成（1.3 分钟）

`verify-init` 先检测已有框架和运行入口，再把缺口列给用户确认。只补缺失部分，并从最邻近的测试开始，按风险扩展到 build、preview、diff 和 review。

**完成信号：** 完成声明附带可复跑命令、关键输出和审查证据。

## 16. 系统能力如何落进仓库（1 分钟）

`AGENTS.md + openspec/` 承载编排，`rules / skills / agents` 承载约束，测试、构建、预览和 review 承载验证。三者共同构成 Agent-ready Repository。

DevKeel 不是文件清单；关键是这些载体能被发现、按需加载并形成反馈闭环。

## 17. 手机登录的 Lite 闭环（1.4 分钟）

手机登录涉及多个交互状态、复用约束和验收证据，因此值得留下简短协调记录；后端契约不变，也没有迁移和高后果风险，所以不需要 Full。

页面上的演示分成五步：Agent 先读取 `/brainstorming` Skill 与 frontend architecture-constraints rules，做只读头脑风暴；确认复用 `AuthTabs`、`TextField` 和现有短信接口后，请用户确认设计；用户批准后创建 Lite change，按 `brainstorm → tasks → apply` 实施，验证通过后 archive。右侧四类证据分别说明路由有依据、范围可追溯、命令与 diff 可审查、经验可以回到仓库。

第三次看同一句 Prompt，变化不在 Agent 的文案，而在范围可追溯、验证可复跑、diff 可审查、决策可归档。

**转场：** 教学案例解释了机制，接下来用两个真实仓库检验它能否迁移。

## 18. 真实案例一：devkeel-demo-project（1.2 分钟）

这是一个普通的 Vite Todo 项目，起点是 React 19、TypeScript 6、Vite 8、Zustand 5 和已有 feature 目录。页面用四个数字概括结果：8 条项目规则、1 个前端 reviewer、3 个 Agent 入口和 1 个归档 change。`devkeel init` 建立统一入口，`domain-init` 从真实代码补出项目能力，业务结构没有被重排。

最重要的细节不是“全部变绿”：项目当时没有 test scripts、Vitest、Testing Library 或 jsdom。`verify-init` 把缺口暴露出来，等待授权后再补；与此同时，一个真实 OpenSpec change 已留下规划、实现、验证和复盘证据并完成归档。

**核心句：** 渐进式落地不是一次补齐所有东西，而是先让项目可读，再让反馈可执行，并让未知保持显式。

**转场：** 当项目从一个 feature 扩展成多个业务仓，问题从“有没有知识”变成“知识应该跟谁走”。

## 19. 真实案例二：example-workspace（1.2 分钟）

这个项目包含 5 个业务 submodule 与 2 个独立知识 submodule。根 `AGENTS.md` 只负责全局契约和路由；进入前端或后端后，更小作用域的 AGENTS.md、rules、skills、agents 和验证方式接管任务。

前后端合计沉淀了 41 条 rules 与 18 个 skills：前端是 23 rules、7 skills、1 agent；后端是 18 rules、11 skills、4 agents。Agent 不必一次吞下整个产品：根仓负责找到边界，子仓负责提供领域知识、专项能力和反馈命令；只有需要跨会话协调的工作才进入 OpenSpec。

**核心句：** 同一套 DevKeel 不要求同一种仓库形态，它让知识跟着 ownership 和验证边界生长。

## 20. 交接：DevKeel → Loop（1.4 分钟）

DevKeel 阶段的交付物是一个 **Agent-ready Repository**：任务可路由、可约束、可验证、可审查。

但 Review 发现的“重复点击和倒计时重置”如果只留在报告里，下次仍会重演。Loop 要把反馈变成登录域 rule、回归测试，并更新 `AGENTS.md` 的加载入口。

**核心句：** 完成一次任务不是终点；让反馈改变下一次默认行为才算闭环。

## 21. Loop：两个时间尺度（1.3 分钟）

内环解决当前任务：目标、行动、验证、纠偏或停止。外环改善执行系统：交付、复盘、提炼、更新 DevKeel，让下一次任务自动继承。

Loop 不是无限重试。它必须有可判定信号、修正策略、停止条件和人类升级入口。

## 22. 四阶段最终对比（1.1 分钟）

Prompt 优化单次表达，Context 优化当下认知，DevKeel 优化执行可靠性，Loop 优化系统学习率。

它们的完成信号依次是：任务边界可检查、项目事实可定位、证据闭环可审查、经验进入下一次执行。

## 23. 四个诊断问题（1.1 分钟）

下一次 Agent 跑偏时，不要马上重写十版 Prompt。依次检查目标是否清楚、上下文是否正确、执行是否闭环、经验是否沉淀。

返工不断先查 Prompt；方案与项目脱节先查 Context；完成无法复跑先查 DevKeel；同类问题反复出现则查 Loop。

**收束句：** 真正的升级，不是让 Agent 更会回答，而是让团队更会交付。

## 24. Q&A（0.5 分钟，之后预留 10 分钟）

谢谢大家。页面上有安装文档 `https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md`、官网 `https://github.com/MinLeeV5/devkeel`、GitLab 仓库 `mhos-apps/ai/devkeel`，以及加入 DevKeel 交流群的二维码。

## 资料来源

- [OpenAI：Prompt engineering best practices](https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt)
- [Anthropic：Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Agent Skills](https://github.com/agentskills/agentskills)
- [obra/superpowers](https://github.com/obra/superpowers)
- [Matt Pocock：Skills](https://github.com/mattpocock/skills)
- [OpenAI：Harness engineering](https://openai.com/index/harness-engineering/)
- [OpenAI：Unlocking the Codex harness](https://openai.com/index/unlocking-the-codex-harness/)
- [OpenAI：Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/)
- [IBM：Loop engineering](https://www.ibm.com/think/topics/loop-engineering)
- [OpenAI：Building self-improving agents with Codex](https://openai.com/index/building-self-improving-tax-agents-with-codex/)
