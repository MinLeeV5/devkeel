## TL;DR

纯前端静态 HTML 页面内容更新：删除一个 section，重写另一个 section。无架构变更、无后端、无数据模型。

## 需求引用

- 删除"实践指南"section（brainstorm.md 核心用例 #1）
- 重写"Worktree + Setup"section 为 paseo.sh 推荐内容（核心用例 #2）

## 方案设计

### 架构概览

无架构变更。操作对象为单个静态 HTML 文件 `web/best-practices.html`，复用现有 CSS。

### ATAM 方案对比

| 质量属性 | 方案 A: 纯文字+代码块 | 方案 B: 图文混排+cards | 权重 |
|----------|----------------------|----------------------|------|
| 可维护性 | 高（纯 HTML） | 高（纯 HTML） | 0.3 |
| 视觉表现 | 中（信息密度高但单调） | 高（层次分明） | 0.4 |
| 外部依赖 | 无 | 引用 paseo.sh 图片 | 0.3 |

**选定方案：B（图文混排+cards）**

理由：Worktree + Setup 是推荐工具的营销向内容，图文混排更具说服力。外部图片依赖风险可接受（图片挂了不影响文字）。

### 关键时序

不适用（纯静态页面，无运行时交互）。

### 模块设计

单文件修改，变更区域：

1. **删除** L111-L139（实践指南 section）
2. **重写** L142-L149（Worktree + Setup section）为完整内容

新 section 内部结构：
- 简介 + 支持的 Agent 列表（badge/tag 形式）
- `paseo.json` 配置示例（代码块）
- 移动端能力介绍 + 外链

### 代码设计预览

#### 变更前后对比

```diff
-<!-- Best Practices -->
-<section>
-  <div class="container">
-    <div class="tag">实践指南</div>
-    <h2 class="stitle">最佳实践</h2>
-    ...4 pillar cards...
-  </div>
-</section>
-
 <!-- Worktree + Setup -->
 <section class="section-alt" id="worktree">
   <div class="container">
     <div class="tag">Worktree + Setup</div>
-    <h2 class="stitle">隔离环境工作模式</h2>
-    <p class="sdesc">即将推出 — ...</p>
+    <h2 class="stitle">隔离环境 × 随时随地</h2>
+    <p class="sdesc">用 Paseo 管理 Agent 的隔离工作空间，从手机到桌面全覆盖。</p>
+    ...完整内容...
   </div>
 </section>
```

### 数据设计

不适用。

## 质量设计

### SLO 指标

本次不涉及 — 纯静态页面，无运行时指标。

### 安全（STRIDE 简表）

| 威胁类型 | 场景 | 缓解措施 |
|----------|------|----------|
| Tampering | 外部图片被替换 | 仅引用 paseo.sh 官方域名 |
| Info Disclosure | 本次不涉及 | — |
| 其他 | 本次不涉及 | — |

### 旁路隔离

本次不涉及 — 无旁路/观测组件。

## 决策追溯

| 决策 | 追溯需求点 |
|------|-----------|
| 删除实践指南 | brainstorm: harness-cli 本身已覆盖这些内容 |
| 选择图文混排 | 用户确认：用 pillar cards + 图文，可从官网摘取图片 |
| 展示 paseo.json 示例 | 用户确认：不需要 CLI 命令，展示 worktree+setup 配置 |

## 风险与未决

| 风险 | 缓解 |
|------|------|
| paseo.sh 图片 CDN 不可用 | 图片仅作视觉增强，alt text 保证可读性 |
| 移动端截图素材来源 | 从官网 OG image 或产品页获取 |
