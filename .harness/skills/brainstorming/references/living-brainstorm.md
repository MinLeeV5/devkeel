# Living brainstorm

进入或恢复持久化讨论、维护、确认或迁移时使用；仅查看 change 不授权写入。讨论控制遵循主 skill。
下文 `scripts/` 路径相对于 skill 根目录；已有路径与状态按 [OpenSpec 上下文](openspec-context.md)
获取，可靠快照可复用。

## 决定格式与状态

在 `brainstorm.md` 中保留决定编号、深度与来源，概要与分组只作阅读视图。
决定标题用纯 `#### D-03`，不插 HTML anchor；正文链接如 `[D-03](#d-03)`，跨 artifact
用 `[D-03](brainstorm.md#d-03)`。答案确认后可同轮写入 D/A，并移除已解决 O 或移入变更记录。

在 `Planning 状态` 的可选“讨论深度”“选择来源”中保存深度及来源（用户指定 / 工作流默认 /
上下文默认），不计入 D/A。按深度优先级恢复；迁入或切换 schema 不覆盖已有深度，用户确认切换后
来源记为用户指定。旧记录缺失时按默认规则选择，下次获准维护时补齐，不批量迁移。

语义变化重置为 `DRAFT`，下游设为 `STALE`（尚无下游则 `NONE`）；纯排版、链接修复、深度切换
或记录补齐不改变确认及下游状态。不得仅因新默认深度重开已确认设计或阻止投影。

## topic-only → change-draft

用户按主 skill 的持久化条件同意建立 change 后：

1. 遵循 `openspec-new-change` 创建 Lite（显式/已确认 Full 除外），按动态 `resolvedOutputPath`
   初始化最小 `brainstorm.md`。
2. 原样迁入有效 D/A/O，保留深度、来源与可复用调查，状态为 `DRAFT`；不重问、不改写语义、不补最佳实践。
3. 运行 `scripts/planning-state.mjs` 检查结构，按 change-draft 缺口重评；有 gap 继续单题，否则快照确认。

迁入回执只报数量、来源与下一 gap，不要求用户通读 Markdown。

## 快照确认

没有阻塞 O-*、不存在会改变结构、可观察行为或维护方式的开放决定，且目标、边界、行为、方案与
验证闭环、当前深度检查完成时：

1. 列出全部有效 D/A，每项一句话，说明下游 artifacts 与主要验证方式。
2. 只询问用户是否确认这份完整快照，不夹带设计问题；用户修正则保持 `DRAFT`、写回并继续单题。
3. 用户明确确认后设置下列状态行；下游未生成时保持 `NONE`，交给 Continue/FF。

```text
> **状态：** `CONFIRMED` · **确认项：** 18 D / 3 A / 0 O
```

缺失、重复、计数不一致、存在 O-* 或状态行无效均不能视为 Confirmed。

## 旧 change 的延迟迁移

- 旧百分比 DRAFT：检查器返回 `DRAFT` 与 `needsStageMigration: true`；下次维护按实际缺口改为
  `DRAFT` · `阶段` 格式，不得从旧分数直接映射阶段；保留 D/A/O、下游状态，不批量改写。
- 旧 `brainstorm.md` 没有 Living 状态行：首次 Continue/Update/Apply 从现有 artifacts 提取可追溯
  D/A/O 候选，保留下游文件，展示完整精简快照并等待确认或修正，不默认已确认。
  确认后改写为 Living 格式；下游忠实覆盖快照则 `CURRENT`，否则 `STALE`。
  仅新增、冲突或遗漏语义才重投影，不批量迁移。
