---
description: "命名规范 — 文件名、函数名、类型名和变量名的命名约定"
globs:
  - "**/*.ts"
---

# 命名规范

## 约定 1: 文件名使用 kebab-case

所有源码和测试文件统一使用 kebab-case（小写 + 连字符）命名。

出处: `src/commands/` 和 `src/lib/` 全部文件

```
✅ config.ts, detect.ts, gitignore.ts
✅ templates.test.ts, config.test.ts
❌ gitIgnore.ts, GitIgnore.ts
```

## 约定 2: 命令入口函数使用 `run` + PascalCase 命令名

每个命令文件导出 `run<CommandName>` 异步函数作为入口，返回 `Promise<void>`。

出处: `runInit`, `runDoctor`, `runUpdate`, `runSubmodule`, `runMigrate`

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

出处: `HarnessConfig`, `VersionsRecord`, `ValidationError`, `DetectResult`, `CheckResult`, `SubmoduleInfo`

```typescript
// ✅ 正确
export interface HarnessConfig { ... }
export interface DetectResult { ... }
```

```typescript
// ❌ 错误
export interface IHarnessConfig { ... }
export type THarnessConfig = { ... }
```

## 约定 4: 库函数使用 camelCase，以动词开头

| 前缀 | 语义 | 示例 |
|------|------|------|
| `read` | 读取数据 | `readConfig`, `readVersions` |
| `write` | 写入文件 | `writeConfig`, `writeVersions` |
| `build` | 构造结构 | `buildDefaultConfig` |
| `detect` | 检测状态 | `detectEnvironment`, `detectRepoType` |
| `copy` | 复制文件 | `copyTemplateSkills`, `copyDirRecursive` |
| `create` | 创建资源 | `createPlatformLinks` |
| `ensure` | 幂等操作 | `ensureGitignore`, `ensureSymlink` |
| `remove` | 删除资源 | `removeDeprecatedAssets` |
| `render` | 渲染模板 | `renderTemplate` |
| `validate` | 校验 | `validateConfig` |
| `is`/`has` | 布尔判断 | `isDirectorySafe`, `hasUserContent` |
| `get` | 获取路径/值 | `getTemplatesDir` |

## 约定 5: 常量命名视作用域而定

- **模块级常量**（配置/映射表）使用 `UPPER_SNAKE_CASE`
- **函数内局部常量** 使用 `camelCase`

出处: `HARNESS_SECTION_HEADER`, `PLATFORM_DIR_MAP`, `PLATFORM_DETECT_PATHS`

```typescript
// ✅ 模块级
const PLATFORM_DIR_MAP: Record<string, string> = { ... }

// ✅ 函数内
const projectRoot = process.cwd()
const configPath = path.join(...)
```

## 约定 6: 测试文件与源码一一对应

测试文件位于 `tests/`，命名 `<模块名>.test.ts`，与 `src/lib/<模块名>.ts` 或 `src/commands/<模块名>.ts` 对应。扁平结构，不嵌套子目录。
