# 编码规范示例

执行约束见 [对应规则](../../.harness/rules/coding-standards.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: Node.js 内置模块使用 `node:` 协议前缀

出处: `src/lib/versions.ts`, `src/lib/templates.ts`, `src/lib/detect.ts`

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

出处: `src/index.ts`, `src/commands/init.ts`, `web/tsconfig.json`, `web/tests/import-specifiers.test.ts`

```typescript
// ✅ 正确
import { readVersions } from '../lib/versions.js'
import { runInit } from './commands/init.js'

// web/**/*.ts(x)
import { PageFrame } from '../components/PageFrame'
const page = import('./pages/home')
```

```typescript
// ❌ 错误
import { readVersions } from '../lib/versions.ts'

// web/**/*.ts(x)
import { PageFrame } from '../components/PageFrame.js'
import { PageFrame } from '../components/PageFrame.tsx'
```

## 约定 3: 导出函数使用具名 `export function`，不使用 default export

出处: `src/lib/versions.ts`, `src/lib/templates.ts`, `src/lib/detect.ts`

```typescript
// ✅ 正确
export interface VersionsRecord {
  harness: string
  skills: Record<string, string>
  agents: Record<string, string>
  rules: Record<string, string>
  schemas: Record<string, string>
}

export function readVersions(projectRoot: string): VersionsRecord | null {
  // ...
}
```

```typescript
// ❌ 错误 — 不使用 default export
export default function readVersions() { ... }

// ❌ 错误 — 不在文件底部集中导出
function readVersions() { ... }
export { readVersions }
```

## 约定 4: 返回值显式标注类型

出处: `src/lib/versions.ts`, `src/lib/detect.ts`, `src/lib/templates.ts`

```typescript
// ✅ 正确
export function readVersions(projectRoot: string): VersionsRecord | null { ... }
export function copyDirRecursive(source: string, target: string): void { ... }
```

```typescript
// ❌ 错误 — 缺少返回类型
export function readVersions(projectRoot: string) { ... }
```

## 约定 5: 文件系统操作前先用 `fs.existsSync` 守卫

出处: `src/lib/templates.ts`, `src/lib/versions.ts`, `src/commands/doctor.ts`

```typescript
// ✅ 正确
export function copyDomainTemplate(domainType: string, targetDir: string): void {
  const source = path.join(getTemplatesDir(), 'domain', domainType)
  if (!fs.existsSync(source)) return
  copyDirRecursive(source, targetDir)
}

fs.mkdirSync(path.dirname(versionsPath), { recursive: true })
```

```typescript
// ❌ 错误 — 不做存在性检查
const content = fs.readFileSync(versionsPath, 'utf-8')
```

## 约定 6: 错误处理使用空 `catch` 配合 null 返回

出处: `src/lib/versions.ts`, `src/lib/detect.ts`

```typescript
// ✅ 正确
try {
  const content = fs.readFileSync(versionsPath, 'utf-8')
  return YAML.parse(content) as VersionsRecord
} catch {
  return null
}
```

```typescript
// ❌ 错误 — 声明未使用的 error
try { ... } catch (e) { return null }
```

## 约定 7: 属性访问使用括号表示法处理 `Record<string, unknown>`

出处: `src/lib/versions.ts` (`getBuiltinVersions`)

```typescript
// ✅ 正确
const pkg = JSON.parse(content) as Record<string, unknown>
if (typeof pkg['version'] === 'string') templatesVersion = pkg['version']
```

```typescript
// ❌ 错误 — 点号访问 Record<string, unknown>
if (typeof pkg.version === 'string') ...
```

## 约定 8: 常量使用模块级 `const`，不使用 `enum`

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
