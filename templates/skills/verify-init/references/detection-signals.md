# 检测信号表

Phase 1 按「领域检测 → 技术栈细化 → 框架已存在检测」三层扫描。检测按优先级从高到低匹配，多领域命中取并集。

## 领域检测信号

### 前端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + react/next | 依赖扫描 | frontend-react |
| `package.json` + vue/nuxt | 依赖扫描 | frontend-vue |
| `package.json` + angular | 依赖扫描 | frontend-angular |
| `package.json` + svelte/sveltekit | 依赖扫描 | frontend-svelte |

### 后端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + express/fastify/nestjs/koa | 依赖扫描 | backend-node |
| `requirements.txt` / `pyproject.toml` + fastapi | 文件+依赖 | backend-python |
| `requirements.txt` / `pyproject.toml` + django | 文件+依赖 | backend-python |
| `requirements.txt` / `pyproject.toml` + flask | 文件+依赖 | backend-python |
| `go.mod` + gin/echo/fiber | 文件+依赖 | backend-go |
| `pom.xml` / `build.gradle` + spring | 文件+依赖 | backend-java-spring |

### 移动端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + react-native | 依赖扫描 | react-native |
| `pubspec.yaml` | 文件存在 | flutter |
| `*.xcodeproj` / `Package.swift` | 文件存在 | ios-swift |
| `build.gradle` + android | 文件+依赖 | android |

### CLI / 库

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + `bin` 字段 | bin 入口检测 | cli-node |
| `Cargo.toml` + `[[bin]]` | manifest 检测 | cli-rust |
| `go.mod` + 根目录 `main.go` | 文件检测 | cli-go |
| `package.json` + `main`/`exports` 且无 `bin` 无前端框架 | 导出检测 | library-node |
| `pyproject.toml` `[lib]` / 纯库 `setup.py` | manifest 检测 | library-python |

### Monorepo 检测

| 信号 | 检测方式 | 处理方式 |
|------|----------|----------|
| `pnpm-workspace.yaml` / `lerna.json` / `nx.json` | 文件存在 | 视为单一项目，根目录运行一次 |
| 根目录 + `packages/` / `apps/` | 目录结构 | 视为单一项目，按主包技术栈检测 |

## 技术栈细化识别

确定领域后进一步检测框架版本与构建工具：

- **框架版本** — React 18 vs 19、Vue 2 vs 3、Spring Boot 2 vs 3
- **构建工具** — Vite/Webpack/Rspack、Maven/Gradle
- **包管理器** — pnpm/yarn/npm（决定安装命令前缀）、pip/uv/poetry、go mod、maven/gradle

包管理器检测优先级：`pnpm-lock.yaml` → `yarn.lock` → `package-lock.json` → 无锁文件默认 npm。Python 侧 `uv.lock` → `poetry.lock` → `requirements.txt`。

## 框架已存在检测信号

对 stack-matrix 推荐的每个框架，按以下信号判断是否「已就绪」：

### Node 生态框架

| 框架 | 依赖信号 | 配置信号 | 锁文件信号 |
|------|---------|---------|-----------|
| vitest | `package.json` devDeps 含 `vitest` | `vitest.config.{ts,js,mts,mjs}` 或 `vite.config` 含 `test` 字段 | `pnpm-lock.yaml` 含 `vitest:` |
| Jest | devDeps 含 `jest` | `jest.config.{ts,js,json}` 或 `package.json` `jest` 字段 | lockfile 含 `jest@` |
| @testing-library/react | devDeps 含 `@testing-library/react` | — | lockfile |
| @vue/test-utils | devDeps 含 `@vue/test-utils` | — | lockfile |
| Playwright | devDeps 含 `@playwright/test` | `playwright.config.{ts,js}` | lockfile |
| supertest | devDeps 含 `supertest` | — | lockfile |
| execa | devDeps 含 `execa` | — | lockfile |

### Python 生态框架

| 框架 | 依赖信号 | 配置信号 |
|------|---------|---------|
| pytest | `pyproject.toml`/`requirements*.txt` 含 `pytest` | `pytest.ini` / `setup.cfg [pytest]` / `pyproject.toml [tool.pytest]` / `conftest.py` |
| httpx | 含 `httpx` | `conftest.py` 含 `TestClient`/`httpx` |

### Go 生态框架

| 框架 | 依赖信号 | 配置信号 |
|------|---------|---------|
| testify | `go.mod` require 含 `github.com/stretchr/testify` | `*_test.go` import testify |
| httptest | （标准库，恒存在） | `*_test.go` import `net/http/httptest` |

### Java 生态框架

| 框架 | 依赖信号 | 配置信号 |
|------|---------|---------|
| JUnit 5 | `pom.xml`/`build.gradle` 含 `junit-jupiter` | `src/test/java/**/*.java` 含 `@Test` |
| Mockito | 含 `mockito-core` | test 源含 `@Mock`/`Mockito` |
| MockMvc | 含 `spring-test` | test 源含 `MockMvc` |

### 移动端框架

| 框架 | 依赖信号 | 配置信号 |
|------|---------|---------|
| Detox | `package.json` devDeps 含 `detox` | `.detoxrc.{js,json}` |
| flutter test | （flutter SDK 内置） | `test/` 目录存在 |
| integration_test | `pubspec.yaml` devDeps 含 `integration_test` | `integration_test/` 目录 |
| XCTest | `*.xcodeproj` test target | `*Tests.swift` / `*Tests.m` |
| Espresso | `build.gradle` androidTestImpl 含 `espresso-core` | `androidTest/` 目录 |

### 目录结构信号

| 目录 | 含义 |
|------|------|
| `tests/` / `__tests__/` | 单测已组织 |
| `e2e/` / `tests-e2e/` | e2e 已组织 |
| `test/`（单数，Go/Python） | 单测已组织 |
| `integration_test/`（Flutter） | 集成测试已组织 |
| `src/test/`（Java/Maven 约定） | 单测已组织 |
| `__snapshots__/` | 快照测试已用 |

## 未命中降级策略

所有领域信号都未命中时：

1. **扫描文件后缀分布** — 统计 `.ts/.js/.py/.go/.rs/.java/.swift` 等比例
2. **读取 README / package.json description** — 提取项目自我描述
3. **向用户确认** — 展示推断结果和依据，让用户确认或手动指定领域标签
4. 标 `custom:<标签>` — 只配基础结构（`tests/` 目录约定）+ 通用规范，不强制装框架

## 可用领域标签

```
frontend-react / frontend-vue / frontend-angular / frontend-svelte
backend-node / backend-python / backend-go / backend-java-spring
react-native / flutter / ios-swift / android
cli-node / cli-rust / cli-go
library-node / library-python
custom:<用户自定义>
```

使用 `custom:<标签>` 时，stack-matrix 按通用处理，用户可自行指定框架。
