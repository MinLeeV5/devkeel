## 一句话描述

将 `technical-design` 从固定套用 C4/ATAM/STRIDE/SLO 的后台偏向方案设计 skill，改造为先识别领域与变更触点，再按 D1-D14 设计维度、领域 profile 和输出优先级生成可读设计文档的领域感知设计框架。

## 需求背景

当前 `technical-design` 在 `.harness/skills/technical-design/SKILL.md` 和 `templates/skills/technical-design/SKILL.md` 中把 C4、ATAM、SLO、STRIDE、旁路隔离等方法论写成核心工具箱和评审红线。这些方法在后端或复杂架构设计中有价值，但在前端、客户端、桌面端、CLI、SDK 等场景中并不总是主轴。

典型问题包括：

- 性能指标默认使用 QPS/TPS、并发用户数、MTBF/MTTR，不适合前端页面、Electron renderer、CLI 启动耗时或 SDK 依赖体积等场景。
- SLO、旁路故障、完整 ATAM、完整 STRIDE 等设计项在后台服务中常见，但小型 UI 变更、组件变更、客户端壳层变更未必需要完整展开。
- UI/交互/组件设计目前主要依靠 `templates/openspec/schemas/superpowers-lite/templates/design.md` 的可选章节提示，尚未进入 `technical-design` 的正式方法论选择流程。
- `superpowers-lite` schema 中仍描述 `design 使用 technical-design（C4/ATAM/STRIDE/SLO）`，会让 agent 在 design artifact 中默认补齐后台架构式章节，导致文档膨胀且不利于人类阅读。

本次需求的目标不是废弃这些方法论，而是让它们从“全局强制项”变成“按领域和触点路由的候选工具”。

## 项目现状与架构分析

受影响区域集中在模板知识层和 OpenSpec schema，不涉及 CLI 运行时代码主链路：

| 区域 | 当前职责 | 当前问题 |
| --- | --- | --- |
| `templates/skills/technical-design/SKILL.md` | 分发给新项目的方案设计 skill 模板 | 固定输出章节和红线偏后端，缺少领域识别、维度裁剪和篇幅控制 |
| `.harness/skills/technical-design/SKILL.md` | 当前仓库运行时使用的方案设计 skill | 与模板源一致，需要同步改造，保证本仓库后续 `/opsx:design` 生效 |
| `templates/openspec/schemas/superpowers-lite/schema.yaml` | `superpowers-lite` artifact 编排说明 | design artifact 描述固定为 C4/ATAM/STRIDE/SLO，未表达领域感知维度选择 |
| `templates/openspec/schemas/superpowers-lite/templates/design.md` | design.md 输出模板 | 已有按需取用和 UI 章节，但完成检查仍偏固定候选方案，不体现优先级和维度选择 |
| `templates/skills/domain-init/references/*` | 项目级领域识别和领域矩阵参考 | 已有检测信号和 `● / ○ / —` 思路，可作为 design 领域 profile 的参考来源 |
| `templates/skills/ui-fidelity-playbook/*` | UI 高保真实现方法论 | 可作为 D7 UI/交互维度的子方法论，但需要区分“有设计事实”和“无设计事实” |
| `tests/templates.test.ts` | 模板复制和 schema 文案回归测试 | 可新增回归测试，确保新参考文件被复制，schema 不再固定描述后台方法论 |
| `templates/versions-yml.yml`、`.harness/versions.yml` | 模板/当前知识层版本记录 | `technical-design` 版本需要随行为变更提升 |

已有参考能力：

- `domain-init` 的领域检测覆盖前端、后端、移动端、系统/底层、CLI/工具、库/SDK、DevOps、桌面、custom 等标签。
- `domain-init` 的领域适用性矩阵用 `● / ○ / —` 控制维度默认启用、按需启用和不适用。
- `ui-fidelity-playbook` 已定义 UI 范围、运行时层次、设计事实来源、高风险失真点、状态变体和运行时验证路径。

这些能力说明，本次更适合新增一套面向“方案设计”的 D1-D14 维度矩阵，而不是直接复用 domain-init 的 R1-R23 规则矩阵。

## 风险与约束

