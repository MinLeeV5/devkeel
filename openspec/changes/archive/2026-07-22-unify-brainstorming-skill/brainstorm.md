# 变更 Brainstorm

## 目标

以一个 Harness 自有的 `brainstorming` skill 统一现有 `grilling` 与
`openspec-explore` 的事实梳理、问题界定、方向探索、方案比较、方案检验和结论收束能力，并在
开发流程前增加明确的写入授权门禁，使模糊反馈默认进入严格只读讨论，只有明确动作指令，或明确
认可最近一条写明具体持久化动作与范围的实施方案或授权询问，才能进入会产生写入的 L0 / Direct /
Lite / Full；认可按上下文语义判断，不依赖固定词表。

## 现状与问题

- `templates/agents-md.md` 当前先判断 Direct / Lite / Full，并鼓励低风险、可逆任务自行推进，
  但没有先区分“讨论反馈”与“授权修改”。带文件路径的“我觉得……可以……”容易直接落为
  Direct 修改。
- `openspec-explore` 已覆盖代码调查、方案比较、挑战假设和可视化，但绑定 OpenSpec 上下文，
  且经同意可写 planning artifact；`grilling` 只补充逐问压力测试和强收敛。两个完整 skill
  职责重叠，用户还需要提前判断应选哪个入口。
- 旧 Superpowers `brainstorming@6.0.3` 曾强制所有创意任务走固定八步、写设计文档、commit
  并转入 `writing-plans`，已因流程过重而退休。本次复用名称，但不恢复旧行为。
- `brainstorming` 目前被 `src/lib/update.ts` 和主规格登记为退休资产；如果只重新注册版本而不
  移除退休探测，现有项目会反复命中 legacy migration，无法达到二次 update no-op。
- 该能力会随 Harness 分发给外部项目；skill 名称、触发语义、`/opsx:explore` 入口和升级
  结果都是可观察契约，需要版本与迁移协调。

## 核心用例

| 角色/调用方 | 触发场景 | 预期结果 | 关键边界 |
|---|---|---|---|
| 提出反馈的开发者 | 列出文件并表达评价、建议或可能方向，但没有明确要求修改 | Agent 自动进入只读 `brainstorming`，调查事实并讨论方案 | 文件路径和“可以考虑”不构成写入授权 |
| 只有早期想法的用户 | 明确要求头脑风暴、探索或澄清 | Agent 建立事实后进入方向探索，按需形成真实候选 | 不强制制造 2–3 个伪方案 |
| 已有多个候选的用户 | 要求比较方案 | Agent 直接进入方案比较，给出权衡、推荐和决定性未知项 | 不从头重复开放发散 |
| 已有明确方案的用户 | 要求找漏洞或压力测试 | Agent 直接进入方案检验，检查假设、失败路径、迁移、回滚和验证 | 不擅自把问题改成重新设计 |
| 给出明确动作指令或认可具体实施方案的开发者 | 明确要求执行具体写操作，或明确认可 Agent 最近提出且包含具体持久化动作与范围的实施方案或授权询问 | 仅相应目标取得本次范围的写入授权，再进入写型 L0 或 Direct / Lite / Full | 脱离上下文，或只确认未写明具体动作与范围的方向、目标或验收不授权写入 |
| 给出混合请求的开发者 | 明确要求修复 A，同时只表示 B 也许可以优化 | A 获得写入授权，B 保持只读并按需讨论 | 一个子句的授权不得扩散到其他目标或模糊子句 |
| `/opsx:explore` topic-only | 显式通过命令进入但没有选定 change | 唯一 skill 加载 OpenSpec reference，可按需读取 change 列表或通用仓库事实 | 不虚构 `changeRoot`、artifact 路径或 active change，不创建 change |
| `/opsx:explore` 或 active change | 点名 change，或热上下文已有可确定的 active change | 使用 status JSON 的动态 `changeRoot`、`artifactPaths` 与 `actionContext` 读取现有 artifacts 后继续只读讨论 | 普通仓库不因存在 `openspec/` 自动运行 CLI；不得写 artifact |
| 暂停或结束讨论的用户 | 当前讨论已有足够结论或暂时无结论 | Agent 汇总事实、候选与推荐、已确认决策、开放项和需另行授权的下一步 | 不把“讨论完成”表述为“实现完成” |

## 范围与验收

