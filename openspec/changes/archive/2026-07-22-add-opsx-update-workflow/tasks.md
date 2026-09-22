# 实施任务

- [x] **1. `/opsx:update` 提供 schema-driven、planning-only 的修订工作流**
  - **结果：** thin command 加载本地化 `openspec-update-change`；skill 从动态 schema 的 Apply 前置依赖闭包展开已有 concrete artifact 路径，并安全发现 Lite 已有的可选 delta specs，逐 artifact 确认并保持一致，不创建 artifact、改实现代码或伪造验证产物，同时保留 Harness promotion/task 证据语义。
  - **范围：** `templates/commands/opsx/update.md`、`templates/skills/openspec-update-change/SKILL.md` 及 `.harness/` 镜像。
  - **验证：** `pnpm exec vitest run tests/openspec-skills-upstream.test.ts tests/templates.test.ts`

- [x] **2. 新 workflow 可通过 init/update 正确分发并参与资产版本管理**
  - **结果：** 新 skill 从版本 `1.0` 起步，模板和 dogfood 版本表一致；全新初始化及旧模板升级都会安装 update command/skill 并记录版本；当前 Web 页面显示 12 个 OPSX workflow 并区分两种 update。
  - **范围：** 两份版本表、当前 Web 架构/能力清单、配置/初始化/更新与文档测试。
  - **验证：** `pnpm exec vitest run tests/config.test.ts tests/init.test.ts tests/update.test.ts && pnpm --dir web exec vitest run tests/workflow-docs.test.ts`

- [x] **3. Update 的持久行为和上游差异有自动化契约**
  - **结果：** OPSX spec 定义 existing-only、逐项确认、Update/Continue/Apply 边界与 Harness 标记守卫；测试锁定 OpenSpec 1.6 factory、custom schema、无 Store/allowed-tools 以及禁止自动实施。
  - **范围：** change delta spec、`tests/openspec-skills-upstream.test.ts`、`tests/templates.test.ts`。
  - **验证：** `node bin/devkeel.js openspec validate add-opsx-update-workflow --json && pnpm exec vitest run tests/openspec-skills-upstream.test.ts tests/templates.test.ts`

- [x] **4. 新入口达到可发布质量并安全收尾**
  - **结果：** 指令审计无镜像漂移，聚焦与全量门禁通过，最终审查无 P0/P1；本次不发版，Templates changelog JSON 延后到实际 release。
  - **范围：** 最终受影响文件、OpenSpec change 状态与归档。
  - **验证：** `pnpm test && pnpm run lint && git diff --check`
