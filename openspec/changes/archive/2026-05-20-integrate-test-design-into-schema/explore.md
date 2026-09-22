## 调查范围

基于 brainstorm.md 确认的需求，聚焦以下区域：

1. `templates/openspec/schemas/superpowers-bridge/` — schema 定义和 artifact 模板
2. `templates/skills/test-case-designer/` — 待重写的 skill
3. `templates/skills/generate-test-cases/` — 待合并废弃的 skill
4. `web/human-review.js` — 需增加测试覆盖卡片解析
5. `templates/openspec/schemas/superpowers-bridge/templates/verify.md` — 需增加 §8

## 现有架构

### schema artifact 流水线

```
brainstorm → explore → design → proposal → specs → tasks → human-review → verify → retrospective
                                                              ↑
                                                        apply (parallel)
```

- `design` artifact 的 instruction 调用 `technical-design` skill，输出到 `design.md`
- `human-review` artifact 生成 HTML，然后调用 `inject-review` 注入 CSS/JS/artifacts
- `verify` artifact 模板有 7 个检查章节（§1-§7），§7 是延迟验证覆盖缺口

### inject-review 机制

`inject-review` 自动扫描 change 目录下所有 `.md` 文件，注入为 `<script type="text/markdown" data-artifact="name">`。这意味着：
- 只要 `test-points.md` 存在于 change 目录，它会自动出现在 Artifact 查看器标签页
- 无需修改 inject-review 代码

### human-review.js 现有能力

- `buildArtifactViewer()` — 自动发现并渲染注入的 markdown artifacts
- `toggleSection()` — 折叠/展开
- `switchArtifactTab()` — 标签页切换，lazy render markdown via `marked.parse()`
- 无任何"解析 markdown 内容提取统计数据"的逻辑

### test-case-designer skill 结构

```
templates/skills/test-case-designer/
└── SKILL.md          # 主 skill 定义（三阶段门禁、TP 追溯体系）

.harness/skills/test-case-designer/
├── SKILL.md          # 已部署版本（内容同上）
├── agents/
│   └── openai.yaml   # Agent 接口定义
└── references/
    ├── output-contract.md   # 产出格式契约
    └── source-analysis.md   # 输入源分析规则
```

### generate-test-cases skill 结构

```
templates/skills/generate-test-cases/
└── SKILL.md          # 单文件 skill（无 references）
```

## 关键代码路径

### schema design instruction 调用链

`schema.yaml` artifacts[3] (design) → instruction 字段：
1. 前置检查 `technical-design` skill 可用性
2. 调用 Skill 工具 `technical-design`
3. 输出写入 `design.md`

**插入点**：在 design instruction 中增加 subagent 调用 test-case-designer 的逻辑。需要在 `technical-design` 调用之后（或并行）追加测试点产出步骤。

### human-review 模板 → HTML 生成

`human-review.md` 模板定义了输出结构：
- Dashboard（SVG + 卡片网格）
- §01 需求与设计
- §02 实现任务
- §03 待确认项
- §04 Artifact 原文（默认折叠）

**插入点**：在 §02 和 §03 之间新增 `§02.5 测试覆盖` 区域（或调整编号）。

### verify 模板检查流程

`verify.md` 模板包含 §1-§7 + Overall Decision。

**插入点**：在 §7（延迟验证覆盖缺口）之后、Overall Decision 之前新增 §8。

### inject-review 注入流程

```
npx devkeel@latest inject-review <html-path>
  → 扫描同目录 *.md → 注入为 <script data-artifact>
  → 注入 web/human-review.css → 替换 CSS 占位符
  → 注入 web/human-review.js → 替换 JS 占位符
```

`test-points.md` 和 `test-cases.md`（若 apply 后存在）会自动被注入，无需额外代码。

## 测试覆盖

### 现有测试

```
tests/
├── config.test.ts
├── detect.test.ts
├── gitignore.test.ts
├── migrate.test.ts
├── submodule.test.ts
└── templates.test.ts
```

- 无 schema 相关测试（schema 是纯 YAML 配置 + markdown 模板，非代码）
- 无 web/ 目录的测试（JS 直接在浏览器运行）
- skill 是 markdown 文档，无自动化测试

### 本次变更需要验证的路径

| 变更 | 验证方式 |
|------|---------|
| schema.yaml version 改为整数 | `openspec validate --all` |
| design instruction 增加测试设计 | 手动跑一次 `/opsx:continue` 观察行为 |
| verify.md 新增 §8 | 模板结构审查 |
| human-review.md 新增测试覆盖区域 | 生成 HTML 后浏览器打开检查 |
| human-review.js 新增解析逻辑 | 浏览器打开含 test-points.md 的 review 页面 |
| test-case-designer skill 重写 | 调用 skill 验证产出格式 |

## 风险与约束

| 风险 | 严重程度 | 缓解 |
|------|---------|------|
| design instruction 过长导致 LLM 遗漏步骤 | 中 | 将测试设计作为独立段落，明确"并行/可选"语义 |
| subagent 产出的 test-points.md 质量不稳定 | 中 | human-review 门禁 + 模板约束 |
| human-review.js 解析 test-points.md 的正则不鲁棒 | 低 | 只解析 TP 编号计数和覆盖状态表格，不做复杂解析 |
| generate-test-cases 废弃后已有用户受影响 | 低 | 在 SKILL.md 头部声明 deprecated + 指向新 skill |
| versions-yml.yml 版本同步 | 低 | 按 skill-versioning 规范同步 |

---

## 下一步

/opsx:continue integrate-test-design-into-schema
