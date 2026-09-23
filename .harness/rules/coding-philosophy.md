---
description: "编码哲学 — 项目的设计原则、anti-pattern 和代码组织偏好"
globs:
  - "src/**/*.ts"
---

# 编码哲学

需要代码示例或出处时，读取 [配套说明](../../docs/examples/coding-philosophy.md)。

## 约定 1: 命令层薄、逻辑层厚

命令文件 (`src/commands/`) 只做三件事：读取 CLI 参数、调用 `@clack/prompts` 与用户交互、调用 `src/lib/` 中的纯函数。所有可测试的业务逻辑都沉淀到 `src/lib/`。

## 约定 2: 防御式存在性检查 + 静默降级

偏好"先检查再操作"模式，对缺失资源返回 null 或空数组。catch 块静默吞掉错误，将决策权交给调用方。

## 约定 3: 扁平控制流 — 早返回代替深嵌套

通过 guard clause（前置 if + return/continue）保持主路径只有一层缩进。避免 else 分支和多层嵌套。

## 约定 4: YAGNI — 不预留扩展点

模板引擎是朴素的 `replaceAll`，不支持条件/循环。无 DI 容器、无插件系统、无中间件链。每个函数只做一件事。

## 约定 5: 配置驱动行为分支，硬编码合理边界

用 `config.yml` 驱动运行时行为（targets 决定 symlink），但字面量映射表直接硬编码为 const。

## 约定 6: 纯函数 + plain object，避免 class 封装

所有函数接收 string / string[] / 简单 interface。返回 plain object 或 null。不使用 class、builder pattern、继承。

## Anti-patterns（本项目禁止）

| Anti-pattern | 原因 |
|---|---|
| 在 lib 层引入交互（prompts、spinner） | 破坏可测试性 |
| 使用 class + 继承 | 项目规模不需要，纯函数更直接 |
| 对可预见的缺失场景 throw Error | 惯例是 null/空值 + 调用方判断 |
| 引入第三方模板引擎或 schema 校验库 | YAGNI |
| 嵌套超过 3 层的条件/循环 | 用 guard clause 打平 |
