## Why

当前 human-review.html 是一份 6 章全量文档（600-700 行），完整复制所有 planning artifact 内容。评审者实际只关注 3 个核心区域（需求背景、技术设计、任务清单），其余章节被跳过。同时缺少代码设计预览，评审者无法判断 AI 即将实施的代码方案是否合理。

## What Changes

| 变更 | From | To | 影响 |
|------|------|----|------|
| HTML 章节结构 | 6 章线性文档 | Dashboard + 2 章 + Artifact 查看器 | human-review.md 模板重写 |
| 代码设计可见性 | design.md 无代码设计 section | 新增「代码设计预览」section（签名 + 伪代码 + Diff） | design.md 模板修改 |
| 交互能力 | 纯静态 | 折叠/展开 + Diff 高亮 + Artifact 标签页 | human-review.md 新增 JS 指引 |
| Dashboard | 无 | 首屏 architecture-diagram SVG + 摘要 + 风险信号 + 任务概览 | human-review.md 新增 |
| CDN 依赖 | highlight.js + mermaid | + marked.js | human-review.md 修改 |
| schema 版本 | version 4 | version 5 | schema.yaml 修改 |

## Capabilities

**新增能力：**

- **`dashboard-overview`** — Dashboard 总览区域：architecture-diagram SVG 影响图、变更摘要、风险信号指示器、任务进度概览
- **`code-design-preview`** — 代码设计预览：design.md 模板新增 section + human-review 中的渲染
- **`interactive-review`** — 交互式评审：章节折叠/展开（localStorage）、Diff 高亮对比样式、Artifact 原文查看器（内嵌 markdown + marked.js 按需渲染）

**修改能力：**

- **`human-review-gate`** — 修改章节结构（6 章 → Dashboard + 2 章 + Artifact 查看器）、更新 schema.yaml instruction 和版本号

## Impact

| 文件 | 变更类型 |
|------|----------|
| `templates/openspec/schemas/superpowers-bridge/templates/human-review.md` | 重写 |
| `templates/openspec/schemas/superpowers-bridge/templates/design.md` | 新增 section |
| `templates/openspec/schemas/superpowers-bridge/schema.yaml` | instruction 更新 + version 5 |
| `openspec/schemas/superpowers-bridge/templates/human-review.md` | 同步重写 |
| `openspec/schemas/superpowers-bridge/templates/design.md` | 同步新增 section |
| `openspec/schemas/superpowers-bridge/schema.yaml` | 同步 |

不影响已归档的 change（它们已生成 HTML）。不影响 TypeScript 源码或测试。

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-human-review-html
