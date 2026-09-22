# 参考项目索引

subAgent 在生成各维度内容前，先用当前可用的页面读取能力获取对应参考项目的关键文件作为质量标杆；不假定环境存在特定名称的工具。

| 维度类别 | 参考项目 | GitHub 地址 | 参考内容 |
|----------|----------|-------------|----------|
| 编码哲学/反模式 | karpathy-skills | https://github.com/multica-ai/andrej-karpathy-skills | `skills/karpathy-guidelines/SKILL.md` |
| 编码规范(per-lang) | everything-claude-code | https://github.com/affaan-m/everything-claude-code | `rules/common/` + `rules/<lang>/` |
| 架构约束 | get-shit-done | https://github.com/gsd-build/get-shit-done | `references/planner-antipatterns.md` |
| 安全规范 | gstack | https://github.com/garrytan/gstack | `cso/` (OWASP Top 10 + STRIDE) |
| 安全规范(深度) | trailofbits/skills | https://github.com/trailofbits/skills | 安全审计工作流 |
| 性能规范(前端) | vercel agent-skills | https://github.com/vercel-labs/agent-skills | `skills/react-best-practices/` |
| 性能规范(通用) | gstack | https://github.com/garrytan/gstack | `benchmark/` |
| 测试策略 | get-shit-done | https://github.com/gsd-build/get-shit-done | `references/verification-patterns.md` |
| Code Reviewer | agency-agents | https://github.com/msitarzewski/agency-agents | `engineering/` (30 specialist agents) |
| Code Reviewer(对抗性) | get-shit-done | https://github.com/gsd-build/get-shit-done | `agents/gsd-code-reviewer.md` |
| UI/UX 审查 | gstack | https://github.com/garrytan/gstack | `design-review/` |
| 可访问性/SEO | vercel agent-skills | https://github.com/vercel-labs/agent-skills | `skills/web-design-guidelines/` |
| 文档规范 | gstack | https://github.com/garrytan/gstack | `document-generate/` (Diataxis) |
| 门控体系 | get-shit-done | https://github.com/gsd-build/get-shit-done | `references/gates.md` |
| Agent 角色定义 | agency-agents | https://github.com/msitarzewski/agency-agents | `strategy/nexus-strategy.md` |
| 组件架构(前端) | vercel agent-skills | https://github.com/vercel-labs/agent-skills | `skills/composition-patterns/` |
| 共享语言 | mattpocock/skills | https://github.com/mattpocock/skills | CONTEXT.md 模式 |
| Skill 元结构 | addyosmani/agent-skills | https://github.com/addyosmani/agent-skills | 生命周期覆盖、反合理化表格 |
| 设计系统 | open-design | https://github.com/nexu-io/open-design | 71 brand-grade design systems |
| Sprint 工作流 | gstack | https://github.com/garrytan/gstack | think/plan/build/review/test/ship |

## subAgent 使用方式

1. 生成前读取对应 GitHub raw URL（`https://raw.githubusercontent.com/<org>/<repo>/main/<path>`）
2. 提取结构和质量标准作为生成锚点
3. 产出中不照搬内容，只借鉴结构和深度
4. 如果 fetch 失败（网络/仓库变动），降级为基于项目代码扫描生成，不阻塞流程
