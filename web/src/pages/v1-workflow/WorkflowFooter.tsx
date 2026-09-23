export function WorkflowFooter(): React.JSX.Element {
  return (
    <footer>
      <div className="container">
        <p style={{ fontSize: 15, color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>
          Spec → Code → Growth，每次协作都是一次完整迭代
        </p>
        <p>DevKeel — 编排 · 规范 · 沉淀，AI 协作的项目知识框架。</p>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-4)' }}>
          <a href="./index.html">首页</a> · <a href="./architecture.html">架构设计</a> · <a href="./best-practices.html">最佳实践</a> · <a href="../changelog.html">变更日志</a>
        </p>
      </div>
    </footer>
  )
}
