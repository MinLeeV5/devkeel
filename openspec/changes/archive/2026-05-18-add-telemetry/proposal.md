## Why

当前 harness CLI 没有任何使用数据收集能力，无法得知有多少项目在使用、哪些命令和 skill 被频繁调用。这些数据对产品迭代的优先级判断至关重要。现在做是因为 CLI 功能趋于稳定，需要数据驱动下一阶段方向。预期收益：获得真实使用分布，指导 skill 开发投入。

## What Changes

**CLI 遥测能力**
- From: 无任何使用数据收集
- To: 命令执行和 skill 调用时异步上报匿名事件到远程端点
- Reason: 获取产品使用数据
- Impact: 非破坏性，用户无感知，可 opt-out

**config.yml schema**
- From: 无 telemetry 相关字段
- To: 新增可选 `telemetry.id` 字段存储匿名项目 ID
- Reason: 跨会话关联同一项目的事件
- Impact: 非破坏性，字段可选，旧 config 正常工作

## Capabilities

### 新增能力

- `cli-telemetry`: 匿名遥测上报（命令调用、skill 使用、项目 ID、opt-out）

### 修改能力

（无已有 spec 需求变更）

## Impact

- `src/lib/telemetry.ts` — 新增模块
- `src/lib/config.ts` — HarnessConfig 接口扩展 telemetry 字段
- `src/commands/*.ts` — 各命令末尾添加 track 调用
- `config-yml.yml` 模板 — 无需改动（telemetry.id 运行时生成）
- 零新 runtime 依赖

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue add-telemetry
