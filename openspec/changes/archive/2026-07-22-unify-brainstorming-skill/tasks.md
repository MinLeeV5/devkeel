# 实现任务

<!-- harness:full-tasks-reconciled -->

- [x] **1. 分发唯一的 Harness Brainstorming skill**
  - **来源：** `specs/brainstorming-workflow`、`specs/embed-superpowers-skills`
  - **结果：** 模板与 dogfood 只包含 `brainstorming@7.0.0`；skill 能按成熟度自适应完成事实梳理、问题界定、方向探索、方案比较、方案检验和结论收束，按需提出一至三个连续问题，并以条件 reference 承接 OpenSpec 上下文。
  - **范围：** `templates/skills/`、`.harness/skills/`、两份 `versions.yml`、skill/config/template 契约测试；删除 `grilling` 与 `openspec-explore` 目录。
  - **约束：** author 必须为 `devkeel`；严格只读；Agent 可推荐和挑战，但实质边界由用户确认；不得保留旧 skill、别名、固定全阶段流程、自动写设计文档、commit 或 `writing-plans` 交接。
  - **本地验证：** `npx vitest run tests/templates.test.ts tests/templates-cache.test.ts tests/config.test.ts`

- [x] **2. 在执行契约前置写入授权门禁**
  - **来源：** `specs/workflow-routing`、design 的“请求路由”
  - **结果：** 每个独立目标只有在收到明确动作指令，或用户明确认可最近一条包含具体持久化动作与范围的实施方案或授权询问后，才获得相应写入权限；认可按上下文语义判断，不依赖固定词表；评价、建议、可能性表达和带路径的模糊反馈保持只读，需要澄清时进入 brainstorming。
  - **范围：** `templates/agents-md.md`、`AGENTS.md`、brainstorming 模板与 dogfood 镜像及 `tests/workflow-routing.test.ts` / `tests/templates.test.ts`；以静态契约覆盖模糊反馈、具体实施方案认可、非具体确认、混合请求、写型 L0 和三档路由。
  - **约束：** 权限不得跨目标或子句扩散；脱离上下文或只确认未写明具体动作与范围的方向、目标、验收不授权；任何写型 L0 先过门禁，只读 L0 可直接执行；已有风险路由和 Direct/Lite/Full 契约保持有效；环境可查事实不得反问用户。
  - **本地验证：** `npx vitest run tests/workflow-routing.test.ts tests/integration-scenarios.test.ts`

- [x] **3. 让 OPSX Explore 复用 Brainstorming 的只读 OpenSpec 模式**
  - **来源：** `specs/brainstorming-workflow` 的 OpenSpec 与 OPSX Explore requirements
  - **结果：** `/opsx:explore` 名称保持可用，但只加载唯一 `brainstorming` skill，并传递 raw topic、明确 change 和热上下文；topic-only 可调查而不虚构 change，选定 change 后使用 CLI JSON 的动态上下文。
  - **范围：** `templates/commands/opsx/explore.md`、`.harness/commands/opsx/explore.md`、OpenSpec skill/command/template 契约测试；移除独立 `openspec-explore` 上游镜像契约，为 topic-only 与 selected-change 分支建立本地测试。
  - **约束：** 普通讨论不因存在 `openspec/` 运行 CLI；selected-change 必须保留 `changeRoot`、`artifactPaths.<id>.existingOutputPaths` 与 `actionContext`；command 不得复制阶段算法、修改应用代码或 planning artifact，也不得保留“批准后更新 artifact”分支。
  - **本地验证：** `npx vitest run tests/templates.test.ts tests/openspec-skills-upstream.test.ts tests/openspec.test.ts`

