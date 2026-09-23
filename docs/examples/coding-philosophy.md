# 编码哲学示例

执行约束见 [对应规则](../../.harness/rules/coding-philosophy.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: 命令层薄、逻辑层厚

出处: `src/lib/skill-distribution.ts` 无 prompts 导入；所有 `@clack/prompts` 只出现在 `src/commands/`

```typescript
// ✅ 正确 — lib 层纯逻辑
export function syncSkillLinks(projectRoot: string, targets: string[]) { ... }

// ✅ 正确 — 命令层编排交互
export async function runSync(opts?: SyncOptions): Promise<void> {
  const result = syncSkillLinks(projectRoot, targets)
  // 只做 UI 输出
}
```

```typescript
// ❌ 错误 — 在 lib 中引入 prompts
// ❌ 错误 — 在 commands 中写文件操作的具体逻辑
```

## 约定 2: 防御式存在性检查 + 静默降级

出处: `readVersions`, `copyDomainTemplate`, `copyTemplateCommands`

```typescript
// ✅ 正确
export function readVersions(projectRoot: string): VersionsRecord | null {
  if (!fs.existsSync(versionsPath)) return null
  try { ... } catch { return null }
}
```

```typescript
// ❌ 错误 — throw new Error('versions not found')
```

## 约定 3: 扁平控制流 — 早返回代替深嵌套

出处: `detectSubmodules`, `ensureGitignoreEntry`

```typescript
// ✅ 正确
for (const source of sources) {
  if (!fs.existsSync(source)) continue
  // 主逻辑
}
```

## 约定 4: YAGNI — 不预留扩展点

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

出处: 整个 `src/` 无任何 `class` 关键字
