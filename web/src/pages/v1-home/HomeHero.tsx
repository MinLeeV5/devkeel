export function HomeHero(): React.JSX.Element {
  return (
    <section className="hero">
      <div className="container">
        <h1>编排 · 规范 · <span className="hl">沉淀</span></h1>
        <p className="hero-sub">
          编排最合适的工具组合，注入领域规范与技能，持续沉淀项目知识<br />
          让 Agent 进入项目就知道该怎么做、不该做什么
        </p>
        <div className="hero-formula mono">
          <span className="sym">编排</span> OpenSpec + Superpowers
          <span style={{ color: 'var(--text-4)', margin: '0 4px' }}>·</span>
          <span className="sym">规范</span> rules + skills + agents
          <span style={{ color: 'var(--text-4)', margin: '0 4px' }}>·</span>
          <span className="sym">沉淀</span> openspec/ 知识真源
        </div>
        <div className="hero-actions">
          <a href="#quickstart" className="btn btn-p">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5" /><line x1={12} y1={19} x2={20} y2={19} /></svg>
            快速开始
          </a>
          <a href="#workflow" className="btn btn-g">看案例演示</a>
        </div>
      </div>
    </section>
  )
}
