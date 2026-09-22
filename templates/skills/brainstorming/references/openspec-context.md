# OpenSpec 上下文

本 reference 只负责定位 change 和读取动态状态。topic-only 始终只读；change-draft 只有在用户显式
创建或同意持久化后，才能维护该 change 的 `brainstorm.md`，不得写其他 artifact 或实现代码。

## 状态快照

仅在用户明确指定 change、热上下文中已有唯一 change，或 `/opsx:*` 入口委托时启用。没有可复用
快照或快照已因写入、外部编辑、会话压缩而失效时，运行：

```bash
bash "<skill-dir>/scripts/openspec-status-snapshot.sh" "<name>"
```

使用返回的 `schemaName`、`changeRoot`、`artifactPaths`、`actionContext` 和 artifact 状态；不得猜测
固定路径。OpenSpec 1.12 状态优先读取 `isPlanningComplete`，只为旧 CLI 兼容读取 `isComplete`。

找到 brainstorm 的具体路径后运行：

```bash
node "<skill-dir>/scripts/planning-state.mjs" "<brainstorm-path>"
```

检查器只读并输出 `MISSING`、`LEGACY`、`DRAFT`、`CONFIRMED` 或 `INVALID`，以及 D/A/O 计数、
下游状态和 `applyReady`。OpenSpec 返回 `done` 只说明文件存在，不能替代这个语义状态。

## 路径与写入边界

- 只读取 `artifactPaths.<id>.existingOutputPaths` 返回的文件；不得把待创建路径当作已存在。
- 用 `changeRoot` 解释相对链接，用 `actionContext` 判断规划与代码边界。
- change-draft 只能写动态 instruction 返回的 brainstorm `resolvedOutputPath`。
- `DRAFT`/`LEGACY`/`INVALID` 时不得生成下游 artifact；交回 Brainstorming 单题循环或迁移流程。
- `CONFIRMED` 仍不自动表示 Apply ready；只有下游 `CURRENT` 且 OpenSpec `applyRequires` 完成时才可 Apply。

## topic-only

没有明确 change 时按 raw topic 调查。只有现有 change 可能冲突或可复用时才运行 `list --json`；
不能唯一选定时呈现候选差异，不擅自选择或创建。
