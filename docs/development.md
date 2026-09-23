# 开发指南

依赖使用 pnpm，运行环境要求以 [根 package.json](../package.json) 的 `engines` 为准。
执行命令前确认工作目录与对应 manifest；详细依赖约束见
[依赖管理](../.harness/rules/dependency-management.md)。

## CLI 开发入口

在仓库根目录运行，命令定义以 [scripts](../package.json) 为准：

| 命令 | 用途 |
|------|------|
| `pnpm build` | 通过 tsup 构建 CLI |
| `pnpm dev` | watch 构建 |
| `pnpm lint` | TypeScript 类型检查 |
| `pnpm test` | 运行根项目 Vitest 测试 |
| `pnpm test:watch` | watch 测试 |
| `node bin/devkeel.js --help` | 查看本地 CLI；先构建，确保 dist 对应当前源码 |

选择单个测试和 Web 验证方式见 [测试说明](testing.md)。
CLI 子命令和选项的用户说明见 [README](../README.md#cli-命令)，命令注册事实以
[src/index.ts](../src/index.ts) 为准。

## 编码说明

实际约束由适用 rules 提供。需要示例时读取：

- [导入、导出与文件系统操作](examples/coding-standards.md)
- [控制流与组织方式](examples/coding-philosophy.md)
- [命名](examples/naming-conventions.md)
- [错误处理](examples/error-handling.md)
- [Web 组件与路由](examples/web-frontend.md)

示例解释代码模式，不是可直接执行的配置或当前源码快照。
