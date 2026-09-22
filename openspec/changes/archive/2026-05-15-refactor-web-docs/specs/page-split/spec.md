## ADDED Requirements

### Requirement: index.html SHALL 仅包含首页核心板块

重构后的 `index.html` MUST 仅包含以下板块，按此顺序排列：
1. Hero（标题 + 副标题 + CTA 按钮）
2. 是什么（`#what`）— 四张价值卡片
3. 快速开始（`#quickstart`）— 安装命令 + 初始化流程
4. 工作流演示（`#workflow`）— 5 个 tab 的工作流展示
5. Version Banner — 当前版本链接
6. Footer — 底部导航

#### Scenario: 首页不包含已迁移内容

- **WHEN** 检查重构后的 `index.html` 源码
- **THEN** MUST 不包含以下板块的 HTML：核心架构（`#core`）、路由机制（`#routing`）、CLI 命令（`#cli`）、通用基线包、领域包、多平台、选型理由、最佳实践、场景速查表、设计原则、架构演进（`#evolution`）

#### Scenario: 工作流演示 tab 切换功能保留

- **WHEN** 在首页点击工作流演示的 tab（门禁模式、快速通道、缺陷修复、技术方案、代码审查）
- **THEN** 对应面板 MUST 正确显示，`switchTab()` 函数正常工作

---

### Requirement: architecture.html SHALL 包含完整的架构设计内容

新建的 `architecture.html` MUST 包含从 `index.html` 迁移的以下板块：
1. 核心架构 — 三个目录各司其职 + 目录树
2. 路由机制 — 两层短路分流 + Submodule 模式图
3. 设计原则 — 三个核心约束
4. 通用基线包 — 内置 19 Skills + 1 Agent + 1 Rule 表格
5. 领域包 — 前端/后端领域包 + review-orchestrator 路由流程图
6. 多平台 — 一份 AGENTS.md 五个平台
7. CLI 命令 — 五个脚手架命令
8. 选型说明 — 四张选型理由卡片

#### Scenario: 架构页内容与原首页一致

- **WHEN** 对比 `architecture.html` 中的核心架构板块与原 `index.html` 中 `#core` 板块
- **THEN** 文字内容、目录树结构、SVG 图表 MUST 完全一致（仅允许 CSS class 引用方式和导航变化）

#### Scenario: 架构页包含简化 Hero

- **WHEN** 打开 `architecture.html`
- **THEN** 页面顶部 MUST 有简化的 Hero 区域（标题 + 一句话描述），不包含 CTA 按钮和公式条

---

### Requirement: best-practices.html SHALL 包含最佳实践和速查表

新建的 `best-practices.html` MUST 包含：
1. 最佳实践 — 四张实践卡片（先沉淀再执行、用 openspec 管理产出、领域包逐步沉淀、路由表保持简洁）
2. 场景速查表 — 9 行场景 × 能力组合 × 提示词模板 × 产出物表格
3. Worktree + Setup 模式 — 占位板块（标题 + "即将推出"提示）

#### Scenario: 场景速查表内容完整

- **WHEN** 检查 `best-practices.html` 中的场景速查表
- **THEN** MUST 包含原 `index.html` 中 `#tooling` 板块下场景速查表的全部 9 行数据

#### Scenario: Worktree 板块为占位状态

- **WHEN** 打开 `best-practices.html` 并滚动到 Worktree + Setup 板块
- **THEN** 该板块 MUST 显示标题和占位提示文字，不包含具体内容

---

### Requirement: 所有页面 SHALL 使用统一的四入口导航栏

4 个文档（index / architecture / best-practices / changelog）MUST 使用相同结构的导航栏，包含 4 个入口链接：首页、架构设计、最佳实践、变更日志。

#### Scenario: 导航互通

- **WHEN** 在任意页面点击导航栏中的任一链接
- **THEN** MUST 正确跳转到对应页面，且目标页面的导航栏结构与来源页一致

#### Scenario: changelog 导航更新

- **WHEN** 检查重构后的 `changelog.html` 导航栏
- **THEN** MUST 包含首页、架构设计、最佳实践、变更日志四个链接，替换原有的版本号链接列表

---

### Requirement: V1→V2 架构演进 SHALL 从首页移除

`index.html` MUST 删除 `#evolution` 板块（V1→V2 对比表和收益卡片），该内容已在 `changelog.html` 的 `#migration` 板块完整存在。

#### Scenario: 首页无 V1→V2 内容

- **WHEN** 在重构后的 `index.html` 中搜索 "V1" 或 "evolution"
- **THEN** MUST 不存在架构演进相关的 HTML 内容

#### Scenario: changelog 保留完整 V1→V2

- **WHEN** 打开 `changelog.html` 并导航到 `#migration`
- **THEN** V1→V2 对比表和 6 个收益说明 MUST 完整保留，不受本次变更影响

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-web-docs
