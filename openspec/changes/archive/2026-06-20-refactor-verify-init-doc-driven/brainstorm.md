## 一句话描述

将 verify-init skill 从「17 份固定 stack-recipes 配方」改为「Agent 凭官方文档（WebFetch 必有/context7 可选）+ detection + matrix + scaffolding-principles 清单自主产出测试脚手架」，删除会过期且覆盖不了的写死配置。

## 需求背景

verify-init skill 当前在 `references/stack-recipes/` 下维护 17 份技术栈固定配方（frontend-react、backend-python、cli-node 等），每份含写死的安装命令、config 文件、示例测试、package.json scripts。这套设计有三个结构性问题：

- **覆盖不了真实多样性** — 17 份配方无法覆盖 bun test、deno test、nextest、kotest、Rspack 等实际技术栈。用户项目不在列表内时，skill 无配方可用，等于失效。
- **随版本过期** — 配方里的精确 config 会随上游漂移。vitest `pool` 默认值已变、Playwright `webServer` 语义调整、`@testing-library/user-event` v14 破坏 v13 API。静态配方无法跟进。
- **与已有 fetch 机制冗余** — `frameworks-index.md` 已搭好 context7→WebFetch 拉官方文档的链路。既然能拉到最新文档，写死的 config 基线是冗余兜底，反而成了过时配置的来源。

而 `frameworks-index.md` 的 fetch 增强 + stack-recipes 固定基线的「叠加」模式，让 Agent 倾向于照抄基线、把 fetch 当锦上添花，而非真正以官方文档为主产出。

## 项目现状与架构分析

### verify-init skill 现状

```
templates/skills/verify-init/
  SKILL.md                        入口，Phase 1-5 流程 + Hard Rules
  references/
    detection-signals.md          领域检测 + 技术栈细化 + 框架已存在检测信号表
    stack-matrix.md               领域→技术栈→测试框架映射表（可覆盖推荐）
    frameworks-index.md           框架对照表 + context7/WebFetch fetch 策略
    output-formats.md             testing 规范 + test-verifier agent 格式
    stack-recipes/                ← 删除目标：17 份固定配方
      frontend-react.md  frontend-vue.md  frontend-angular.md  frontend-svelte.md
      backend-node.md  backend-python.md  backend-go.md  backend-java-spring.md
      react-native.md  flutter.md  ios-swift.md  android.md
      cli-node.md  cli-rust.md  cli-go.md
      library-node.md  library-python.md
```

### 当前 Phase 3 链路

```
detection-signals → 识别技术栈
stack-matrix      → 推荐框架（vitest+RTL+Playwright 等）
frameworks-index  → context7 优先 → WebFetch 降级 → 提取增强点
stack-recipes     → 固定基线 config（install/config/example/scripts）
合并 fetch 增强 + 固定基线 → 执行安装/写配置/写示例/补 scripts
```

### 受影响区域

| 区域 | 改动 | 说明 |
|------|------|------|
| `references/stack-recipes/` | **删除整个目录（17 份）** | 写死配置，过期且覆盖不了 |
| `references/frameworks-index.md` | **重写** | 从「每框架 URL 表」改为「官方文档定位方法论」（删表，写定位步骤） |
| `references/scaffolding-principles.md` | **新增** | 跨栈通用 checklist（必含项 + 跨栈注意点），不含任何栈 config |
| `SKILL.md` | **改 Phase 3 / Read First / Hard Rule 4 / 流程总览** | fetch→照 principles 产出；fetch-fail 降级=跳过 config 只产规范 |
| `.harness/skills/verify-init/` | 同步 | 与 templates/ 副本保持一致（devkeel update 同步） |
| `references/detection-signals.md` | 不动 | 事实检测，非配方 |
| `references/stack-matrix.md` | 不动 | 可覆盖推荐，低维护 |
| `references/output-formats.md` | 不动 | Phase 4 产出格式，不依赖 recipes |

### 关键判断

| 模块 | 现状 | 去留依据 |
|------|------|---------|
| `detection-signals.md` | 事实信号表（package.json+react→react） | **留**：这是项目现状事实检测，不是配方，与「不写死」不冲突；Agent 需要它识别技术栈 |
| `stack-matrix.md` | 领域→框架推荐表 | **留**：极轻量、很少过期；作「可覆盖提示」，Agent 仍可凭官方文档推翻，但不必每次从零推导主流选型 |
| `frameworks-index.md` | 每框架 URL + context7 库名 + WebFetch URL 表 | **重写**：URL 表会过期且违背「不写死」；改为「如何定位官方文档」的方法论 |
| `stack-recipes/` | 17 份固定 config | **删**：会过期、覆盖不了、与 fetch 冗余 |
| `output-formats.md` | testing 规范 + agent 格式 | **不动**：Phase 4 产出，不依赖 recipes |

## 风险与约束

| 风险/约束 | 说明 | 缓解 |
|---------|------|------|
| 离线/fetch 全失败 | 删 stack-recipes 后，context7 + WebFetch 都失败时无固定基线兜底 | **降级=跳过 config 只产规范+agent**，log() 提示「config 请手动补」。不凭记忆编造可能过时的 config（比写死基线更诚实） |
| context7 非必有 | context7 是 MCP 插件，环境不一定有 | fetch 链定为 context7 首选非必需 → WebFetch 内置必有为主力 |
| 质量底线 | 纯靠 Agent + 官方文档，可能漏掉跨栈通用约定（CI 先 build、覆盖率门槛、trace、内存 vs 进程） | **新增 scaffolding-principles.md** checklist，Agent 拉完文档照它核对产出 |
| 框架选型一致性 | 删 recipes 后 Agent 选型可能发散 | **保留 stack-matrix** 作可覆盖提示，主流选型有锚点 |
| 向后兼容 | skill 未发布（1.0.0 刚加 versions-yml，无 tag），无下游消费者 | 无破坏性影响，版本保持 1.0.0 |
| 双份同步 | templates/ 与 .harness/ 副本须一致 | task 用 diff -rq 校验 |

