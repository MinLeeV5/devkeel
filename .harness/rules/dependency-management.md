---
description: "依赖管理 — 依赖准入、版本策略和包管理约定"
globs:
  - "package.json"
  - "pnpm-lock.yaml"
  - ".npmrc"
---

# 依赖管理

## 约定 1: pnpm 为唯一包管理器

项目使用 pnpm 管理依赖。禁止混用 npm/yarn。不应出现 `package-lock.json` 或 `yarn.lock`。

## 约定 2: 普通依赖使用 caret，行为基线依赖精确锁定

普通 dependencies 和 devDependencies 使用 `^`，依赖 lockfile 保证可复现构建。不使用 tilde
(`~`)。`@fission-ai/openspec` 同时定义 CLI 行为和内置 workflow skill 的上游基线，必须精确
锁定，并与 skill provenance 和上游契约测试同步升级，避免安装时漂移到未经审计的新 minor。

```json
// ✅ 正确
"commander": "^13.1.0",
"yaml": "^2.7.1"
```

`@fission-ai/openspec` 的具体精确版本以当前 `package.json` 为唯一事实源，不在 rule 中复制版本号。

## 约定 3: 最小依赖原则 — runtime 依赖严格精简

runtime dependencies 仅保留 CLI 运行必需的包：

| 包 | 职责 |
|---|---|
| commander | CLI 命令注册与解析 |
| @clack/prompts | 交互式终端 UI |
| yaml | YAML 配置读写 |

新增 runtime 依赖前须确认：(1) Node.js 内置模块无法满足；(2) 不属于构建/测试/类型工具。

## 约定 4: 构建产物不 bundle 依赖

tsup 将 `dependencies` 中的包视为 external，不打入 bundle。`package.json` 的 `files` 字段仅包含 `bin`、`dist`、`templates`。

## 约定 5: Node.js 最低版本 >=20.19.0

`engines.node` 声明为 `>=20.19.0`，与 OpenSpec 的运行时要求一致；tsup target 保持 `node20`。
代码可自由使用 Node 20+ 内置 API，无需 polyfill。

## 约定 6: 公共 npm registry

项目依赖与发布统一使用公共 npm registry：

```
registry=https://registry.npmjs.org/
```

安装后的 CLI 遵循用户的 npm registry 配置。
