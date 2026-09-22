## TL;DR

为 harness CLI 增加远程遥测，记录哪些项目在用、调用了什么命令和 skill，用于了解产品使用情况。

## 需求背景

当前 harness CLI 没有任何使用数据收集机制，无法了解：
- 有多少项目在使用 harness
- 哪些命令被频繁调用
- 哪些 skill（如 domain-init）实际被用户触发
- init/update 的成功率

这些数据对产品迭代优先级判断至关重要。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| harness 维护者 | 了解使用量、命令分布、skill 热度，指导迭代 |
| CLI 用户（开发者） | 无感知或可 opt-out，不影响正常使用 |

## 核心功能用例

### UC1: 命令调用上报

- 触发：用户执行 `devkeel init`、`devkeel update` 等命令
- 行为：异步上报事件（项目标识、命令名、是否成功、耗时）
- 约束：不阻塞 CLI 主流程

### UC2: Skill 使用上报

- 触发：用户通过 harness 触发 skill（如 domain-init）
- 行为：记录 skill 名称和调用上下文
- 约束：只记录 skill 名称，不记录 skill 输入内容

### UC3: 项目标识

- 触发：首次 init 时生成匿名项目 ID
- 行为：写入 config.yml，后续上报携带该 ID
- 约束：不收集用户个人信息，仅匿名标识

### UC4: Opt-out 机制

- 触发：用户设置环境变量或 config 字段
- 行为：完全禁用遥测，不发送任何请求

## 需求边界

**In Scope:**
- init / update / doctor / setup / submodule / migrate 命令的调用统计
- skill 调用统计（名称级别）
- 匿名项目 ID 生成与持久化
- 异步非阻塞上报
- opt-out 机制

**Out of Scope:**
- 用户身份信息收集（姓名、邮箱等）
- 命令参数或输入内容
- 遥测数据可视化仪表盘（首版不做）
- 离线缓存与重试机制（首版不做）

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| 纯本地日志 | 无法汇总跨项目数据，放弃 |
| 第三方分析服务（Mixpanel/Amplitude） | 依赖外部服务 + SDK 体积大，不适合轻量 CLI |
| 自建 HTTP 端点 + 最小 payload | 轻量、可控、无额外依赖，**采纳** |

### UC5: 自建遥测服务

- 触发：部署 server/ 目录下的 Node 服务
- 行为：接收 POST /api/telemetry 事件，追加写入 JSONL 文件；同时静态托管 web/ 目录（替代 nginx）
- 约束：最简实现，单文件入口，无数据库依赖

## 待确认项

- [ ] 服务部署环境和端口
- [ ] 是否需要 config.yml 新增 `telemetry.enabled` 字段，还是只用环境变量控制

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue add-telemetry
