# 架构约束

需要代码示例或出处时，读取 [配套说明](../../docs/examples/architecture-constraints.md)。

## 约定 1: commands → lib 单向依赖

`src/commands/` 可以导入 `src/lib/`，反方向禁止。lib 层不得感知命令层的存在。

## 约定 2: lib 层间依赖为有向无环图

lib 模块间允许互相引用，但禁止循环依赖。新增 lib 模块时须确认不引入环路。
模块职责与依赖示例见 [架构说明](../../docs/architecture.md)。

## 约定 3: bin/ 只做入口转发

`bin/devkeel.js` 唯一职责是 `import '../dist/index.js'`，不含任何逻辑判断、参数处理或条件分支。

## 约定 4: src/index.ts 只做命令注册

入口文件仅负责 Commander program 定义和 `.command().action()` 注册，不包含业务逻辑。每个 action handler 为单行函数调用。

## 约定 5: templates/ 只通过 lib/templates.ts 访问

模板目录的路径解析和文件操作统一由 `src/lib/templates.ts` 封装（`getTemplatesDir()`）。commands 层不得直接拼接 templates 路径。

## 约定 6: @clack/prompts 只出现在 commands 层

lib 层禁止引入 `@clack/prompts`。所有用户交互（输入、输出、spinner）都在 commands 层完成。
