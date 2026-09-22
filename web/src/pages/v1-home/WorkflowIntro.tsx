export function WorkflowIntro(): React.JSX.Element {
  return (
    <section id="workflow" className="section-alt">
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="tag">工作流</div>
        <h2 className="stitle" style={{ textAlign: 'center' }}>从需求到交付，完整闭环</h2>
        <p className="sdesc" style={{ margin: '0 auto 44px', textAlign: 'center' }}>
          每次与 Agent 的会话都经历 Spec → Code → Growth 三个阶段。
          OpenSpec 编排流程，Superpowers 提供方法论与运行时执行。
        </p>
        <a href="./workflow.html" className="btn btn-p">了解完整工作流</a>
      </div>
    </section>
  )
}
