export function WorkflowHero(): React.JSX.Element {
  return (
    <section className="hero">
      <div className="container">
        <h1>从需求到交付<br /><span className="hl">完整闭环</span></h1>
        <p className="hero-sub">
          大多数 AI 编码工具只解决"写代码"这一步。但真正的工程闭环远不止于此 —— 需求澄清、方案设计、质量门禁、知识沉淀，每一步都决定了交付质量。
        </p>
        <div className="pain-points">
          <div className="pain-point">
            <div className="icon">⚠️</div>
            <h4>跳过 Spec</h4>
            <p>需求没想清楚就开写，反复返工，最终交付物偏离目标</p>
          </div>
          <div className="pain-point">
            <div className="icon">🚧</div>
            <h4>无门禁</h4>
            <p>Agent 不经审阅就实现，低质量代码直接合入，技术债累积</p>
          </div>
          <div className="pain-point">
            <div className="icon">🗑️</div>
            <h4>无沉淀</h4>
            <p>每次对话结束即遗忘，同样的错误在不同 session 反复出现</p>
          </div>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto', lineHeight: '1.7' }}>
          DevKeel 的解法：将每次 Agent 协作拆解为 <strong style={{ color: 'var(--purple)' }}>Spec</strong> → <strong style={{ color: 'var(--accent)' }}>Code</strong> → <strong style={{ color: 'var(--cyan)' }}>Growth</strong> 三个阶段，由三层工具协同驱动。
        </p>
      </div>
    </section>
  )
}
