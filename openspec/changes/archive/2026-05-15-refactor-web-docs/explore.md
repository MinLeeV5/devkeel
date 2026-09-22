## 调查范围

基于 brainstorm.md，本次聚焦以下区域：

1. `web/index.html` — 当前单页文档，1493 行，77.4KB
2. `web/changelog.html` — 变更日志，591 行，29KB
3. `web/capability-inventory.html` — 能力清单，690 行，55.2KB
4. `web/assets/` — 仅含 `favicon.ico`
5. `web/v1/` — 旧版本目录（不在变更范围内）

## 现有架构

### 文件结构

```
web/
├── index.html              # 主页（1493 行，全部内容集中于此）
├── changelog.html          # 变更日志（591 行，独立页面）
├── capability-inventory.html # 能力清单（690 行，无导航栏）
├── assets/
│   └── favicon.ico
└── v1/                     # 旧版本（不动）
```

### 现有 CSS 模式

- **无共享 CSS 文件**：每个 HTML 文件都在 `<style>` 标签内内联全部样式
- **CSS 变量一致**：`index.html` 和 `changelog.html` 使用相同的 `:root` 变量定义（`--bg`, `--accent`, `--cyan` 等）
- **`--max-w` 差异**：`index.html` 用 `1120px`，`changelog.html` 用 `960px`
- **字体加载一致**：都通过 Google Fonts 加载 Inter + JetBrains Mono

### 导航模式

- **index.html 导航**（`web/index.html:456-467`）：链接到页内锚点 + changelog
  ```
  是什么 | 核心架构 | 路由机制 | 工作流演示 | 快速开始 | CLI | 最佳实践 | V1→V2 | 变更日志
  ```
- **changelog.html 导航**（`web/changelog.html:183-202`）：链接回首页 + 各版本锚点
  ```
  首页 | v0.2.6 | v0.2.5 | ... | v0.1 | v1→v2
  ```
- **capability-inventory.html**：无导航栏

### index.html 内容板块清单

| # | Section ID | 板块名称 | 行范围 | 目标文档 |
|---|-----------|---------|--------|---------|
| 1 | — | Hero | 470-492 | **首页** |
| 2 | `#what` | 是什么 | 495-522 | **首页** |
| 3 | `#core` | 核心架构 | 525-598 | architecture |
| 4 | `#routing` | 路由机制 | 601-707 | architecture |
| 5 | `#workflow` | 工作流演示 | 710-1028 | **首页** |
| 6 | `#quickstart` | 快速开始 | 1031-1060 | **首页** |
| 7 | `#cli` | CLI 命令 | 1063-1077 | architecture |
| 8 | — | 通用基线包 | 1080-1115 | architecture |
| 9 | — | 领域包 | 1118-1182 | architecture |
| 10 | — | 多平台 | 1184-1233 | architecture |
| 11 | `#tooling` | 选型理由 | 1237-1265 | architecture |
| 12 | `#tooling` | 场景速查表 | 1266-1327 | best-practices |
| 13 | `#tooling` | 最佳实践 | 1328-1353 | best-practices |
| 14 | — | 设计原则 | 1356-1376 | architecture |
| 15 | `#evolution` | 架构演进 V1→V2 | 1379-1460 | changelog |
| 16 | — | Version Banner | 1463-1471 | **首页** |
| 17 | — | Footer | 1474-1481 | **首页** |

## 关键代码路径

### 交互逻辑

index.html 仅有一处 JavaScript（`web/index.html:1484-1489`）：

```javascript
function switchTab(id) {
  document.querySelectorAll('.wf-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.wf-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  if (event && event.target) event.target.classList.add('active');
}
```

此函数仅用于 `#workflow` 工作流演示的 tab 切换，随首页保留，不需要迁移。

### 架构演进内容重复

`index.html` 的 `#evolution` 板块（V1→V2 对比表 + 4 个收益卡片）与 `changelog.html` 的 `#migration` 板块（V1→V2 对比表 + 6 个收益卡片）**内容高度重复**。changelog 版本更详细（多了"维护成本骤降"和"零运行时状态"两项收益），是超集。

结论：index.html 的 V1→V2 内容可直接删除，changelog.html 已有完整版本。

### CSS 组件依赖关系

各板块使用的 CSS class 前缀清晰分离：

| 板块 | CSS 前缀 | 迁移目标 |
|------|---------|---------|
| Hero | `.hero-*` | 首页 |
| What is | `.what-*` | 首页 |
| Pillars | `.pillar*` | architecture + best-practices |
| Tree | `.tree-*` | architecture |
| Route | `.route-*` | architecture |
| Workflow | `.wf-*` | 首页 |
| Submodule | `.mono-*`, `.sub-*` | architecture |
| CLI | `.cli-*` | architecture |
| Baseline | `table` | architecture |
| Domain | `.dp-*` | architecture |
| Platform | `.plat-*` | architecture |
| Principles | `.princ-*` | architecture |
| Code window | `.code-*` | 首页 |
| Version banner | inline styles | 首页 |

注意：`.pillar*` 同时被核心架构（三个目录）和最佳实践（4 个实践卡片）使用。迁移时两个文档都需要包含此样式。

## 测试覆盖

- **无自动化测试**：web/ 目录是纯静态 HTML，项目无前端测试框架覆盖此目录
- **验证方式**：浏览器打开文件，目视检查布局、交互、跨页导航
- **响应式断点**：index.html 定义了 3 个媒体查询断点（1024px、768px、480px），迁移后每个文档需保留对应的响应式规则

## 风险与约束

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| **CSS 重复膨胀** | 3 个文档各自内联全套 CSS，总体积增大 | 保持现有模式（每个文件自包含），复杂度可控；可选后续抽取 `styles.css` |
| **导航一致性** | 新增两个页面后，所有文档的导航栏需统一更新 | 每个文档的 `<nav>` 保持统一结构：首页、架构设计、最佳实践、变更日志 |
| **首页内容顺序调整** | 当前顺序 `是什么→核心架构→路由→工作流→快速开始`，移除中间板块后，`是什么` 直接接 `快速开始` 或 `工作流` | 推荐新顺序：Hero → 是什么 → 快速开始 → 工作流演示 → Footer |
| **外部链接可能失效** | 如果有外部系统链接到 `index.html#core` 等锚点 | 此为内部项目文档，外部链接风险极低 |
| **`#tooling` 板块拆分** | 选型理由、场景速查表、最佳实践三块内容在同一个 section id 下 | 按内容性质拆到不同文档，代码层面是 HTML 块剪切 |
| **changelog 已有完整 V1→V2** | index.html 的架构演进与 changelog 重复 | 直接删除 index.html 版本，无需迁移 |

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
