# 官方文档定位方法论

Phase 3 脚手架产出前，按本方法论定位每个要补齐框架的官方文档，作为配置产出的权威来源。本文件不内置任何框架的固定 URL 或 config —— 那些会随版本过期且覆盖不了真实技术栈多样性。Agent 凭项目现状的包名，动态定位当前版本的官方文档。

## 定位步骤（从项目现状出发）

### 1. 从 manifest 取包名

从项目的依赖清单中取出要安装/已声明的包名：

| 生态 | manifest 位置 | 字段 |
|------|--------------|------|
| Node.js | `package.json` | `dependencies` / `devDependencies` |
| Python | `pyproject.toml` / `requirements*.txt` | `[project.dependencies]` / 依赖行 |
| Go | `go.mod` | `require` 块 |
| Rust | `Cargo.toml` | `[dependencies]` |
| Java | `pom.xml` / `build.gradle` | `<dependencies>` / `dependencies {}` |

要补齐的框架由 Phase 1 的 `stack-matrix` 推荐 + `detection-signals` 的缺口判定决定。取到包名后，以下一步定位官方文档。

### 2. 定位官方文档源（按优先级）

对每个包名，按以下顺序尝试定位官方文档，任意一步成功即提取要素，无需走完全部：

1. **context7 MCP（可用时加速）** — 环境装有 `plugin:context7:context7` 时，先 `resolve-library-id(包名)` 拿到库 ID，再 `query-docs(库ID, "configuration options and testing setup")` 拉配置/最佳实践文档。环境无 context7 直接跳过，不报错。
2. **读取官方文档站（能力可用时）** — 从包的 registry 页面（npmjs.com / pypi.org / pkg.go.dev / crates.io）找 `homepage` 字段定位官方 docs 站，用当前平台的页面读取能力拉取配置参考页。
3. **网页搜索（可用且前两步定位不到时）** — 搜 `"<包名> testing configuration <年份>"` 找最新实践页面，再读取命中的官方 URL。
4. **GitHub README（兜底）** — 包的仓库 README 通常含 quickstart + 配置示例，从 registry 页面的 repository 字段或直接搜 `<包名> github` 定位。

### 3. 提取产出要素

从拉到的官方文档中，提取 Phase 3 产出所需的 5 类要素：

- **安装命令** — 对应检测到的包管理器（pnpm/npm/pip/uv/go get/cargo add/maven）
- **config 文件 schema** — 框架约定的配置文件结构（如 `vitest.config.ts` 的 `test` 字段、`pytest.ini` 的 `[pytest]` 段）
- **一个最小可跑示例** — 官方 quickstart 里的示例测试，作为 `tests/example.*` 起点
- **scripts 约定** — 官方推荐的执行命令（test / coverage / watch）
- **覆盖率/超时最佳实践** — 官方文档中的推荐配置项（如 vitest `coverage` provider、Playwright `use.trace`、pytest fixture scope）

提取后交 `scaffolding-principles.md` 清单核对产出，不直接照搬。

## fetch 链（context7 首选非必需）

定位步骤 2 的四条路径构成 fetch 链，优先级与可用性约定：

| 环节 | 可用性 | 角色 |
|------|--------|------|
| context7 MCP | 可选（环境不一定装） | 加速：已有索引的库直接命中，减少页面读取次数 |
| 页面读取 | 依当前会话能力与权限 | 读取官方文档页面 |
| 网页搜索 | 依当前会话能力与权限 | 定位官方 URL，再读取页面 |
| GitHub README | 页面读取可达时 | 末位兜底：包仓库的 quickstart 示例 |

各途径均以当前会话的实际能力和权限为准；不可用时跳过，不要求安装额外插件。平台工具差异见技能入口中的按需参考。

### 全失败降级

文档查询、页面读取、网页搜索及官方仓库 README 等可用途径均失败（离线、网络受限、站点变更）时：

- **不凭训练记忆编造 config** —— 记忆里的配置项可能对应旧版本，无法校验，编造比诚实跳过更危险
- **跳过精确 config 产出** —— Phase 3.3 的安装/写 config/写示例/补 scripts 四步整体跳过
- **只产 Phase 4 规范 + agent** —— testing.md 通用规范 + test-verifier agent 不依赖具体框架 config，正常产出
- **向用户显式提示** —— 输出「未能获取 `<框架>` 官方文档，config 请手动补」，把不确定的部分明确交还用户

降级语义详见 SKILL.md Hard Rule 4。

## context7 使用方式

环境有 context7 MCP 时，按序调用两个工具：

1. `resolve-library-id` —— 输入框架/包名（如 `vitest`、`pytest`），返回匹配的库 ID
2. `query-docs` —— 用库 ID 查具体文档，query 聚焦「configuration options and testing setup」

```
# 伪流程
libraryId = context7.resolve-library-id("vitest")
docs = context7.query-docs(libraryId, "configuration options and coverage setup")
# 从 docs 提取 5 类产出要素 → 交 scaffolding-principles 清单核对
```

context7 无返回或库 ID 不匹配时，回退到可用的页面读取能力，不报错。

## 页面读取方式

context7 不可用或未命中时，用当前平台的页面读取能力访问官方文档站。优先级：

1. 官方 docs 站的配置参考页（如 `vitest.dev/config`、`docs.pytest.org/en/stable/reference`）
2. 仓库 README（`raw.githubusercontent.com` 直链或 GitHub 渲染页）
3. registry 页面（npmjs.com / pypi.org）的 README 渲染

页面读取请求 聚焦提取 5 类产出要素，要求标注文档对应的版本号，便于 Phase 3 核对「版本对应」质量标准。

## 质量标准

| 标准 | 要求 |
|------|------|
| 来源权威 | 优先官方文档站 / GitHub README，不凭记忆或第三方博客 |
| 版本对应 | 确认文档对应当前安装版本（核对 package.json 声明版本 vs 文档版本），非旧版 |
| 不照搬 | 借鉴结构、深度、最佳实践，不复制官方文档全文进产出 |
| 降级明确 | fetch 失败必须向用户提示「config 请手动补」，不静默吞错 |
| 要素齐全 | 至少提取安装命令 + config schema + 一个示例，缺项不编造 |
