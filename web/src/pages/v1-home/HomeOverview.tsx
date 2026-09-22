export function HomeOverview(): React.JSX.Element {
  return (
    <section id="what">
      <div className="container">
        <div className="tag">是什么</div>
        <h2 className="stitle">编排 · 规范 · 沉淀</h2>
        <p className="sdesc">
          DevKeel 为项目选对工具组合，建立领域规范与技能，让每次 Agent 协作的经验持续沉淀 — Agent 进入项目就知道该怎么做、不该做什么。
        </p>
        <div className="what-grid">
          <div className="what-card">
            <h3><span className="what-icon" style={{ background: 'rgba(167,139,250,.1)', color: 'var(--purple)' }}>编</span> 编排最合适的工具</h3>
            <p>把 OpenSpec（流程编排）和 Superpowers（方法论与运行时）编排进项目工作流。两层解耦，各自演进 — DevKeel 只做搭配，不重复造轮子。</p>
          </div>
          <div className="what-card">
            <h3><span className="what-icon" style={{ background: 'rgba(16,185,129,.12)', color: 'var(--accent)' }}>规</span> 注入领域规范与技能</h3>
            <p>rules 约束行为边界、skills 沉淀最佳实践、AGENTS.md 统一执行契约。<code>/domain-init</code> 全盘扫描项目，自动生成专属规范 — Agent 一进项目就知道该遵守什么。</p>
          </div>
          <div className="what-card">
            <h3><span className="what-icon" style={{ background: 'rgba(34,211,238,.1)', color: 'var(--cyan)' }}>沉</span> 持续沉淀项目知识</h3>
            <p>每次变更的 brainstorm、design、spec 自动归档到 openspec/，经验回流为新的 rules 和 skills。Submodule 模式下主仓统一路由，子项目各自沉淀 — 知识越用越厚。</p>
          </div>
        </div>
      </div>
    </section>
  )
}
