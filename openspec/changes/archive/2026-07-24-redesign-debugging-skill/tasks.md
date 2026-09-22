# 实施任务

- [x] **1. 系统化 Debug skill 以证据闭环为默认路径**
  - **结果：** `automated-instrumented-debugging` 保留现有标识但能覆盖普通 Bug、测试/构建失败、异常行为和性能回归；主流程先建立可判定反馈信号、最小化复现、追踪根因并逐一验证可证伪假设，只有满足观测缺口、探针预测和写入授权门禁时才进入插桩；诊断请求与修复授权、性能分支、三次失败后的架构停点和完成证据均有明确约束。
  - **范围：** `templates/skills/automated-instrumented-debugging/SKILL.md`、按需加载的诊断/插桩 references、`templates/agents-md.md`、dogfood `AGENTS.md` 与 `.harness/skills/` 副本、内置 skill 版本清单和相关模板/路由/配置测试。
  - **验证：** `npx vitest run tests/templates.test.ts tests/workflow-routing.test.ts tests/config.test.ts`；检查普通 Debug 路由已命中该 skill、简单路径不要求启动 collector，且模板与 dogfood 路由一致。

- [x] **2. 临时 collector 提供统一且有界的 HTTP 证据通道**
  - **结果：** collector 通过同一 HTTP 日志入口接收 JSON 和 `text/plain` 事件，补齐 session、顺序、时间和 runtime 元数据并支持按 session 查询；默认监听 loopback，endpoint/host/port 可配置，事件与请求体有界、空闲自动退出，且不引入 TLS、认证、持久化或复杂脱敏。
  - **范围：** `templates/skills/automated-instrumented-debugging/scripts/debug-server.js`、`bootstrap.js`、dogfood 脚本副本及 collector 自动化测试。
  - **验证：** `npx vitest run tests/automated-instrumented-debugging.test.ts -t "collector"`；测试分别提交 JSON 与纯文本事件、验证 session 隔离/顺序/查询、容量边界、可配置监听和自动关闭。

- [x] **3. Browser、Node.js、Electron 与 Java 8+ 可通过 HTTP emitter 采集证据**
  - **结果：** 提供可按运行时加载或复制的轻量 helper，业务探针保持单行 `HDBG:<session>` 调用；Browser 与 Electron renderer/preload 优先 `fetch`，Node.js 与 Electron main 使用 `node:http`，Electron 仅在 direct HTTP 被 CSP/sandbox/mixed-content 阻止时采用窄 IPC 转发到 main 后再走 HTTP；Java helper 只使用 Java 8 语法和 `HttpURLConnection`，无 JSON 依赖也能发送纯文本，发送失败不改变业务控制流。
  - **范围：** JavaScript/Electron/Java 运行时 references、可复用 emitter assets、collector 联调 fixtures 和运行时兼容测试。
  - **验证：** `npx vitest run tests/automated-instrumented-debugging.test.ts -t "emitters"`；Node/Web/Electron 模式向真实临时 collector 发送样例事件；Java helper 使用 `javac --release 8`（JDK 8 环境使用 `-source 8 -target 8`）编译并运行一次端到端上报，现代 LTS JDK 再运行同一 fixture。

- [x] **4. 调试会话可以跨语言精确清理且不会误删用户代码**
  - **结果：** 插桩使用短 `/*HDBG:<session>*/` 单行标识和 helper BEGIN/END 标识，并记录临时 session manifest；cleanup 必须指定 session，优先按 manifest 清理触及文件，manifest 缺失时只按同 session 标识兜底，支持残留检查，并在成功、失败或中断路径关闭 collector、移除 helper/manifest；其他 session 和普通 DEBUG 区块保持不变。
  - **范围：** `templates/skills/automated-instrumented-debugging/scripts/cleanup.js`、生命周期说明、dogfood 副本以及 JS/TS/Java 混合 fixture 测试。
  - **验证：** `npx vitest run tests/automated-instrumented-debugging.test.ts -t "cleanup"`；覆盖正常清理、manifest 丢失、中断恢复、并存 session、用户自有 `#region DEBUG`、helper 文件删除和零残留检查。

- [x] **5. 内置模板交付保持同步并通过仓库回归验证**
  - **结果：** 模板源、dogfood skill、AGENTS 路由、版本清单和安装/更新后的产物包含相同的 Debug 能力，旧 skill 标识仍可原地升级；外部参考方法已用 Harness 自有语言重写，不包含大段原文或额外许可声明，且没有引入范围外的生产可观测能力。
  - **范围：** `templates/`、`.harness/`、`AGENTS.md`、版本与安装/更新测试，以及本 change 涉及的全部实现。
  - **验证：** `npm run lint && npm test && npm run build`；额外比较模板与 dogfood 的受管 skill/路由/版本内容，并确认仓库中除 fixture 外不存在未清理的 `HDBG:` 标识。
  - **实施证据：** lint、build、专项 106 项和 Java 8/现代 JVM 联调通过；全量回归 374/375
    通过，唯一失败是 HEAD 既有的 `release:templates` 脚本与测试断言不一致，用户明确选择不在本
    change 修改或执行发布；三路定向复审均为 APPROVE。
