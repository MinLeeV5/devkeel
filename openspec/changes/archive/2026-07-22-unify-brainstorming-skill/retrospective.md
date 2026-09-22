# 变更回顾

## 结果与目标

目标已达成：模板与 dogfood 只分发 `brainstorming@7.0.0`，`/opsx:explore` 复用其严格只读的
OpenSpec 模式，旧 `grilling` 与 `openspec-explore` 由可恢复事务迁移并退休。写入授权门禁按独立
目标生效，既接受明确动作，也接受对最近且写明具体持久化动作与范围的实施方案或授权询问作出的
语义认可，不维护固定认可词表。

最终聚焦回归 228/228、根项目 347/347、Web 147/147 通过，CLI 与 Web 构建通过；按用户要求未运行
`run-scenario.sh`。

## 计划与实现偏差

- 授权门禁最初被压缩为两句话，后根据反馈改为“总结原则 + 无标签场景条件句”，保留同等语义
  覆盖并降低阅读负担。
- 最初只有明确授权询问后的肯定答复可继承授权，最终放宽为对具体实施方案或授权询问的语义认可；
  同时保留脱离上下文、动作/范围不清和非具体方向确认不授权的边界。
- 安装指南最初新增完整运行时契约与迁移说明，最终只保留 `grilling` → `brainstorming` 的必要名称
  纠正；运行时契约与迁移说明由 README 和现行架构/工作流页面承载。

## Review 与 Verify

- 迁移实现审查确认同级 staging、路径安全、版本合并和提交前恢复满足设计；CLI 专审最终 APPROVE。
- 授权契约专审发现 task 6 仍使用旧“肯定短答”措辞，根因是追加语义调整后 artifact 未完全同步；
  已改为“基于上下文语义的认可”并定向复审，最终 P0/P1 CLEAR。
- 最终 Verify 为 PASS，5/5 required checks 通过；实现指纹为
  `ceb1d1be8dc5d2d06b9870c71c82cac4e33763f6a051168c4f34e227052b9409`。

## 后续行动

- 在 `tests/update.test.ts` 补充 `versions-committed` 后日志/备份尚未清理时的直接崩溃恢复用例。
- 在 `web/tests/workflow-docs.test.ts` 增加 install 只保留受管 skill 名称纠正的独立边界断言。
- 在 `tests/templates.test.ts` 增加 brainstorming 对完整上下文授权语义的镜像断言。
