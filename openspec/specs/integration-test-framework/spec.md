# integration-test-framework Specification

## Purpose
TBD - created by archiving change integration-test-opsx-workflow. Update Purpose after archive.
## Requirements
### Requirement: fixture 项目初始化
测试框架 SHALL 提供 `setup-fixture.sh` 脚本，在临时目录创建一个最小 React TODO 项目并执行 `devkeel init --yes`，返回 fixture 目录路径。

#### Scenario: 正常初始化
- **WHEN** 执行 `setup-fixture.sh`
- **THEN** 返回一个存在 `.harness/config.yml` 和 `package.json` 的临时目录路径

#### Scenario: 清理
- **WHEN** 场景执行完毕后调用 cleanup
- **THEN** 临时目录被删除

---

### Requirement: 单轮执行封装
测试框架 SHALL 提供 `run-turn.sh`，封装 `claude -p --verbose --output-format stream-json --dangerously-skip-permissions` 调用，支持 `--continue` 参数和 `--max-turns` 控制。

#### Scenario: 首轮执行
- **WHEN** 调用 `run-turn.sh "<prompt>" <output-file> <max-turns>`
- **THEN** 将 stream-json 输出写入指定文件

#### Scenario: 续轮执行
- **WHEN** 调用 `run-turn.sh "<prompt>" <output-file> <max-turns> --continue`
- **THEN** 带 `--continue` flag 执行，续接上一轮会话上下文

---

### Requirement: 事件提取
测试框架 SHALL 提供 `extract.sh`，从 stream-json 文件中提取工具调用事件（tool name + input）。

#### Scenario: 提取 Bash 命令
- **WHEN** 对包含 Bash tool_use 的 stream-json 调用 `extract_bash_commands`
- **THEN** 输出所有 Bash tool 的 command 参数，每行一条

#### Scenario: 提取全部工具调用
- **WHEN** 调用 `extract_tool_calls`
- **THEN** 输出格式为 `ToolName:<input-json>` 的行

---

### Requirement: 断言原语
测试框架 MUST 提供以下断言函数，失败时输出 ❌ 并递增 FAILURES 计数器：

- `assert_bash_called <pattern> <json-file>` — Bash command 含 pattern
- `assert_skill_triggered <skill-name> <json-file>` — Skill tool 调用了指定 skill
- `assert_tool_called <tool-name> <json-file>` — 任意 tool 被调用
- `assert_not_called <tool-name> <json-file>` — 指定 tool 未被调用
- `assert_sequence <json-file> <event1> <event2> ...` — 事件按顺序出现
- `assert_file_exists <path>` — 文件存在

#### Scenario: 断言成功
- **WHEN** 条件满足时调用断言函数
- **THEN** 输出 ✅ 并不递增 FAILURES

#### Scenario: 断言失败
- **WHEN** 条件不满足时调用断言函数
- **THEN** 输出 ❌ 并递增 FAILURES

---

### Requirement: 场景编排
测试框架 SHALL 提供 `run-scenario.sh <scenario-dir>`，按顺序执行：setup fixture → 依次运行 scenario.sh 中定义的 turns → 运行 assertions → cleanup → 报告 pass/fail。

#### Scenario: 场景通过
- **WHEN** 所有断言成功
- **THEN** 输出 PASS，退出码 0

#### Scenario: 场景失败
- **WHEN** 任一断言失败
- **THEN** 输出 FAIL + 失败明细，退出码 1

---

### Requirement: 批量执行
测试框架 SHALL 提供 `run-all.sh`，批量执行所有 `scenarios/*/scenario.sh`，汇总 pass/fail 统计。支持 `--smoke` 参数只跑 opsx-new 场景。

#### Scenario: 全量执行
- **WHEN** 不带参数执行 `run-all.sh`
- **THEN** 执行所有场景并输出汇总

#### Scenario: smoke 模式
- **WHEN** 执行 `run-all.sh --smoke`
- **THEN** 仅执行 opsx-new 场景

