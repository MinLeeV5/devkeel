## Purpose

定义 `devkeel-templates` 模板缓存、拉取和错误处理行为，确保 `devkeel init` 与 `devkeel update` 使用正确的模板资产来源。

## Requirements

### Requirement: 实时拉取最新模板版本

当用户执行 `devkeel update` 或 `devkeel init` 时，系统 SHALL 通过 `npm view devkeel-templates@latest version --json` 查询公共 npm registry 的最新版本号。

#### Scenario: 成功查询到最新版本
- **WHEN** 用户执行 `devkeel update` 且 npm 环境正常
- **THEN** 系统解析 `npm view` 的 JSON 输出，提取版本号，随后通过 `npm pack devkeel-templates@<version>` 下载模板

#### Scenario: npm 未安装或不在 PATH
- **WHEN** `npm view` 执行失败，exit code ≠ 0
- **THEN** 系统抛出 `TemplatesFetchError`，错误信息包含：
  1. 原始 npm stderr
  2. 修复指引：确认 `npm --version` 可用
  3. 修复指引：`npm config get registry` 检查公共包访问配置
  4. 修复指引：`curl -I <registry-url>` 验证网络可达
  5. 修复指引：确认 `devkeel-templates` 已发布

#### Scenario: npm 输出非预期 JSON
- **WHEN** `npm view` 成功但输出无法解析为版本号字符串
- **THEN** 系统抛出 `TemplatesFetchError`，错误信息包含原始 stdout

### Requirement: 缓存目录布局与版本隔离

系统 SHALL 将模板缓存到 `~/.harness/cache/devkeel-templates/<version>/`，每个版本独立目录，支持并发安全与回滚。

#### Scenario: 首次拉取
- **WHEN** 缓存根目录不存在或无对应版本目录
- **THEN** 系统创建 `~/.harness/cache/devkeel-templates/<version>.tmp/`，下载并解压 tarball，完成后 `rename` 为 `<version>/`

#### Scenario: 缓存命中
- **WHEN** `<version>/package.json` 的包名为 `devkeel-templates`、版本号与请求版本一致，且 `versions-yml.yml` 存在
- **THEN** 系统跳过下载，直接返回缓存路径

#### Scenario: 缓存版本过期
- **WHEN** `meta.json` 中的 `version` 与 latest 不一致
- **THEN** 系统下载新版本到新目录，更新 `meta.json`，保留旧版本目录（供回滚或 doctor 清理）

### Requirement: 模板读取入口统一指向缓存

CLI 所有读取模板的函数（`getTemplatesDir()`、`getBuiltinVersions()`、`readSchemaVersion()`）SHALL 从缓存目录读取，而非包内 `templates/`。

#### Scenario: 缓存已就绪
- **WHEN** `ensureTemplatesCache()` 成功返回 `{ cacheDir, version }`
- **THEN** 命令层调用 `setTemplatesDir(cacheDir)`，后续 `getTemplatesDir()` 返回缓存路径

#### Scenario: 本地开发环境
- **WHEN** 命令层未调用 `setTemplatesDir()`（如直接运行 `node bin/devkeel.js` 开发）
- **THEN** `getTemplatesDir()` fallback 到源码态的 `templates/` 目录（通过 `fs.existsSync` 探测）

### Requirement: 错误处理无 fallback

系统 SHALL 在拉取失败时直接报错退出，不 fallback 到包内旧模板，不静默降级。

#### Scenario: 网络不可达
- **WHEN** `npm view` 因网络超时或 DNS 失败
- **THEN** 系统输出诊断文案后以 `exit(1)` 退出

#### Scenario: registry 鉴权失败
- **WHEN** npm 返回 401/403 或配置的 registry 拒绝访问
- **THEN** 系统输出诊断文案（含 registry 检查命令）后以 `exit(1)` 退出

#### Scenario: 包未发布
- **WHEN** npm 返回 404（`devkeel-templates` 不存在）
- **THEN** 系统输出诊断文案（提示维护者首次发版）后以 `exit(1)` 退出

### Requirement: update 支持指定模板版本
`devkeel update` SHALL 支持用户通过显式模板版本选择 `devkeel-templates` 的下载版本，且默认不改变最新稳定版本更新行为。

#### Scenario: 默认更新最新稳定模板
- **WHEN** 用户执行 `devkeel update`
- **THEN** 系统查询 `devkeel-templates` 的 npm `version` 字段并下载该版本模板

#### Scenario: 使用 option 指定模板版本
- **WHEN** 用户执行 `devkeel update --template-version 1.2.3-beta.1`
- **THEN** 系统下载 `devkeel-templates@1.2.3-beta.1` 并用该模板目录执行后续 update 检测和同步

#### Scenario: 使用位置参数指定模板版本
- **WHEN** 用户执行 `devkeel update 1.2.3`
- **THEN** 系统下载 `devkeel-templates@1.2.3` 并用该模板目录执行后续 update 检测和同步

#### Scenario: 显式版本格式非法
- **WHEN** 用户指定的模板版本不符合 semver 字符串格式
- **THEN** 系统 MUST 在执行 `npm pack` 前失败，并输出 `TemplatesFetchError`

### Requirement: update 支持 npm beta 渠道模板版本
`devkeel update --beta` SHALL 解析 `devkeel-templates` 的 npm `beta` dist-tag，并使用该 tag 指向的具体版本作为模板下载目标。具体版本可以是普通 semver，也可以是带 beta prerelease 的 semver。

#### Scenario: beta tag 指向普通 semver
- **WHEN** npm dist-tags 为 `latest=1.3.0`、`beta=2.0.0`
- **THEN** 系统选择 `2.0.0`

#### Scenario: beta tag 指向 prerelease semver
- **WHEN** npm dist-tag `beta` 指向 `2.0.0-beta.1`
- **THEN** 系统选择 `2.0.0-beta.1`

#### Scenario: beta tag 不存在
- **WHEN** registry 中不存在 npm dist-tag `beta`
- **THEN** 系统 MUST 输出 `TemplatesFetchError`，包含 npm 查询失败信息

#### Scenario: beta 与显式模板版本同时传入
- **WHEN** 用户执行 `devkeel update --beta --template-version 1.2.3`
- **THEN** 系统 MUST 拒绝执行并提示 `--beta` 不能与指定模板版本同时使用

#### Scenario: 强制覆盖 beta 渠道模板
- **WHEN** 用户执行 `devkeel update --beta --force`，且项目记录的模板版本已等于 beta dist-tag 指向的版本
- **THEN** 系统 MUST 仍将全部受管组件加入更新计划，以 beta 渠道模板覆盖对应本地文件

### Requirement: version 输出显式选择发布渠道
`devkeel -V` SHALL 查询并显示 CLI 与模板 npm `latest` dist-tag 指向的版本；只有显式传入 `--beta` 时，系统才 SHALL 查询 beta dist-tag，并为两行输出标注 `(beta)`。

#### Scenario: 默认显示 latest
- **WHEN** 用户执行 `devkeel -V`
- **THEN** 系统查询 `devkeel@latest` 与 `devkeel-templates@latest` 的版本并显示，且不添加 beta 标识

#### Scenario: 显式显示 beta
- **WHEN** 用户执行 `devkeel -V --beta`
- **THEN** 系统查询 `devkeel@beta` 与 `devkeel-templates@beta` 的版本，并分别输出 `harness <version> (beta)` 与 `templates <version> (beta)`

#### Scenario: registry 不可达
- **WHEN** 查询 CLI dist-tags 或模板版本失败
- **THEN** 系统沿用当前 CLI 版本与现有本地模板版本回退，不因版本查询失败退出
