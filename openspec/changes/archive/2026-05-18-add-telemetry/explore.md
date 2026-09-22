## 调查范围

基于 brainstorm.md，聚焦以下区域：
1. 命令入口层（src/commands/）— 遥测埋点位置
2. 配置层（src/lib/config.ts）— 存储项目 ID 和 telemetry 开关
3. src/index.ts — 统一的命令注册点，可作为全局 hook

## 现有架构

```
src/index.ts          Commander 注册，action 单行委托到 runXxx
src/commands/*.ts     每个命令独立文件，用 @clack/prompts 做 UI
src/lib/config.ts     readConfig/writeConfig/HarnessConfig 接口
src/lib/templates.ts  模板操作
src/lib/detect.ts     环境检测
```

关键约束：
- lib 层不可引入 @clack/prompts（架构规则）
- 函数返回 null 表示失败，不 throw
- ESM-only，node20 target
- runtime 依赖极简（commander, @clack/prompts, yaml）

## 关键代码路径

**命令执行流**：
1. `src/index.ts` 注册 `.action((opts) => runXxx(opts))`
2. 各 `runXxx` 函数执行业务逻辑
3. 通过 `p.outro()` 结束

**配置读写流**：
- `readConfig(projectRoot)` → 返回 `HarnessConfig | null`
- `writeConfig(projectRoot, config)` → void
- config.yml 模板当前字段：version, project.name, project.types, targets

**无现有 hook/middleware 机制** — Commander 的 action 直接调用命令函数，无拦截层。

## 测试覆盖

- `tests/config.test.ts` — 覆盖 readConfig/writeConfig round-trip
- `tests/templates.test.ts` — 模板复制
- `tests/detect.test.ts` — 环境检测
- 无 integration test 覆盖命令执行完整流程

遥测模块需新增独立测试文件 `tests/telemetry.test.ts`。

## 风险与约束

| 风险 | 缓解 |
|------|------|
| 网络请求阻塞 CLI | 必须 fire-and-forget，不 await |
| 新增 runtime 依赖 | 用 Node.js 内置 `fetch`（node20+ 原生支持），零新依赖 |
| config.yml schema 变更 | 新增可选字段 `telemetry`，向后兼容 |
| 隐私顾虑 | 仅匿名 ID + 命令名，opt-out 明确 |
| 测试中触发网络请求 | telemetry 模块需支持 disable/mock endpoint |

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue add-telemetry
