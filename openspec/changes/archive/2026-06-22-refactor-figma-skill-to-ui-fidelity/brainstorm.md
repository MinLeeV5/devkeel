## 一句话描述

将 `superpowers-lite` schema 引用的 `figma-fidelity-playbook` skill 重构为 `ui-fidelity-playbook`，去除 Figma 强依赖，使 UI 高保真实现方法论来源无关；Figma 降级为"设计事实来源之一"的可选最佳路径，无设计事实时软引用 `ui-ux-pro-max` 等设计类 skill。

## 需求背景

`figma-fidelity-playbook` 是 2026-06-20 通过 `add-ui-coverage-to-superpowers-lite` change 引入的 UI 高保真还原方法论 skill，作为 superpowers-lite 规划链路（brainstorm → design → specs → tasks → verify）的 UI 维度方法论锚点。

该 skill 的核心方法论——识别运行时层次（宿主/页面/组件/浮层/状态）、先结构后细节、分轮次收敛（结构→尺寸间距→字体→表面样式→资源→交互→状态→运行时）、提交前自验清单——**完全来源无关**。`references/checklist.md` 与 `traps.md` 的内容几乎 100% 通用。

但 skill 的以下部分强绑 Figma：

- `name` / `description` / `triggers` 绑定 Figma 品牌
- `SKILL.md`「与基础 Figma skill 的关系」整节描述 Figma MCP 流程（`get_design_context` / `get_screenshot`）作为必经入口
- 「何时不使用」声明"还没有拿到 Figma 上下文"时不使用

**链式后果**：schema.yaml 为绕开 skill 自声明"无 Figma 不使用"，在三处 instruction 引用（design/tasks/verify）里引入"有/无 Figma 上下文"分层逻辑——有 Figma 时调用 skill 完整流程，无 Figma 时"只应用其约束性原则"。这导致不使用 Figma 的项目（Sketch / Adobe XD / 截图 / 线框 / 无稿）在 schema 流程中被强制 Figma 语境，"应用约束性原则"时体验割裂。

**关键前提**：`figma-fidelity-playbook` 尚未随 `devkeel` npm 包发布（仅存在于仓库 git 历史），无用户侧迁移负担，不需要 update 清理废弃 skill 目录的逻辑。

## 项目现状与架构分析

### harness-cli 仓库架构

```
templates/                          发布模板源
  openspec/schemas/superpowers-lite/
    schema.yaml                     schema 定义（artifacts/instruction/apply）
    templates/                      各 artifact 模板
  skills/                           各 skill 的 SKILL.md + references
  versions-yml.yml                  所有模板资产版本唯一权威来源
openspec/                           项目自用副本（dogfood，与 templates/ 同步）
  schemas/superpowers-lite/         与 templates/ 版本完全一致
  changes/                          本 change 产出位置
.harness/skills/                    项目自用 skill 副本（与 templates/skills/ 同步）
```

### 受影响区域（7 个改动单元）

| # | 单元 | 路径 | 性质 |
|---|------|------|------|
| U1 | skill 主体重写 | `templates/skills/figma-fidelity-playbook/` → 重命名 `ui-fidelity-playbook/`，重写 SKILL.md + 3 references | 核心变更 |
| U2 | 项目自用副本同步 | `.harness/skills/figma-fidelity-playbook/` → 同步重命名 | 同步 U1 |
| U3 | 版本注册 | `templates/versions-yml.yml` | 删旧 key + 新增 `ui-fidelity-playbook: "1.0.0"` |
| U4 | schema instruction 统一去分层 | `templates/openspec/schemas/superpowers-lite/schema.yaml` 3 块（design/tasks/verify） | 去"有/无 Figma"分层 |
| U5 | schema 模板泛化 | `templates/openspec/schemas/superpowers-lite/templates/design.md` 2 处 (38, 44) | Figma 来源 → 泛化设计事实 + 软引用 |
| U6 | ~~schema version +1~~ | — | **撤销**（schema 未发布，version 保持 7） |
| U7 | runtime 副本同步 | `openspec/schemas/superpowers-lite/...` 对应文件 | 随 templates/ 同步 |

### figma-fidelity-playbook 当前结构

```
templates/skills/figma-fidelity-playbook/
  SKILL.md                  name/description/triggers 绑 Figma；「与基础 Figma skill 的关系」节绑 MCP 流程
  references/workflow.md    §3「获取设计事实」列 Figma 术语（结构化设计上下文/页面截图/子节点上下文）
  references/traps.md       7 类失真点，内容 100% 通用，仅标题带"Figma"
  references/checklist.md   6 大类自验清单，内容 100% 通用，仅开篇带"Figma"
```

