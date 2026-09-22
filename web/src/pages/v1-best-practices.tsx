import { MarketingNav } from './v1-home/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { V1_TEMPLATES_VERSION } from './v1-template'

const styles = [
  `.flow-pipeline{display:flex;align-items:stretch;gap:0;margin:8px 0 0;overflow-x:auto;overflow-y:visible;padding:16px 0 8px}
      .flow-step{flex:1;min-width:160px;position:relative;padding:24px 16px 20px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;transition:transform .2s,box-shadow .2s}
      .flow-step:hover{transform:translateY(-3px);box-shadow:0 6px 20px rgba(79,70,229,0.12)}
      .flow-step h4{font-size:13px;font-weight:700;margin:0 0 6px;color:var(--text-1)}
      .flow-step p{font-size:12px;color:var(--text-3);margin:0;line-height:1.6}
      .flow-step .step-num{position:absolute;top:-10px;left:16px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff}
      .flow-arrow{display:flex;align-items:center;padding:0 4px;color:var(--text-4);flex-shrink:0}
      .flow-arrow svg{animation:flowPulse 2s ease-in-out infinite}
      @keyframes flowPulse{0%,100%{opacity:.4;transform:translateX(0)}50%{opacity:1;transform:translateX(3px)}}
      @media(max-width:768px){.flow-pipeline{flex-direction:column;gap:12px}.flow-arrow{transform:rotate(90deg);padding:4px 0;justify-content:center}}`,
]

const externalStyles: string[] = ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap']

export function V1BestPracticesPage(): React.JSX.Element {
  return (
    <PageFrame pageId="v1-best-practices" title="DevKeel — 最佳实践" description="" styles={styles} externalStyles={externalStyles}>
      <div data-template-version={V1_TEMPLATES_VERSION}>
        <MarketingNav activePage="best-practices" />
        <BestPracticesHero />
        <WorktreeSetupSection />
        <BestPracticesFooter />
      </div>
    </PageFrame>
  )
}

function BestPracticesHero(): React.JSX.Element {
  return (
    <section style={{padding: '64px 24px 48px'}}>
      <div className="container">
        <div className="tag">指南</div>
        <h1 className="stitle" style={{fontSize: 42}}>最佳实践</h1>
        <p className="sdesc">工具使用技巧与注意事项</p>
      </div>
    </section>
  )
}

