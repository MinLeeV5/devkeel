## ADDED Requirements

### Requirement: 实时拉取最新模板版本

当用户执行 `devkeel update` 或 `devkeel init` 时，系统 SHALL 通过 `npm view devkeel-templates version dist.tarball --json` 查询内部 registry 的最新版本号。

#### Scenario: 成功查询到最新版本
- **WHEN** 用户执行 `devkeel update` 且 npm 环境正常
- **THEN** 系统解析 `npm view` 的 JSON 输出，提取 `version` 和 `dist.tarball` URL

#### Scenario: npm 未安装或不在 PATH
- **WHEN** `npm view` 执行失败，exit code ≠ 0
- **THEN** 系统抛出 `TemplatesFetchError`，错误信息包含：
  1. 原始 npm stderr
  2. 修复指引：确认 `npm --version` 可用
  3. 修复指引：`~/.npmrc` 必须包含 `registry=https://registry.npmjs.org/`
  4. 修复指引：`curl -I <registry-url>` 验证网络可达
  5. 修复指引：确认 `devkeel-templates` 已发布

#### Scenario: npm 输出非预期 JSON
- **WHEN** `npm view` 成功但输出无法解析为 `{ version, dist.tarball }`
- **THEN** 系统抛出 `TemplatesFetchError`，错误信息包含原始 stdout

### Requirement: 缓存目录布局与版本隔离

系统 SHALL 将模板缓存到 `~/.harness/cache/harness-templates/<version>/`，每个版本独立目录，支持并发安全与回滚。

#### Scenario: 首次拉取
- **WHEN** 缓存根目录不存在或无对应版本目录
- **THEN** 系统创建 `~/.harness/cache/harness-templates/<version>.tmp/`，下载并解压 tarball，完成后 `rename` 为 `<version>/`

#### Scenario: 缓存命中
- **WHEN** `meta.json` 中的 `version` 与 `npm view` 返回的 latest 一致，且 `<version>/` 目录存在
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
- **WHEN** npm 返回 401/403 或 Artifactory 拒绝访问
- **THEN** 系统输出诊断文案（含 `.npmrc` 配置片段）后以 `exit(1)` 退出

#### Scenario: 包未发布
- **WHEN** npm 返回 404（`devkeel-templates` 不存在）
- **THEN** 系统输出诊断文案（提示维护者首次发版）后以 `exit(1)` 退出
