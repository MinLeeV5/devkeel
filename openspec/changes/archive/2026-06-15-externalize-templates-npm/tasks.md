# externalize-templates-npm 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 将 `templates/` 就地升级为独立内部 npm 包，CLI 运行时通过 `npm view` 实时拉取最新模板到本地缓存。

**架构：** `templates/` 目录新增 `package.json` 作为独立 npm 包发版；CLI 新增 `src/lib/templates-cache.ts` 封装拉取与缓存逻辑；`getTemplatesDir()` 改造为指向缓存目录；`devkeel update/init` 入口前置调用 `ensureTemplatesCache()`。

**技术栈：** Node.js 20+、`child_process.execSync`（调用 npm）、`node:fs`/`node:path`/`node:os`、`node:zlib`（解压 tarball）、`yaml` 包。

---

## 1. 模板包基础设施

- [x] **1.1 创建 templates/package.json**
  1. 在 `templates/` 目录新建 `package.json`
  2. 字段：`name: "devkeel-templates"`、`version: "1.0.0"`、`description`、`license: "MIT"`
  3. `files` 白名单列出所有应发布的目录和文件（skills/rules/agents/commands/domain/openspec/versions-yml.yml 及根模板文件）
  4. `publishConfig.registry` 指向 `https://registry.npmjs.org/`
  5. 验证：`cd templates && npm pack --dry-run` 输出仅包含白名单文件
  > commit: feat(templates): 新增独立 npm 包配置

- [x] **1.2 创建 templates/.npmignore**
  1. 排除 `node_modules/`、`.DS_Store`、`.gitkeep`、`*.log`
  2. 验证：`npm pack --dry-run` 不含排除项
  > commit: chore(templates): 添加 .npmignore

- [x] **1.3 主仓添加 release:templates 脚本**
  1. 在根 `package.json` 的 `scripts` 新增 `"release:templates": "cd templates && npm publish"`
  2. 验证：`pnpm release:templates --dry-run`（或手动 `cd templates && npm publish --dry-run`）可执行
  > commit: feat(harness): 添加模板发版脚本

## 2. CLI 移除 templates 打包

- [x] **2.1 CLI package.json files 字段移除 templates**
  1. 编辑 `package.json`，从 `files` 数组删除 `"templates"`
  2. 验证：`pnpm build && npm pack --dry-run` 输出不含 `templates/`
  > commit: feat(harness): CLI 发布不再包含模板资源

## 3. 模板缓存拉取模块

- [x] **3.1 实现 ensureTemplatesCache 核心逻辑**
  1. 新建 `src/lib/templates-cache.ts`
  2. 定义常量：`PACKAGE_NAME`、`CACHE_ROOT`（`~/.harness/cache/harness-templates`）、`META_FILE`、`REGISTRY_HINT`
  3. 实现 `ensureTemplatesCache(): TemplatesCacheInfo`：
     - 调用 `execSync('npm view devkeel-templates version dist.tarball --json')`
     - 解析 JSON 输出，提取 `version` 和 `dist.tarball`
     - 读取 `CACHE_ROOT/meta.json`，比对 `version`
     - 若一致且 `<version>/` 目录存在，直接返回 `{ cacheDir, version }`
     - 若不一致或无缓存，下载 tarball 到 `<version>.tmp/`，解压，`rename` 为 `<version>/`，更新 `meta.json`
  4. 失败时抛出 `TemplatesFetchError`，`diagnostic` 字段包含修复指引（npm 检查、`.npmrc` 配置、网络测试、包发布确认）
  5. 验证：单元测试覆盖"首次拉取"、"缓存命中"、"版本过期"三种场景（mock `execSync` 和 `fetch`）
  > commit: feat(templates-cache): 实现模板缓存拉取核心逻辑

- [x] **3.2 实现 tarball 下载与解压**
  1. 在 `templates-cache.ts` 内部实现 `downloadAndExtract(tarballUrl: string, targetDir: string)`：
     - 用 `fetch()` 下载 tarball（`.tgz`）
     - 用 `node:zlib` + `tar` 命令（或纯 Node 解压库）解压到 `targetDir`
     - npm tarball 结构通常是 `package/...`，需剥离顶层目录
  2. 验证：单元测试解压后文件结构正确（`skills/`、`rules/` 在顶层）
  > commit: feat(templates-cache): 实现 tarball 下载与解压

- [x] **3.3 实现 TemplatesFetchError 与诊断文案**
  1. 定义 `class TemplatesFetchError extends Error`，含 `diagnostic: string` 字段
  2. 诊断文案模板：
     ```
     无法拉取 devkeel-templates：
       <原始错误>

     请确认：
       1. npm 已安装且在 PATH 中：npm --version
       2. ~/.npmrc 包含以下配置：
          registry=https://registry.npmjs.org/
       3. 当前网络可访问 registry：
          curl -I https://registry.npmjs.org/devkeel-templates
       4. 模板包已发布到上述 registry（维护者首次发版后才可用）
     ```
  3. 验证：单元测试错误消息包含所有指引项
  > commit: feat(templates-cache): 实现错误诊断文案

