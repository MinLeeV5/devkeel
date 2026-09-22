# 脚手架产出原则

Agent 按 `frameworks-index.md` 定位并拉到官方文档后，按本清单核对脚手架产出。本文件只列「一个合格测试脚手架必须包含什么 + 跨栈通用注意点」，不写任何技术栈的 config —— 具体 config 由 Agent 凭官方文档产出，避免写死过期。

## 必含项（缺一不可）

每个要补齐的测试框架，产出必须覆盖以下 5 项（本节是产出核对清单，≠ frameworks-index 从文档提取的 5 类要素，两者部分重叠但非一一对应——前者管「产出要有什么」，后者管「文档要提取什么」）：

- [ ] **安装命令** —— 用 Phase 1 检测到的包管理器（pnpm / npm / pip / uv / go get / cargo add / maven），按官方文档精确命令执行；已声明的依赖跳过安装只确认版本
- [ ] **配置文件** —— 框架官方约定的 config 文件（vitest / Playwright / pytest / jest 等各自的配置文件）；已存在则跳过或提示合并，不覆盖
- [ ] **每类测试一个最小示例** —— 单测 +（若有）集成 / e2e / API，每个一个能立刻跑通的最小示例（如 `tests/example.test.ts`、`e2e/smoke.spec.ts`），不写业务逻辑
- [ ] **执行 scripts** —— `test` / `test:unit` / `test:e2e` / `test:api` / `test:coverage`（按栈调整，Python 用 Makefile 或 `pyproject.toml` `[tool]` scripts，Go 用 Makefile）；已有则不覆盖
- [ ] **幂等守卫** —— 每步产出前 `existsSync` 检查，已存在的文件不覆盖；安装命令检测已声明依赖则跳过

## 跨栈通用注意点（官方文档不会告诉你）

官方文档讲「怎么配这个框架」，以下跨栈约定讲「配出来的脚手架怎么融进工程实践」，对应 frameworks-index 从文档提取的「最佳实践」要素的核对落点。产出时逐项确认已考虑，不适用的标注 N/A：

- **CI 先 build** —— bin 指向 `dist/` 的项目（如 cli-node 类 CLI），集成/e2e 测试前需先 build；`test:ci` 脚本应含 `build && test`，否则 CI 跑的是旧产物
- **覆盖率门槛** —— 新增/变更文件 ≥80%（项目可在 R4 阶段调整具体阈值）；e2e 不计入覆盖率统计（慢且不稳定）；config 里声明 coverage provider（v8 / istanbul）和 include/glob
- **e2e trace** —— Playwright `trace: 'on-first-retry'`、失败留 screenshot + video；e2e 默认不阻塞日常 `test`（单独 `test:e2e` 触发），CI 才跑全量
- **API 测试内存优先** —— 后端 API 测试用内存 TestClient（FastAPI `TestClient` / Spring `MockMvc` / Express supertest with in-memory），不起独立进程；DB 用内存引擎或事务回滚隔离，不污染开发库
- **mock 边界** —— 只 mock 跨进程边界（HTTP 外部服务 / DB / 第三方 SDK），不 mock 被测内部函数；mock 放在测试文件或 `__mocks__/`，不污染源码
- **执行分层** —— `test` 跑单测（快，日常开发用）、`test:e2e` 单独跑（慢，不阻塞日常）、`test:ci` 全量（含 build + coverage）；watch 模式只跑单测

## 产出核对流程

Agent 拉到官方文档后，按以下顺序核对再执行：

1. **提取** —— 从官方文档提取 5 类产出要素（安装命令 / config schema / 示例 / scripts / 最佳实践），核对文档版本对应当前安装版本
2. **对照必含项** —— 逐项确认 5 个必含项都有要素来源；缺项不编造，标 TODO 交还用户
3. **对照跨栈注意点** —— 逐项确认 6 个跨栈注意点已考虑，不适用的标注 N/A 并说明原因
4. **幂等执行** —— 每步 `existsSync` 守卫就位后，执行安装 / 写 config / 写示例 / 补 scripts；已存在跳过
5. **缺项提示** —— 要素缺失或无法确认时，不凭记忆补，`log()` 提示「`<框架>` 的 `<要素>` 未从官方文档确认，请手动核对」，确定能做好的正常产出

## 与其他 references 的关系

| 文件 | 职责 | 与本文件关系 |
|------|------|-------------|
| `frameworks-index.md` | 定位官方文档 + fetch 链 | 上游：提供 5 类产出要素的来源 |
| `scaffolding-principles.md`（本文件） | 产出核对清单 + 跨栈注意点 | 中游：核对上游要素，约束产出质量 |
| `output-formats.md` | testing 规范 + verifier agent 格式 | 下游：Phase 4 产出的格式，不依赖本文件的 config |
| `stack-matrix.md` | 领域→框架推荐（可覆盖） | 上游：决定要补齐哪些框架，本文件不管选型 |
| `detection-signals.md` | 技术栈检测信号 | 上游：决定包管理器和已有框架，本文件据其判断幂等 |

本文件不含任何具体技术栈的 config 代码块 —— 那些由 Agent 凭官方文档在 Phase 3.3 产出，本文件只管「产出前核对什么」。
