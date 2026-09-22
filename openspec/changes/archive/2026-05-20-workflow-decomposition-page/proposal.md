## Why

当前 `web/index.html` 的工作流演示按使用场景分 tab，缺少从阶段分解角度讲解"为什么要拆分工作流"的页面。用户难以理解 openspec（编排器）、SuperPowers（方法论库）、OMC/OMX（运行时引擎）三层协作模型的全貌。新建独立页面，用问题驱动的方式讲清楚 Spec → Code → Growth 三阶段分解的理念和具体做法，同时精简 index.html 避免内容重复。

## What Changes

**工作流展示载体**
- From: index.html 内嵌 5 个 tab 的工作流演示 section（~350 行 HTML + CSS + JS）
- To: index.html 精简为一段概述 + CTA 按钮，详细内容移至独立的 `workflow.html`
- Reason: 视角重构——从"按场景"改为"按阶段分解"，需要更大的内容空间
- Impact: 非破坏性，index.html 工作流 section 被替换，原有场景内容不再直接展示

**站点导航**
- From: 导航栏 4 个页面链接（首页、架构设计、最佳实践、变更日志）
- To: 新增"工作流"链接，插入首页与架构设计之间
- Reason: 新页面需要可达入口
- Impact: 需更新所有 6 个 HTML 文件的导航栏

## Capabilities

### 新增能力

- `workflow-page`: 独立的工作流分解页面（workflow.html），含三层模型可视化、Step Indicator 导航、三阶段子步骤卡片、真实案例片段嵌入
- `index-workflow-simplify`: index.html 工作流 section 精简为入口概述 + CTA 按钮，移除原有 tab/panel 内容及相关 CSS/JS

### 修改能力

- `nav-links-update`: 所有页面导航栏新增"工作流"链接

## Impact

- **web/workflow.html** — 新文件
- **web/index.html** — 工作流 section 重写 + 导航栏更新
- **web/architecture.html** — 导航栏更新
- **web/best-practices.html** — 导航栏更新
- **web/changelog.html** — 导航栏更新
- **web/stats.html** — 导航栏更新
- 不涉及 `src/` 代码变更，不涉及构建流程变更

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
