## TL;DR

将测试用例设计能力集成到 superpowers-bridge schema 流程中：design 阶段并行产出测试点，apply 阶段落地完整测试用例，verify 阶段输出测试报告。同时合并 `test-case-designer` 和 `generate-test-cases` 两个 skill 为一个统一 skill。

## 需求背景

当前 superpowers-bridge schema 的 design 阶段只有技术方案设计（technical-design），缺乏测试设计维度。apply 阶段虽然强制 TDD，但 TDD 产出的是代码级自动化测试，缺少业务级测试用例的系统设计。verify 阶段只验证实现一致性，不输出测试覆盖报告。

同时项目中存在两个测试用例设计相关的 skill：
- `test-case-designer`：三阶段门禁、黑盒+白盒联合分析、TP 追溯体系
- `generate-test-cases`：一次性产出、platform 参数、OpenSpec spec 直接映射

两者定位重叠但各有优势，需要合并为统一 skill 并集成到 schema 流程。

## 目标用户与角色

| 角色 | 关注点 |
|------|--------|
| 方案评审人 | 在 human-review 中快速判断测试覆盖是否完整 |
| 开发者 | apply 阶段通过 TDD 引用测试点作为需求输入 |
| QA 工程师 | 独立调用 skill 进行完整测试设计（三阶段门禁） |
| schema 维护者 | 理解测试设计如何嵌入各环节 |

## 核心功能用例

### UC1: design 阶段并行产出测试点

- 触发：brainstorm.md 完成后
- 行为：起 subagent 并行执行 test-case-designer（快速模式），产出 `test-points.md`
- 与 technical-design 并行，不阻塞 design 主流程
- explore.md 的发现后续补充到测试点中

### UC2: human-review 呈现测试覆盖

- 触发：human-review artifact 生成时
- 行为：inject-review 自动注入 `test-points.md` 为标签页；JS 解析渲染覆盖率卡片
- 评审人在同一页面审阅方案和测试点

### UC3: apply 阶段落地完整测试用例

- 触发：tasks.md 中包含"落地测试用例"任务
- 行为：ralph 调度执行，基于 test-points.md + specs 产出 `test-cases.md`
- 不额外开 subagent，作为 tasks.md 的普通任务由 ralph 调度

### UC4: verify 阶段输出测试报告

- 触发：verify artifact 生成时
- 行为：新增 §8 测试报告章节（TP 覆盖率、自动化测试通过率、覆盖缺口）

### UC5: 合并两个 skill 为统一 test-case-designer

- 双模式：`full`（三阶段门禁）/ `fast`（一次性产出）
- platform 参数：`frontend` / `backend` / `all`
- 统一追溯体系：TP 编号 + TC 编号 + `[spec]` 溯源
- 支持 Agent 模式（subagent 调用）和人工模式（交互式门禁）

### UC6: TDD 与测试点的映射

- 测试点中 `自动化候选=是` 的项，在 apply 阶段作为 TDD test case 的需求输入
- verify 阶段报告 TP 到自动化测试的覆盖映射

## 需求边界

**In Scope:**

- schema design artifact 的 instruction 修改（增加 subagent 调用测试设计）
- schema verify artifact 的模板修改（增加 §8 测试报告）
- human-review 模板修改（增加测试覆盖卡片）
- `web/human-review.js` 增加 test-points.md 解析逻辑
- `test-case-designer` skill 重写（合并两者能力）
- `generate-test-cases` skill 废弃（能力合并入 test-case-designer）
- 产出路径：`openspec/changes/<name>/test-points.md` 和 `test-cases.md`
- 归档策略：随 change 归档到 `openspec/archive/<name>/`

**Out of Scope:**

- human-review.css 视觉改动（复用现有卡片样式）
- openspec CLI 代码修改（利用现有 inject-review 机制）
- 测试平台集成（导入 Jira/TestRail 等）
- test-points.md 同步到 specs 目录（归档即可）

## 探索过的替代方向

| 方向 | 取舍 |
|------|------|
| design 阶段走完整三阶段门禁 | 弃 — 会严重阻塞流程，human-review 已吸收评审职责 |
| 将 skill 改写为独立 agent | 弃 — skill 天然共享主会话上下文，agent 需要重复传递材料 |
| apply 阶段额外开 subagent 并行产出测试用例 | 弃 — ralph 本身就是编排器，作为普通任务即可 |
| 测试点输出到 docs/test/ | 弃 — AGENTS.md 规定知识产出到 openspec/，且需随 change 归档 |
| 保留两个独立 skill | 弃 — 定位重叠，维护成本高，用户选择困难 |

## 待确认项

无 — 所有设计决策已在头脑风暴中确认。
