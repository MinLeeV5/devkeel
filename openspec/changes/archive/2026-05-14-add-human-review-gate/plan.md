# Human Review Gate 实现计划

> **给 agentic 执行器：** 使用 superpowers:subagent-driven-development
> 按任务逐个实现本计划。

**目标：** 在 superpowers-bridge schema 中新增 human-review artifact，作为 plan 之后、apply 之前的人类验收门禁。

**架构：** 仅修改 schema 模板层（templates/openspec/schemas/superpowers-bridge/），不涉及 openspec CLI 核心代码。变更集中在 schema.yaml（artifact 定义 + apply.requires）和新增模板文件。

**技术栈：** YAML（schema 定义）、Markdown（模板）、HTML（验收文档输出格式）

---

## 任务 1: 修改 schema.yaml — 新增 human-review artifact

- [ ] **步骤 1.1:** 读取 `templates/openspec/schemas/superpowers-bridge/schema.yaml`，定位 `plan` artifact 定义（约 182-206 行）和 `verify` artifact 定义（约 209 行）
- [ ] **步骤 1.2:** 在 `plan` 和 `verify` 之间插入 `human-review` artifact 定义：
  ```yaml
  - id: human-review
    generates: human-review.html
    description: 汇总所有规划产出生成 HTML 验收文档，供人类在浏览器中审阅
    template: human-review.md
    instruction: |
      （详见步骤 3.x）
    requires:
      - plan
  ```
- [ ] **步骤 1.3:** 修改 `verify` artifact 的 `requires` 从 `[plan]` 改为 `[human-review]`（verify 在 human-review 之后）
- [ ] **步骤 1.4:** 修改 `apply.requires` 从 `[plan]` 改为 `[human-review]`
- [ ] **步骤 1.5:** 更新 schema.yaml 顶部 description 中的流程描述，将 `流程：brainstorm → proposal → specs → tasks → plan → verify → retrospective` 改为 `流程：brainstorm → proposal → specs → tasks → plan → human-review → verify → retrospective`
- [ ] **提交点:** `feat(schema): add human-review artifact to superpowers-bridge`

## 任务 2: 创建 human-review.md 模板文件

- [ ] **步骤 2.1:** 创建 `templates/openspec/schemas/superpowers-bridge/templates/human-review.md`
- [ ] **步骤 2.2:** 模板内容为一个轻量 scaffold，指引 agent 输出 HTML 文件：
  ```markdown
  <!-- human-review.html 的生成模板 -->
  <!-- agent 应读取所有已完成的规划 artifact 并生成一份自包含的 HTML 文件 -->
  ```
- [ ] **提交点:** `feat(schema): add human-review template`

## 任务 3: 编写 human-review artifact 的 instruction

- [ ] **步骤 3.1:** 在 schema.yaml 的 human-review artifact instruction 字段中，编写以下逻辑：
  - 读取 change 目录下的 brainstorm.md、proposal.md、design.md（如有）、specs/**/*.md、tasks.md、plan.md
  - 从每个 artifact 提取关键信息（标题、摘要、核心内容）
- [ ] **步骤 3.2:** 定义 HTML 文档结构规范：
  - 单文件自包含（内联 CSS，无外部依赖）
  - 顶部：变更名称、日期、一句话摘要
  - 目录导航（锚点链接）
  - 各 section：需求背景、变更提案、设计要点（可选）、规格清单、任务列表、实现计划
  - 底部：验收指引（提示用户确认后开新会话执行 apply）
- [ ] **步骤 3.3:** 编写 agent 提示语：
  - 生成完成后显示 HTML 文件路径
  - 提示用户用 `open <path>` 在浏览器中打开
  - 明确告知：验收完毕后请运行 `/new` 开新会话，然后执行 `/opsx:apply`
- [ ] **提交点:** `feat(schema): add human-review instruction with HTML generation logic`

## 任务 4: 验证

- [ ] **步骤 4.1:** 运行 `pnpm build` 确认构建通过
- [ ] **步骤 4.2:** 运行 `pnpm test` 确认现有测试不受影响
- [ ] **步骤 4.3:** 运行 `openspec validate --all` 确认 schema 仍有效
- [ ] **步骤 4.4:** 创建一个临时测试 change（`openspec new change test-review`），运行 `openspec status --change test-review --json`，确认输出包含 `human-review` artifact 且 `applyRequires` 包含 `human-review`
- [ ] **步骤 4.5:** 清理测试 change（`rm -rf openspec/changes/test-review`）
- [ ] **提交点:** 无额外提交（验证步骤）
