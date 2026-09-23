# 错误处理示例

执行约束见 [对应规则](../../.harness/rules/error-handling.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: 用户取消使用 `p.isCancel` + `p.cancel` + `process.exit(0)`

出处: `src/commands/init.ts` (7 处), `src/commands/update.ts` (3 处)

```typescript
// ✅ 正确
const name = await p.text({ message: '项目名称？' })
if (p.isCancel(name)) { p.cancel('已取消'); process.exit(0) }
```

## 约定 2: 前置条件不满足使用 `p.cancel` + `process.exit(1)`

出处: `src/commands/doctor.ts`, `src/commands/update.ts`

```typescript
// ✅ 正确
if (!fs.existsSync(path.join(projectRoot, '.harness'))) {
  p.cancel('未检测到 .harness/ 目录，请先执行 devkeel init')
  process.exit(1)
}
```

## 约定 3: 外部命令失败累积错误，统一退出

示例场景：调用 Git 后汇总失败结果。

```typescript
// ✅ 正确
let hasError = false

try {
  execSync('git submodule update --init --recursive', { cwd: projectRoot, stdio: 'inherit' })
  p.log.success('git submodules 初始化完成')
} catch {
  p.log.error('git submodule 初始化失败，请检查网络或权限')
  hasError = true
}

if (hasError) {
  p.outro('部分步骤失败，请检查上方错误信息')
  process.exit(1)
}
```

## 约定 4: 读取失败静默返回 null，由调用方决定

出处: `src/lib/versions.ts` (`readVersions`), `src/lib/detect.ts` (`detectProjectName`)

## 约定 5: 写操作不做 try/catch，依赖 mkdirSync recursive

出处: `src/lib/versions.ts` (`writeVersions`)

## 约定 7: 不存在的可选资源采用跳过策略

出处: `src/lib/templates.ts` (`copyTemplateCommands`)

```typescript
// ✅ 正确
if (!fs.existsSync(source)) return  // 静默跳过
```
