---
name: new-subcommand
description: 为 DevKeel CLI 新增子命令的标准开发流程
metadata:
  version: "1.0.0"
  author: "devkeel"
  domain: cli-node
triggers:
  - 新增命令
  - 添加子命令
  - new command
  - add subcommand
---

# 子命令实现

## 何时使用

为 DevKeel CLI 新增一个子命令时（如 `harness <new-cmd>`）。

## 流程

### Step 1: 注册命令

在 `src/index.ts` 中添加：

```typescript
import { runNewCmd } from './commands/new-cmd.js'

program
  .command('new-cmd')
  .description('中文功能描述')
  .option('--flag', '选项说明')
  .action((opts) => runNewCmd(opts))
```

### Step 2: 实现命令层

创建 `src/commands/new-cmd.ts`：

```typescript
import * as p from '@clack/prompts'
import { someLogic } from '../lib/new-cmd.js'

export async function runNewCmd(opts?: { flag?: boolean }): Promise<void> {
  p.intro('harness new-cmd')
  // 交互 + 调用 lib
  p.outro('完成')
}
```

命令层只做：读参数 → 交互 → 调用 lib → 输出结果。

### Step 3: 实现逻辑层

创建 `src/lib/new-cmd.ts`：

- 纯函数，不引入 `@clack/prompts`
- 文件操作前 `fs.existsSync` 守卫
- 返回 plain object 或 null，不 throw

### Step 4: 编写测试

创建 `tests/new-cmd.test.ts`：

- 临时目录隔离（`fs.mkdtempSync`）
- 真实文件系统验证
- 覆盖正常路径 + 缺失输入 + 幂等性

### Step 5: 验证

```bash
pnpm lint && pnpm test && pnpm build
node bin/devkeel.js new-cmd --help
```

## Checklist

- [ ] `src/index.ts` 注册命令
- [ ] `src/commands/new-cmd.ts` 交互层
- [ ] `src/lib/new-cmd.ts` 逻辑层（如有复杂逻辑）
- [ ] `tests/new-cmd.test.ts` 测试
- [ ] `pnpm lint` + `pnpm test` 通过
