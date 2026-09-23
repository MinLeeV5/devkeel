# 测试说明

本项目复用 [.harness/rules/testing-strategy.md](../.harness/rules/testing-strategy.md)；
不另建 testing.md 规则副本。文件系统隔离、断言和组织示例见
[测试示例](examples/testing-strategy.md)。

## 作用域与入口

| 范围 | 工作目录 | 执行入口 | 配置依据 |
|------|----------|----------|----------|
| CLI 和模板契约 | 仓库根 | `pnpm test` | [package.json](../package.json)、[vitest.config.ts](../vitest.config.ts) |
| 单个 CLI 测试 | 仓库根 | `pnpm exec vitest run tests/versions.test.ts`（替换为目标文件） | [tests/](../tests/) |
| Web | web/，或根目录用 `pnpm --dir web test` | Web 的 `test` script | [web/package.json](../web/package.json) |
| CLI 类型检查与构建 | 仓库根 | `pnpm lint`、`pnpm build` | [package.json](../package.json)、[tsup.config.ts](../tsup.config.ts) |
| Web 构建 | web/，或根目录用 `pnpm --dir web build` | Web 的 `build` script | [web/package.json](../web/package.json) |

根 Vitest 配置排除了 `web/**`，根测试通过不代表 Web 已验证。脚本与配置的声明只证明入口
存在，具体变更是否通过以当次命令退出状态和测试报告为准。

## 选择与判定

先验证受影响模块；模板和初始化变更优先检查 templates、init-agents、update 及对应 skill
契约。涉及 Web 的范围按 [Web 规则](../.harness/rules/web-frontend.md)选择验证。
测试使用编译产物时先构建，不要求纯源码测试无条件构建。

覆盖率配置与 CI 是实际门槛的依据，当前根 Vitest 配置没有声明覆盖率阈值；不能把生成模板
的建议比例当作已生效要求。缺少测试或环境时报告未验证，补测试交给实施流程。

失败报告保留工作目录、命令、失败用例和关键错误栈，区分真实回归、环境问题和覆盖缺口。
只有新的改动、失败或未解决疑点才扩大或重复检查。
