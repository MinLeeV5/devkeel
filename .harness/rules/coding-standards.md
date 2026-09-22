---
description: "编码规范 — TypeScript ESM CLI 项目的编码约定和风格要求"
globs:
  - "**/*.ts"
---

# 编码规范

## 约定 1: Node.js 内置模块使用 `node:` 协议前缀

所有 Node.js 内置模块导入必须带 `node:` 前缀，第三方包则直接导入名称。

出处: `src/lib/config.ts`, `src/lib/templates.ts`, `src/lib/detect.ts`

```typescript
// ✅ 正确
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
```

```typescript
// ❌ 错误
import fs from 'fs'
import path from 'path'
```

## 约定 2: 相对导入后缀必须匹配执行环境

CLI `src/` 编译后由 Node.js ESM 直接执行，内部模块的相对导入必须使用 `.js` 后缀（即使源文件是 `.ts`），确保源码 specifier 与编译产物一致。

`web/**/*.{ts,tsx}` 使用 `moduleResolution: "bundler"`，本地 TypeScript 模块必须省略扩展名，不写 `.js`、`.ts` 或 `.tsx`。真正由 Node.js 直接执行的 `.js` 源文件及静态资源 URL 不受此例外影响。

出处: `src/index.ts`, `src/commands/init.ts`, `web/tsconfig.json`, `web/tests/import-specifiers.test.ts`

```typescript
// ✅ 正确
import { readConfig } from '../lib/config.js'
import { runInit } from './commands/init.js'

// web/**/*.ts(x)
import { PageFrame } from '../components/PageFrame'
const page = import('./pages/home')
```

```typescript
// ❌ 错误
import { readConfig } from '../lib/config.ts'

// web/**/*.ts(x)
import { PageFrame } from '../components/PageFrame.js'
import { PageFrame } from '../components/PageFrame.tsx'
```

## 约定 3: 导出函数使用具名 `export function`，不使用 default export

所有公开 API 通过具名导出，函数直接在声明处添加 `export`。接口同理。

出处: `src/lib/config.ts`, `src/lib/templates.ts`, `src/lib/detect.ts`

```typescript
// ✅ 正确
export interface HarnessConfig {
  version: string
  project: { name: string; types: string[] }
}

export function readConfig(projectRoot: string): HarnessConfig | null {
  // ...
}
```

```typescript
// ❌ 错误 — 不使用 default export
export default function readConfig() { ... }

// ❌ 错误 — 不在文件底部集中导出
function readConfig() { ... }
export { readConfig }
```

## 约定 4: 返回值显式标注类型

所有导出函数必须显式标注返回类型。参数为简单标量时内联标注，复杂对象参数使用独立 interface。

出处: `src/lib/config.ts`, `src/lib/detect.ts`, `src/lib/templates.ts`

```typescript
// ✅ 正确
export function readConfig(projectRoot: string): HarnessConfig | null { ... }
export function copyDirRecursive(source: string, target: string): void { ... }
```

```typescript
// ❌ 错误 — 缺少返回类型
export function readConfig(projectRoot: string) { ... }
```

## 约定 5: 文件系统操作前先用 `fs.existsSync` 守卫

读取文件前检查路径存在性。创建目录时使用 `{ recursive: true }`。

出处: `src/lib/templates.ts`, `src/lib/config.ts`, `src/commands/doctor.ts`

```typescript
// ✅ 正确
export function copyDomainTemplate(domainType: string, targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'domain', domainType)
  if (!fs.existsSync(source)) return
  copyDirRecursive(source, targetDir)
}

fs.mkdirSync(path.dirname(configPath), { recursive: true })
```

```typescript
// ❌ 错误 — 不做存在性检查
const content = fs.readFileSync(configPath, 'utf-8')
```

## 约定 6: 错误处理使用空 `catch` 配合 null 返回

读取外部资源时，使用 try/catch 捕获异常并返回 null，让调用方决定后续行为。不声明未使用的 error 变量。

出处: `src/lib/config.ts`, `src/lib/detect.ts`

```typescript
// ✅ 正确
try {
  const content = fs.readFileSync(configPath, 'utf-8')
  return YAML.parse(content) as HarnessConfig
} catch {
  return null
}
```

```typescript
// ❌ 错误 — 声明未使用的 error
try { ... } catch (e) { return null }
```

## 约定 7: 属性访问使用括号表示法处理 `Record<string, unknown>`

配合 `noUncheckedIndexedAccess` 确保类型安全。

出处: `src/lib/config.ts` (`validateConfig`)

```typescript
// ✅ 正确
const c = config as Record<string, unknown>
if (!c['version']) errors.push(...)
```

```typescript
// ❌ 错误 — 点号访问 Record<string, unknown>
if (!c.version) ...
```

## 约定 8: 常量使用模块级 `const`，不使用 `enum`

配置常量使用 `const` 或 `Record` 对象。数组常量使用 `as const` 确保字面量类型。

出处: `src/lib/templates.ts`, `src/lib/gitignore.ts`

```typescript
// ✅ 正确
const HARNESS_SECTION_HEADER = '# harness runtime'

const PLATFORM_DIR_MAP: Record<string, string> = {
  'claude-code': '.claude',
  'copilot': '.github',
}
```

```typescript
// ❌ 错误
enum Platform {
  ClaudeCode = '.claude',
  Copilot = '.github',
}
```

## 约定 9: 私有函数不加 `export`，不用 `_` 前缀

模块内部辅助函数通过不加 `export` 关键字实现私有化。

出处: `src/lib/templates.ts`, `src/commands/update.ts`

```typescript
// ✅ 正确
function ensureSymlink(target: string, linkPath: string): void { ... }
function hashFile(filePath: string): string { ... }
```

```typescript
// ❌ 错误
function _ensureSymlink(...) { ... }
export function ensureSymlink(...) { ... }
```

## 约定 10: 命令入口函数命名为 `runXxx`，使用 `@clack/prompts` 处理输出

每个 CLI 命令导出一个 `async function runXxx(...)`。命令内部使用 `@clack/prompts`（别名 `p`），不用 `console.log`。

出处: `src/commands/init.ts`, `src/commands/doctor.ts`, `src/commands/update.ts`

```typescript
// ✅ 正确
import * as p from '@clack/prompts'

export async function runDoctor(opts?: { fix?: boolean }): Promise<void> {
  p.intro('devkeel doctor')
  // ...
  p.outro('完成')
}
```

```typescript
// ❌ 错误 — 使用 console.log
export async function runDoctor() {
  console.log('checking...')
}
```
