# E2E Compact Handoff

## 何时加载

仅在 Jira 缺陷流程进入前端 `E2E Repro` 子步骤时加载。独立执行 `e2e-case-designer` 时继续使用其原有
完整输出，不读取本文件。

## 执行边界

先按 `e2e-case-designer` 完成源码、现有 E2E、可测性、风险和测试矩阵分析，再压缩呈现。compact handoff
只减少 Jira Gate 的信息量，不降低分析深度，也不能省略 P0 / P1 blocker。

## 输出合同

默认控制在约 `12 ~ 18` 行，只返回：

1. 一句话说明模块、平台与最高回归风险
2. 最多 `3` 条最高优先级用例：

   | Case | Project / Tag | 场景 | 关键断言 |
   | --- | --- | --- | --- |
   | `<ID>` | `<project> / <tag>` | `<用户结果或关键异常>` | `<可观察结果>` |

3. 仅在存在时列出 blocker 与必须补充的 `data-testid`；P0 / P1 blocker 不能省略
4. 用一句话给出 Playwright handoff，包含 spec 分组、POM 和 fixture / 数据策略

若完整矩阵还有更多用例，补充“其余 N 条不影响当前 Gate，可按需展开”，不要重复完整六部分输出。
若实现已存在且没有先补 failing E2E，必须明确写出“当前无 failing E2E”及原因或 blocker。

完成 handoff 后回到 Jira 编排器，由对应 Gate 决定是否继续；不要在 compact 输出后自行开始实现。