### schema.yaml 引用分布（3 个 instruction 块）

| 行 | instruction 块 | 内容 |
|----|---------------|------|
| 93-96 | design | UI 设计章节指引 + 对齐 figma-fidelity-playbook 探索维度 + 有/无 Figma 分层 |
| 157-158 | tasks | UI 任务分轮次收敛，引用 figma-fidelity-playbook |
| 375-380 | verify | UI 还原度验证，引用 figma-fidelity-playbook checklist，对照 Figma 截图 |

### design.md 模板两处引用

| 行 | 内容 |
|----|------|
| 38 | UI 设计章节注释，对齐 figma-fidelity-playbook 探索维度 |
| 44 | "设计稿对齐：Figma 来源与节点；有上下文时调用 figma-fidelity-playbook" |

## 风险与约束

| 风险/约束 | 说明 | 缓解 |
|---------|------|------|
| 向后兼容 | skill 改名是 breaking 变更 | figma-fidelity-playbook 未发布，无用户侧迁移负担；ui-fidelity-playbook 作为新 key 从 1.0.0 起步 |
| 两份 schema 同步 | templates/ 与 openspec/ 两份必须一致 | U7 强制同步，验证用 diff |
| 软引用 ui-ux-pro-max 不假设已安装 | 用户侧不一定有 ui-ux-pro-max skill | 软引用措辞"如已安装设计类 skill（如 ui-ux-pro-max 等）"，"如已安装"+"等"同时承担可选与开放语义 |
| skill-versioning 合规 | 自有 skill 改名重构的版本号处理 | ui-fidelity-playbook 是注册表新 key，走"新增自有 Skill"流程 1.0.0；figma-fidelity-playbook 走"删除资产"移除条目 |
| schema version 是否升版 | instruction 变更按规范应 +1 | schema 未发布，version 保持 7 不升版 |
| Figma 最佳路径丢失 | 去耦合后 Figma 用户失去 MCP 流程指引 | skill 保留「来源为 Figma 时的最佳实践」子节，MCP 流程降级为"来源之一、效果最佳"而非必经入口 |

**向后兼容性**：figma-fidelity-playbook 未发布，无任何用户持有该 skill。重构后用户侧效果等同"新增 ui-fidelity-playbook skill"，不存在升级路径断裂。

**现有测试覆盖**：harness-cli 有 vitest 套件，本 change 改动的是模板资产（markdown/yaml），不涉及 src/ 运行时代码，现有测试不受影响；新增校验以 diff/grep 为主。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 使用 superpowers-lite 的非 Figma 项目（Sketch/截图/线框/无稿） | schema 流程不再强制 Figma 语境；UI 方法论可用 |
| 使用 superpowers-lite 的 Figma 项目 | Figma MCP 最佳路径仍保留，效果不打折 |
| 无设计事实的项目 | 明确划界到 ui-ux-pro-max 等设计类 skill，不在 fidelity skill 里硬套 |
| schema 维护者 | 改动是否向后兼容、两份 schema 同步、skill-versioning 合规 |

## 核心功能用例

### 用例 1：非 Figma 项目使用 ui-fidelity-playbook

- **触发**：项目用 Sketch/Adobe XD/截图/线框作为设计意图来源，涉及 UI 变更
- **行为**：schema 三处引用 ui-fidelity-playbook，不带"有/无 Figma"分层；skill 的「设计事实的最小契约」接受任意来源
- **预期**：非 Figma 项目在 design/tasks/verify 全链路获得 UI 方法论指导，不被 Figma 语境排斥

### 用例 2：Figma 项目仍走 MCP 最佳路径

- **触发**：项目用 Figma 作为设计意图来源
- **行为**：skill 的「来源为 Figma 时的最佳实践」子节保留 MCP 流程（确认节点 → get_design_context → get_screenshot → 子节点上下文 → 用本 skill）
- **预期**：Figma 用户体验不降级，MCP 流程作为"结构化程度最高、效果最佳"的路径保留

### 用例 3：无设计事实时划界到设计类 skill

- **触发**：完全无设计事实（无设计稿/截图/线框/明确视觉参考，仅口头需求）
- **行为**：skill「何时不使用」声明不归本 skill；软引用"如已安装设计类 skill（如 ui-ux-pro-max 等），可先用其产出设计意图，再回到本 skill"
- **预期**：无稿项目不被强行套用还原方法论，明确路由到创造设计

### 用例 4：schema 三处统一引用（去分层）

