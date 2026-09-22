## ADDED Requirements

### Requirement: CSS 变量与基础重置 SHALL 定义在共享样式文件中

系统 SHALL 将 `:root` CSS 变量定义（`--bg`, `--bg-r`, `--bg-s`, `--bg-in`, `--border`, `--border-d`, `--text`, `--text-2`, `--text-3`, `--text-4`, `--accent`, `--accent-h`, `--accent-g`, `--cyan`, `--purple`, `--yellow`, `--orange`, `--red`, `--blue`, `--max-w`, `--r`, `--r-lg`）和全局重置样式（`*`, `html`, `body`, `::selection`, `a`, `code`）统一放置在 `web/assets/styles.css` 中。

#### Scenario: 所有页面通过外部引用加载共享样式

- **WHEN** 浏览器打开 `index.html`、`architecture.html`、`best-practices.html` 或 `changelog.html` 中的任意一个
- **THEN** 该页面的 `<head>` 中 MUST 包含 `<link rel="stylesheet" href="./assets/styles.css">`，且页面正确应用 `:root` 变量定义的深色主题

#### Scenario: CSS 变量值在所有页面一致

- **WHEN** 分别检查 4 个页面的计算样式
- **THEN** `--accent`、`--bg`、`--text` 等变量值 MUST 完全一致，不存在因内联覆盖导致的差异

---

### Requirement: 共享布局样式 SHALL 包含导航、容器、卡片、表格和页脚

`assets/styles.css` MUST 包含以下组件样式：
- 导航栏：`nav`, `.nav-inner`, `.nav-logo`, `.nav-mark`, `.nav-links`
- 布局：`section`, `.container`, `.section-alt`, `.tag`, `.stitle`, `.sdesc`
- 按钮：`.btn`, `.btn-p`, `.btn-g`
- 卡片：`.what-grid`, `.what-card`, `.what-icon`, `.pillar*`, `.princ-list`, `.princ`
- 表格：`table`, `th`, `td`, `tr`
- 代码窗口：`.code-window`, `.code-titlebar`, `.code-dot`, `.code-body` 及颜色 class
- 页脚：`footer`
- 响应式：`@media` 1024px、768px、480px 断点

#### Scenario: 共享样式覆盖所有公共组件

- **WHEN** `architecture.html` 使用 `.what-card` 和 `table` 组件
- **THEN** 组件样式 MUST 仅来自 `styles.css`，页面内无需为这些 class 添加内联样式

---

### Requirement: 页面专属样式 SHALL 保留为内联 style 标签

各页面仅在自身使用的组件样式 MUST 以内联 `<style>` 形式保留在对应 HTML 文件中，不放入共享 CSS。

#### Scenario: index.html 专属样式内联

- **WHEN** 检查 `index.html` 的 `<style>` 标签
- **THEN** MUST 包含 `.hero-*` 和 `.wf-*`（工作流 tab/timeline）样式，且这些样式不存在于 `styles.css` 中

#### Scenario: architecture.html 专属样式内联

- **WHEN** 检查 `architecture.html` 的 `<style>` 标签
- **THEN** MUST 包含 `.tree-*`、`.route-*`、`.mono-*`、`.cli-*`、`.dp-*`、`.plat-*` 样式

---

### Requirement: 导航高亮 SHALL 通过 active class 标识当前页

系统 MUST 在 `styles.css` 中定义 `.nav-links a.active` 样式（`color: var(--accent)`），每个页面在自身对应的导航链接上静态标记 `class="active"`。

#### Scenario: 首页导航高亮

- **WHEN** 打开 `index.html`
- **THEN** 导航栏中"首页"链接 MUST 带有 `class="active"`，显示为绿色（`--accent`），其他链接显示为灰色（`--text-3`）

#### Scenario: 架构设计页导航高亮

- **WHEN** 打开 `architecture.html`
- **THEN** 导航栏中"架构设计"链接 MUST 带有 `class="active"`

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
