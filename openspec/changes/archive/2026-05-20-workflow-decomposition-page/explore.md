## 调查范围

基于 brainstorm.md，聚焦以下区域：
1. `web/index.html` 工作流演示 section（将被精简为入口）
2. `web/assets/styles.css` 共享样式体系（新页面需复用）
3. 导航栏结构（新页面需加入导航）
4. 已归档 change `add-telemetry`（贯穿案例素材）

## 现有架构

### web/ 页面结构

```
web/
├── index.html              ← 主页，含工作流演示 section（L189-530+）
├── architecture.html       ← 架构设计页
├── best-practices.html     ← 最佳实践页
├── changelog.html          ← 变更日志页
├── stats.html              ← 统计页
├── assets/
│   ├── styles.css          ← 全局共享样式（173 行）
│   └── favicon.ico
└── v1/                     ← 旧版页面
```

### 共享样式体系（styles.css）

| 类别 | 关键 class | 用途 |
|------|-----------|------|
| 色彩变量 | `--accent`, `--cyan`, `--purple`, `--yellow` 等 | dark theme 统一色板 |
| 布局 | `.container`, `.section-alt`, `--max-w: 1120px` | 页面容器 |
| 导航 | `.nav-inner`, `.nav-logo`, `.nav-links` | 粘性顶栏，`active` class 标记当前页 |
| 排版 | `.stitle`, `.sdesc`, `.tag` | section 标题、描述、标签 |
| 卡片 | `.what-card`, `.pillar`, `.princ` | 卡片式内容容器 |
| 按钮 | `.btn-p`（主色）, `.btn-g`（灰底） | CTA 按钮 |
| 代码窗 | `.code-window`, `.code-body` | 模拟终端样式 |
| 表格 | `table`, `th`, `td` | 深色表格 |
| 响应式 | `@media 1024/768/480px` | 三档断点 |

### 导航栏

当前 4 个页面链接：首页 → 架构设计 → 最佳实践 → 变更日志 → GitLab 图标。新页面 `workflow.html` 需加入导航（建议在"首页"和"架构设计"之间）。

### 工作流演示 section 现状（index.html L189-530+）

- 位于 `<section id="workflow" class="section-alt">`
- 5 个 tab：门禁模式（默认激活）、快速通道、缺陷修复、技术方案、代码审查
- 每个 tab 用 `.wf-timeline` + `.wf-step` 组织步骤卡片
- 自定义样式大量内联在 `<style>` 中（`.wf-tab`, `.wf-step`, `.wf-badge`, `.wf-gate` 等）
- 用 `switchTab()` JS 函数切换面板可见性

精简方案：将整个 `.wf-timeline` 内容移除，保留 section 框架，替换为一段概述文案 + "了解完整工作流"按钮链接到 `workflow.html`。

## 关键代码路径

### 页面创建路径

1. 新建 `web/workflow.html`
2. 引入 `./assets/styles.css` 共享样式
3. 复用导航栏 HTML（修改 `active` 标记）
4. 页面专属样式写在 `<style>` 内联（与 architecture.html、index.html 模式一致）
5. Step Indicator 交互需少量 JS（滚动监听 + 点击跳转）

### index.html 修改路径

1. 移除 `.workflow-tabs` 和所有 `.wf-panel` 内容
2. 移除对应的内联 CSS（`.wf-tab`, `.wf-step`, `.wf-badge`, `.wf-gate` 等）
3. 移除 `switchTab()` JS 函数
4. 替换为简洁的概述 + 按钮
5. 导航栏新增 `workflow.html` 链接

### 案例素材路径

归档 change `add-telemetry` 的 artifact：

| 文件 | 大小 | 用于展示 |
|------|------|---------|
| brainstorm.md | 2.6K | Spec - 提问发散 |
| explore.md | 2.0K | Spec - 探索与设计 |
| design.md | 5.6K | Spec - 探索与设计 |
| proposal.md | 1.4K | Spec - 方案定稿 |
| tasks.md | 5.0K | Spec - 方案定稿 |
| human-review.html | 18.9K | Spec - 人工评审 |
| verify.md | 752B | Growth - 验证交付 |
| retrospective.md | 552B | Growth - 知识回顾 |

## 风险与约束

| 风险 | 影响 | 缓解 |
|------|------|------|
| 导航栏改动影响所有页面 | 所有页面需同步添加 workflow 链接 | 逐个文件更新 nav-links |
| index.html 工作流 section 移除后页面变短 | 首页内容减少，可能影响"首屏完整感" | 用精炼的概述 + 视觉亮点补偿 |
| Step Indicator 滚动监听性能 | 纯静态页面，影响极小 | 用 IntersectionObserver 替代 scroll 事件 |
| 案例 retrospective.md 内容适中 | Growth 阶段案例可正常展示 | 精简摘要即可 |

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue workflow-decomposition-page
