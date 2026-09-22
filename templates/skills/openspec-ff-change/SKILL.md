---
name: openspec-ff-change
description: 用户显式选择时，快速推进访谈并投影全部 Apply 前置 artifacts；绝不代替用户确认设计。
license: MIT
metadata:
  author: openspec
  version: "2.0"
  upstreamVersion: "1.12.0"
  generatedBy: "1.12.0"
---

Fast-forward 是高级节奏入口，不是跳过设计确认。只有用户显式调用 `/opsx:ff` 才使用。

## 1. 建立或选择 change

已有 change 时使用它；否则加载并执行 `openspec-new-change`。默认 Lite，显式/已确认 Full 优先。
New 在首题前的停止点是本 skill 的内部交接点。

## 2. 先完成 Living brainstorm

运行共享 planning-state 检查器：

- DRAFT：加载 Brainstorming，以单题循环尽快补齐；可以连续处理不需要用户回答的仓库事实和已授权
  A-*，但一遇到用户决定就提出唯一问题并停止本次调用；
- LEGACY/INVALID/MISSING：按 Continue 的迁移或修复流程处理；
- CONFIRMED：才开始投影。

调用 FF 本身不等于确认 D/A 快照。不得自动把 95% 改成 100%，不得为填模板把推测写成决定。

## 3. 计算并投影所需闭包

运行 `status --json`，使用 `applyRequires` 和每个 artifact 的 `requires` 计算传递依赖闭包；不按
文件名硬编码顺序。循环选择闭包中第一个 ready artifact，获取其 JSON instruction。OpenSpec
1.12 的 schema `instruction` 是权威语义；每轮都从磁盘重读 `dependencies`，处理 `skipped`。

只做封闭投影，沿用 Continue 的来源、缺口和写入规则。发现新设计选择时立即把 brainstorm 重置
DRAFT、下游设为 STALE，回到单题访谈并停止；不得继续生成剩余 artifacts。

每次写入后刷新 status。全部 `applyRequires` done 且来源覆盖无误时，把下游状态更新为 CURRENT，
再运行 planning-state 检查器确认 `applyReady: true`。

## 4. 输出

逐项只显示 `✓ artifact ← D/A/仓库事实`，最后报告 schema、进度和 `/opsx:apply <name>`。不得生成
verify/retrospective，不得复制 context/rules 包装块，也不得覆盖 selector 冲突。
