## 调查范围

基于 brainstorm.md，聚焦以下区域：

1. **human-review.md 模板** — HTML 生成指引的结构和内容定义
2. **schema.yaml** — human-review artifact 的依赖链和 instruction
3. **design.md 模板** — 是否有代码设计预览的 section（需新增）
4. **已生成的 human-review.html** — 实际产出的结构和体积
5. **模板同步机制** — templates/ vs openspec/schemas/ 的关系

## 现有架构

### 文件布局

```
templates/openspec/schemas/superpowers-bridge/
├── schema.yaml                    # 权威 schema 定义（init 时复制到项目）
└── templates/
    ├── human-review.md            # HTML 生成指引（视觉规格 + 章节定义）
    ├── design.md                  # 技术设计模板
    └── ...                        # 其他 artifact 模板

openspec/schemas/superpowers-bridge/
├── schema.yaml                    # 项目内副本（devkeel init/update 同步）
└── templates/
    └── human-review.md            # 项目内副本
```

两处 schema.yaml 内容基本一致（templates/ 是 source of truth，openspec/ 是项目副本）。

### human-review 生成流程

```
brainstorm.md ─┐
explore.md ────┤
design.md ─────┼── human-review artifact instruction ──► 读取所有 .md
proposal.md ───┤                                         ↓
specs/*.md ────┤                              读取 human-review.md 模板
tasks.md ──────┘                              （视觉规格 + 章节定义）
                                                         ↓
                                              生成 human-review.html
                                              （6 章 + 验收指引）
```

human-review.html 不是由代码生成的，而是由 **AI agent 根据 human-review.md 模板指引**手动组装。模板定义了：
- CDN 依赖（highlight.js, mermaid）
- CSS 设计令牌（Slate Indigo 主题）
- 组件样式规格
- 6 章的来源映射

### design.md 模板现状

当前 design.md 模板（`templates/openspec/schemas/superpowers-bridge/templates/design.md`）包含以下 section：

| Section | 内容 |
|---------|------|
| TL;DR | 一句话方案 + 交付清单 |
| 需求引用 | 引用 brainstorm.md |
| 方案设计 | 架构概览(C4) + ATAM 对比 + 关键时序 + 模块设计 + 数据设计 |
| 质量设计 | SLO + STRIDE + 旁路隔离 |
| 决策追溯 | 决策 → 需求追溯 |
| 风险与未决 | 风险 + 缓解 |

**缺失：没有「代码设计预览」section**（函数签名、伪代码、interface 变更、Diff 对比）。这是 brainstorm 确认的核心新增需求。

## 关键代码路径

### 变更点 1：human-review.md 模板

**文件**：`templates/openspec/schemas/superpowers-bridge/templates/human-review.md`（230 行）

当前定义 6 章输出：

| 章节 | 来源 | 保留？ |
|------|------|--------|
| 01 需求背景 | brainstorm.md | ✓ 合并到「需求与设计」 |
| 02 现状调查 | explore.md | ✗ 移入 Artifact 原文查看器 |
| 03 技术设计 | design.md | ✓ 合并到「需求与设计」 |
| 04 变更提案 | proposal.md | ✗ 移入 Artifact 原文查看器 |
| 05 规格清单 | specs/*.md | ✗ 移入 Artifact 原文查看器 |
| 06 实现任务 | tasks.md | ✓ 保留为独立章节 |

需要重写为：Dashboard + 2 章 + Artifact 查看器 + 验收指引。

**关键新增内容**：
- Dashboard 区域（architecture-diagram SVG + 摘要 + 风险信号 + 任务概览）
- Artifact 原文查看器（`<script type="text/markdown">` + marked.js 按需渲染）
- 代码设计预览区域（从 design.md 新增 section 提取）
- Diff 高亮对比样式
- 章节折叠/展开交互（JS + localStorage）
- CDN 新增：marked.js

### 变更点 2：design.md 模板

**文件**：`templates/openspec/schemas/superpowers-bridge/templates/design.md`（69 行）

需要在「模块设计」之后新增「代码设计预览」section：

```markdown
### 代码设计预览

<!-- 关键函数签名、伪代码、interface 变更 -->
<!-- 评审者通过此 section 判断 AI 即将实施的代码方案是否合理 -->
<!-- 变更前后对比使用代码块 + diff 标注 -->
```

### 变更点 3：schema.yaml human-review instruction

**文件**：`templates/openspec/schemas/superpowers-bridge/schema.yaml`（行 219-274）

instruction 中描述了 6 章的收集和生成流程，需要更新为新章节结构。同时需要增加：
- 读取 marked.js CDN
- 内嵌所有 .md 原文为 `<script type="text/markdown">`
- 调用 architecture-diagram skill 生成 Dashboard SVG
- 折叠/展开 JS 交互

### 变更点 4：项目内副本同步

变更 templates/ 后，需要同步更新 openspec/schemas/superpowers-bridge/ 下的对应文件。`devkeel update` 命令会处理这个同步，但开发时需要手动保持一致。

## 测试覆盖

### 已有测试

human-review 相关的自动化测试：**无**。

human-review.html 是 AI agent 根据模板指引生成的产物，不经过代码路径，因此没有单元测试覆盖。验证方式是人工在浏览器中打开检查。

### 模板文件的测试

templates/ 目录的测试在 `tests/templates.test.ts`，覆盖模板复制逻辑（`copyTemplateSkills`、`copyDirRecursive` 等），但不验证模板内容本身。

### 测试需求

本次变更的测试策略：
- 模板内容变更不需要新增自动化测试（模板是指引文档，不是可执行代码）
- 验证方式：修改后用一个现有 change 重新生成 human-review.html，在浏览器中验证

## 风险与约束

### R1：marked.js CDN 可用性

新增 marked.js CDN 依赖（jsdmirror 镜像）。与现有 highlight.js 和 mermaid 使用同一镜像源，风险等级与现有一致。

**缓解**：Artifact 原文查看器在 marked.js 加载失败时可优雅降级为显示原始 markdown 文本。

### R2：architecture-diagram skill 依赖

Dashboard 的影响范围可视化依赖 architecture-diagram skill。若该 skill 不可用，需要在 human-review.md 指引中说明降级方案（使用 Mermaid 图替代）。

### R3：HTML 体积控制

内嵌所有 artifact .md 原文会增加 HTML 体积。估算：

| 组件 | 当前体积 | 新增 |
|------|----------|------|
| HTML + CSS + JS | ~25KB | +5KB（交互 JS + Diff 样式） |
| 内嵌 .md 原文 | 0 | +15-25KB（6 个 .md × 2-5KB） |
| Dashboard SVG | 0 | +5-10KB |
| **总计** | ~25KB | ~50-60KB |

体积翻倍但仍在合理范围（<100KB），且 .md 原文是纯文本、高度可压缩。

### R4：向后兼容性

human-review.md 模板变更后，已归档的 change 不受影响（它们已经生成了 HTML）。新 change 会使用新模板。没有向后兼容性问题。

### R5：双份模板同步

`templates/` 和 `openspec/schemas/` 下都有模板文件副本。修改时必须同步两处，否则 `devkeel update` 后会覆盖项目内的修改。

**缓解**：先改 `templates/`（source of truth），再手动复制到 `openspec/schemas/`。

---

## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-human-review-html
