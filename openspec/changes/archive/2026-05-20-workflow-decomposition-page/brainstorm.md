## TL;DR

创建独立的 `workflow.html` 页面，从**工作流分解**视角讲解 Spec → Code → Growth 三阶段，突出 openspec（编排器）+ SuperPowers（方法论库）+ OMC/OMX（运行时引擎）的三层协作模型，兼顾理念传达和操作指引。

## 需求背景

当前 `web/index.html` 的「工作流演示」按使用场景分 tab（快速提案、门禁方案、修缺陷等），视角是"我要做 X → 看 X 的流程"。但缺少一个从**阶段分解**角度讲解的页面——为什么要把与 Agent 的协作拆成 Spec → Code → Growth，每个阶段用什么工具、做了什么、产出是什么。

核心观点：**每次与 Agent 的会话无非就是这几个环节，每个环节用上当下社区最适合的工具，就能使 Agent 的产出是最高质量的。**

痛点（问题驱动开场）：
- 直接让 Agent 写代码，产出不稳定——因为跳过了 spec
- 没有质量门禁——缺少 TDD、review 等工程实践
- 做完就忘——没有知识沉淀，每次从零开始

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 潜在用户 | 理解"为什么要分阶段"、"这样做比一个 prompt 搞定好在哪" |
| 已有用户 | 了解每个阶段的具体步骤、工具使用方式、最佳实践 |

页面结构兼顾两者：上半部分讲理念（问题驱动 + 三层模型），下半部分给每个阶段的子步骤明细。

## 核心功能用例

### 宏观架构叙事——三层模型

页面需突出三个角色的分工：

| 层 | 角色 | 职责 |
|----|------|------|
| openspec | 流程编排器 | 定义阶段、管理 artifact 依赖、驱动流转、归档沉淀。贯穿 `new` → `continue` → `apply` → `archive` 全生命周期 |
| SuperPowers | 方法论工具库 | 提供每个阶段的具体 skill：需求分析、苏格拉底提问、TDD、worktree、代码审查、原子提交、归档复盘等 |
| OMC / OMX | 运行时编排引擎 | 自动选择引擎、调度 skill、多 agent 协调。在 Code 阶段接管执行 |

每个阶段都在用 SuperPowers 的方法论，侧重不同：
- Spec 侧重需求分析 / 头脑风暴类 skill
- Code 侧重 TDD / review / commit 类 skill
- Growth 侧重归档 / 复盘类 skill

### Spec 阶段（4 子步骤）

| 子步骤 | 做了什么 | 产物 |
|--------|---------|------|
| 提问发散 | 苏格拉底式提问 + 5W1H / SCAMPER，一次一个问题，选择题优先，发散问题空间 | brainstorm.md |
| 探索与设计 | 扫描代码现状、梳理依赖、产出初步方案 | explore.md + design.md |
| 方案定稿 | 收敛为可执行方案，拆解任务清单 | proposal.md + specs/ + tasks.md |
| 人工评审 | 生成 human-review 报告，供人工阅读和决策 | human-review.html |

### Code 阶段（4 子步骤）

| 子步骤 | 做了什么 | 关键点 |
|--------|---------|-------|
| 运行时选择 | 自动检测环境，选用 omc 或 omx 作为编排引擎 | 按能力匹配，无需人工选择 |
| 隔离执行 | 在 git worktree 中独立工作，不影响主分支 | 安全回退、并行开发 |
| TDD 驱动实现 | 先写测试 → 实现代码 → 测试通过 | 把人类工程实践自动化 |
| 审查与提交 | review-orchestrator 审查 + commit skill 原子提交 | 质量门禁自动执行 |

### Growth 阶段（3 子步骤）

| 子步骤 | 做了什么 | 关键点 |
|--------|---------|-------|
| 验证交付 | spec vs 实现一致性校验 | verify.md 记录验证结果 |
| 归档沉淀 | `/opsx:archive` 结构化归入知识库 | 变更记录可检索、可追溯 |
| 知识回顾 | 自动产出 retrospective，沉淀经验教训 | 后续会话可加载已沉淀上下文，实现知识复用 |

### 贯穿案例

使用已归档的真实 change `add-telemetry` 作为贯穿案例（为 CLI 新增遥测能力），展示每个子步骤的真实产出片段（brainstorm.md、design.md、tasks.md、human-review.html 等）。该案例各 artifact 内容丰富（design 5.6K、tasks 5.0K），适合完整展示全流程。

### 页面交互

- **横向 Step Indicator**：① Spec → ② Code → ③ Growth，滚动/点击时高亮对应阶段
- **每个阶段 section** 包含子步骤卡片，展示做了什么 + 案例片段
- **顶部理念区**：问题驱动开场 → 三层模型图

### 与 index.html 的关系

index.html 的工作流 section 精简为一段概述 + 一个"了解完整工作流"按钮，链接到 `workflow.html`。

## 需求边界

**In Scope:**
- 新建 `web/workflow.html` 独立页面
- 三阶段 × 子步骤的完整内容
- 三层模型（openspec / SuperPowers / OMC）的可视化
- 真实案例片段嵌入
- index.html 工作流 section 精简为入口
- 与现有 web/ 页面保持统一的视觉风格（dark theme、Inter/JetBrains Mono 字体）

**Out of Scope:**
- 不改动现有 `architecture.html`、`best-practices.html` 等页面内容
- 不新增后端逻辑，纯静态 HTML
- 不涉及 CLI 代码变更

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 保留 index 工作流 section + 新页面互链 | 未采纳——两处维护成本高，且视角重叠 |
| 完全替换 index 工作流 section | 未采纳——index 需要保留一个简洁入口 |
| 纵向长页面无导航 | 未采纳——缺少阶段推进的视觉感 |
| Tab 切换 | 未采纳——三个阶段是线性关系，tab 暗示并列 |
| 虚拟案例 | 未采纳——真实归档 change 更有说服力 |

## 待确认项

- `workflow.html` 文件名是否确定，还是用其他名称（如 `workflow-guide.html`）
—— 用 `workflow.html`
- 案例 `refactor-architecture-domain-section` 的内容是否需要脱敏或精简后再嵌入
—— 精简嵌入即可，不要太多内容，只摘抄关键内容
- 是否需要在页面底部加 CTA（如"立即安装 harness"或"查看更多案例"）
—— 不用