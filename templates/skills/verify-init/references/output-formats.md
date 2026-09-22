# 产出格式规范

Phase 4 生成的 testing 规范和验证 agent 按本格式输出。

## testing 规范格式

写到目标项目 `.harness/rules/testing.md`。

### YAML 头

```yaml
---
description: 测试基建规范，约定测试组织、命名、执行与覆盖率门槛。当编写或运行测试时触发。
globs:
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/tests/**"
  - "**/e2e/**"
  - "**/conftest.py"
  - "**/*_test.go"
  - "**/src/test/**"
---
```

globs 按检测到的技术栈调整：默认含通用测试文件模式，Python 项目追加 `**/conftest.py`、Go 追加 `**/*_test.go`、Java 追加 `**/src/test/**`。

### 正文章节

9 个章节，每条带「约定 + 依据」结构，不写 ✅/❌ 代码示例（具体框架 config 代码示例由 Agent 凭官方文档在 Phase 3.3 产出）：

#### 1. 测试金字塔比例

约定：单元:集成:e2e ≈ 7:2:1。e2e 只覆盖关键用户路径，不追求覆盖完整 UI。
依据：e2e 慢且脆，金字塔底层（单测）保证覆盖率与速度。

#### 2. 目录组织

约定：按已选框架默认约定组织（Node `tests/unit/`+`tests/integration/`+`e2e/`；Python `tests/`+`conftest.py`；Go `*_test.go` 与源同目录；Java `src/test/java/`）。测试文件与被测模块镜像或就近，不强行统一跨语言结构。
依据：遵循框架默认 glob，避免引入自定义匹配规则增加心智负担。

#### 3. 文件命名

约定：按框架默认命名（Node `<name>.test.ts`/`<name>.spec.ts`；Python `test_<name>.py`；Go `<name>_test.go`；Java `<Name>Test.java`）。
依据：默认命名与框架 test runner glob 对齐，零配置可发现。

#### 4. 断言风格

约定：单一断言库优先（vitest 内置 expect / pytest assert / testify assert / JUnit Assertions）。每个测试一个明确断言目标。禁止「无异常即通过」的空测试。
依据：单一断言库降低依赖；明确断言目标保证测试意图清晰。

#### 5. mock 边界

约定：只 mock 跨进程边界（HTTP/DB/外部服务），不 mock 被测模块内部函数。mock 在测试内就近 setup、就近清理。
依据：mock 内部函数会绕过真实集成，掩盖耦合问题。项目特定的 mock 策略由 R4 测试策略 rule 补充。

#### 6. 覆盖率门槛

约定：新增/变更文件覆盖率不低于 80%（门禁值，项目可在 R4 调整）。CI 跑 `test:coverage`，e2e 不计入覆盖率统计。
依据：80% 覆盖率平衡质量与成本；e2e 脆且慢，计入覆盖率会扭曲指标。

#### 7. 测试执行约定

约定：`pnpm test` 跑单测；`test:e2e` 单独跑（慢，不阻塞日常开发）；`test:ci` 在 CI 跑全量；单测默认 watch-off、随机执行顺序（detect flakes）。
依据：分层执行让日常开发只跑快的单测；随机顺序暴露隐式顺序依赖。

#### 8. 测试独立性

约定：无执行顺序依赖、无共享可变状态、每个测试自建自清理 fixture。
依据：顺序依赖是 flaky 测试主因；自建自清理保证可单独重跑。

#### 9. 失败可诊断

约定：失败信息含上下文（输入/期望/实际）。e2e 失败留存截图和 trace（Playwright trace viewer）/ 录屏。
依据：失败诊断成本占测试维护大头；trace 让 e2e 失败可复盘。

### 生成策略

- **半固定模板** — 主体不变，按检测技术栈微调 globs 和第 2/3 条命名
- **幂等** — `.harness/rules/testing.md` 已存在则提示合并而非覆盖
- **与 R4 互补** — 本规范管「测试该怎么组织」（通用结构），R4 管「这个项目实际怎么 mock」（项目特定）

## test-verifier agent 格式

写到目标项目 `.harness/agents/test-verifier.md`。

### YAML 头

```yaml
---
name: test-verifier
description: 验证刚完成的代码变更。接收变更+验证目标，运行对应测试（单测/e2e/API），解析结果，blocker-first 回报通过/失败。当需要自主验证代码输出时被调度。
model: sonnet
---
```

### 正文结构

#### 角色定义

你是验证执行者。不写测试用例（那是 test-case-designer 的事）、不改被测代码逻辑（那是 executor 的事）。只做：把「待验证声明」映射到可执行测试 → 跑 → 判定 → 回报。

#### 强制启动步骤（按序执行）

1. **确认验证目标** — 读 `AGENTS.md` 路由表 + `.harness/rules/testing.md`，明确本项目测试基建（哪些命令、什么门槛）
2. **识别变更范围** — `git diff` / `git status` 取刚完成改动，列出涉及模块/文件
3. **映射测试类型** — 按变更性质选：纯逻辑/工具函数→单测；API/接口契约→API测试；页面/交互/路由→e2e；跨层影响→多类型组合
4. **判断是否补回归测试** — 变更触及现有测试未覆盖路径时，先补一个最小回归测试（针对变更点的失败复现），再跑
5. **执行测试** — 按映射类型跑对应 script（`pnpm test:unit`/`test:e2e`/`test:api`），scope 收窄到受影响文件（vitest `<path>`、pytest `<file>`、go test `./pkg/...`），不全量跑
6. **解析结果** — 提取 pass/fail/skip 数、失败用例名、错误堆栈首行
7. **回报** — blocker-first

#### 执行维度（判定时检查）

- 现有测试是否全绿（基线回归）
- 新增/变更代码是否有对应测试覆盖（覆盖率门禁）
- 失败是「真实回归」还是「测试本身过时/环境问题」——区分并标注
- e2e 失败是否环境抖动（必要时重试 1 次，仍失败才报）

#### 输出规则

- **blocker-first** — 先报阻断项（红色），再报警告，最后报通过项
- **证据先行** — 每条结论附执行命令 + 结果摘要（不贴全量堆栈，只贴首行 + 失败用例）
- **条数限制** — 阻断项 ≤ 5 条详细，超出折叠为「另 N 条同因」
- **语言** — 中文结论，命令和代码标识保留原文
- **下一步** — 结尾给明确「修复方向」或「确认通过」判定，不留模糊

#### 何时不被调用

- 没有变更可验证（纯文档任务）
- 用户明确要人工验证
- 测试基建未搭建（提示先跑 verify-init）

#### 与 test-case-designer 衔接

test-case-designer 产出用例文档（TC 编号 + 步骤 + 预期），test-verifier 不直接消费该文档翻译成代码。当用户要求「验证 TC-xxx」时，test-verifier 把该 TC 的预期结果当作验证目标断言，检查现有测试是否覆盖——覆盖则跑、未覆盖则提示「该 TC 缺可执行落点，需先实现测试」。

## 质量标准

| 标准 | 要求 |
|------|------|
| testing 规范 | 9 章节齐全，每条带依据；globs 按技术栈调整 |
| test-verifier agent | YAML 头含 name/description/model；正文含角色+启动步骤+维度+输出规则 |
| 幂等 | 已存在文件提示合并不覆盖 |
| 与 R4 互补 | 不重复 R4 的项目特定软规范内容 |
| 格式 | 遵循 harness 标准 rules/agents 格式 |
