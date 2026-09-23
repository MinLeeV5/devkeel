# 测试策略示例

执行约束见 [对应规则](../../.harness/rules/testing-strategy.md)。需要理解规则用法时按对应章节查阅；
以下代码用于说明模式，当前实现以所列源码为准。

## 约定 1: 临时目录隔离模式

```typescript
// ✅ 正确
let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})
```

## 约定 2: 真实文件系统验证，不 mock fs

```typescript
// ✅ 正确 — 真实 FS 操作
fs.mkdirSync(path.join(tmpDir, '.harness'), { recursive: true })
writeVersions(tmpDir, versions)
const result = readVersions(tmpDir)
expect(result).toEqual(versions)
```

```typescript
// ❌ 错误 — 不 mock 文件系统
vi.mock('node:fs', () => ({ ... }))
```

## 约定 3: describe 嵌套与 it 命名风格

```typescript
// ✅ 正确
describe('versions', () => {
  describe('readVersions', () => {
    it('should return null when versions.yml does not exist', () => { ... })
    it('should round-trip versions correctly', () => { ... })
  })
})
```

## 约定 4: 边界条件与防御性测试

```typescript
// ✅ 各类别示例
it('should return null when versions.yml does not exist', ...)
it('should not duplicate entries when run twice', ...)
it('should not crash when .agents/rules is a file', ...)
```

## 约定 6: 测试文件与源码一一对应

```typescript
// ✅ 正确
import { detectEnvironment } from '../src/lib/detect.js'
import { detectSubmodules } from '../src/lib/detect.js'
```
