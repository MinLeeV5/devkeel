# 《从开源 Skills 到 DevKeel》补充分享讲稿

> 版本：2026-07-31  
> 配套页面：`web/public/sharing-harness-research.html`  
> 建议时长：8–10 分钟，可作为主分享第 10 页后的可选展开。

## 01. 开源调研地图

调研看的不是 Skill 数量，而是五件事：什么时候触发、怎样组合、状态放哪里、怎样自证、怎样安全演进。

Agent Skills 提供格式；Superpowers 提供强流程；Matt Skills 提供可组合能力；Harness Engineering 提供系统视角。

## 02. Superpowers：强纪律流程

Superpowers 把 brainstorming、计划、实现、TDD、Review 和分支收尾串成强约束 workflow。它的价值是把“最好这样做”变成“必须经过这些节点”。

## 03. Superpowers 的工程机制

四个机制值得关注：会话启动即检查 Skill；关键阶段不能跳步；完成声明必须有证据；Skill 本身也用压力场景测试。

它带来高一致性，但默认启用 worktree、TDD、subagent、commit 等完整纪律，对日常小改动可能过重。

## 04. Matt Skills：能力系统

Matt Skills 更像一个可编辑、可组合的能力系统。用户调用的 Router 与 Agent 自动遵守的纪律分开，横向按开发阶段组织，纵向补研究、TDD、调试和项目设置。

## 05. Matt 的 Flow

虽然能力是可组合的，主线仍然清楚：grill、spec、tickets、implement、review。setup、issue tracker 和 domain docs 则把阶段结果持久化。

## 06. 开源方案对比

Superpowers 偏完整、强约束；Matt Skills 偏小型、可编辑、可组合。DevKeel 的选择是中央执行契约加专项能力：保留必要纪律，但让质量动作与任务风险相称。

状态统一进入 OpenSpec artifacts，项目授权、风险路由和版本迁移则由 DevKeel 补齐。

## 07. 从研究到 DevKeel

这张图讲的是设计演进：从借鉴 Superpowers 的流程纪律，到逐步形成 Lite / Full，再吸收 Agent Skills 与 Matt Skills 的外部设计对照。

强调三点：借鉴纪律、重构默认路径、补齐项目治理。外部方案是设计启发，不冒充仓库历史依赖。
