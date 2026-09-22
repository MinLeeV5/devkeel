## Retrospective: refactor-setup-skill

### 变更概要

将 setup skill 从 7 工具全量安装器重构为 3 工具推荐库配置器，新增 Agent 类型自动检测和 oh-my-codex 支持。

### 执行效果

- **范围控制**：严格限于 2 个模板文件，未产生范围蔓延
- **用时**：单会话完成全部 9 个 artifact + 8 个实现任务
- **质量**：97/97 测试通过，所有 spec requirement 已覆盖

### 关键决策回顾

| 决策 | 效果 |
|------|------|
| 单 skill 条件分支（非拆两个） | 正确 — SKILL.md 约 120 行，结构清晰 |
| OMC 推荐 npm 而非 marketplace | 合理 — 更通用的安装路径 |
| openspec 不做 init | 正确 — 职责分离，init 归 harness |

### 改进发现

- OMC/OMX 的官方安装文档需通过 GitHub API 获取（WebFetch 对 github.com 被屏蔽），`gh api` 是可靠的替代方案
- 对于纯模板变更，superpowers-bridge schema 的 9 个 artifact 略显重量级，但结构化过程确保了完整性
