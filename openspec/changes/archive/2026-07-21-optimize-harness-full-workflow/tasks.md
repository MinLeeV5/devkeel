# 实施任务

- [x] **1. Lite 与 Full schema 提供新的 artifact 契约**
  - **结果：** Lite 使用共用 `brainstorm → tasks` 规划链且不再限制篇幅；Full 使用 `brainstorm → design → specs → tasks → verify → retrospective` 强制 artifact 图，以 tasks 作为 apply 分界。Full 的 brainstorm、design、spec、tasks、verify、retrospective 模板均按已确认的结果导向结构工作，human-review 不再出现在 schema 中；dogfood 与分发模板完全一致并更新 schema 版本。
  - **范围：** `templates/openspec/schemas/lite/`、`templates/openspec/schemas/full/`、`openspec/schemas/lite/`、`openspec/schemas/full/`、schema 版本声明及对应模板契约测试。
  - **验证：** `npm test -- tests/templates.test.ts tests/openspec.test.ts tests/release-workflow.test.ts`；运行 OpenSpec schema/status 检查确认依赖图和 `apply.requires`。

- [x] **2. 规划入口按风险路由并支持 Lite 原地升级 Full**
  - **结果：** Direct 仍为不明确边界的默认选择，无上下文 `/opsx:new` 默认 Lite；Full 仅按已确认风险或显式选择建议，用户拒绝后可继续 Lite。同一 change 能在规划早期或 tasks/实现开始后安全升级并保留热上下文、代码和已验证任务；`new/continue/ff/propose` 在达到 `apply.requires` 后停止，不因 verify 的拓扑 ready 提前越过 apply 分界。
  - **范围：** `templates/agents-md.md`、`AGENTS.md`，`templates/commands/opsx/` 与 `.harness/commands/opsx/` 中的 `new/continue/ff/propose`，对应 `templates/skills/openspec-*` 与 `.harness/skills/openspec-*`，路由和升级场景测试。
  - **验证：** `npm test -- tests/workflow-routing.test.ts tests/templates.test.ts tests/integration-scenarios.test.ts`；对相关 integration shell 脚本运行 `bash -n`。

- [x] **3. Full Apply、Verify 与 Archive 形成轻量且有门禁的闭环**
  - **结果：** Full Apply 由当前 Agent 顺序执行结果任务，复用热上下文，保护既有工作区改动，按需使用聚焦 TDD；任务经本地验证后完成，失败可恢复，范围变化能回到上游 artifact。所有任务结束只做一次 `review-orchestrator auto`，仅 P0/P1 阻断并定向复审，随后自动走统一 Verify。Verify 根据 Final Verification 产出 PASS/FAIL/BLOCKED 测试报告并记录同一指纹的 Final Review provenance；Standalone PASS 不得绕过 Review。Archive 检查实现指纹与 Review 新鲜度、兼容旧 Full、生成精简 retrospective、默认同步 specs，并提供记录风险的显式 force。Lite 继续快速归档，所有 commit/push/PR/清理动作只在归档后询问且默认不执行。
  - **范围：** Full schema 的 apply/verify/retrospective 指令与模板，`apply/verify/archive` OPSX commands 及对应 OpenSpec skills 的模板和 dogfood 镜像，Lite/Full/旧 Full 生命周期场景。
  - **验证：** `npm test -- tests/templates.test.ts tests/integration-scenarios.test.ts tests/evidence.test.ts`；相关完整生命周期 integration 脚本通过语法检查并验证不再触发旧执行器。

- [x] **4. 规划 skills 结果导向，Human Review 成为独立可选能力**
  - **结果：** requirement-analysis 默认由当前 Agent 做必要调查，只询问实质未知项，不自动调度 Explore 或串联 technical-design；technical-design 将领域与 D1–D14 裁剪保留为内部方法，只输出可落地方案。新增显式调用的 human-review skill，可读取 Lite/Full 已有 artifacts、生成并尝试打开 `human-review.html`，但不改变 schema status 或门禁。review-orchestrator 与 commit 保持 Harness 原生职责。
  - **范围：** `templates/skills/requirement-analysis/`、`templates/skills/technical-design/`、新增 human-review skill、对应 `.harness/skills/` 镜像、版本声明和 skill/template 测试；复用现有 open-review 与 Web 资产。
  - **验证：** `npm test -- tests/templates.test.ts tests/config.test.ts tests/open-review.test.ts tests/inject-review.test.ts`；检查两个规划 skill 不再包含默认 subagent、强制输出矩阵或自动串联指令。

- [x] **5. Superpowers 托管资产从新项目和现有项目中安全退役**
  - **结果：** writing-plans、executing-plans、subagent-driven-development、requesting-code-review、verification-before-completion、finishing-a-development-branch、test-driven-development、using-git-worktrees 不再随 Harness 安装或受版本管理，现行命令、schema、文档和 gitignore 不再依赖其路径。Init/Update 以版本表退管为删除信号，直接删除退休名称对应的 `.harness/skills/<name>` 目录，不检查内容、发布快照、文件摘要或定制状态；复用退休名称的自定义或上游 skill 一并删除，未命中退休名称的用户自建能力不受影响。既有 Full change 继续使用新 Apply，不回填已经越过的 design/specs。
  - **范围：** `templates/skills/`、`.harness/skills/`、`templates/versions-yml.yml`、`.harness/versions.yml`、`templates/gitignore`、版本驱动的退休目录删除与更新规划逻辑（`src/lib/templates.ts`、`src/lib/update.ts`、init/update 命令）及其测试。
  - **验证：** `npm test -- tests/config.test.ts tests/templates.test.ts tests/update.test.ts tests/init.test.ts tests/gitignore.test.ts`；覆盖版本表退管后目录直接删除、内容已定制或来源无法识别时仍删除、版本表已更新后的遗留目录清理、版本键清理和重复更新幂等。

- [x] **6. 分发文档与回归契约证明新流程可用**
  - **结果：** README、AGENTS 框架、版本清单、dogfood 镜像和测试断言统一描述新 Direct/Lite/Full 行为；integration 场景脚本覆盖无上下文默认 Lite、用户拒绝或确认 Full、早期与晚期原地升级、Lite 快速归档、Full 最终 Review/Verify/Retrospective/Archive、force archive、旧 Full 兼容及无 Superpowers 调度。新初始化和增量更新得到一致资产集合。
  - **范围：** `README.md`、`templates/agents-md.md`/`AGENTS.md`、受影响的 `openspec/specs/` current specs，`tests/` 中模板、路由、init/update、OPSX 集成场景与 runner，所有模板和 dogfood 镜像校验。
  - **验证：** 依次运行 `npm run lint`、`npm test`、`npm run build`；由 `tests/integration-scenarios.test.ts` 检查场景注册、关键断言和全部 shell 语法，不执行 `tests/integration/run-all.sh`。
