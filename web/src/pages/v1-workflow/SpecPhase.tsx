export function SpecPhase(): React.JSX.Element {
  return (
    <section className="phase-section" id="phase-spec">
      <div className="container">
        <div className="phase-header">
          <div className="tag" style={{ background: 'rgba(167,139,250,.08)', borderColor: 'rgba(167,139,250,.2)', color: 'var(--purple)' }}>Phase 1</div>
          <h2>Spec — 想清楚再动手</h2>
          <p>在写第一行代码之前，通过结构化的思考和审阅，确保方向正确、边界清晰、方案合理。</p>
        </div>
        <div className="phase-steps">
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-spec">1</span>
              <h4>提问发散</h4>
              <span className="phase-badge">brainstorm.md</span>
            </div>
            <p>使用 requirement-analysis（5W1H / SCAMPER / MECE）进行结构化需求分析，同时扫描代码现状、梳理依赖。一次一个问题，选择题优先，发散问题空间。明确需求背景、用户角色、核心用例和边界。</p>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-spec">2</span>
              <h4>技术方案</h4>
              <span className="phase-badge">design.md</span>
              <span className="phase-badge" style={{ color: 'var(--text-4)', opacity: '.7' }}>可选</span>
            </div>
            <p>使用 technical-design（C4 / ATAM / STRIDE / SLO）进行技术方案设计。适用于架构变更、多方案对比、跨系统集成等场景。小变更可直接跳过，进入任务拆解。</p>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-spec">3</span>
              <h4>任务拆解</h4>
              <span className="phase-badge">tasks.md</span>
            </div>
            <p>使用 writing-plans 将可用 artifact 拆解为可执行的微任务清单：粗粒度 checkbox + 缩进微步骤 + commit 点。始终读取 brainstorm.md，按需读取 design.md 和 specs。</p>
            <div className="phase-highlight">
              <strong>条件读取</strong> — brainstorm.md 始终作为需求输入；design.md 存在时提供架构参考；specs 存在时提供 WHEN/THEN 场景作为 TDD 输入。
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
