# 命名规范示例

执行约束见 [对应规则](../../.harness/rules/naming-conventions.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: 文件名使用 kebab-case

出处: `src/commands/` 和 `src/lib/` 全部文件

```
✅ versions.ts, detect.ts, gitignore.ts
✅ templates.test.ts, versions.test.ts
❌ gitIgnore.ts, GitIgnore.ts
```

## 约定 2: 命令入口函数使用 `run` + PascalCase 命令名

出处: `runInit`, `runDoctor`, `runUpdate`, `runSync`

```typescript
// ✅ 正确
export async function runDoctor(opts?: { fix?: boolean }): Promise<void> { ... }
```

```typescript
// ❌ 错误
export async function doctor() { ... }
export default async function runDoctor() { ... }
```

## 约定 3: 接口/类型使用 PascalCase，无 `I` 前缀

出处: `VersionsRecord`, `DetectResult`, `CheckResult`, `SubmoduleInfo`

```typescript
// ✅ 正确
export interface VersionsRecord { ... }
export interface DetectResult { ... }
```

```typescript
// ❌ 错误
export interface IVersionsRecord { ... }
export type TVersionsRecord = { ... }
```

## 约定 5: 常量命名视作用域而定

出处: `HARNESS_SECTION_HEADER`, `PLATFORM_DIR_MAP`, `PLATFORM_DETECT_PATHS`

```typescript
// ✅ 模块级
const PLATFORM_DIR_MAP: Record<string, string> = { ... }

// ✅ 函数内
const projectRoot = process.cwd()
const versionsPath = path.join(...)
```
