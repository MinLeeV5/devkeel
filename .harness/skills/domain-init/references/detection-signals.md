# 领域检测信号表

检测按优先级从高到低匹配，**命中第一个即停止**。

## 前端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + react/next | 依赖扫描 | frontend-react |
| `package.json` + vue/nuxt | 依赖扫描 | frontend-vue |
| `package.json` + angular | 依赖扫描 | frontend-angular |
| `package.json` + svelte/sveltekit | 依赖扫描 | frontend-svelte |

## 后端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `pom.xml` / `build.gradle` + spring | 文件+依赖 | backend-java-spring |
| `go.mod` + gin/echo/fiber | 文件+依赖 | backend-go |
| `go.mod`（无 Web 框架） | 文件存在 | backend-go |
| `requirements.txt` / `pyproject.toml` + django | 文件+依赖 | backend-python-django |
| `requirements.txt` / `pyproject.toml` + fastapi | 文件+依赖 | backend-python-fastapi |
| `package.json` + express/nestjs/koa | 依赖扫描 | backend-node |

## 移动端

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `Package.swift` / `*.xcodeproj` | 文件存在 | ios-swift |
| `build.gradle` + android | 文件+依赖 | android |
| `pubspec.yaml` | 文件存在 | flutter |
| `package.json` + react-native | 依赖扫描 | react-native |

## 系统/底层

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `Cargo.toml` | 文件存在 | rust |
| `CMakeLists.txt` / `*.vcxproj` | 文件存在 | cpp |
| `*.sln` / `*.csproj` | 文件存在 | dotnet |

## 工具/库/平台

| 信号 | 检测方式 | 推断领域 |
|------|----------|----------|
| `package.json` + `bin` 字段 | bin 入口检测 | **cli-node** |
| `package.json` + `main`/`exports` 且无 `bin` 无前端框架 | 导出检测 | **library-node** |
| `Cargo.toml` + `[[bin]]` | manifest 检测 | **cli-rust** |
| `go.mod` + `main.go` 在根目录 | 文件检测 | **cli-go** |
| `setup.py` / `pyproject.toml` + `[project.scripts]` | 入口检测 | **cli-python** |
| `Dockerfile` / `docker-compose.yml` 为主入口 | 文件检测 | **devops-infra** |
| `terraform/` / `*.tf` | 文件检测 | **devops-iac** |
| `*.proto` + `buf.yaml` / `grpc` | 文件+依赖 | **sdk-grpc** |
| `electron` / `tauri` in dependencies | 依赖扫描 | **desktop** |

## Monorepo 检测

| 信号 | 检测方式 | 处理方式 |
|------|----------|----------|
| `pnpm-workspace.yaml` / `lerna.json` / `nx.json` | 文件存在 | 视为单一项目，正常执行 Phase 2-4 |
| 根目录 + `packages/` / `apps/` | 目录结构 | 视为单一项目，正常执行 Phase 2-4 |

Monorepo 是一个项目的多包组织方式，domain-init 在根目录运行一次即可。

## Git Submodule 检测

| 信号 | 检测方式 | 处理方式 |
|------|----------|----------|
| `.gitmodules` / `git submodule status` 有输出 | git 命令 | 检测到子模块 |

**检测到 git submodule 时的行为：**

提示用户应在各子模块内分别运行 domain-init，而非在主仓库根目录运行：

> 检测到当前项目包含 git submodule。domain-init 应在各子模块中分别运行，生成各自的领域能力。主仓库可通过 `sync-submodule-skills.mjs` 将子模块 skills 汇聚到主仓库。

随后终止当前流程，不继续 Phase 2。

## 未命中降级策略

如果以上信号都未命中，执行降级流程：

1. **扫描文件后缀分布** — 统计 `.ts/.js/.py/.go/.rs/.java/.cpp` 等的文件数量比例
2. **扫描入口特征** — 是否有 `main` 函数/文件、`bin/` 目录、`src/index.*`
3. **读取 README / package.json description** — 提取项目自我描述
4. **综合推断** — 基于以上信息推断最可能的领域类别
5. **向用户确认** — 展示推断结果和依据，让用户确认或手动指定领域

## 可用领域标签

```
cli-node / cli-go / cli-rust / cli-python
library-node / library-python / library-go
frontend-react / frontend-vue / frontend-angular / frontend-svelte
backend-node / backend-go / backend-java-spring / backend-python-django
ios-swift / android / flutter / react-native
rust / cpp / dotnet
desktop / devops-infra / devops-iac / sdk-grpc
data-science / ml-ops
game-unity / game-unreal
custom:<用户自定义>
```

使用 `custom:<标签>` 时，后续 Phase 2/3 的维度适用性矩阵按「通用」列处理，用户可自行调整。

## 细化识别

在确定领域后进一步检测：

- **框架版本** — React 18 vs 19、Spring Boot 2 vs 3、Go 1.21 vs 1.22
- **构建工具** — Vite/Webpack/Rspack/tsup、Maven/Gradle
- **测试框架** — Vitest/Jest/Playwright/Cypress、JUnit/TestNG/GoTest
- **Lint 工具** — ESLint/Biome/oxlint、Checkstyle/SpotBugs/golangci-lint
- **包管理器** — pnpm/yarn/npm、Maven/Gradle/go mod
- **样式方案** — Tailwind/UnoCSS/CSS-in-JS/SCSS（前端）
- **ORM/数据层** — Prisma/TypeORM/MyBatis/GORM/SQLAlchemy（后端）
