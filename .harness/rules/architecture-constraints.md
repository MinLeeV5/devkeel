# 架构约束

## 约定 1: commands → lib 单向依赖

`src/commands/` 可以导入 `src/lib/`，反方向禁止。lib 层不得感知命令层的存在。

出处: `src/lib/` 全部文件的 import 均为 `node:*`、第三方包或同层 `./xxx.js`，无任何 `../commands/` 导入

```typescript
// ✅ 正确 — commands 导入 lib
import { readConfig } from '../lib/config.js'
import { createPlatformLinks } from '../lib/templates.js'

// ❌ 错误 — lib 导入 commands
import { runInit } from '../commands/init.js'
```

## 约定 2: lib 层间依赖为有向无环图

lib 模块间允许互相引用，但禁止循环依赖。当前实际依赖方向：

- `templates.ts` → `config.js`（读版本）
- `detect.ts` → `templates.js`（`isDirectorySafe`）

新增 lib 模块时须确认不引入环路。

出处: `src/lib/templates.ts:4`, `src/lib/detect.ts:3`

## 约定 3: bin/ 只做入口转发

`bin/devkeel.js` 唯一职责是 `import '../dist/index.js'`，不含任何逻辑判断、参数处理或条件分支。

出处: `bin/devkeel.js`

```javascript
// ✅ 正确
#!/usr/bin/env node
import '../dist/index.js'

// ❌ 错误 — 在 bin 中做参数预处理
```

## 约定 4: src/index.ts 只做命令注册

入口文件仅负责 Commander program 定义和 `.command().action()` 注册，不包含业务逻辑。每个 action handler 为单行函数调用。

出处: `src/index.ts` — 全部 action 为 `() => runXxx()` 或 `(opts) => runXxx(opts)`

```typescript
// ✅ 正确 — 单行委托
.action((opts) => runDoctor(opts))

// ❌ 错误 — 在 action 中写逻辑
.action(async (opts) => {
  const config = readConfig(process.cwd())
  if (!config) { ... }
})
```

## 约定 5: templates/ 只通过 lib/templates.ts 访问

模板目录的路径解析和文件操作统一由 `src/lib/templates.ts` 封装（`getTemplatesDir()`）。commands 层不得直接拼接 templates 路径。

出处: `src/lib/templates.ts:8-12`（`getTemplatesDir`），commands 中无直接 templates 路径引用

## 约定 6: @clack/prompts 只出现在 commands 层

lib 层禁止引入 `@clack/prompts`。所有用户交互（输入、输出、spinner）都在 commands 层完成。

出处: `src/lib/` 全部文件无 `@clack/prompts` 导入；所有 `import * as p from '@clack/prompts'` 仅在 `src/commands/`
