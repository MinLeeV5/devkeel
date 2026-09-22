export function GrowthPhase(): React.JSX.Element {
  return (
    <section className="phase-section" id="phase-growth">
      <div className="container">
        <div className="phase-header">
          <div className="tag" style={{ background: 'rgba(34,211,238,.08)', borderColor: 'rgba(34,211,238,.2)', color: 'var(--cyan)' }}>Phase 3</div>
          <h2>Growth — 沉淀而非遗忘</h2>
          <p>实现完成不是终点。验证交付完整性、归档设计决策、提炼可复用经验，让每次协作都为下一次积累势能。</p>
        </div>
        <div className="phase-steps">
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-growth">1</span>
              <h4>验证交付</h4>
              <span className="phase-badge">verify.md</span>
            </div>
            <p>自动验证实现与 spec 的一致性：任务完成率、类型检查、测试通过、API 合规、功能验收。任何维度不通过都会阻塞归档。</p>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-growth">2</span>
              <h4>回顾与归档</h4>
              <span className="phase-badge">retrospective.md</span>
              <span className="phase-badge">openspec archive</span>
            </div>
            <p>趁上下文还热，基于证据回顾本次变更：§0 量化证据（提交数、diff 规模、任务完成率）+ §1–§6 分析章节（收获、不足、计划偏差、skill 合规性、意外、晋升候选）。回顾完成后归档到 archive/，同步 spec 增量，持久化到 Git。</p>
            <div className="phase-highlight">
              <strong>知识持久化</strong> — 设计决策、方案对比、验证证据、回顾经验全部以文件形式留存。§6 晋升候选将重复出现的模式转化为 memory / CLAUDE.md / schema 改进，让每次协作都为下一次积累势能。
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
