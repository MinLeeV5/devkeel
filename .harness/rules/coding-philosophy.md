---
description: "编码哲学 — 项目的设计原则、anti-pattern 和代码组织偏好"
globs:
  - "src/**/*.ts"
---

# 编码哲学

## 约定 1: 命令层薄、逻辑层厚

命令文件 (`src/commands/`) 只做三件事：读取 CLI 参数、调用 `@clack/prompts` 与用户交互、调用 `src/lib/` 中的纯函数。所有可测试的业务逻辑都沉淀到 `src/lib/`。

出处: `src/lib/migrate.ts` 无 prompts 导入；所有 `@clack/prompts` 只出现在 `src/commands/`

```typescript
// ✅ 正确 — lib 层纯逻辑
export function migrateKnowledgeAssets(sources: string[], targetRoot: string) { ... }

// ✅ 正确 — 命令层编排交互
export async function runMigrate(sources: string[]): Promise<void> {
  const result = migrateKnowledgeAssets(sources, projectRoot)
  // 只做 UI 输出
}
```

```typescript
// ❌ 错误 — 在 lib 中引入 prompts
// ❌ 错误 — 在 commands 中写文件操作的具体逻辑
```

## 约定 2: 防御式存在性检查 + 静默降级

偏好"先检查再操作"模式，对缺失资源返回 null 或空数组。catch 块静默吞掉错误，将决策权交给调用方。

出处: `readConfig`, `readVersions`, `copyDomainTemplate`, `copyTemplateCommands`

```typescript
// ✅ 正确
export function readConfig(projectRoot: string): HarnessConfig | null {
  if (!fs.existsSync(configPath)) return null
  try { ... } catch { return null }
}
```

```typescript
// ❌ 错误 — throw new Error('config not found')
```

## 约定 3: 扁平控制流 — 早返回代替深嵌套

通过 guard clause（前置 if + return/continue）保持主路径只有一层缩进。避免 else 分支和多层嵌套。

出处: `detectSubmodules`, `migrateKnowledgeAssets`, `ensureGitignoreEntry`

```typescript
// ✅ 正确
for (const source of sources) {
  if (!fs.existsSync(source)) continue
  // 主逻辑
}
```

## 约定 4: YAGNI — 不预留扩展点

模板引擎是朴素的 `replaceAll`，不支持条件/循环。无 DI 容器、无插件系统、无中间件链。每个函数只做一件事。

出处: 整个项目零 class 定义，`renderTemplate` 使用 `replaceAll` 实现

```typescript
// ✅ 正确 — 最简实现
export function renderTemplate(content: string, vars: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}
```

```typescript
// ❌ 错误 — 引入 Handlebars/EJS
// ❌ 错误 — 用 class + Strategy 模式
```

## 约定 5: 配置驱动行为分支，硬编码合理边界

用 `config.yml` 驱动运行时行为（targets 决定 symlink），但字面量映射表直接硬编码为 const。

出处: `PLATFORM_DIR_MAP`, `PLATFORM_DETECT_PATHS`, `requiredDirs`

```typescript
// ✅ 正确 — 映射表直接写死
const PLATFORM_DIR_MAP: Record<string, string> = {
  'claude-code': '.claude',
  'copilot': '.github',
}
```

```typescript
// ❌ 错误 — 把平台目录名放到 config.yml
```

## 约定 6: 纯函数 + plain object，避免 class 封装

所有函数接收 string / string[] / 简单 interface。返回 plain object 或 null。不使用 class、builder pattern、继承。

出处: 整个 `src/` 无任何 `class` 关键字

## Anti-patterns（本项目禁止）

| Anti-pattern | 原因 |
|---|---|
| 在 lib 层引入交互（prompts、spinner） | 破坏可测试性 |
| 使用 class + 继承 | 项目规模不需要，纯函数更直接 |
| 对可预见的缺失场景 throw Error | 惯例是 null/空值 + 调用方判断 |
| 引入第三方模板引擎或 schema 校验库 | YAGNI |
| 嵌套超过 3 层的条件/循环 | 用 guard clause 打平 |
