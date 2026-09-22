## 一句话描述

将现有 `templates/` 目录就地升级为独立内部 npm 包 `devkeel-templates`（同仓、不另开仓库），`devkeel update` 通过 `npm view` 实时拉取最新版 tarball，使模板迭代独立于 CLI 发版。

## 需求背景

当前 `templates/` 与 CLI 同仓，且被 `package.json` 的 `files` 字段打入 `devkeel` tarball。这意味着：

- 模板内容变更必须伴随 CLI 升版 + 重新发布，才能让用户拿到
- 用户执行 `devkeel update` 只是把当前已安装版本的模板**还原**一次，并不是真的升级
- 模板（skills/rules/agents/schemas）迭代频率明显高于 CLI 代码，二者耦合成为瓶颈

业务诉求："devkeel update 永远可以拉到最新的 template 模板" —— 模板变更能在用户下一次执行 `devkeel update` 时自动生效，无需 CLI 升版。

## 项目现状与架构分析

**受影响模块：**

| 模块 | 当前职责 | 改造后 |
|------|----------|--------|
| `templates/` 目录 | 模板资产 + `versions-yml.yml` | 原地新增 `package.json`（`name: devkeel-templates`），作为独立 npm 包发版；CLI `package.json` 的 `files` 字段**移除** `templates` |
| `src/lib/templates.ts::getTemplatesDir()` | 解析包内 `templates/` 路径 | 改为指向 `~/.harness/cache/harness-templates/<version>/` |
| `src/lib/config.ts::getBuiltinVersions()` | 读包内 `versions-yml.yml` | 改读缓存中的 `versions-yml.yml` |
| `src/lib/config.ts::readSchemaVersion()` | 读包内 schema.yaml | 改读缓存中的 schema.yaml |
| `src/commands/update.ts` | 编排更新流程 | 开头新增"拉取最新模板包"步骤 |
| `src/commands/init.ts` | 复制模板到目标项目 | 自动受益（依赖 `getTemplatesDir()`） |

**核心调用链（改造后）：**

```
devkeel update
  ↓
ensureTemplatesCache()              ← 新增
  ├─ npm view devkeel-templates version dist.tarball --json
  ├─ 比对缓存 meta.json 中的 version
  ├─ 不同 → 下载 tarball → 解压到 ~/.harness/cache/harness-templates/<version>/
  └─ 相同 → 复用缓存
  ↓
detectUpdates() / copyDirRecursive()   ← 不变，但模板源从包内变为缓存
```

## 风险与约束

| 风险 | 缓解 |
|------|------|
| 用户环境无 npm / npm 不在 PATH | 启动时检测；失败报错含修复建议 |
| 内部 Artifactory 不可达 / 鉴权失败 | 报错含 `.npmrc` 配置片段（`registry=...`） |
| 拉取延迟影响 `devkeel update` 体验 | 实时拉取，不做 TTL；网络差时直接报错而非静默降级 |
| 首次执行冷启动慢 | 接受，仅第一次 |
| 旧 CLI 用户（包内还带 templates） | 不在本 change 范围；新 CLI 直接移除包内 templates |
| 缓存目录权限 / 多用户并发写 | 用用户级 `~/.harness/cache/`，自然隔离 |
| `versions-yml.yml` 在两个包里的单一权威源 | 迁到新包，CLI 包不再保留 |
| 同仓双包发版冲突（CLI 和模板共用 `master`，发版节奏不同） | 用 npm `workspaces` 或独立发版脚本；`templates/package.json` 独立 `version`；CLI 发版流程不联动模板发版 |

**向后兼容：** 不兼容旧 CLI（用户明确要求"旧 CLI 不管了"）。CLI 升 major 或在新 minor 中明确提示。

**测试覆盖：** 现有 `tests/templates.test.ts`、`tests/config.test.ts` 大量依赖包内 templates 路径，需改造为使用临时目录构造的"假模板缓存"。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| CLI 用户（内部工程师） | 执行 `devkeel update` 拿到最新 skills/rules；环境配置一次到位 |
| 模板维护者 | 改模板只需发 `devkeel-templates`，无需碰 CLI |
| Ops/SRE | 内部 Artifactory 容量、tarball 命名规范 |

