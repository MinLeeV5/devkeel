# 架构约束示例

执行约束见 [对应规则](../../.harness/rules/architecture-constraints.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: commands → lib 单向依赖

出处: `src/lib/` 全部文件的 import 均为 `node:*`、第三方包或同层 `./xxx.js`，无任何 `../commands/` 导入

```typescript
// ✅ 正确 — commands 导入 lib
import { readVersions } from '../lib/versions.js'
import { createPlatformLinks } from '../lib/templates.js'

// ❌ 错误 — lib 导入 commands
import { runInit } from '../commands/init.js'
```

## 约定 2: lib 层间依赖为有向无环图

出处: `src/lib/templates.ts:4`, `src/lib/detect.ts:3`

## 约定 3: bin/ 只做入口转发

出处: `bin/devkeel.js`

```javascript
// ✅ 正确
#!/usr/bin/env node
import '../dist/index.js'

// ❌ 错误 — 在 bin 中做参数预处理
```

## 约定 4: src/index.ts 只做命令注册

出处: `src/index.ts` — 全部 action 为 `() => runXxx()` 或 `(opts) => runXxx(opts)`

```typescript
// ✅ 正确 — 单行委托
.action((opts) => runDoctor(opts))

// ❌ 错误 — 在 action 中写逻辑
.action(async (opts) => {
  const config = readVersions(process.cwd())
  if (!config) { ... }
})
```

## 约定 5: templates/ 只通过 lib/templates.ts 访问

出处: `src/lib/templates.ts:8-12`（`getTemplatesDir`），commands 中无直接 templates 路径引用

## 约定 6: @clack/prompts 只出现在 commands 层

出处: `src/lib/` 全部文件无 `@clack/prompts` 导入；所有 `import * as p from '@clack/prompts'` 仅在 `src/commands/`
