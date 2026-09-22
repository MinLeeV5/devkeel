# Web 文档重构实现计划

> **给 agentic 执行器：** 使用 superpowers:subagent-driven-development
> 按任务逐个实现本计划。

**目标：** 将 `web/index.html` 拆分为 3 个页面 + 1 个共享 CSS 文件，首页聚焦核心价值。

**架构：** 从 index.html 抽取公共 CSS 到 `assets/styles.css`，各页面通过 `<link>` 引用。页面专属样式保留内联 `<style>`。4 个页面使用统一导航栏，`class="active"` 标记当前页。

**技术栈：** 纯 HTML + CSS，无构建工具，无 JavaScript 框架。

---

## 1. 共享样式抽取（shared-styles）

- [x] **1.1 创建 `web/assets/styles.css`**
  1. 从 `web/index.html` 的 `<style>` 标签中提取以下样式块到 `web/assets/styles.css`：
     - `:root` 变量定义（`--bg` 到 `--r-lg`，保留 `--max-w: 1120px`）
     - 全局重置：`*,*::before,*::after`、`html`、`body`、`::selection`、`a`、`code,.mono`
     - 布局：`section`、`.container`、`.section-alt`、`.tag`、`.stitle`、`.sdesc`
     - 导航：`nav`、`.nav-inner`、`.nav-logo`、`.nav-mark`、`.nav-links` 及子选择器
     - 按钮：`.btn`、`.btn-p`、`.btn-g`
     - 卡片：`.what-grid`、`.what-card`、`.what-icon`
     - 支柱卡片：`.pillars`、`.pillar`、`.pillar-harness`、`.pillar-agents`、`.pillar-openspec`
     - 表格：`table`、`th`、`td`、`tr:last-child td`
     - 代码窗口：`.code-window`、`.code-titlebar`、`.code-dot`、`.code-titlebar-t`、`.code-body` 及颜色 class（`.c`、`.g`、`.y`、`.w`、`.p`）
     - 原则列表：`.princ-list`、`.princ`
     - 页脚：`footer`
     - 响应式：3 个 `@media` 断点（1024px、768px、480px）中与上述组件相关的规则
  2. 新增导航高亮样式：`.nav-links a.active { color: var(--accent); }`
  3. 验证：浏览器打开 index.html 确认样式文件可加载
  > commit: refactor(web): extract shared CSS to assets/styles.css

- [x] **1.2 更新 `web/index.html` 引用外部 CSS**
  1. 在 `<head>` 中 Google Fonts `<link>` 之后添加：`<link rel="stylesheet" href="./assets/styles.css">`
  2. 从 `<style>` 标签中删除已抽取到 `styles.css` 的样式
  3. 保留 index.html 专属样式在 `<style>` 中：`.hero-*`、`.wf-*`（工作流相关全部样式）
  4. 验证：浏览器打开 index.html，对比重构前后视觉效果一致
  > commit: refactor(web): update index.html to use shared CSS

## 2. 页面拆分 — architecture.html（page-split）

- [x] **2.1 创建 `web/architecture.html` 基础结构**
  1. 创建文件，包含：`<!DOCTYPE html>`、`<head>`（meta、title "Harness — 架构设计"、favicon、Google Fonts、`<link>` 引用 `styles.css`）
  2. 添加页面专属 `<style>` 标签，包含以下样式：
     - 目录树：`.tree-box`、`.tree-box pre`、`.tree-box .d/.f/.n/.s`
     - 路由图：`.route-diagram`、`.route-flow`、`.route-step`、`.route-num`、`.route-num-1~4`、`.route-content`、`.route-arrow`
     - Submodule 图：`.mono-diagram`、`.mono-root`、`.mono-label`、`.mono-svg-wrap`、`.mono-cols`、`.mono-col`、`.mono-sub`、`.mono-sub-fe/.mono-sub-be`、`.mono-assets`、`.mono-context-box`
     - CLI 网格：`.cli-grid`、`.cli-item`
     - 领域包：`.dp-layout`、`.dp-card`、`.dp-card-fe/.dp-card-be`、`.dp-list`、`.dp-type`、`.dp-type-rule/.dp-type-skill/.dp-type-agent`、`.dp-flow`、`.dp-flow-steps`、`.dp-flow-step`、`.dp-flow-arrow`、`.dp-note`
     - 平台：`.plat-hub`、`.plat-hub-badge`、`.plat-hub-arrow`、`.plat-grid`、`.plat`、`.plat-tag`、`.plat-tag-ref/.plat-tag-native`
     - Submodule 布局：`.sub-grid`、`.sub-desc`
     - 响应式：对应的 `@media` 规则
  3. 添加统一导航栏（"架构设计"链接带 `class="active"`）
  4. 添加简化 Hero：标题"架构设计"、副标题"核心架构、路由机制、CLI 命令、选型说明"
  > commit: feat(web): create architecture.html scaffold