| 范围 | 内容 |
|---|---|
| In Scope | 新建唯一 `brainstorming` skill 及其条件式 OpenSpec reference；删除 `grilling` 与 `openspec-explore`；让 `/opsx:explore` 委托新 skill；在 AGENTS 增加写入授权门禁和自动只读路由；同步版本、init/update 迁移、主规格、测试、现行文档与 dogfood 镜像 |
| Out of Scope | 恢复旧 Superpowers 固定流程；保留 `grilling` 兼容别名；让 brainstorming 创建或修改任何文件；修改 Lite/Full 风险算法、schema 的 `brainstorm.md` artifact、其他 OPSX 生命周期入口、历史 archive 与版本快照 |

验收条件：

1. 新初始化和当前项目中只存在 `brainstorming` 这一项讨论 skill；`grilling` 与
   `openspec-explore` 的目录和版本键均不存在。
2. `brainstorming` 归属 `devkeel`，版本为 `7.0.0`，模板与 dogfood 内容、reference
   和版本表一致；旧 Superpowers 6.0.3 安装可原地升级为新契约。
3. 原始“列出三个模板并表达缺失内容、可以增加图表”的反馈场景不会修改目标文件或创建
   change；明确动作指令，或明确认可最近一条包含具体持久化动作与范围的实施方案或授权询问后，
   才对相应目标进入开发分流。认可不依赖固定词表；混合请求中模糊子句不继承其他子句的权限。
4. skill 根据输入成熟度自动选择方向探索、方案比较或方案检验；需要提问的一轮只提出 1–3 个
   同一决策链问题，依赖前一答案的问题拆轮，仓库可查事实不询问；复杂主题先拆清边界、依赖和
   顺序，现有代码讨论遵循已有结构，不加入超前设计或无关重构。
5. brainstorming 期间只允许读取、搜索和只读检查；即使用户要求保存结论，也先退出 skill
   并交给独立写入流程。
6. `/opsx:explore` 保持可用并加载 `brainstorming` 的 OpenSpec 模式；topic-only 不要求
   change-specific 路径，选定 change 后必须保留动态 `changeRoot`、
   `artifactPaths.<id>.existingOutputPaths` 与 `actionContext`；任何模式都不得写 planning artifact。
7. 从当前版本更新时，一次受管事务先在同级临时目录安装校验 `brainstorming` 与 explore command，
   可恢复地切换后再删除两个旧 skill 并写版本；旧 6.0.3 的遗留文件被完整清除，任一提交前失败
   保留旧入口和版本字节。用户同时跳过的其他组件不得被标为最新；全部实际更新完成后第二次
   update 为 no-op。
8. 版本已是 7.0.0 但目标结构损坏、reference 缺失或路径不安全时仍会触发修复或安全失败；用户
   拒绝 AGENTS 框架更新后，下一次 update 仍能检测框架漂移并再次应用，而不会因版本最新提前返回。

## 架构与影响概览

```mermaid
flowchart TD
    U[用户请求] --> G[AGENTS 写入授权门禁]
    G -->|动作指令或认可具体实施方案| W[写型 L0 / Direct / Lite / Full]
    G -->|明确讨论或模糊反馈| B[唯一 brainstorming skill]
    B --> C{输入成熟度}
    C -->|早期想法| D[方向探索]
    C -->|多个候选| P[方案比较]
    C -->|明确方案| H[方案检验]
    D --> S[结论收束]
    P --> S
    H --> S
    O[/opsx:explore] --> X[条件式 OpenSpec 上下文]
    X --> B
    S -->|动作指令或认可具体实施方案| W
```

| 区域/模块 | 当前职责或行为 | 本次影响 |
|---|---|---|
| `templates/agents-md.md` / `AGENTS.md` | 开发请求直接进入三档流程 | 在三档路由前增加讨论意图与写入授权门禁 |
| `templates/skills` / `.harness/skills` | 分发两个重叠讨论 skill，旧 brainstorming 已退休 | 只分发 Harness `brainstorming@7.0.0` 及条件 reference |
| `commands/opsx/explore.md` | 固定加载 `openspec-explore`，允许经同意更新 artifact | 改为向 `brainstorming` 传 OpenSpec 模式，保持严格只读 |
| 版本与 update 迁移 | 删除 brainstorming，保留 grilling / openspec-explore | 恢复并升级 brainstorming，退休并安全删除后两者，保证幂等 |
| capability specs | 分散描述路由、退休 skill 和 schema 迁移 | 新增 brainstorming 行为真源，并修订三项相邻契约 |
| 单元/集成测试与现行 Web | 断言无 brainstorming、展示显式 grilling 与 OpenSpec explore | 改为唯一 skill、授权门禁、条件 OpenSpec 和升级回归 |

## 方案方向与取舍

采用“一个物理 skill、一个自适应行为核心、两个入口上下文”的方案：

