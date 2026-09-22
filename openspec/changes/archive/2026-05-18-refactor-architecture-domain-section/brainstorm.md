## TL;DR

重构 `web/architecture.html` 的「领域包」章节，将焦点从静态的"前端包/后端包"示例列表转向 `domain-init` 的动态生成能力，突出"扫描 → 识别 → 生成"的智能流程。

## 需求背景

当前领域包章节展示的是两个固定示例（前端领域包、后端领域包），给读者的印象是"预置模板"。但实际上 harness 已有 `domain-init` skill，能对任意项目自动扫描并生成专属 rules/skills/agents。架构页面需要反映这个核心能力。

## 目标用户与角色

- **新用户** — 了解 harness 如何为项目生成领域能力
- **已有用户** — 理解 domain-init 与 devkeel init 的分工

## 核心功能用例

1. 展示 domain-init 的四阶段流程（识别 → baseline → 增强 → 收尾）
2. 保留前端/后端示例作为"产出样本"但弱化为辅助说明
3. 突出"自动检测 + 用户确认"的交互模式
4. 展示 subAgent 并行扫描的机制
5. 保留 review-orchestrator 跨域路由流程图

## 需求边界

**In Scope:**
- 重写领域包章节的文案和结构
- 新增 domain-init 流程可视化
- 调整前端/后端示例的展示层级

**Out of Scope:**
- 不改动其他章节
- 不改动 CSS 全局样式（可新增该章节专用样式）
- 不改动 domain-init skill 本身的逻辑

## 探索过的替代方向

- 完全删除前端/后端示例 → 放弃，因为具体示例有助于理解产出物
- 新增独立页面介绍 domain-init → 过重，一个章节足够

## 待确认项

无，需求明确。

---
## 下一步

在新会话中粘贴以下命令：

/opsx:continue refactor-architecture-domain-section
