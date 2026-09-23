---
description: "错误处理 — CLI 工具的异常处理、用户提示和退出码约定"
globs:
  - "src/**/*.ts"
---

# 错误处理

需要代码示例或出处时，读取 [配套说明](../../docs/examples/error-handling.md)。

## 约定 1: 用户取消使用 `p.isCancel` + `p.cancel` + `process.exit(0)`

每个 `@clack/prompts` 交互调用后，立即检查 `p.isCancel()`。用户主动取消以退出码 0 退出（不算错误）。

## 约定 2: 前置条件不满足使用 `p.cancel` + `process.exit(1)`

命令入口检测必要前置条件，不满足时提示原因 + 建议修复动作，以退出码 1 退出。

## 约定 3: 外部命令失败累积错误，统一退出

执行外部进程时用 try/catch 捕获，通过 `p.log.error()` 输出人类可读信息，设置错误标记，最后根据标记决定退出码。

## 约定 4: 读取失败静默返回 null，由调用方决定

lib 层读取函数在文件不存在或解析失败时返回 null，不抛出异常。调用方根据 null 值决定终止或降级。

## 约定 5: 写操作不做 try/catch，依赖 mkdirSync recursive

写入文件前通过 `fs.mkdirSync(dir, { recursive: true })` 确保目录存在。写操作本身不包裹 try/catch，写入失败让 Node.js 自然抛出未捕获异常。

## 约定 6: 退出码语义

| 退出码 | 含义 | 触发场景 |
|--------|------|----------|
| 0 | 成功或用户主动取消 | 正常完成、`p.isCancel` |
| 1 | 错误 | 前置条件不满足、外部命令失败 |

不使用其他退出码。

## 约定 7: 不存在的可选资源采用跳过策略

模板源目录、可选文件或 submodule 目录不存在时，静默跳过（early return 或 continue），不视为错误。
