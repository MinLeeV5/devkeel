# 集成测试框架实现计划

> **给 agentic 执行器：** 使用 subagent-driven-development 逐任务实现本计划。

**目标：** 为 opsx 工作流建立可手动执行的 shell 集成测试框架

**架构：** `tests/integration/` 下纯 shell 脚本，`lib/` 提供可复用原语（fixture 初始化、轮次执行、事件提取、断言），`scenarios/` 下每个场景独立编排

**技术栈：** Bash + jq + claude CLI (stream-json)

---

## 1. 基础设施（lib/）

- [x] **1.1 创建 lib/setup-fixture.sh**
  1. 创建 `tests/integration/lib/setup-fixture.sh`
  2. 实现：mktemp 创建临时目录 → 写入最小 React TODO 项目（package.json + src/App.tsx + index.html）→ 执行 `node bin/devkeel.js init --yes --name todo-app --types frontend --targets claude-code` → echo 目录路径
  3. 提供 `cleanup_fixture` 函数（rm -rf 临时目录）
  4. 验证：手动执行确认 fixture 目录包含 `.harness/config.yml`
  > commit: test(integration): 新增 fixture 初始化脚本

- [x] **1.2 创建 lib/run-turn.sh**
  1. 创建 `tests/integration/lib/run-turn.sh`
  2. 实现 `run_turn "<prompt>" <output-file> [max-turns] [--continue]` 函数
  3. 封装 `claude -p --verbose --output-format stream-json --dangerously-skip-permissions --max-turns N`
  4. timeout 300s 防止 hang
  5. 验证：在 fixture 目录中执行简单 prompt 确认输出 stream-json
  > commit: test(integration): 新增 run-turn 执行封装

- [x] **1.3 创建 lib/extract.sh**
  1. 创建 `tests/integration/lib/extract.sh`
  2. 实现 `extract_tool_calls <json-file>` — 提取所有 tool_use 事件为 `ToolName:<input-json>` 格式
  3. 实现 `extract_bash_commands <json-file>` — 提取 Bash tool 的 command 参数
  4. 实现 `extract_skill_calls <json-file>` — 提取 Skill tool 的 skill 参数
  5. 验证：用已有的 stream-json 样本测试 jq 表达式
  > commit: test(integration): 新增事件提取工具

- [x] **1.4 创建 lib/assert.sh**
  1. 创建 `tests/integration/lib/assert.sh`
  2. 实现断言函数：`assert_bash_called`、`assert_skill_triggered`、`assert_tool_called`、`assert_not_called`、`assert_sequence`、`assert_file_exists`
  3. 每个函数：成功输出 ✅，失败输出 ❌ + 递增 `$FAILURES`
  4. 验证：构造 mock json 测试各断言函数
  > commit: test(integration): 新增断言函数库

## 2. 场景脚本

- [x] **2.1 创建 scenarios/opsx-new/scenario.sh**
  1. 创建 `tests/integration/scenarios/opsx-new/scenario.sh`
  2. Turn 1 prompt: `/opsx:new "add-user-auth"`，max-turns 8
  3. 断言：skill triggered、bash commands 按序、no Write/Edit、change 目录存在、无 artifact 文件
  4. 验证：手动执行确认 pass
  > commit: test(integration): 新增 opsx:new 场景

- [x] **2.2 创建 scenarios/opsx-propose/scenario.sh**
  1. 创建 `tests/integration/scenarios/opsx-propose/scenario.sh`
  2. Turn 1 prompt: `/opsx:propose "add-verbose-flag"`，max-turns 15
  3. 断言：skill triggered、openspec new change called、openspec status called ≥2 次、Write called、tasks 文件存在
  4. 验证：手动执行确认 pass
  > commit: test(integration): 新增 opsx:propose 场景

- [x] **2.3 创建 scenarios/opsx-full-cycle/scenario.sh**
  1. 创建 `tests/integration/scenarios/opsx-full-cycle/scenario.sh`
  2. Turn 1: `/opsx:new "add-dark-mode"`
  3. Turn 2: `/opsx:continue` (--continue)
  4. Turn 3+: 重复 `/opsx:continue` 直到 tasks 就绪
  5. 最终轮: `/opsx:apply` — 断言执行器调用（`omc ralph`）
  6. 验证：手动执行确认多轮链路
  > commit: test(integration): 新增 full-cycle 多轮场景

## 3. 入口脚本

- [x] **3.1 创建 run-scenario.sh**
  1. 创建 `tests/integration/run-scenario.sh`
  2. 接收参数：场景目录名
  3. 流程：setup fixture → cd fixture → source scenario.sh → cleanup → 报告
  4. 退出码：FAILURES > 0 → exit 1
  > commit: test(integration): 新增单场景入口脚本

- [x] **3.2 创建 run-all.sh**
  1. 创建 `tests/integration/run-all.sh`
  2. 遍历 `scenarios/*/scenario.sh` 执行
  3. 支持 `--smoke` 只跑 opsx-new
  4. 汇总报告：passed/failed 数量 + 列表
  > commit: test(integration): 新增批量执行入口
