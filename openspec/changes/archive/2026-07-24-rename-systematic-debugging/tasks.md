# 实施任务

- [x] **1. Debug skill 使用新标识并明确 TypeScript 复用边界**
  - **结果：** 模板与 dogfood 只提供 `systematic-debugging`；frontmatter、AGENTS 路由和版本清单
    使用新名称；TypeScript 按 Browser/Node/Electron 实际运行时复用现有 JS helper，只增加必要的
    类型或模块适配说明，不新增 emitter 或协议副本。
  - **范围：** `templates/skills/`、`.harness/skills/`、`templates/agents-md.md`、`AGENTS.md`、
    两份 versions yml、Debug reference 与专项测试。
  - **验证：** 比较模板与 dogfood 新目录；搜索旧路由/旧版本键；运行 Debug 专项、模板、路由和
    config 测试。

- [x] **2. 受管更新按先安装后移除迁移旧 Debug skill**
  - **结果：** `systematic-debugging` 不再被当作退休资产；旧
    `automated-instrumented-debugging` 只有在新目录已安装且旧版本键证明其受管时才被移除，
    成功更新后版本键切换；跳过新 skill 或未登记的自定义旧目录保持不变。
  - **范围：** `src/lib/update.ts`、`src/commands/update.ts` 与 init/update/migration 测试。
  - **验证：** 定向运行成功迁移、逐项跳过、自定义保留、幂等和 symlink 安全用例。

- [x] **3. 分发、回归与收尾门禁确认改名后无双 skill**
  - **结果：** 新安装、更新和受管资产检查只暴露一个 Debug skill；模板/dogfood、metadata 和版本
    保持一致，旧名称只存在于迁移代码、迁移测试或历史 artifact；不生成 changelog、不发布。
  - **范围：** 本 change 全部实现、测试与 OpenSpec artifact。
  - **验证：** `npm run lint`、相关 Vitest、`npm run build`、`git diff --check`、受限旧名称搜索及
    一次阻断优先审查。
