# 变更回顾

## 结果与目标

已实现 Templates V2 独立遥测链路：CLI 只向 V2 endpoint 发送版本化事件，服务端以独立路由和
`telemetry-v2.jsonl` 接收及统计，`/stats.html` 展示 V2 change/schema 数据，
`/v1/stats.html` 保留 V1 入口。V2 stats 按项目与 change name 去重，统计当前 schema、
Lite→Full 数量，并固定使用最早事件的 Git 身份作为负责人。

最终 tasks 5/5 完成；OpenSpec strict validation 1/1、CLI 测试 26/26、Web 测试 90/90、CLI
类型检查和 Web 生产构建全部通过。Verify 结论为 PASS，绑定实现指纹
`67cb4f1a495bd20b99d813514532d703796468f4fa7a6e4741fb68af05e6cbae`，Final Review 为
`P0/P1 CLEAR`。

## 计划与实现偏差

功能范围、V1/V2 隔离方式、项目+change 去重、首次事件负责人和双页面路由均按 design/specs
落地。实现过程中根据最终 Review 补强了原计划中的安全边界：promotion 标记改为独占行匹配，
扩展了明确 change 位置参数解析，并对 V2 已定义可选字段执行存在即类型校验。

此外将既有遥测发送改为真正不等待响应的 fire-and-forget，以满足主 spec 的非阻塞契约；该调整
未改变 opt-out、超时和静默失败语义。

首次归档尝试在 spec sync 前安全中止，因为既有 `openspec/specs/cli-telemetry/spec.md` 仍使用
change delta 的 `## ADDED Requirements` 结构。为恢复 main spec 的可同步性，仅新增 Purpose 并
替换为 `## Requirements`，五条既有 requirement 及 scenarios 内容保持不变。

## Review 与 Verify

最终 deep Review 首轮发现的阻断问题包括：正文中的 promotion marker 示例会误判升级、明确的
`validate/show` change 参数漏识别、`track` 等待 fetch、V2 可选字段类型校验不足，以及残缺
Git 仓库身份导致页面项目展示不一致。根因分别是字符串包含判断过宽、参数解析覆盖不足、沿用
旧 await 行为、服务端只校验核心字段，以及展示逻辑未复用完整项目身份规则。

上述问题均补充回归测试并修复，CLI 与 Web 专项定向复审最终确认 `P0/P1 CLEAR`。Verify 的
5 项 required 检查全部通过；部署后真实服务烟雾检查为 optional，本次未执行。

归档失败的反馈信号由单 spec strict validation 最小化复现；第一次短 Purpose 修复触发长度警告，
扩充为完整职责说明后单 spec strict validation 1/1 通过。该必要 spec 增量经 fast Review 确认
未改变需求语义，随后在新指纹上完整重跑 Verify，仍为 PASS 且 `P0/P1 CLEAR`。

剩余非阻断风险：V1 stats 基础样式选择器可补充 `v1-stats`；无 Git remote 的 V2 项目尚未进入
通用活跃项目列表；同时间戳决胜、全部 change 排序表头和 OpenSpec telemetry wiring 还可增加
更细的测试覆盖。

## 后续行动

- 在 `web/src/pages/stats.tsx` 让共享基础样式同时覆盖 `stats` 与 `v1-stats`。
- 在 `web/server.ts` 为 V2 通用项目聚合增加 `projectId` fallback，同时保持 V1 原语义。
- 在邻近测试中补齐同时间戳决胜、全部 change 排序表头和 OpenSpec meta wiring 场景。
- 发布时按“服务端先于 CLI”顺序执行真实 V1/V2 JSONL 与双页面烟雾检查。