**现有测试覆盖**：harness-cli 有 vitest 套件（187 测试），本 change 改的是 skill 模板资产（markdown），不涉及 src/ 运行时代码，现有测试不受影响。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 使用 verify-init 的 AI Coding Agent（主要） | 不在 17 份配方列表内的技术栈也能搭起测试脚手架；产出的 config 对应当前版本而非过期基线 |
| harness-cli 维护者 | 不再维护 17 份会过期的配方；skill 资产精简、维护成本降低 |
| 业务项目工程师（下游） | fetch 失败时是否被强制编造错误 config；离线场景是否有合理降级 |

## 核心功能用例

### 用例 1：非列表内技术栈能搭起脚手架

- **触发**：用户项目用 bun test / deno test / nextest 等 stack-recipes 未覆盖的框架
- **行为**：Agent 凭 detection-signals 识别技术栈，从 manifest 找包名，按 frameworks-index 方法论定位官方文档（WebFetch 主力/context7 可选加速），拉到最新配置文档，照 scaffolding-principles 清单产出 install/config/example/scripts
- **预期**：非列表栈也能得到对应当前版本的可用脚手架，不再因「无配方」失效

### 用例 2：列表内技术栈产出对应当前版本的 config

- **触发**：用户项目是 react/python 等列表内栈
- **行为**：Agent 凭 stack-matrix 得到可覆盖推荐（react→vitest），拉官方文档确认当前版本配置项，照 scaffolding-principles 产出 config
- **预期**：产出的 config 对应当前版本（如 vitest 最新 pool 默认值），而非 stack-recipes 里可能过期的写死值

### 用例 3：fetch 全失败时诚实降级

- **触发**：context7 不可用 + WebFetch 也失败（离线/网络受限）
- **行为**：跳过精确 config 产出，只生成 testing 规范 + 验证 agent，log() 提示「未能获取 <框架> 官方文档，config 请手动补」
- **预期**：不编造可能过时的 config；确定能做好的（规范+agent）正常产出，不确定的（精确 config）交还用户

### 用例 4：质量底线不被 fetch 漏掉

- **触发**：Agent 拉完官方文档准备产出 config
- **行为**：照 scaffolding-principles.md 核对——必含项（install/config/每类一个 example/scripts/幂等守卫）是否齐全；跨栈注意点（CI 先 build、覆盖率门槛、trace、内存 vs 进程）是否考虑
- **预期**：跨栈通用约定不因「靠文档」而遗漏

## 需求边界

**In Scope:**
- 删除 `templates/skills/verify-init/references/stack-recipes/` 全部 17 份
- 重写 `frameworks-index.md`：删每框架 URL 表，写「官方文档定位方法论」（从 manifest 包名 → 官方文档站/GitHub README/context7/WebSearch）
- 新增 `scaffolding-principles.md`：跨栈通用 checklist（必含项 + 跨栈注意点），不含任何栈 config
- 同步改 `SKILL.md`：Phase 3（fetch→照 principles 产出）、Read First（删 recipes 加 principles）、Hard Rule 4（fetch-fail 降级=跳过 config 只产规范）、流程总览
- fetch 链定为：context7 首选非必需 → WebFetch 内置必有主力 → 全失败跳过 config 不编造
- 同步 `.harness/skills/verify-init/` 副本与 templates/ 一致
- 版本保持 1.0.0（未发布）

**Out of Scope:**
- 不改 `detection-signals.md` / `stack-matrix.md` / `output-formats.md`
- 不改 src/ 运行时代码、不改 CLI 命令注册
- 不改 verify-init 的版本号（未发布，1.0.0 定稿前调整）
- 不在 harness-cli 内消费具体框架文档（方法论资产，不绑定具体框架）
- 不保留任何 stack-recipes 样例（17 份全删，principles 纯清单）

## 探索过的替代方向

| 替代方向 | 取舍 |
|---------|------|
| **只删 recipes，frameworks-index 不改** | 否决。frameworks-index 的每框架 URL 表同样会过期且违背「不写死」，留着等于换了个小一号的配方表 |
| **删 recipes 同时删 stack-matrix（Agent 全自主选型）** | 否决。matrix 极轻量且少过期，删了让 Agent 每次从零推导主流选型，增加发散风险。留作可覆盖提示更稳 |
| **保留 1-2 份主流 recipe 作离线兜底** | 否决。留样例破坏「不写死」一致性，且 fetch-fail 已有「跳过 config 只产规范」的诚实降级，不需要离线配方兜底 |
| **fetch-fail 时 Agent 凭训练记忆写 config** | 否决。凭记忆写的 config 可能过时且无法校验，不如诚实跳过交还用户 |
| **跨栈通用约定写进 output-formats 的 testing.md** | 否决。testing.md 是 Phase 4 产出格式（测试怎么组织），脚手架产出 checklist（配置怎么搭）是 Phase 3 的事，职责不同，单独 scaffolding-principles 更清晰 |
| **删 recipes + 重写 frameworks-index + 新增 principles（推荐）** | 采纳。删过期写死配置、保留事实检测与轻量推荐、用方法论替代 URL 表、用清单保质量底线，治本 |

## 待确认项

无。关键决策已在讨论中收敛：删 recipes 全 17 份、留 detection+matrix、重写 frameworks-index 为方法论、新增 scaffolding-principles 纯清单、fetch 链 context7 首选非必需/WebFetch 必有主力/全失败跳过 config、版本保持 1.0.0、合并到当前 feat/verify-init 分支 PR。
