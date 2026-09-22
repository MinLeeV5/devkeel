# 领域 → 技术栈 → 测试框架映射表

stack-matrix 是 Phase 1 推荐框架的权威来源。v1 覆盖主流四大类（前端/后端/移动端/CLI·库）。每个技术栈给「单元测试 + e2e/API 测试」的默认选型。

## 前端

| 信号 | 领域 | 单元测试 | e2e |
|------|------|---------|-----|
| react/next + vite | frontend-react | vitest + @testing-library/react + jsdom | Playwright |
| vue/nuxt | frontend-vue | vitest + @vue/test-utils + jsdom | Playwright |
| angular | frontend-angular | vitest（Angular test bed）/ Karma（老项目） | Playwright |
| svelte/sveltekit | frontend-svelte | vitest + @testing-library/svelte + jsdom | Playwright |

**前端共性**：jsdom 提供 DOM 环境；e2e 统一 Playwright（跨浏览器、自动等待、trace viewer）。

## 后端

| 信号 | 领域 | 单元测试 | API 测试 |
|------|------|---------|---------|
| express/fastify/nestjs/koa | backend-node | vitest（已有 Jest 则沿用 Jest） | supertest |
| fastapi/django/flask | backend-python | pytest | pytest + httpx / TestClient |
| gin/echo/fiber | backend-go | testing + testify | net/http/httptest + testify |
| pom.xml + spring | backend-java-spring | JUnit 5 + Mockito | MockMvc / RestAssured |

**后端共性**：API 测试优先用「内存内启服务 + HTTP 客户端调」，避免起独立进程。

## 移动端

| 信号 | 领域 | 单元测试 | UI/e2e |
|------|------|---------|--------|
| react-native | react-native | jest + @testing-library/react-native | Detox / Maestro |
| pubspec.yaml | flutter | flutter test（SDK 内置） | integration_test |
| *.xcodeproj / Package.swift | ios-swift | XCTest | XCUITest |
| build.gradle + android | android | JUnit 4 + Robolectric | Espresso |

## CLI / 库

| 信号 | 领域 | 单元测试 | 集成/e2e |
|------|------|---------|---------|
| commander/yargs/bin | cli-node | vitest + execa（子进程执行） | execa 跑真实 bin |
| clap / Cargo.toml `[[bin]]` | cli-rust | cargo test + assert_cmd | assert_cmd |
| go.mod + 根目录 main.go | cli-go | testing + testify | 黄金文件对比 |
| exports/main 无 bin 无前端框架 | library-node | vitest | — |
| `[lib]` / 纯库 pyproject | library-python | pytest | — |

**CLI 共性**：集成测试用「编译后真实 bin 子进程执行 + 断言 stdout/exit code」；库只做单测，无 e2e 段。

## Monorepo 处理

`pnpm-workspace.yaml` / `lerna.json` / `nx.json` 命中 → 视为单一项目，根目录运行一次 verify-init。按主包/主 app 技术栈检测，子包若技术栈不同由用户在 Phase 2 补充说明。

## 未命中（custom）

检测不到明确技术栈 → 标 `custom:<标签>`：

- 只配基础结构（`tests/` 目录约定 + 通用 testing 规范）
- 不强制装框架，提示用户手动指定领域或框架
- 验证 agent 仍可生成（变更驱动验证不依赖具体框架，跑用户已有的 test 命令）

## 选型原则

1. **自动识别优先** — 扫描项目信号匹配技术栈，取该技术栈最合适的框架
2. **已有框架沿用** — 检测到已有 vitest/Jest 等，不强行换；只补缺失类型
3. **2026 主流选型** — 前端默认 vitest（Vite 原生、更快），Jest 仅老项目降级
4. **跨栈一致** — e2e 统一 Playwright（前端/移动端 webview）；API 测试用内存 HTTP 客户端
5. **可调** — 用户可在 Phase 2 取消任何推荐项或补充自定义框架

## 脚手架产出路径

本表给出可覆盖的框架推荐，不绑定固定 config 配方。每个技术栈的具体安装/config/示例/scripts 由 Agent 凭官方文档产出（见 `frameworks-index.md` 定位方法论 + `scaffolding-principles.md` 产出清单），推荐项可被官方文档或用户在 Phase 2 推翻。

custom 领域无推荐锚点，走通用基础结构路径 + 通用规范，Agent 仍可凭官方文档产出脚手架。
