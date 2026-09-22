---
name: openspec-verify-change
description: 从完整性、正确性和一致性验证实现是否符合 change artifacts，并生成适用报告。
license: MIT
metadata:
  author: openspec
  version: "3.2"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

验证实现与 specs、tasks、design 等 change artifacts 是否一致。本 skill 保留 OpenSpec 1.12.0
官方 Verify 的三维验证框架；Full 增加 schema report、实现指纹和 Review provenance。

## 1. 选择、状态与上下文

显式名称优先；其次使用对话中无歧义的 change。无法唯一确定时运行 `list --json`，展示存在
tasks 的 changes、schema 和进行中状态，让用户选择；不得猜测。

```bash
npx devkeel@latest openspec status --change "<name>" --json
```

解析 `schemaName`、`planningHome`、`changeRoot`、`artifactPaths`、`actionContext` 和现有
artifacts。以返回的当前仓库路径和上下文判断实现归属；不得把 `linkedContext` 当作当前 change
的实现或编辑目标。

```bash
npx devkeel@latest openspec instructions apply \
  --change "<name>" --json
```

读取返回的 `contextFiles` 中所有可用具体路径；artifact 集合由 schema 决定。

运行共享 planning-state 检查器。DevKeel change 只有 brainstorm 为有效 CONFIRMED 且下游为
CURRENT 才能 Verify；LEGACY 先迁移，DRAFT/INVALID/STALE 回到 Brainstorming/Continue。该门禁
不能由 OpenSpec 文件状态替代。

### DevKeel schema 路由

- `lite`：仅在用户显式要求或 tasks 列有验证时执行，在对话中报告；不创建 `verify.md`，
  不改变 Lite 归档条件。
- `full`：要求全部实现 checkbox 为 `[x]`；否则列出未完成 task 并停止。随后加载：

  ```bash
  npx devkeel@latest openspec instructions verify \
    --change "<name>" --json
  ```

  schema instruction/template 决定最终检查计划、结论和输出路径。
- 其他 schema：执行其 artifact 图；若无专属 verify artifact，使用下面的官方三维报告并只在
  对话中输出。

## 2. 官方三维验证框架

### 完整性 Completeness

- 读取 `contextFiles.tasks` 的全部路径，统计 `[x]` 与 `[ ]`；未完成 task 为 CRITICAL。
- 从 delta specs 提取全部 `### Requirement:`；调查每项是否有实现证据。明显缺失为 CRITICAL。

### 正确性 Correctness

- 为每个 requirement 建立实现映射，记录具体文件和行号，判断行为是否符合意图；偏离为
  WARNING，明确缺失才是 CRITICAL。
- 为每个 `#### Scenario:` 检查条件处理和测试覆盖；缺口通常为 WARNING，并给出具体建议。

### 一致性 Coherence

- 有 design 时提取关键决策、方案和架构，检查实现是否遵循；矛盾为 WARNING。
- 检查新增代码与项目命名、目录、风格和既有模式；非关键偏差为 SUGGESTION，不挑剔
  细枝末节。

每个问题必须有可执行建议和适用的 `file:line`。不确定时降低严重度：优先 SUGGESTION，其次
WARNING，证据充分才用 CRITICAL。缺少 design/spec 时优雅降级，并明确哪些检查未执行及原因。

## 3. Full 实现指纹

Full 检查前运行唯一指纹实现：

```bash
node "<skill-dir>/scripts/implementation-fingerprint.mjs" \
  --change-dir "<changeRoot>"
```

记录算法版本、branch、HEAD、tracked diff、dirty paths、untracked 内容摘要和 `fingerprint`；脚本
只排除当前 change 的 `verify.md` 与 `retrospective.md`。不得以时间戳、单独 HEAD 或自定义哈希
替代。

`Final Review` 必须绑定同一指纹：Apply 已对该状态完成最终审查时写 `P0/P1 CLEAR`；独立 Verify
未审查代码时写 `NOT_RUN`。该字段是 Archive 门禁，不改变 PASS/FAIL/BLOCKED 测试结论。

## 4. 执行、复算与写入

按 schema instruction 执行最终计划，同时用三维框架检查遗漏。旧 Full tasks 没有 Final
Verification 时，从明确的旧测试命令恢复并去重；没有可恢复 required 检查时询问，
不得臆造。

从 Apply 调用时，同范围实现缺陷可以回到对应 task 做聚焦修复、邻近验证和 P0/P1 定向复审，
然后重跑完整计划。独立 Verify 只报告，不静默修复。需要改变 design/spec/scope、遇到外部
阻塞或重复失败时停止。

检查后再次运行指纹脚本。若指纹变化，保留观察到的测试结果，但把 `Final Review` 写为
`NOT_RUN`，不得把旧 review provenance 绑定到新状态。

Full 按返回的 template/`resolvedOutputPath` 写入 `verify.md`，刷新 status。报告摘要应覆盖三维
状态、CRITICAL/WARNING/SUGGESTION、未验证范围、最终结论和下一步。不得生成 retrospective、
archive、commit、push、PR 或清理动作。
