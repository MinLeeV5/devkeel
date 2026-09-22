export function MarketingFooter(): React.JSX.Element {
  return (
    <footer>
      <div className="container">
        <p style={{ fontSize: 15, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
          项目知识框架 = .harness/ + AGENTS.md + openspec/
        </p>
        <p>DevKeel — 编排 · 规范 · 沉淀，AI 协作的项目知识框架。</p>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-4)' }}>
          <a href="./workflow.html">工作流</a> · <a href="./architecture.html">架构设计</a> · <a href="./best-practices.html">最佳实践</a> · <a href="../changelog.html">变更日志</a>
        </p>
      </div>
    </footer>
  )
}
