export function ThreeLayerModel(): React.JSX.Element {
  return (
    <section className="section-alt model-section">
      <div className="container">
        <div className="tag">三层模型</div>
        <h2 className="stitle" style={{ textAlign: 'center' }}>各司其职，协同驱动</h2>
        <p className="model-desc">
          OpenSpec 定义"做什么、按什么顺序做"，SuperPowers 提供"怎么做好"的方法论，OMC 负责"自动执行"的运行时编排。三者解耦，各自演进。
        </p>
        <div className="pillars">
          <div className="pillar pillar-openspec">
            <h3><a href="https://github.com/Fission-AI/OpenSpec" target="_blank" rel="noopener" style={{ color: 'var(--purple)', textDecoration: 'none' }}>OpenSpec</a></h3>
            <div className="pillar-role">流程编排器</div>
            <p>定义阶段 · 管理依赖 · 驱动流转 · 归档沉淀。每次变更经历完整的 artifact 链，从 brainstorm 到 retrospective。</p>
          </div>
          <div className="pillar pillar-superpowers">
            <h3><a href="https://github.com/obra/superpowers" target="_blank" rel="noopener" style={{ color: 'var(--accent)', textDecoration: 'none' }}>SuperPowers</a></h3>
            <div className="pillar-role">方法论工具库</div>
            <p>需求分析 · TDD · Worktree 隔离 · 代码审查 · 归档复盘。把人类工程实践编码为可复用的 skill。</p>
          </div>
          <div className="pillar pillar-omc">
            <h3 style={{ color: 'var(--cyan)' }}>Agent 原生能力</h3>
            <div className="pillar-role">运行时编排引擎</div>
            <p>subagent-driven-development 逐任务派发独立 agent · 双重审查 · 零外部依赖。Claude Code 和 Codex CLI 统一行为。</p>
          </div>
        </div>
      </div>
    </section>
  )
}
