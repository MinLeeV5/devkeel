## TL;DR

重构 human-review.html 输出：从 6 章全量文档精简为 Dashboard + 2 章评审页面，新增代码设计预览、Diff 高亮对比、章节折叠和 Artifact 原文查看器，让评审者一眼看清全局、快速定位风险，同时保留完整过程追溯能力。

## 需求背景

当前 `human-review.html` 是一份 600-700 行的静态 HTML，包含 6 个章节（需求背景、现状调查、技术设计、变更提案、规格清单、实现任务），完整复制了所有 planning artifact 的内容。

**核心痛点：**

1. **信息过载** — 评审者需要滚过大量中间过程信息（现状调查、变更提案、BDD 规格）才能找到关键决策点，实际评审时这些章节被跳过
2. **无法评审代码设计** — 技术设计章节只有架构图和决策表，缺少伪代码/接口设计/关键函数签名，评审者无法判断 AI 即将实施的代码方案是否合理
3. **无交互能力** — 纯静态页面，评审者无法折叠无关内容、无法对比变更前后差异、无法标注意见
4. **缺少全局视图** — 没有一个 Dashboard 式的总览让评审者一眼掌握变更范围和风险分布

## 目标用户与角色

| 角色 | 关注点 | 评审时间 |
|------|--------|----------|
| **技术负责人** | 方案是否合理、风险是否可控、影响范围多大 | 5-10 分钟快速扫描 |
| **同组工程师** | 代码设计是否符合规范、接口是否合理、任务拆分是否清晰 | 10-20 分钟详细审阅 |
| **跨组评审者** | 是否影响自己负责的模块、接口契约是否变更 | 3-5 分钟看 Dashboard |

## 核心功能用例

### UC-1: Dashboard 总览

评审者打开 HTML 后，首屏即看到一个 Dashboard 式总览，核心是「一图胜千言」：
- **影响范围可视化** — 使用 architecture-diagram skill 生成 inline SVG，以拓扑图/模块关系图展示变更涉及的模块、文件和依赖关系，用颜色区分新增/修改/删除
- 变更摘要（一句话 + 关键标签）
- 风险信号指示器（破坏性变更、新依赖、跨模块影响）
- 任务进度概览（N 个任务，预估工作量）

Dashboard 的图表优先级：能用 SVG 图表达的信息绝不用文字段落。

### UC-2: 代码设计预览

在技术设计章节中，评审者能看到：
- 关键函数/接口的签名和伪代码
- 数据流示意（输入 → 处理 → 输出）
- 变更前后的代码结构对比（Diff 高亮）
- 核心类型定义 / interface 变更

### UC-3: 章节折叠/展开

- 默认展开 Dashboard 总览和技术设计
- 其他章节默认折叠，标题可见
- 点击标题展开/折叠，状态记忆（localStorage）

### UC-4: Diff 高亮对比

对于涉及的关键变更（接口变更、配置变更、架构调整），以 Diff 视图展示前后对比，类似 GitHub PR 的 diff 样式。

### UC-5: Artifact 原文查看器

评审者可以在页面内查看各 artifact .md 的原文内容：
- .md 原文以 `<script type="text/markdown" data-artifact="xxx">` 内嵌到 HTML 中（纯文本，零渲染开销）
- 页面底部提供标签页切换，点击时用轻量 markdown 渲染器（marked.js ~8KB CDN）按需渲染
- 所有 artifact 都保留（brainstorm/explore/design/proposal/specs/tasks），不删除任何过程信息
- 好处：主体评审页面精简聚焦，但完整过程文档随时可查，体积增量仅为 .md 原文大小（通常 2-5KB/个）

## 需求边界

**In Scope:**

- 重新定义 human-review.html 的章节结构（从 6 章 → 3 章 + Dashboard）
- 修改 `templates/openspec/schemas/superpowers-bridge/templates/human-review.md` 模板
- 同步修改 `openspec/schemas/superpowers-bridge/templates/human-review.md`
- 新增 Dashboard 总览区域
- 新增代码设计预览区域（伪代码 + 接口签名）
- 新增 Diff 高亮对比组件
- 新增章节折叠/展开交互
- 新增 Artifact 原文查看器（内嵌 .md + marked.js 按需渲染）
- 新增 `inject-review` 脚本：agent 生成轻量 HTML 后，脚本自动注入 .md 原文和 CSS，节省 ~70K+ token
- 在 design.md 模板中新增「代码设计」section（函数签名、伪代码、interface 变更）
- 新增 CDN 依赖：marked.js（markdown 渲染）
- 通用 CSS 发布到 `raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/human-review.css`，生成 HTML 时 link 引入而非内联（节省 ~3000-4000 token/次）
- 保留现有视觉风格（Slate Indigo 主题）

**Out of Scope:**

- 不改变 schema 的 artifact 流程（brainstorm → explore → ... → human-review 顺序不变）
- 不新增 artifact（代码设计信息在现有 design.md 中增加 section）
- 不涉及评审批注/评论功能（需要后端支持，超出静态 HTML 范围）
- 不涉及审批打分/投票功能（同上）
- 不改变 CSS 主题 / 设计令牌
- 不使用 iframe 加载本地 .md（浏览器 file:// 安全策略限制）

## 新章节结构

| # | 章节 | 内容来源 | 说明 |
|---|------|----------|------|
| — | **Dashboard 总览** | 所有 artifact 聚合 | 首屏：摘要 + **架构图式影响范围可视化**（architecture-diagram skill 生成 inline SVG）+ 风险信号 + 任务概览 |
| 01 | **需求与设计** | brainstorm.md + design.md | TL;DR + 目标用户 + 架构图 + 关键决策 + **代码设计预览**（签名、伪代码、Diff） |
| 02 | **实现任务** | tasks.md | 任务 checkbox + 微步骤 + commit 建议 |
| — | **Artifact 原文** | 所有 .md | 标签页切换，点击按需渲染，默认隐藏 |
| — | **验收指引** | — | 精简保留 |

**关键变化：**
- 去掉独立的「现状调查」「变更提案」「规格清单」章节（主体不展示）
- 这些内容通过 Artifact 原文查看器保留完整追溯能力
- design.md 模板新增「代码设计」section，human-review 从中提取渲染

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 保留 6 章但默认全部折叠 | 信息量仍在，折叠只是视觉隐藏，不解决内容冗余问题 |
| 评审批注/评论功能 | 需要后端存储，超出静态 HTML 的能力边界 |
| 生成 PDF 而非 HTML | 失去交互能力（折叠、Diff），不符合需求 |
| iframe 加载本地 .md | 浏览器 file:// 安全策略禁止跨文件 iframe/fetch，不可行 |
| 把规格清单精简保留 | 用户明确表示不需要 BDD 风格的 Requirement/Scenario |

## 待确认项

1. **代码设计预览的粒度** — 建议：关键函数签名 + 伪代码 + 核心 interface 变更，不展示完整实现。在 design.md 模板中新增 section 指引 agent 产出
2. **Diff 对比的来源** — 需要在 design.md 模板中要求 agent 以代码块形式给出变更前后对比，human-review 渲染时加 diff 高亮样式
3. **Dashboard 数据密度** — 建议：定性标签（高/中/低风险）为主 + 影响文件列表作为定量参考

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-human-review-html