| 类型 | 风险/约束 | 处理方式 |
| --- | --- | --- |
| 向后兼容 | 现有 change 可能已经按旧 design 模板产出文档 | 不迁移历史 artifact；只更新未来模板和 skill |
| 文档膨胀 | 领域感知后可能命中大量维度，仍导致 design.md 过长 | 引入 `core / supporting / checklist / skip`，用优先级控制输出深度 |
| 上下文膨胀 | 若把所有领域启用条件写进一个大文件，agent 每次都加载大量无关信息 | 采用短入口 `dimension-selection.md` + 按需读取 `domain-profiles/*.md` + 被选中的 `dimensions/Dxx-*.md` |
| 维护漂移 | 如果按领域拆完整 design 模板，D8/D10/D13 等内容会重复且容易不一致 | 领域文件只写启用条件和优先级；维度文件是输出契约的唯一权威来源 |
| 过度抽象 | D1-D14 维度可能变成新形式的固定模板 | 每个维度必须支持 `skip` 和输出深度；只有 `core` 正文展开 |
| UI 误用 | `ui-fidelity-playbook` 要求有设计事实，不能用于从零创造 UI | D7 区分“有设计事实的 fidelity 对齐”和“无设计事实的 UI 方案设计” |
| 安全误用 | STRIDE 不应对所有设计强制输出 | D10 采用 frontend/backend-api/desktop/cli/sdk lens，完整 STRIDE 仅在高风险后端入口等触发时启用 |
| 测试覆盖 | 大部分改动是 Markdown 模板，容易只靠人工检查 | 新增模板复制和 schema 文案回归测试，并运行 `npm test -- tests/templates.test.ts` 与 `npm run lint` |

验收口径：

- `copyTemplateSkills` 后能复制 `technical-design/references/dimension-selection.md`、领域 profile 和维度文件。
- `superpowers-lite` schema 的 design 描述不再写死 C4/ATAM/STRIDE/SLO，而是指向领域识别、D1-D14、优先级控制。
- design 模板包含“设计维度选择”入口和 `D03 运行边界与职责归属` 命名。
- `technical-design` skill 明确要求先按需读取参考文件，再按 `core / supporting / checklist / skip` 控制输出。
- 当前 `.harness/skills/technical-design` 与 `templates/skills/technical-design` 保持同步。

## 目标用户与角色

| 角色 | 关注点 |
| --- | --- |
| 使用 `/opsx:design` 的工程师 | 设计文档能贴合当前任务领域，不被无关 SLO/STRIDE/ATAM 填充 |
| Coding Agent | 有明确路由：先领域识别，再读取相关 profile 和维度文件，避免上下文过载 |
| harness 模板维护者 | 维度定义集中维护，领域差异通过 profile 表达，降低重复和漂移 |
| 代码审查者 | 能从 design.md 看到本次为什么启用/跳过某些设计维度，以及核心决策追溯 |
| 前端/客户端/桌面开发者 | UI、组件、状态、运行边界、安全 lens 和性能指标能按本领域表达 |
| 后端/API/平台开发者 | C4、SLO、STRIDE、可观测性等方法仍可在合适场景启用 |

## 核心功能用例

```mermaid
flowchart LR
  User["工程师触发 /opsx:design"] --> Agent["technical-design skill"]
  Agent --> Detect["识别项目领域和本次变更触点"]
  Detect --> Profiles["按需读取领域 profile"]
  Profiles --> Select["选择 D1-D14 设计维度并标记优先级"]
  Select --> Dimensions["按需读取被选中的维度契约"]
  Dimensions --> Output["生成精简且可追溯的 design.md"]
```

1. **领域感知设计路由**
   - 触发条件：design artifact 需要生成或完善。
   - 预期行为：agent 先识别项目领域标签和本次变更触点，可多标签组合，例如 `frontend-react + desktop`。

2. **按需加载领域 profile**
   - 触发条件：识别到领域标签。
   - 预期行为：只读取命中的 `domain-profiles/*.md`，例如 Electron + React change 读取 `frontend.md` 和 `desktop.md`，不读取后端、CLI、SDK profile。

3. **维度选择与输出优先级**
   - 触发条件：领域 profile 与变更触点合并完成。
   - 预期行为：每个 D1-D14 维度被标为 `core`、`supporting`、`checklist` 或 `skip`；只有 `core` 在正文详细展开。