- [x] **4. 实现可恢复的讨论 skill 受管迁移**
  - **来源：** `specs/harness-schema-migration`、design 的“受管升级时序”
  - **结果：** fresh init、当前双 skill 项目、旧 `brainstorming@6.0.3`、目标结构损坏与混合中断状态都安全收敛到 7.0.0；同文件系统 staging 校验后，以可恢复事务切换 skill、command 和旧目录，并以原子 versions 替换提交；有效状态二次运行 no-op。
  - **范围：** `src/lib/update.ts`、`src/commands/update.ts`、必要的 init/template/事务辅助代码，以及 `tests/update.test.ts`、`tests/init.test.ts` 和邻近模板迁移测试；覆盖目标/父 symlink、版本最新但 reference 缺失、部分旧目录已删、事务中断、AGENTS 框架重试，以及 consolidation 成功但另一组件被跳过。
  - **约束：** required consolidation 在可跳过的普通组件写入前执行且不可部分跳过，相关 skill/command/退休目录不得先走通用复制、批量同步或清理；成功升级必须删除 6.0.3 遗留文件；copy、frontmatter、reference、command、路径或版本提交失败时恢复旧资产并保持 versions 原始字节；版本表只合并实际成功项，被跳过组件保留旧版本；用户拒绝 AGENTS 更新后 framework drift 必须在下次 update 越过 no-op 再次出现。
  - **本地验证：** `npx vitest run tests/update.test.ts tests/init.test.ts tests/templates.test.ts`

- [x] **5. 更新现行使用说明**
  - **来源：** `specs/embed-superpowers-skills`、design 的兼容与迁移决策
  - **结果：** README 和现行 Web 页面使用唯一 brainstorming、写入授权门禁与 `/opsx:explore` 兼容语义，并说明 `grilling`、`openspec-explore` 的迁移入口；安装指南只纠正受管 skill 名称，不重复运行时契约或迁移算法。
  - **范围：** `README.md`、`web/install.md`、`web/public/install.md`、`web/public/sharing.html` 与当前 architecture/capability/workflow 页面及其测试；install 两份镜像只保留 `grilling` → `brainstorming` 的必要纠正。
  - **约束：** 本 change 不执行发布，不创建根 `CHANGELOG.md` 或版本 JSON；后续发布再按 changelog 流程记录。不得改写 `openspec/changes/archive/`、Web v1 页面或已发布版本快照。
  - **本地验证：** `npm --prefix web test && npm --prefix web run build`；限定当前资产搜索确认没有把退休 skill 描述为可用入口。

- [x] **6. 精炼授权门禁并中文化讨论阶段**
  - **来源：** 用户对完成实现的追加反馈、`specs/workflow-routing`、`specs/brainstorming-workflow`
  - **结果：** AGENTS 以总结原则和无标签的场景条件句表达授权门禁；brainstorming 以“事实梳理、问题界定、方向探索、方案比较、方案检验、结论收束”描述自适应阶段，并补充复杂问题拆分、遵循现有结构和避免超前设计的质量原则。
  - **范围：** `AGENTS.md`、`templates/agents-md.md`、brainstorming 模板与 dogfood 镜像、相关 active change artifacts 和静态契约测试。
  - **约束：** 不限定门禁句数或增加加粗场景标签；不削弱逐目标授权、基于上下文语义的认可、混合请求、写型 L0/L1 与严格只读语义；不恢复固定阶段、固定产物或流程串联；不改 archive、Web v1 或版本快照。
  - **本地验证：** `npx vitest run tests/templates.test.ts tests/workflow-routing.test.ts tests/openspec-skills-upstream.test.ts`

## Final Verification

| 检查 | 命令或操作 | 覆盖目标 | 必需性 |
|------|------------|----------|--------|
| 聚焦行为回归 | `npx vitest run tests/templates.test.ts tests/templates-cache.test.ts tests/config.test.ts tests/workflow-routing.test.ts tests/openspec-skills-upstream.test.ts tests/openspec.test.ts tests/update.test.ts tests/init.test.ts tests/integration-scenarios.test.ts` | skill、路由、命令、init/update 与静态场景契约 | required |
| 根项目质量 | `npm run lint && npm test && npm run build` | 类型、全量回归和 CLI 构建 | required |
| Web 质量 | `npm --prefix web test && npm --prefix web run build` | 现行说明与页面构建 | required |
| 资产、恢复与历史边界审计 | 限定 `templates/`、`.harness/`、`src/` 和现行 Web/README 搜索退休名称，检查无遗留 staging/backup/事务文件，并检查 archive、v1 与版本快照 diff | 唯一 skill、迁移清理、无旧入口、历史资产未改写 | required |
| 指令与 diff 审计 | 按 instruction-maintenance 检查触发、授权、权限与真源重复，并运行 `git diff --check` | 指令一致性与格式 | required |
