# 实施任务

## 交付结果

- [x] **1. 子仓库初始化只分发领域承载层**
  - **结果：** CLI 自动持久化 root/domain profile；domain init 创建领域 AGENTS、知识目录和平台链接，但不复制模板通用 skills、OPSX commands 或 OpenSpec，重复 init 保留自定义领域资产。
  - **范围：** `src/lib/config.ts`、`src/commands/init.ts`、相关 config/init tests。
  - **验证：** `pnpm vitest run tests/config.test.ts tests/init.test.ts tests/init-agents.test.ts`

- [x] **2. 子仓库更新和诊断保持角色边界**
  - **结果：** domain profile 的 versions/update 不把根仓库资产视为缺失更新，doctor 不要求 root-only commands/OpenSpec；普通根仓库行为保持不变。
  - **范围：** `src/commands/update.ts`、`src/commands/doctor.ts`、版本过滤辅助逻辑及相关 tests。
  - **验证：** `pnpm vitest run tests/update.test.ts tests/doctor.test.ts tests/config.test.ts`

- [x] **3. 安装文档明确主仓库与领域子仓库资产边界**
  - **结果：** 两份 `install.md` 保持一致，Step 2/7/8/9 和目录示例不再要求通用 skills/commands 下沉，并说明从主仓库共享调用 domain-init/verify-init。
  - **范围：** `web/install.md`、`web/public/install.md`、文档一致性测试；当前未发版，因此不新增 changelog 版本 JSON。
  - **验证：** `cmp web/install.md web/public/install.md`，并运行仓库中与 install 文档相关的测试及 `pnpm --dir web build`。

- [x] **4. CLI 变更通过整体回归和差异自审**
  - **结果：** 定向测试、类型/构建检查与低成本 diff 自审通过，未覆盖工作树中与本 change 无关的既有修改。
  - **范围：** 本 change 的代码、测试、文档和 OpenSpec artifacts。
  - **验证：** 134 个相关测试、`pnpm build`、`pnpm lint`、`git diff --check` 与领域 reviewer 复审通过；`pnpm test` 唯一失败来自任务开始前已修改的 `openspec/config.yaml` 与既有模板断言不一致。
