---
description: "测试策略 — vitest 测试编写规范和覆盖要求"
globs:
  - "tests/**/*.test.ts"
---

# 测试策略

需要代码示例或出处时，读取 [配套说明](../../docs/examples/testing-strategy.md)。

## 约定 1: 临时目录隔离模式

每个 describe 块使用 `os.tmpdir()` + `fs.mkdtempSync` 创建独立临时目录，在 `beforeEach` 中初始化、`afterEach` 中清理。禁止测试间共享文件系统状态。

临时目录前缀统一使用 `harness-<模块名>-` 格式。

## 约定 2: 真实文件系统验证，不 mock fs

测试在真实临时目录中创建文件、调用被测函数、用 `fs.existsSync` / `fs.readFileSync` 验证结果。仅导入 vitest 原生 API（`describe, it, expect, beforeEach, afterEach`），不使用 `vi.mock` 或 `vi.spyOn`。

## 约定 3: describe 嵌套与 it 命名风格

顶层 `describe` 对应模块名，嵌套 `describe` 对应被测函数名。`it` 使用 `should + 动词` 句式。

## 约定 4: 边界条件与防御性测试

每个功能至少包含以下类别的测试用例：

- **正常路径**: 功能正确执行（round-trip 读写）
- **空/缺失输入**: 文件不存在时返回 null 或空数组
- **幂等性**: 重复执行不产生副作用
- **异常容错**: 处理损坏数据、非预期文件类型

## 约定 5: 断言风格

| 场景 | 匹配器 |
|------|--------|
| 精确值 | `toBe` |
| 结构比较 | `toEqual` |
| 包含关系 | `toContain` |
| 存在性 | `fs.existsSync(x)` + `toBe(true/false)` |
| 数量 | `toHaveLength` |
| 否定 | `not.toContain` / `not.toThrow` |

## 约定 6: 测试文件与源码一一对应

测试文件位于 `tests/` 根目录（扁平结构），命名为 `<模块名>.test.ts`。导入使用 ESM 路径（`.js` 扩展名）。

## 约定 7: 无外部依赖、无网络调用

测试完全自包含。所有测试数据通过 `fs.writeFileSync` 在临时目录中就地构造。

## 约定 8: 导入顺序

1. vitest API（`describe, it, expect, beforeEach, afterEach`）
2. Node.js 内置模块（`node:fs`, `node:path`, `node:os`）
3. 被测模块（从 `../src/` 导入）

不使用 `import *`，仅具名导入需要测试的函数。
