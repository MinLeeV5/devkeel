## ADDED Requirements

### Requirement: 页面结构

workflow.html SHALL 包含以下顶层结构：统一导航栏、问题驱动开场 Hero section、三层模型可视化（openspec / SuperPowers / OMC）、粘性 Step Indicator、三个阶段 section（Spec / Code / Growth）、统一页脚。

#### Scenario: 页面加载后展示完整结构
- **WHEN** 用户访问 workflow.html
- **THEN** 页面自上而下依次渲染：导航栏 → Hero → 三层模型 → Step Indicator → Spec section → Code section → Growth section → 页脚

### Requirement: 问题驱动开场

Hero section SHALL 以三个痛点问题开场（跳过 spec 导致产出不稳定、缺少质量门禁、无知识沉淀），然后引出核心观点："每个环节用上最适合的工具，Agent 产出最高质量"。

#### Scenario: 痛点与核心观点展示
- **WHEN** 用户查看 Hero section
- **THEN** 页面展示三个痛点描述，紧随其后展示核心观点文案

### Requirement: 三层模型可视化

页面 SHALL 用三列卡片展示 openspec（流程编排器，紫色）、SuperPowers（方法论工具库，绿色）、OMC/OMX（运行时编排引擎，青色）的角色分工，并说明三者的协作关系。

#### Scenario: 三层模型卡片渲染
- **WHEN** 用户滚动到三层模型区域
- **THEN** 展示三张并排卡片，每张包含角色名称、副标题、职责描述，颜色分别对应 `--purple`、`--accent`、`--cyan`

### Requirement: Step Indicator 导航

页面 SHALL 提供横向 Step Indicator（① Spec → ② Code → ③ Growth），粘性定位于导航栏下方（`top: 56px`）。支持点击跳转和滚动高亮。

#### Scenario: 点击跳转
- **WHEN** 用户点击 Step Indicator 上的某个阶段节点
- **THEN** 页面 smooth scroll 到对应阶段 section

#### Scenario: 滚动高亮
- **WHEN** 用户滚动页面使某个阶段 section 进入视口
- **THEN** Step Indicator 上对应节点高亮（`--accent` 色），其他节点恢复灰色

### Requirement: Spec 阶段内容

Spec section SHALL 展示 4 个子步骤卡片：提问发散（brainstorm）、探索与设计（explore + design）、方案定稿（proposal + specs + tasks）、人工评审（human-review）。每个子步骤包含描述文字和案例片段。

#### Scenario: Spec 子步骤卡片展示
- **WHEN** 用户查看 Spec section
- **THEN** 展示 4 个纵向排列的子步骤卡片，每个包含序号、标题、产物标签、描述和案例片段

### Requirement: Code 阶段内容

Code section SHALL 展示 4 个子步骤卡片：运行时选择、隔离执行（worktree）、TDD 驱动实现、审查与提交。描述侧重"把人类工程实践自动化"的核心叙事。

#### Scenario: Code 子步骤卡片展示
- **WHEN** 用户查看 Code section
- **THEN** 展示 4 个纵向排列的子步骤卡片，每个包含序号、标题、描述和关键亮点

### Requirement: Growth 阶段内容

Growth section SHALL 展示 3 个子步骤卡片：验证交付（verify）、归档沉淀（archive）、知识回顾（retrospective）。知识回顾子步骤 SHALL 提及后续会话可加载已沉淀上下文的复用愿景。

#### Scenario: Growth 子步骤卡片展示
- **WHEN** 用户查看 Growth section
- **THEN** 展示 3 个纵向排列的子步骤卡片，知识回顾卡片包含知识复用的愿景说明

### Requirement: 案例片段嵌入

页面 SHALL 从归档 change `add-telemetry` 中精简摘抄关键内容，以代码窗口样式嵌入 Spec 和 Growth 阶段的子步骤卡片中。

#### Scenario: 案例片段在 Spec 阶段展示
- **WHEN** 用户查看 Spec section 的子步骤卡片
- **THEN** 提问发散卡片展示 brainstorm.md 摘要，探索与设计展示 design.md 关键决策，方案定稿展示 tasks.md 任务清单片段

#### Scenario: 案例片段在 Growth 阶段展示
- **WHEN** 用户查看 Growth section 的子步骤卡片
- **THEN** 验证交付展示 verify.md 验证清单，知识回顾展示 retrospective.md 经验总结

### Requirement: 视觉风格一致性

workflow.html SHALL 复用现有 `web/assets/styles.css` 的全局样式（dark theme、色彩变量、字体、导航栏、按钮、表格等），页面专属样式写在内联 `<style>` 中。

#### Scenario: 样式继承
- **WHEN** workflow.html 加载
- **THEN** 页面的背景色、字体、导航栏、页脚样式与 index.html 等其他页面一致

### Requirement: 响应式布局

workflow.html SHALL 在三个断点（1024px / 768px / 480px）下正确适配：三层模型卡片在窄屏堆叠，Step Indicator 保持可用，子步骤卡片全宽展示。

#### Scenario: 窄屏适配
- **WHEN** 屏幕宽度小于 768px
- **THEN** 三层模型卡片从三列变为单列堆叠，Step Indicator 节点缩小但仍可点击

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