## 4. 改造模板读取入口

- [x] **4.1 改造 getTemplatesDir 支持动态路径**
  1. 在 `src/lib/templates.ts` 新增模块级变量 `let cachedTemplatesDir: string | null = null`
  2. 新增 `export function setTemplatesDir(dir: string): void` 设置缓存路径
  3. 改造 `getTemplatesDir()`：优先返回 `cachedTemplatesDir`，否则 fallback 到源码态 `templates/`（通过 `fs.existsSync` 探测）
  4. 验证：现有测试 `tests/templates.test.ts` 仍通过（fallback 路径覆盖本地开发场景）
  > commit: feat(templates): getTemplatesDir 支持动态缓存路径

- [x] **4.2 验证 getBuiltinVersions 与 readSchemaVersion 自动适配**
  1. 检查 `src/lib/config.ts` 中 `getBuiltinVersions()` 和 `readSchemaVersion()` 是否依赖 `getTemplatesDir()`
  2. 确认改造后自动指向缓存目录（无需额外改动）
  3. 验证：`tests/config.test.ts` 仍通过
  > commit: (无需 commit，仅验证)

## 5. 命令层接入

- [x] **5.1 devkeel update 入口前置 ensureTemplatesCache**
  1. 在 `src/commands/update.ts` 的 `runUpdate()` 开头（`readVersions` 检查后）调用 `ensureTemplatesCache()`
  2. 成功时调用 `setTemplatesDir(cacheDir)`
  3. 捕获 `TemplatesFetchError`，输出 `e.message + '\n\n' + e.diagnostic`，`process.exit(1)`
  4. 验证：手动测试 `node bin/devkeel.js update`（需先发布 `devkeel-templates@1.0.0` 到内部 registry，或 mock npm view）
  > commit: feat(update): 入口前置模板缓存拉取

- [x] **5.2 devkeel init 入口前置 ensureTemplatesCache**
  1. 在 `src/commands/init.ts` 的 `runInit()` 开头（读取模板前）调用 `ensureTemplatesCache()`
  2. 成功时调用 `setTemplatesDir(cacheDir)`
  3. 捕获 `TemplatesFetchError`，输出诊断文案，`process.exit(1)`
  4. 验证：手动测试 `node bin/devkeel.js init`（同上）
  > commit: feat(init): 入口前置模板缓存拉取

## 6. 集成验证

- [x] **6.1 端到端验证 update 流程**
  1. 在内部 registry 发布 `devkeel-templates@1.0.0`（执行 `pnpm release:templates`）
  2. 清空 `~/.harness/cache/harness-templates/`
  3. 执行 `node bin/devkeel.js update`，确认：
     - `npm view` 被调用
     - tarball 下载并解压到 `~/.harness/cache/harness-templates/1.0.0/`
     - `meta.json` 写入 `{ version: "1.0.0", fetchedAt: "..." }`
     - 后续 `detectUpdates()` 从缓存读取版本基线
  4. 验证：`~/.harness/cache/harness-templates/1.0.0/skills/` 存在且内容正确
  > commit: (无需 commit，仅验证)

- [x] **6.2 端到端验证 init 流程**
  1. 在空目录执行 `node bin/devkeel.js init`
  2. 确认 `.harness/skills/`、`.harness/rules/` 等从缓存复制
  3. 验证：`ls .harness/skills/` 内容正确
  > commit: (无需 commit，仅验证)

- [x] **6.3 错误路径验证**
  1. 模拟网络不可达（断网或 mock npm view 失败）
  2. 执行 `node bin/devkeel.js update`，确认输出完整诊断文案
  3. 验证：exit code = 1，错误消息包含 `.npmrc` 配置指引
  > commit: (无需 commit，仅验证)

## 7. 文档与 changelog

- [x] **7.1 更新 web/changelog.html**
  1. 按 `.harness/skills/changelog/` 规范添加新版本条目
  2. 用户可见变更：模板独立发版、`devkeel update` 实时拉取最新模板、要求配置内部 npm 源
  3. breaking 标注：旧 CLI 用户升级后需配置 `registry` 才能使用 `update/init`
  > commit: docs(web): 更新 changelog

- [x] **7.2 更新 CLAUDE.md 或 README（若存在）**
  1. 在"安装"或"前置条件"章节添加 `.npmrc` 配置要求
  2. 示例：`registry=https://registry.npmjs.org/`
  > commit: docs(harness): 补充内部 npm 源配置要求

---

## 验收标准

- [x] `pnpm lint` 通过
- [x] `pnpm test` 通过（含新增 `tests/templates-cache.test.ts`）
- [x] `pnpm build` 产物不含 `templates/`
- [x] 端到端验证：`devkeel update` 和 `devkeel init` 在配置内部 registry 后可正常拉取模板
- [x] 端到端验证：网络失败时输出完整诊断文案并 exit(1)
