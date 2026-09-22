## 调查范围

基于 brainstorm.md，聚焦调查 `web/architecture.html` 中领域包章节（L464-L529）的结构和样式依赖。

## 当前结构分析

领域包章节位于 `web/architecture.html:464-529`，结构：

```
<section> "领域包"
├── .tag + h2 + p.sdesc（标题区）
├── .dp-layout（两列卡片）
│   ├── .dp-card.dp-card-fe（前端领域包 — 9 条 li）
│   └── .dp-card.dp-card-be（后端领域包 — 10 条 li）
├── .dp-flow（review-orchestrator 路由流程图）
└── .dp-note（"构建你自己的领域包"提示）
```

## CSS 依赖

领域包专用样式定义在 `web/assets/styles.css` 中（`.dp-*` 前缀类），包括：
- `.dp-layout` — 两列布局
- `.dp-card` / `.dp-card-fe` / `.dp-card-be` — 卡片样式
- `.dp-list` / `.dp-type` / `.dp-type-rule` / `.dp-type-skill` — 列表样式
- `.dp-flow` / `.dp-flow-steps` / `.dp-flow-step` / `.dp-flow-arrow` — 流程图
- `.dp-note` — 底部提示框

## 改造方向

1. **新增顶部流程图** — 展示 domain-init 四阶段（识别 → baseline → 增强 → 收尾）
2. **重写标题和描述** — 从"每个子项目一套专属知识"转为强调"智能扫描生成"
3. **保留 dp-card 但调整为"产出示例"** — 缩小卡片比重，作为 domain-init 产出的具体示例
4. **保留 dp-flow** — review-orchestrator 路由仍然有价值
5. **改写 dp-note** — 从"构建你自己的领域包"改为介绍 domain-init 与 devkeel init 的分工

## 技术约束

- 可复用现有 `.dp-*` CSS 类，按需新增
- 新增的流程图可复用页面上方 `.route-*` 样式模式
- 无 JS 依赖，纯 HTML+CSS

## 风险点

无显著风险，纯前端静态页面内容重构。

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-architecture-domain-section