- `brainstorming/SKILL.md` 拥有通用的“事实梳理 → 问题界定 → 方向探索 / 方案比较 / 方案检验 →
  结论收束”行为；事实梳理与结论收束必经但可很短，中间阶段由 Agent 自动判断且可切换。
- `brainstorming/references/openspec-context.md` 只在 `/opsx:explore`、明确 change 或热上下文已有
  active change 时加载，承接 `changeRoot`、`artifactPaths`、`actionContext` 和只读 status
  规则。它是同一 skill 的渐进披露资源，不是第二个 skill。
- 需要提问时，每轮提出 1–3 个连续且互不依赖的问题并附推荐；如果后问依赖前答则拆轮。
- Agent 可继续挑战当前最优候选，但会改变目标、范围、验收、架构边界或外部契约的选择仍由
  用户确认；仓库事实或不改变结果的低风险假设可标注后推进。
- 复杂主题先拆清可独立交付部分的边界、依赖和顺序；现有代码讨论遵循已有结构，只保留服务当前
  目标的改进，并避免预设尚未出现的功能。
- brainstorming 永远不拥有写入权限。用户要求保存或实施，或明确认可最近一条写明具体持久化
  动作与范围的实施方案或授权询问时，先收束并退出，再由写型 L0 或 Direct / Lite / Full 接管；
  认可只继承对应上下文，不依赖固定词表。

未采用以下方向：

| 方向 | 不采用原因 |
|---|---|
| 保留两个 skill，只在文档中解释区别 | 用户仍需预判入口，重复调查、比较和挑战契约继续漂移 |
| 把所有能力塞进 `openspec-explore` | 通用讨论被绑定 OpenSpec，上游同步与严格只读边界长期冲突 |
| 扩展 `grilling` 为通用头脑风暴 | 名称和外部来源仍表达压力测试，无法自然承载开放发散 |
| 恢复旧 Superpowers brainstorming | 会重新引入所有创意任务强制流程、固定产物、commit 和自动 planning |
| 为旧 grilling 保留兼容入口 | 继续暴露两个用户概念，违背最终只保留一个 skill 的目标 |

## 约束、风险与决策

| 类型 | 约束或风险 | 决策或应对 |
|---|---|---|
| 写入授权 | 模糊反馈再次被 Direct 规则解释为可逆修改，或一个已授权子句把相邻建议一并带入 | 按独立目标逐项判定；动作指令或对具体实施方案/授权询问的明确认可才授权，认可按语义判断且不得跨子句扩散 |
| L0 绕过 | “任务确需专项能力”可能让会写状态的 L0 跳过三档门禁 | 授权判断先于任何持久化动作；只读 L0 可直接调查，写型 L0 必须已有相应范围授权 |
| 触发过宽 | 自动 brainstorming 可能重现旧版对简单任务的流程负担 | 已授权执行请求和明确只读 L0 不进入；自适应跳阶段、无实质未知项可零提问 |
| 退休名称复用 | `brainstorming` 仍在静态退休列表会造成误删；直接覆盖同名 6.0.3 会残留旧资源或破坏失败恢复 | 从退休集合移除；使用同级 staging、校验、备份和可恢复切换完成 6.0.3 → 7.0.0，再验证 no-op |
| 旧 skill 清理 | 仅删除版本键会在既有项目残留完整 `grilling` / `openspec-explore` | 把两者登记为受管退休资产并保持路径安全、幂等清理 |
| OpenSpec 上游 | 删除独立 upstream `openspec-explore` 后可能遗漏动态路径不变量，topic-only 又没有 change 路径 | reference 区分 list/topic 与选定 change；后者保留 status/path/actionContext 规则并用本地契约测试承接 |
| 更新恢复 | 版本最新但 skill 结构损坏或 AGENTS 更新曾被拒绝会被当前早退逻辑隐藏 | 把目标结构和 AGENTS 框架漂移纳入更新探测；用户拒绝只延后框架应用，不把它伪报为已完成 |
| 外部兼容 | skill 名称、触发和命令目标变化会影响已安装项目 | 使用 Full、主版本断代、init/update 集成测试和现行文档说明迁移；保留 `/opsx:explore` 命令入口 |
| 历史污染 | 批量替换会改写 archive、v1 页面或版本快照 | 只更新现行事实源；历史资产保持原样 |

## 流程选择

该变更同时满足外部契约 Full 条件：Harness skill 与命令由外部项目消费；可观察的名称、触发、
只读语义和目录形状发生变化；升级需要版本、退休清理和命令迁移。Agent 已建议
`full`，用户确认采用 Full 并授权先完成 planning，再进入 Apply。