## 核心功能用例

### UC1: 首次执行 `devkeel update`

- **触发：** 用户在新版 CLI 下第一次跑 `devkeel update`
- **预期：** CLI 调 `npm view` 拿到 latest 版本，下载 tarball 解压到 `~/.harness/cache/harness-templates/<version>/`，后续流程使用此目录作为模板源；写入 `meta.json` 记录 `{ version, fetchedAt }`

### UC2: 重复执行且版本未变

- **触发：** 缓存已有 latest 版本
- **预期：** `npm view` 返回版本与缓存一致，复用缓存，不重新下载

### UC3: 模板包发布新版本

- **触发：** 模板维护者发布 `devkeel-templates@x.y.z`，用户随后执行 `devkeel update`
- **预期：** `npm view` 返回新版本号，下载新 tarball 解压为新目录；旧版本目录保留供回滚（或按策略清理）

### UC4: 网络 / registry 不可达

- **触发：** npm 调用失败（网络错误、鉴权失败、包不存在）
- **预期：** 报错退出，输出诊断信息：
  ```
  ❌ 无法拉取 devkeel-templates：
    <npm 原始错误>

  请确认：
    1. npm 已安装且在 PATH 中：npm --version
    2. ~/.npmrc 包含以下配置：
       registry=https://registry.npmjs.org/
    3. 当前网络可访问上述 registry：
       curl -I https://registry.npmjs.org/
  ```

### UC5: `devkeel init` 在新架构下

- **触发：** 用户执行 `devkeel init`
- **预期：** init 内部复用 `ensureTemplatesCache()`，确保模板缓存就绪后再复制；失败同 UC4

## 需求边界

**In Scope:**

- 将 `templates/` 目录就地升级为 `devkeel-templates` npm 包：新增 `templates/package.json`、`.npmignore`（或 `files` 字段）、发版脚本
- CLI `package.json` 的 `files` 字段移除 `templates`，CLI 发布不再包含模板
- CLI 新增 `src/lib/templates-cache.ts`：`ensureTemplatesCache()`、缓存读写
- 改造 `getTemplatesDir()`、`getBuiltinVersions()`、`readSchemaVersion()` 指向缓存
- 在 `devkeel update` 和 `devkeel init` 入口前置调用 `ensureTemplatesCache()`
- 失败路径的诊断文案（含内部 registry 配置指引）

**Out of Scope:**

- 另开独立仓库承载模板（用户明确：直接复用 `templates/` 目录）
- 旧 CLI 版本的兼容或 fallback（用户明确排除）
- TTL 缓存 / 离线模式 / 异步后台刷新（用户选择"每次必拉，失败报错"）
- `devkeel update --offline` 之类的强制离线 flag

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| **方案 A: runtime 依赖包**（CLI 把模板包写进 `dependencies`，依赖 npm 升级） | 简单，但"最新模板"必须靠用户 `npm update`，不满足"永远最新"语义 |
| **方案 8b: 用 `pacote` 库** | 控制力强但违反"最小依赖原则"；用户环境已有 npm |
| **方案 8c: 直接 HTTP 拼 registry URL** | 绕开 `.npmrc` 鉴权配置，不推荐 |
| **9b/9c: TTL 缓存 / 离线优先** | 增加状态机和复杂度；用户接受"实时拉取，失败报错" |
| **保留 fallback 到包内 templates** | 用户明确排除——失败直接报错更清晰 |
| **另开独立仓库存放模板** | 用户明确排除——直接复用 `templates/` 目录作为包根，少维护一个仓库 |

## 已确认项

- **同仓双包发版流程**：CLI 主导，通过主包脚本 `cd templates/ && npm publish` 发版；不用 lerna/changesets 协调。模板包纯资源无代码，发版权威在主仓。Owner: CLI 维护者。
- **`templates/package.json` 初始版本号**：`1.0.0`，与 CLI `0.6.1` 解耦，独立演进。
