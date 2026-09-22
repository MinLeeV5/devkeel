export function HomeHero(): React.JSX.Element {
  return (
    <header className="home-hero">
      <div className="home-hero-inner">
        <div className="home-hero-kicker">
          <span className="home-live-dot" aria-hidden="true" />
          DevKeel V2 · 面向现有项目
        </div>
        <h1>
          让现有项目成为 <span className="home-hero-agent">AI Agent</span><br />
          <span>能读懂、会执行、可验证</span><br className="home-hero-balance-break" />的工程环境。
        </h1>
        <p className="home-hero-copy">
          DevKeel 将项目知识、专业能力与反馈回路沉淀进仓库，
          并按任务真实成本选择最短但足够可靠的路径。
        </p>
        <div className="home-hero-actions">
          <a className="home-button home-button-primary" href="#quickstart">快速开始</a>
          <a className="home-button home-button-secondary" href="#comparison">了解 DevKeel</a>
        </div>
        <div className="home-hero-index" aria-label="DevKeel V2 核心能力">
          <span><b>01</b> 项目知识</span>
          <span><b>02</b> 渐进路径</span>
          <span><b>03</b> 验证反馈</span>
        </div>
      </div>
    </header>
  )
}
