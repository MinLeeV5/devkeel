# 部署与 CI

## 约定 1: 构建流程为 tsup 单入口 ESM

构建命令 `pnpm build` 执行 tsup，入口 `src/index.ts`，输出 `dist/`。格式 ESM-only，target `node20`，生成 `.d.ts` 和 sourcemap。

出处: `tsup.config.ts`

```typescript
defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  target: 'node20',
})
```

## 约定 2: prepublishOnly 门禁

`npm publish` 前自动触发 `prepublishOnly` 脚本执行完整构建。确保发布产物始终是最新编译结果。

出处: `package.json` — `"prepublishOnly": "npm run build"`

## 约定 3: 发布到公共 npm registry

包名 `devkeel`，通过 `publishConfig.registry` 指向公共 npm registry。发布使用 `npm publish`（非 pnpm publish）。

出处: `.npmrc` — `registry=https://registry.npmjs.org/`

## 约定 4: files 字段白名单控制发布内容

`package.json` 的 `files` 仅包含 `bin`、`dist`、`templates`。源码、测试、配置文件不随包发布。

出处: `package.json:11-15`

## 约定 5: 发布前质量门禁顺序

完整发布流程：

```
pnpm lint → pnpm test → pnpm build → version bump → npm publish
```

lint 和 test 必须在构建和发布之前通过。

## 约定 6: 版本号遵循 semver

`package.json` 中 `version` 使用标准三段式 semver。版本升级语义与 skill-versioning.md 一致（breaking → major，新功能 → minor，修正 → patch）。

出处: `package.json:3` — `"version": "0.2.7"`
