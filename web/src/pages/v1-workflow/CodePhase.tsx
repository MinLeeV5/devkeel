export function CodePhase(): React.JSX.Element {
  return (
    <section className="phase-section section-alt" id="phase-code">
      <div className="container">
        <div className="phase-header">
          <div className="tag" style={{ background: 'var(--accent-g)', borderColor: 'rgba(16,185,129,.2)', color: 'var(--accent)' }}>Phase 2</div>
          <h2>Code — 把人类工程实践自动化</h2>
          <p>tasks 就绪后，Agent 在隔离环境中自主实现。可选 worktree 隔离，遵循完整的工程纪律：subagent 逐任务执行，每个任务内置 TDD + code-review。</p>
        </div>
        <div className="phase-steps">
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-code">1</span>
              <h4>运行时执行</h4>
              <span className="phase-badge">subagent-driven-development</span>
            </div>
            <p>使用 subagent-driven-development 逐任务派发独立 agent，每个任务内置 TDD + 双重代码审查门禁。可选使用 git worktree 隔离开发环境，复杂变更推荐启用。</p>
            <div className="phase-highlight">
              <strong>统一路径</strong> — 不区分平台。Claude Code 和 Codex CLI 使用相同执行策略，零外部依赖。worktree 按需启用，简单变更可直接在主分支开发。
            </div>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-code">2</span>
              <h4>隔离执行</h4>
              <span className="phase-badge">git worktree</span>
              <span className="phase-badge" style={{ color: 'var(--text-4)', opacity: '.7' }}>可选</span>
            </div>
            <p>推荐使用 git worktree 隔离开发环境，与主分支完全隔离。已在 worktree 中时自动跳过询问。简单变更可直接在主分支开发，无需额外隔离。</p>
            <div className="phase-highlight">
              <strong>安全网</strong> — worktree 隔离意味着实现过程中的任何错误都不会污染主分支。失败了就丢弃重来，零成本。
            </div>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-code">3</span>
              <h4>TDD 驱动实现</h4>
              <span className="phase-badge">test-driven-development</span>
            </div>
            <p>每个微任务严格遵循 RED → GREEN → REFACTOR 循环。先写失败测试，再写最小实现，最后重构。不是"写完补测试"，而是"测试驱动设计"。</p>
            <div className="phase-highlight">
              <strong>质量内建</strong> — TDD 不仅保证正确性，更重要的是约束 Agent 不做过度设计。测试就是 spec，代码只需让测试通过。
            </div>
          </div>
          <div className="phase-step">
            <div className="phase-step-head">
              <span className="phase-num phase-num-code">4</span>
              <h4>审查与验证</h4>
              <span className="phase-badge">review + verify</span>
            </div>
            <p>每个任务完成后，code-reviewer 检查 spec 合规性和代码质量。全部任务完成后，openspec-verify-change 验证交付完整性：任务完成率、测试通过、结构校验。验证通过后交还用户确认。</p>
            <div className="phase-highlight">
              <strong>双重保障</strong> — 自动化代码审查 + 结构化验证，确保每次交付都是完整、可审计、可回退的。
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
