## ADDED Requirements

### Requirement: 工作流 section 精简

index.html 的工作流 section（`#workflow`）SHALL 被替换为一段概述文案和一个指向 workflow.html 的 CTA 按钮，移除所有原有的 tab 切换、timeline 面板及相关内联 CSS 和 JS。

#### Scenario: 精简后的 section 内容
- **WHEN** 用户访问 index.html 并滚动到工作流 section
- **THEN** 展示标题"从需求到交付，完整闭环"、一段概述（提及 Spec → Code → Growth 三阶段和三层模型）、一个"了解完整工作流"主色按钮

#### Scenario: CTA 按钮跳转
- **WHEN** 用户点击"了解完整工作流"按钮
- **THEN** 导航到 `./workflow.html`

### Requirement: 移除冗余代码

index.html SHALL 移除以下内联样式和脚本：`.workflow-tabs`、`.wf-tab`、`.wf-panel`、`.wf-step`、`.wf-timeline`、`.wf-badge`、`.wf-gate`、`.wf-cmd` 相关 CSS 规则，以及 `switchTab()` JavaScript 函数。

#### Scenario: 无残留样式和脚本
- **WHEN** index.html 精简完成后
- **THEN** 页面中不存在 `.wf-` 前缀的 CSS class 定义，不存在 `switchTab` 函数定义

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