function WorktreeSetupSection(): React.JSX.Element {
  return (
    <section className="section-alt" id="worktree">
      <div className="container">
        <div className="tag">Worktree + Setup</div>
        <h2 className="stitle">隔离环境 × 随时随地</h2>
        <p className="sdesc">用 <a href="https://paseo.sh/docs" target="_blank" rel="noopener">Paseo</a> 管理 Agent 的隔离工作空间，从手机到桌面全覆盖。</p>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0 32px'}}>
          <img src="https://paseo.sh/logo.svg" alt="Paseo" style={{width: 40, height: 40}} />
          <p style={{margin: 0, color: 'var(--text-3)', fontSize: 15}}>Paseo 是 coding agent 的运行时管理平台 — 每个 agent 运行在独立的 git worktree 中，并行任务互不干扰。</p>
        </div>
        <h3 style={{fontSize: 18, marginBottom: 12}}>支持的 Agent</h3>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32, alignItems: 'center'}}>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)'}}>Claude Code</span>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)'}}>Codex</span>
          <span style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, background: 'var(--surface-2)', border: '1px solid var(--border)'}}>Gemini CLI</span>
          <a href="https://paseo.sh/docs/supported-providers" target="_blank" rel="noopener" style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', textDecoration: 'none'}}>30+ providers →</a>
        </div>
        <h3 style={{fontSize: 18, marginBottom: 12}}>paseo.json — Worktree + Setup 配置</h3>
        <p style={{color: 'var(--text-3)', marginBottom: 16}}>在项目根目录放一个 <code>paseo.json</code>，Paseo 会在创建 worktree 时自动执行 setup，归档时执行 teardown。</p>
        <pre style={{border: '1px solid var(--border)', borderRadius: 8, padding: 20, overflowX: 'auto', fontSize: 13, lineHeight: '1.7', color: 'var(--text-2)'}}>{"{"}{"\n"}{"  "}"worktree": {"{"}{"\n"}{"    "}"setup": "git submodule update --init --remote --recursive &amp;&amp; pnpm install",{"\n"}{"    "}"teardown": "rm -rf node_modules .cache"{"\n"}{"  "}{"}"},{"\n"}{"  "}"scripts": {"{"}{"\n"}{"    "}"test": {"{"} "command": "pnpm test" {"}"},{"\n"}{"    "}"dev": {"{"} "command": "pnpm dev" {"}"}{"\n"}{"  "}{"}"}{"\n"}{"}"}</pre>
        <h3 style={{fontSize: 18, margin: '32px 0 12px'}}>工作流</h3>
        <div className="flow-pipeline">
          <div className="flow-step">
            <span className="step-num" style={{background: 'var(--accent)'}}>1</span>
            <h4>创建 Worktree</h4>
            <p>隔离分支 + 独立目录，自动运行 setup hook 安装依赖。</p>
          </div>
          <div className="flow-arrow"><svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
          <div className="flow-step">
            <span className="step-num" style={{background: 'var(--cyan)'}}>2</span>
            <h4>Agent 工作</h4>
            <p>Agent 在隔离环境中写代码，不影响主分支。</p>
          </div>
          <div className="flow-arrow"><svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
          <div className="flow-step">
            <span className="step-num" style={{background: 'var(--purple)'}}>3</span>
            <h4>审查 Diff</h4>
            <p>在桌面或移动端逐文件查看变更。</p>
          </div>
          <div className="flow-arrow"><svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg></div>
          <div className="flow-step">
            <span className="step-num" style={{background: 'var(--yellow)'}}>4</span>
            <h4>Commit + MR</h4>
            <p>通过 commit + MR 合并到主分支；或归档，teardown 自动清理。</p>
          </div>
        </div>
        <h3 style={{fontSize: 18, margin: '32px 0 12px'}}>移动端操作</h3>
        <div style={{display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap'}}>
          <div style={{flex: 1, minWidth: 240}}>
            <p style={{color: 'var(--text-3)', marginBottom: 16}}>Paseo 提供专用移动 App，连接到你的开发机后即可随时随地：</p>
            <ul style={{color: 'var(--text-3)', paddingLeft: 20, lineHeight: 2}}>
              <li>发起新任务 — 在手机上描述需求，Agent 在后台执行</li>
              <li>查看 Diff — 逐文件浏览代码变更</li>
              <li>管理 Worktree — 创建、归档、切换分支</li>
              <li>监控服务 — 查看 dev server 状态和日志</li>
            </ul>
          </div>
          <div style={{flex: '0 0 auto'}}>
            <img src="https://paseo.sh/phone-2-480.webp" alt="Paseo 移动端界面" style={{width: 220, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)'}} />
          </div>
        </div>
        <p style={{marginTop: 24}}>
          <a href="https://paseo.sh/docs" target="_blank" rel="noopener" style={{fontWeight: 500}}>了解更多 →</a>
          &nbsp;&nbsp;
          <a href="https://paseo.sh/docs/worktrees" target="_blank" rel="noopener" style={{fontWeight: 500}}>Worktree 文档 →</a>
        </p>
      </div>
    </section>
  )
}

function BestPracticesFooter(): React.JSX.Element {
  return (
    <footer>
      <p>DevKeel — 项目知识框架 · <a href="./index.html">首页</a> · <a href="./workflow.html">工作流</a> · <a href="./architecture.html">架构设计</a> · <a href="./changelog.html">变更日志</a></p>
    </footer>
  )
}
