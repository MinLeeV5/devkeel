---
description: 修改构建或发布流程时遵守产物边界与发布门禁。
globs:
  - "package.json"
  - "templates/package.json"
  - "tsup.config.ts"
---

# 部署与 CI

- CLI 保持 tsup 单入口 ESM 构建；入口、产物和 target 以 `tsup.config.ts` 为准。
- 保留 `prepublishOnly` 构建门禁，发布产物必须对应当前源码；发布前依次通过 lint、test、build，
  再执行已授权的版本调整和发布。
- 发布内容由所属包 `package.json` 的 `files` 白名单控制，不将源码、测试和私有配置混入包。
- 发布使用公共 npm registry 与 `npm publish`；依赖管理仍使用 pnpm。
- 版本遵循 semver，与对应资产的版本规则保持一致。

了解构建背景与包边界时读取 [构建与发布说明](../../docs/building.md)。实际发布使用
[release-workflow](../skills/release-workflow/SKILL.md)，不能以阅读本规则代替发布授权。
