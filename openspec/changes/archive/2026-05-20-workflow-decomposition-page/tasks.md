# 工作流分解页面 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 中的
> 平台感知路由选择执行器（omc ralph / omx ralph / subagent-driven-development），
> 逐任务实现本计划。

**目标：** 新建 `web/workflow.html` 独立页面，从工作流分解视角展示 Spec → Code → Growth 三阶段，同步精简 index.html 并更新全站导航。

**架构：** 纯静态 HTML 页面，复用 `web/assets/styles.css` 全局样式体系，页面专属样式内联。Step Indicator 用 IntersectionObserver 实现滚动高亮。案例片段从归档 change `add-telemetry` 精简摘抄嵌入。

**技术栈：** HTML + CSS + vanilla JS（IntersectionObserver）

---

## 1. 案例素材准备

- [x] **1.1 从 add-telemetry 归档 change 提取案例片段**
  1. 读取 `openspec/changes/archive/2026-05-18-add-telemetry/` 下的 brainstorm.md、design.md、tasks.md、verify.md、retrospective.md
  2. 为每个子步骤精简摘抄关键内容（每段不超过 10 行），记录到实现时直接嵌入
  3. human-review.html 不嵌入内容，用文字描述 + 截图示意

## 2. workflow.html 主体页面

- [x] **2.1 页面骨架与导航栏**
  1. 创建 `web/workflow.html`，引入共享字体和 `./assets/styles.css`
  2. 复制统一导航栏 HTML，"工作流"链接标记为 `active`
  3. 添加统一页脚
  4. 验证：浏览器打开页面，导航栏和页脚正常渲染
  > commit: feat(web): 创建 workflow.html 页面骨架

- [x] **2.2 Hero section — 问题驱动开场**
  1. 实现 Hero 区域：三个痛点（跳过 spec / 无门禁 / 无沉淀）
  2. 引出核心观点文案
  3. 样式：复用 `.hero` 系列样式模式，适配 dark theme
  4. 验证：浏览器查看 Hero 区域的文案和视觉效果
  > commit: feat(web): workflow 页面 Hero section 问题驱动开场

- [x] **2.3 三层模型可视化**
  1. 实现三列卡片（openspec 紫色 / SuperPowers 绿色 / OMC 青色）
  2. 复用 `.pillar` 样式，添加角色名称、副标题、职责描述
  3. 添加三者协作关系的说明文字
  4. 验证：浏览器查看三列布局和配色
  > commit: feat(web): workflow 页面三层模型可视化

- [x] **2.4 Step Indicator 粘性导航**
  1. 实现横向 Step Indicator：三个圆形节点 + 连接线
  2. CSS：`position: sticky; top: 56px`，z-index 低于导航栏
  3. JS：点击节点 smooth scroll 到对应 section
  4. JS：IntersectionObserver 监听三个阶段 section，切换高亮
  5. 验证：点击跳转正常、滚动高亮切换正确
  > commit: feat(web): workflow 页面 Step Indicator 导航

- [x] **2.5 Spec 阶段 section**
  1. 实现 4 个子步骤卡片（提问发散、探索与设计、方案定稿、人工评审）
  2. 每个卡片包含：序号、标题、产物标签（badge）、描述文字
  3. 嵌入案例片段（`.code-window` 样式）：brainstorm 摘要、design 关键决策、tasks 清单片段
  4. 人工评审卡片用文字描述 human-review.html 的作用
  5. 验证：浏览器查看 4 个卡片的内容和案例展示
  > commit: feat(web): workflow 页面 Spec 阶段内容

- [x] **2.6 Code 阶段 section**
  1. 实现 4 个子步骤卡片（运行时选择、隔离执行、TDD 驱动实现、审查与提交）
  2. 每个卡片包含：序号、标题、描述文字、关键亮点
  3. 突出"把人类工程实践自动化"叙事
  4. 验证：浏览器查看 4 个卡片内容
  > commit: feat(web): workflow 页面 Code 阶段内容

- [x] **2.7 Growth 阶段 section**
  1. 实现 3 个子步骤卡片（验证交付、归档沉淀、知识回顾）
  2. 嵌入案例片段：verify.md 验证清单、retrospective.md 经验总结
  3. 知识回顾卡片包含知识复用愿景说明
  4. 验证：浏览器查看 3 个卡片内容和案例展示
  > commit: feat(web): workflow 页面 Growth 阶段内容

- [x] **2.8 响应式适配**
  1. 测试 1024px / 768px / 480px 三个断点
  2. 三层模型卡片窄屏堆叠、Step Indicator 缩小、子步骤卡片全宽
  3. 修复任何断点下的布局问题
  4. 验证：浏览器 DevTools 逐个断点检查
  > commit: style(web): workflow 页面响应式适配

## 3. index.html 精简

- [x] **3.1 替换工作流 section**
  1. 移除 `#workflow` section 内的所有 `.wf-tab`、`.wf-panel`、`.wf-timeline` 内容
  2. 替换为概述文案 + "了解完整工作流" CTA 按钮（`<a href="./workflow.html" class="btn btn-p">`）
  3. 移除 `.wf-` 前缀的全部内联 CSS 规则
  4. 移除 `switchTab()` JavaScript 函数
  5. 验证：浏览器打开 index.html，工作流 section 展示精简内容，CTA 按钮链接正确
  > commit: refactor(web): 精简 index.html 工作流 section 为入口

## 4. 全站导航栏更新

- [x] **4.1 所有页面导航栏新增"工作流"链接**
  1. 在以下 5 个文件的 `.nav-links` 中，在"首页"和"架构设计"之间插入 `<a href="./workflow.html">工作流</a>`：
     - `web/index.html`
     - `web/architecture.html`
     - `web/best-practices.html`
     - `web/changelog.html`
     - `web/stats.html`
  2. 确保每个页面各自的 `active` class 正确（只有当前页高亮）
  3. 验证：逐个打开 6 个页面，检查导航链接顺序和 active 状态
  > commit: feat(web): 全站导航栏新增工作流页面链接

## 5. 最终验证

- [x] **5.1 全站联调**
  1. 依次打开 6 个页面，检查导航栏一致性
  2. workflow.html 全流程走查：Hero → 三层模型 → Step Indicator 交互 → 三个阶段 section → 案例片段 → 响应式
  3. index.html CTA 按钮链接正确
  4. 无控制台错误、无样式异常
  > commit: 无（验证通过即可）

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