- **触发**：任意涉及 UI 变更的 change 走 superpowers-lite 流程
- **行为**：design/tasks/verify 三处 instruction 统一引用 ui-fidelity-playbook，不再区分"有/无 Figma 上下文"；verify 的"对照 Figma 截图"改为"对照设计事实（设计稿/截图等）"
- **预期**：schema 简洁，分层逻辑消失；软引用在 schema 侧仅 design.md 模板注释一处落点

## 需求边界

**In Scope:**

- skill 重命名：`templates/skills/figma-fidelity-playbook/` → `ui-fidelity-playbook/`，4 文件重写（SKILL.md + 3 references）
- SKILL.md 重构：name/description/triggers 去 Figma；「与基础 Figma skill 的关系」节重构为「设计事实来源」（含通用最小契约 + Figma 最佳实践子节）；「何时不使用」加无设计事实划界 + 软引用
- references：workflow.md 标题 + §3 泛化；traps.md/checklist.md 仅改标题与个别 Figma 字样（方法论内容保留）
- 版本注册：删 `figma-fidelity-playbook` 条目，新增 `ui-fidelity-playbook: "1.0.0"`；SKILL.md metadata.version `"1.0.0"`
- schema.yaml 三块 instruction 改写：design（去分层）、tasks（改名）、verify（改名 + Figma 截图→设计事实）
- design.md 模板两处：第 38 行改名；第 44 行泛化来源 + 软引用
- runtime 副本同步：openspec/schemas/superpowers-lite/ 对应文件
- 项目自用副本同步：.harness/skills/ui-fidelity-playbook/

**Out of Scope:**

- 不改 schema.yaml version（未发布，保持 7）
- 不处理 update 清理废弃 skill 目录逻辑（figma-fidelity-playbook 未发布，无用户侧残留）
- 不改动 ui-ux-pro-max skill 本身（不属本项目，仅作软引用文本提及）
- 不改动 src/ 运行时代码、不改动 CLI 命令注册
- 不改工作流拓扑（artifact 顺序、依赖、optional 标记不变）
- 不改已归档的 `openspec/changes/archive/2026-06-20-add-ui-coverage-to-superpowers-lite/`（历史产物）

## 探索过的替代方向

| 替代方向 | 取舍 |
|---------|------|
| **B. 扩展为完整 UI/UX 全流程 skill**（覆盖无稿创造性设计：配色/字体/风格/组件决策） | 否决。与 ui-ux-pro-max 定位重叠，需大量新增内容，违背去耦合初衷；丢失"还原方法论"独特价值 |
| **C. 还原方法论为主 + 无稿决策指引**（A 为主 + 轻量补充无稿 UI 决策） | 否决。A 已满足核心诉求，C 的无稿指引会把 skill 拉回创造设计领域，与 ui-ux-pro-max 重叠 |
| **策略 Y. 保留"有无设计事实"分层**（分层从 Figma 换为设计事实） | 否决。分层原始动机（绕开 skill 自声明"无 Figma 不用"）已消失；"约束性原则 vs 完整流程"语义模糊，会把模糊带进 schema |
| **版本号 2.0.0**（按 breaking 升 major） | 否决。ui-fidelity-playbook 是注册表新 key，走"新增自有 Skill"1.0.0；2.0.0 会造成新 key 断档（从未注册过 1.0.0 直接跳 2.0.0） |
| **写法 1. 不点名 ui-ux-pro-max**（纯划界，不提任何工具） | 否决。用户装了 ui-ux-pro-max 却不知道能接本 skill 上游，丢失有价值链路；软引用（写法 2）用"如已安装"+"等"兼顾可选与开放 |
| **A + ui-fidelity-playbook + 写法 2 + 策略 X**（推荐） | 采纳。最小改动、来源无关、保留 Figma 最佳路径、软引用可选、schema 去分层 |

## 待确认项

无。关键决策已在讨论中收敛：

| 决策点 | 选定值 |
|--------|--------|
| skill 定位 | A — 聚焦"按设计意图高保真实现"，来源无关 |
| 无设计事实划界 | a — skill 不覆盖，软引用 ui-ux-pro-max 等 |
| 新名字 | ui-fidelity-playbook |
| 软引用写法 | 写法 2 — 点名但不强依赖（"如已安装……等"） |
| schema 改写 | 策略 X — 统一去分层，三处统一引用 |
| 版本号 | 1.0.0（新 key，新增自有 skill） |
| schema version | 保持 7（未发布） |
| update 清理逻辑 | 跳过（未发布，无用户侧残留） |