4. **大白话运行边界设计**
   - 触发条件：变更涉及宿主层、页面层、进程、worker、native bridge、后端服务等运行位置差异。
   - 预期行为：使用 `D03 运行边界与职责归属`，说明“东西运行在哪里、谁负责什么、不负责什么”，不再使用抽象的 ownership 命名。

5. **UI/交互设计维度**
   - 触发条件：变更涉及页面、组件、弹窗、状态、设计稿、桌面壳层或视觉适配。
   - 预期行为：D7 引用 `ui-fidelity-playbook` 的范围、运行层次、设计事实、高风险失真点、状态变体和验证思路；无设计事实时明确不能声称高保真。

6. **安全 lens 设计维度**
   - 触发条件：变更涉及外部输入、权限、敏感数据、API、preload/IPC、CLI 参数或 SDK 公开 API。
   - 预期行为：D10 输出统一安全章节，但按 frontend/backend-api/desktop/cli/sdk lens 写风险与缓解；完整 STRIDE 只在合适场景启用。

7. **模板复制与当前运行时同步**
   - 触发条件：实现模板改造。
   - 预期行为：`templates/skills/technical-design` 是分发源，`.harness/skills/technical-design` 是当前仓库副本，两者保持一致。

## 需求边界

**In Scope:**

- 重写 `technical-design` skill 的入口流程和方法论说明。
- 新增 `technical-design/references/dimension-selection.md` 短入口。
- 新增 `technical-design/references/domain-profiles/*.md`，覆盖首版领域 profile：frontend、backend、desktop、mobile、cli、sdk、devops、custom。
- 新增 `technical-design/references/dimensions/D01-D14*.md`，定义方案设计维度输出契约。
- 将 `D03` 命名为“运行边界与职责归属”。
- 将 D7 UI/交互维度与 `ui-fidelity-playbook` 建立引用关系。
- 将 D10 安全与隐私维度设计为统一章节 + 多领域 lens。
- 更新 `superpowers-lite` schema 和 design 模板，使其指向领域感知维度选择和输出优先级。
- 新增/更新模板回归测试，验证参考文件复制和 schema/template 关键文案。
- 更新 `technical-design` 版本记录。

**Out of Scope:**

- 不修改 OpenSpec CLI 的 artifact 状态机、schema 解析器或 apply 执行器。
- 不自动迁移历史 `openspec/changes/**/design.md`。
- 不把 `domain-init` 的 R1-R23 矩阵整体搬进 `technical-design`；只复用其“领域识别 + 适用性过滤”思想。
- 不创建按领域完整复制的 `frontend-design.md`、`backend-design.md`、`desktop-design.md` 模板。
- 不引入新的运行时代码依赖。
- 不新增独立 UI 设计生成 skill；D7 只引用已有 `ui-fidelity-playbook` 的高保真落地方法。

## 探索过的替代方向

| 方案 | 结论 | 取舍理由 |
| --- | --- | --- |
| 保持现有 `technical-design`，仅在模板中提示“按需省略” | 不采纳 | 模板已有按需提示，但 skill 红线和 schema 描述仍会把 agent 拉向固定后台方法论 |
| 为每个领域写完整 design md，例如 `frontend-design.md`、`backend-design.md` | 不采纳 | 短期直观，长期 D8/D10/D13 等内容重复维护，混合领域 change 难组合 |
| 只建 D1-D14 维度，不拆领域 profile | 不采纳 | 维度抽象清楚，但缺少“什么时候启用”和“输出多深”的领域差异，仍可能全量展开 |
| 直接复用 `domain-init` 的检测和 R1-R23 矩阵 | 部分采纳 | domain-init 是项目级规则/skill/agent 生成器；technical-design 需要变更级方案设计维度，应借鉴思想而不是照搬 |
| D10 中内置所有启用条件 | 不采纳 | 启用条件属于维度选择层；D10 自身只应定义启用后的输出契约和 lens |
| 短入口 + 领域 profile + 维度文件 | 采纳 | 上下文加载可控，混合领域可组合，维度契约集中维护，符合 AGENTS.md 的“先索引，后加载”纪律 |

## 待确认项

无当前阻塞项。首版领域 profile 和 D1-D14 具体字段可在后续 `design.md` artifact 中展开并校准。