- [x] **2.2 迁移内容到 architecture.html**
  1. 从 `web/index.html` 复制以下板块的完整 HTML（保持原始结构不变）：
     - `#core` 核心架构（含三支柱卡片 + 目录树）
     - `#routing` 路由机制（含路由流程图 + Submodule 模式图）
     - 设计原则（三个核心约束）
     - 通用基线包（表格）
     - 领域包（前端/后端卡片 + review-orchestrator 路由流程 + 构建你自己的领域包）
     - 多平台（AGENTS.md hub + 5 平台网格）
     - `#cli` CLI 命令（5 个命令网格）
     - 选型理由（4 张 what-card）
  2. 添加 Footer（含指向首页和最佳实践的链接）
  3. 验证：浏览器打开 architecture.html，确认所有板块正确渲染
  > commit: feat(web): populate architecture.html with migrated content

## 3. 页面拆分 — best-practices.html（page-split）

- [x] **3.1 创建 `web/best-practices.html`**
  1. 创建文件，包含：`<head>`（title "Harness — 最佳实践"、favicon、Google Fonts、`<link>` 引用 `styles.css`）
  2. 页面专属 `<style>`：无额外样式需要（复用 `.pillar*` + `table`）
  3. 添加统一导航栏（"最佳实践"链接带 `class="active"`）
  4. 添加简化 Hero：标题"最佳实践"、副标题"实战指南与场景速查"
  5. 从 `web/index.html` 复制：
     - 最佳实践板块（4 张 pillar 卡片）
     - 场景速查表（9 行表格）
  6. 添加 Worktree + Setup 占位板块：
     ```html
     <section id="worktree">
       <div class="container">
         <div class="tag">Worktree + Setup</div>
         <h2 class="stitle">隔离环境工作模式</h2>
         <p class="sdesc">即将推出 — 使用 git worktree 实现隔离开发环境，配合 setup skill 自动初始化。</p>
       </div>
     </section>
     ```
  7. 添加 Footer
  8. 验证：浏览器打开 best-practices.html，确认布局和表格正确
  > commit: feat(web): create best-practices.html with migrated content

## 4. 首页精简（page-split）

- [x] **4.1 精简 `web/index.html`**
  1. 删除以下板块的 HTML：
     - `#core` 核心架构（`<section id="core">` 到 `</section>`）
     - `#routing` 路由机制
     - `#cli` CLI 命令
     - 通用基线包
     - 领域包
     - 多平台
     - `#tooling` 选型理由 + 场景速查表 + 最佳实践（整个 section）
     - 设计原则
     - `#evolution` 架构演进 V1→V2
  2. 从 `<style>` 中删除已不再使用的专属样式（如有残留）
  3. 确认保留的板块顺序：Hero → 是什么(#what) → 快速开始(#quickstart) → 工作流演示(#workflow) → Version Banner → Footer
  4. 在 Footer 中增加指向架构设计和最佳实践的引导链接
  5. 验证：浏览器打开 index.html，确认保留板块正常、无样式缺失
  > commit: refactor(web): slim down index.html to core sections

- [x] **4.2 更新所有页面导航栏**
  1. 更新 `index.html` 导航栏：替换为统一四入口（首页 active、架构设计、最佳实践、变更日志）
  2. 更新 `changelog.html` 导航栏：替换版本号链接为统一四入口（变更日志 active）
  3. 更新 `changelog.html`：在 `<head>` 中添加 `<link rel="stylesheet" href="./assets/styles.css">`，删除与 `styles.css` 重复的内联样式，保留 changelog 专属样式（`.version-*`、`.change-*`、`.migration*`、`.compare-table`、`.benefit*` 等）
  4. 验证：逐页点击导航，确认 4 个页面间可互相跳转，当前页正确高亮
  > commit: refactor(web): unify navigation across all pages

## 5. 最终验证

- [x] **5.1 全面验收**
  1. 用浏览器逐一打开 4 个页面，确认：
     - 深色主题渲染正确
     - 导航栏结构一致，当前页高亮
     - 所有内容从 index.html 完整迁移（无遗漏）
     - index.html 工作流 tab 切换正常
     - architecture.html 的 SVG 图表（Submodule 连线）正常渲染
  2. 用 DevTools 切换 768px 和 480px 视口，确认响应式布局正常
  3. 确认 `web/capability-inventory.html` 和 `web/v1/` 未受影响
  > commit: 无（验证通过即可）

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
