---
name: release-workflow
description: DevKeel CLI 与 Templates 独立版本发布完整流程
metadata:
  version: "1.2.2"
  author: "devkeel"
  domain: cli-node
triggers:
  - 发布
  - release
  - publish
  - 版本升级
  - bump version
---

# 发布流程

## 何时使用

准备发布 `devkeel` CLI 或 `devkeel-templates` 模板包时。

## 前置条件

- master 分支代码已合并完毕
- `pnpm lint` + `pnpm test` 全部通过
- 已明确本次只发布 CLI 或 Templates 其中一个包
- 对应版本流的 changelog JSON 已准备

## Step 1: 选择发布分支

两个包版本独立，禁止用同一个版本号或暂存清单同时发布：

| 发布分支 | 包名 | 权威版本 | Changelog 流 | Git tag |
|---|---|---|---|---|
| CLI | `devkeel` | `package.json` | `cli` | `vX.Y.Z` |
| Templates | `devkeel-templates` | `templates/package.json` | `templates` | `templates-vX.Y.Z` |

根据变更类型选择 semver 升级段：

| 变更 | 升级 | 示例 |
|------|------|------|
| 破坏性变更 | major | 0.2.7 → 1.0.0 |
| 新功能 | minor | 0.2.7 → 0.3.0 |
| Bug fix / 修正 | patch | 0.2.7 → 0.2.8 |

选定分支后只执行对应章节。

### CLI 发布

1. 以根 `package.json` 为权威版本，升级并读取实际版本：

```bash
BUMP=patch
pnpm version "$BUMP" --no-git-tag-version
CLI_VERSION=$(pnpm pkg get version | tr -d '"')
```

2. 按 `.harness/skills/changelog/` 规范只创建 CLI JSON：

```bash
CHANGELOG_JSON="web/public/versions/cli/${CLI_VERSION}.json"
test -f "$CHANGELOG_JSON"
```

文件名必须等于 `versions` 最后一项。不得编辑 Templates JSON、旧静态 Changelog HTML、Changelog TSX 或 `web/dist/`。

3. 运行公共质量门禁，然后只暂存 CLI 发布单元：

```bash
pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/changelog-data.test.ts
pnpm --dir web build
pnpm lint && pnpm test && pnpm build
git add package.json pnpm-lock.yaml "$CHANGELOG_JSON"
git diff --cached --name-only
git commit -m "chore(harness): 发布 v${CLI_VERSION}"
```

4. 使用 CLI 既有 `vX.Y.Z` tag 并发布根包：

```bash
git tag "v${CLI_VERSION}"
git push && git push origin "v${CLI_VERSION}"
npm publish
pnpm view devkeel version
```

### Templates 发布

1. 以 `templates/package.json` 为权威版本，独立升级并读取实际版本：

```bash
BUMP=patch
npm --prefix templates version "$BUMP" --no-git-tag-version
TEMPLATES_VERSION=$(npm --prefix templates pkg get version | tr -d '"')
```

2. 同步 `templates/versions-yml.yml` 中本次变更的资产版本：

- `harness: "{{HARNESS_VERSION}}"` 保持占位符，实际 Templates 版本以
  `templates/package.json` 为准。
- 修改 skill 时，`skills.<name>` 必须与其 `metadata.version` 一致。
- 修改 schema 时，注册值必须与对应 `schema.yaml` 的 `version` 一致；例如
  `schemas.full` 对齐
  `templates/openspec/schemas/full/schema.yaml`。

未涉及 skill 或 schema 版本时不要改动对应注册值。

3. 按 `.harness/skills/changelog/` 规范只创建 Templates JSON：

```bash
CHANGELOG_JSON="web/public/versions/templates/${TEMPLATES_VERSION}.json"
test -f "$CHANGELOG_JSON"
```

文件名必须等于 `versions` 最后一项。不得修改根 `package.json`、CLI JSON、旧静态 Changelog HTML、Changelog TSX 或 `web/dist/`。

4. 运行公共质量门禁，然后只暂存 Templates 发布单元：

```bash
pnpm --dir web exec vitest run tests/version-catalog.test.ts tests/changelog-data.test.ts
pnpm --dir web build
pnpm lint && pnpm test && pnpm build
git add templates/package.json templates/versions-yml.yml "$CHANGELOG_JSON"
git diff --cached --name-only
git commit -m "chore(templates): 发布 v${TEMPLATES_VERSION}"
```

5. 使用带包前缀的 tag 避免与 CLI tag 冲突，并通过根脚本发布模板包：

```bash
git tag "templates-v${TEMPLATES_VERSION}"
git push && git push origin "templates-v${TEMPLATES_VERSION}"
pnpm release:templates
pnpm view devkeel-templates version
```

## 注意事项

- `pnpm release:templates` 是根 `package.json` 的模板发布入口，会进入 `templates/` 发布 `devkeel-templates`。
- CLI 发布触发根包 `prepublishOnly` 构建；Templates 发布不发布根包。
- `web build` 会逐流比较 `public/versions` 与 `dist/versions` 的文件集合和内容；任一缺失或不一致都必须终止发布。
- 每次只暂存实际发布包的 manifest、对应流的新 JSON，以及 Templates 发布所需的
  `templates/versions-yml.yml`；CLI 分支额外暂存根锁文件。禁止提交 `web/dist/`。
