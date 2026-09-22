## 1. design.md 模板新增代码设计预览 section

- [x] **1.1 修改 design.md 模板**

  文件：`templates/openspec/schemas/superpowers-bridge/templates/design.md`

  在 `### 模块设计` 和 `### 数据设计` 之间插入：

  ```markdown
  ### 代码设计预览

  #### 关键接口与类型

  <!-- 新增/修改的 interface、type、函数签名 -->

  #### 核心实现伪代码

  <!-- 关键函数的伪代码逻辑，评审者据此判断实现方案是否合理 -->

  #### 变更前后对比

  <!-- 用 ```diff 代码块展示关键变更的前后对比 -->
  ```

  同步到：`openspec/schemas/superpowers-bridge/templates/design.md`

  commit: `feat(schema): design.md 模板新增代码设计预览 section`

## 2. human-review.md 模板重写

- [x] **2.0 创建 `devkeel inject-review` 子命令**

  文件：
  - `src/lib/inject-review.ts` — 纯逻辑（扫描 .md、替换占位符、幂等处理）
  - `src/commands/inject-review.ts` — Commander 注册 + @clack/prompts 输出
  - `src/index.ts` — 注册新命令

  功能：
  1. 接收 human-review.html 路径参数
  2. 扫描同目录下 .md 文件 → 注入到 `<!-- INJECT:artifacts -->` 占位符
  3. 读取 `web/human-review.css` → 注入到 `<!-- INJECT:css -->` 占位符
  4. `specs/` 目录合并为单个 artifact
  5. 幂等：重复运行结果一致

  用法：`devkeel inject-review openspec/changes/<name>/human-review.html`

  commit: `feat(harness): 新增 inject-review 子命令自动注入固定内容`

- [x] **2.1 创建并发布 human-review.css**

  文件：`web/human-review.css`

  将通用 CSS 提取为独立文件（设计令牌、布局、组件样式、响应式、打印样式），发布到 `raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/human-review.css`。

  commit: `feat(web): 发布 human-review.css 供 HTML 评审页面引用`

- [x] **2.2 重写 CDN 依赖 section**

  文件：`templates/openspec/schemas/superpowers-bridge/templates/human-review.md`

  模板指引 agent：
  - 使用 `<link rel="stylesheet" href="https://github.com/MinLeeV5/devkeel/human-review.css">`（在线）
  - 或留 `<!-- INJECT:css -->` 占位符由脚本注入（离线）
  - CDN 新增 marked.js
  - 不再内联通用 CSS，仅保留极少量页面特有样式

- [x] **2.3 重写输出内容 section**

  替换原 6 章结构为新结构：

  | # | 章节 | 来源 | 提取内容 |
  |---|------|------|----------|
  | — | Dashboard | 所有 artifact | architecture-diagram SVG + 摘要卡片 + 风险信号 + 任务概览 |
  | 01 | 需求与设计 | brainstorm + design | TL;DR + 目标用户 + 架构图 + ATAM + 关键决策 + 代码设计预览 |
  | 02 | 实现任务 | tasks.md | 按组分列任务 checkbox |
  | — | Artifact 原文 | 所有 .md | 标签页切换，marked.js 按需渲染 |
  | — | 验收指引 | — | /opsx:apply 命令 |

- [x] **2.3 新增交互 JS section**

  添加以下交互功能的指引：

  1. 章节折叠/展开（点击 `.section-head` 切换 `.collapsed` class，localStorage 持久化）
  2. Artifact 标签页切换（点击 tab 按钮，首次点击时用 `marked.parse()` 渲染对应 `<script type="text/markdown">` 内容）
  3. marked.js 加载失败降级（`<pre>` 显示原文）

- [x] **2.4 新增 Diff 高亮样式 section**

  添加 diff 代码块的行级着色规格：
  - `+` 开头行：浅绿背景
  - `-` 开头行：浅红背景
  - 深色模式适配

- [x] **2.5 新增 Dashboard 区域规格**

  描述 Dashboard 区域的布局和内容：
  - architecture-diagram SVG 容器（深色岛 + 响应式）
  - 摘要卡片（TL;DR + 变更类型标签）
  - 风险信号指示器（条件渲染）
  - 任务概览（组数 + 任务数）
  - 降级方案：skill 不可用时用 Mermaid 图

- [x] **2.6 新增 Artifact 原文查看器规格**

  描述内嵌 .md 的方式和交互：
  - 所有 artifact 以 `<script type="text/markdown" data-artifact="name">` 内嵌
  - 标签页 UI（brainstorm | explore | design | proposal | specs | tasks）
  - 按需渲染逻辑

  同步到：`openspec/schemas/superpowers-bridge/templates/human-review.md`

  commit: `feat(schema): 重写 human-review.md 模板为 Dashboard + 2 章 + Artifact 查看器`

## 3. schema.yaml 更新

- [x] **3.1 更新 human-review instruction**

  文件：`templates/openspec/schemas/superpowers-bridge/schema.yaml`

  修改 human-review artifact 的 instruction，反映新的生成流程：
  1. 收集所有 .md（仅用于提取可变内容渲染）
  2. 调用 architecture-diagram skill 生成 Dashboard SVG
  3. 组装轻量 HTML（Dashboard + 2 章 + 占位符 `<!-- INJECT:artifacts -->` + `<!-- INJECT:css -->`）
  4. 生成完成后立即执行 `npx devkeel@latest inject-review <html-path>`
  5. 若 .npmrc 缺少 registry，先配置再重试

- [x] **3.2 版本号升级**

  ```yaml
  version: 5
  ```

  同步到：`openspec/schemas/superpowers-bridge/schema.yaml`

  commit: `feat(schema): 更新 human-review instruction 并升级至 v5`

## 4. 项目内副本同步

- [x] **4.1 同步所有变更到 openspec/schemas/**

  将 `templates/openspec/schemas/superpowers-bridge/` 下的 3 个变更文件复制到 `openspec/schemas/superpowers-bridge/` 对应位置：
  - `templates/design.md`
  - `templates/human-review.md`
  - `schema.yaml`

  commit: `chore(schema): 同步 superpowers-bridge 模板到项目内副本`

## 5. 验证

- [x] **5.1 结构验证**

  运行 `openspec validate --all` 确认 schema 结构正确。

- [x] **5.2 功能验证**

  使用现有已归档 change 的 artifact 数据，按新模板手动生成一份 human-review.html，在浏览器中验证：
  - Dashboard SVG 渲染正常
  - 章节折叠/展开工作
  - Artifact 标签页切换 + marked.js 渲染正常
  - Diff 高亮颜色正确
  - 深色模式适配
  - 响应式（768px/480px）

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-human-review-html
