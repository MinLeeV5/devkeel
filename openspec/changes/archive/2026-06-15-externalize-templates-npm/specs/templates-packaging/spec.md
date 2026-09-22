## ADDED Requirements

### Requirement: templates/ 目录作为独立 npm 包发布

`templates/` 目录 SHALL 包含 `package.json`，`name` 为 `devkeel-templates`，通过 `files` 字段白名单控制发布内容，`publishConfig.registry` 指向内部 Artifactory。

#### Scenario: npm publish 从 templates/ 执行
- **WHEN** 维护者在 `templates/` 目录执行 `npm publish`
- **THEN** 仅 `files` 字段列出的目录和文件被打入 tarball，不包含 `node_modules`、`.DS_Store`、`.gitkeep`

#### Scenario: publishConfig 强制内部 registry
- **WHEN** `package.json` 包含 `publishConfig.registry`
- **THEN** `npm publish` 默认发布到 `https://registry.npmjs.org/`，无需额外 `--registry` 参数

### Requirement: CLI 不再打包 templates 到 tarball

CLI 的 `package.json` SHALL 从 `files` 字段移除 `templates`，确保 `devkeel` 发布时不包含模板资源。

#### Scenario: pnpm build 后检查产物
- **WHEN** 执行 `pnpm build` 生成 `dist/`
- **THEN** `dist/` 不包含 `templates/` 目录，`npm pack --dry-run` 输出不含 `templates/`

#### Scenario: 旧 CLI 用户升级
- **WHEN** 用户从 `devkeel@0.6.1`（含 templates）升级到新版（不含 templates）
- **THEN** 本 change 不在范围，旧 CLI 行为不变；新 CLI 强制依赖网络拉取

### Requirement: 模板包版本独立演进

`devkeel-templates` 的 `version` SHALL 从 `1.0.0` 起始，与 CLI 版本号解耦，遵循 semver。

#### Scenario: 模板内容变更触发升版
- **WHEN** 维护者修改 `templates/skills/` 或 `templates/rules/` 内容
- **THEN** 按 `templates/versions-yml.yml` 中的版本同步更新 `templates/package.json` 的 `version`

#### Scenario: CLI 发版不联动模板版本
- **WHEN** 维护者发布 `devkeel@0.7.0`
- **THEN** `templates/package.json` 的 `version` 不受影响，除非模板本身有变更

### Requirement: 主仓脚本驱动模板发版

CLI 主仓 SHALL 提供发版脚本，通过 `cd templates/ && npm publish` 完成模板发布，不使用 lerna/changesets 协调。

#### Scenario: 维护者执行 release:templates
- **WHEN** 维护者在主仓根目录执行 `pnpm release:templates`
- **THEN** 脚本进入 `templates/`，执行 `npm publish`，成功后返回根目录

#### Scenario: 模板包纯资源无代码
- **WHEN** `templates/` 目录被发版
- **THEN** tarball 仅包含 markdown、yaml、json 等静态资源，不含 `.ts`、`.js` 源码
