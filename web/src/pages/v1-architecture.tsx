import { MarketingNav } from './v1-home/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { V1_TEMPLATES_VERSION } from './v1-template'

const styles = [
  `/* Dir Tree */
    .tree-box{
      padding:24px 28px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      overflow-x:auto;
    }
    .tree-box pre{font-size:13px;line-height:1.85;color:var(--text-3);white-space:pre}
    .tree-box .d{color:var(--cyan);font-weight:600}
    .tree-box .f{color:var(--text)}
    .tree-box .n{color:var(--text-4);font-style:italic}
    .tree-box .s{color:var(--purple)}

    /* Routing */
    .route-diagram{
      padding:32px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      margin-bottom:32px;
    }
    .route-flow{display:flex;flex-direction:column;gap:16px}
    .route-step{display:flex;align-items:flex-start;gap:16px}
    .route-num{
      width:32px;height:32px;border-radius:50%;flex-shrink:0;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
    }
    .route-num-1{background:rgba(16,185,129,.12);color:var(--accent);border:1px solid rgba(16,185,129,.25)}
    .route-num-2{background:rgba(34,211,238,.1);color:var(--cyan);border:1px solid rgba(34,211,238,.2)}
    .route-num-3{background:rgba(167,139,250,.1);color:var(--purple);border:1px solid rgba(167,139,250,.2)}
    .route-num-4{background:rgba(251,191,36,.1);color:var(--yellow);border:1px solid rgba(251,191,36,.2)}
    .route-content h4{font-size:14px;font-weight:700;margin-bottom:4px}
    .route-content p{font-size:13px;color:var(--text-3);line-height:1.65}
    .route-content code{font-size:12px}
    .route-arrow{
      width:32px;display:flex;justify-content:center;
      color:var(--text-4);font-size:16px;
    }

    /* Monorepo Diagram */
    .mono-diagram{
      padding:40px 32px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      margin-bottom:32px;overflow:hidden;
    }
    .mono-root{
      max-width:420px;margin:0 auto;padding:16px 32px;border-radius:var(--r-lg);
      background:rgba(16,185,129,.08);border:2px solid rgba(16,185,129,.35);
      text-align:center;
    }
    .mono-root h4{font-size:16px;font-weight:700;color:var(--accent)}
    .mono-root p{font-size:12px;color:var(--text-3);margin-top:2px}
    .mono-svg-wrap{display:flex;justify-content:center}
    .mono-svg-wrap svg{display:block}
    .mono-cols{display:flex;justify-content:center;gap:48px}
    .mono-col{display:flex;flex-direction:column;align-items:center;width:280px}
    .mono-sub{
      padding:10px 24px;border-radius:var(--r);font-size:14px;font-weight:700;text-align:center;
      background:var(--bg-s);border:1px solid var(--border);
    }
    .mono-sub-fe{border-color:rgba(34,211,238,.35);color:var(--cyan)}
    .mono-sub-be{border-color:rgba(167,139,250,.35);color:var(--purple)}
    .mono-assets{
      display:flex;flex-direction:column;gap:6px;margin-top:14px;
      padding:14px 18px;border-radius:var(--r);width:100%;
      background:var(--bg-in);border:1px solid var(--border-d);
      font-size:12px;color:var(--text-3);
    }
    .mono-assets span{display:flex;align-items:center;gap:6px;line-height:1.5}
    .mono-assets .ico{width:14px;text-align:center;flex-shrink:0;font-size:10px}
    .mono-context-box{
      margin-top:32px;padding:20px 24px;border-radius:var(--r-lg);
      background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.15);
      display:flex;gap:16px;align-items:flex-start;
    }
    .mono-context-box .ico{font-size:20px;flex-shrink:0;margin-top:2px}
    .mono-context-box p{font-size:13px;color:var(--text-3);line-height:1.7}
    .mono-context-box strong{color:var(--accent);font-weight:600}

    /* Sub-project */
    .sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
    .sub-desc{font-size:15px;color:var(--text-3);line-height:1.8}
    .sub-desc strong{color:var(--text);font-weight:600}

    /* CLI */
    .cli-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    .cli-item{
      display:flex;align-items:center;gap:16px;padding:16px 20px;
      border-radius:var(--r);background:var(--bg-r);border:1px solid var(--border-d);
      transition:border-color .2s;
    }
    .cli-item:hover{border-color:var(--border)}
    .cli-item .cmd{font-size:14px;font-weight:600;color:var(--accent);white-space:nowrap;min-width:175px}
    .cli-item .desc{font-size:13px;color:var(--text-3)}

    /* Domain Pack */
    .dp-layout{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px}
    .dp-card{
      padding:24px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      transition:border-color .2s;
    }
    .dp-card:hover{border-color:var(--border)}
    .dp-card h4{font-size:15px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px}
    .dp-card-fe h4{color:var(--cyan)}
    .dp-card-be h4{color:var(--purple)}
    .dp-list{list-style:none;display:flex;flex-direction:column;gap:4px}
    .dp-list li{
      font-size:12px;color:var(--text-3);line-height:1.6;
      padding:5px 12px;border-radius:6px;background:var(--bg-in);
      display:flex;align-items:center;gap:8px;
    }
    .dp-list .dp-type{
      font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
      padding:1px 6px;border-radius:4px;flex-shrink:0;min-width:36px;text-align:center;
    }
    .dp-type-rule{background:rgba(251,191,36,.1);color:var(--yellow)}
    .dp-type-skill{background:rgba(16,185,129,.1);color:var(--accent)}
    .dp-type-agent{background:rgba(96,165,250,.1);color:var(--blue)}
    .dp-flow{
      padding:24px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      margin-bottom:32px;
    }
    .dp-flow h4{font-size:14px;font-weight:700;color:var(--accent);margin-bottom:16px}
    .dp-flow-steps{display:flex;align-items:center;gap:0;flex-wrap:wrap;justify-content:center}
    .dp-flow-step{
      padding:8px 16px;border-radius:var(--r);font-size:12px;font-weight:600;
      background:var(--bg-s);border:1px solid var(--border-d);white-space:nowrap;
    }
    .dp-flow-arrow{color:var(--text-4);padding:0 6px;font-size:14px}
    .dp-note{
      padding:18px 22px;border-radius:var(--r-lg);
      background:rgba(167,139,250,.04);border:1px solid rgba(167,139,250,.15);
      font-size:13px;color:var(--text-3);line-height:1.7;
    }
    .dp-note strong{color:var(--purple);font-weight:600}

    /* Platform */
    .plat-hub{text-align:center;margin-bottom:32px}
    .plat-hub-badge{
      display:inline-flex;align-items:center;gap:10px;
      padding:14px 32px;border-radius:var(--r-lg);
      background:rgba(16,185,129,.06);border:2px solid rgba(16,185,129,.3);
      font-size:16px;font-weight:800;color:var(--accent);
    }
    .plat-hub-badge code{background:none;color:var(--accent);font-size:16px;font-weight:800;padding:0}
    .plat-hub-arrow{color:var(--text-4);font-size:20px;margin:12px 0}
    .plat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
    .plat{
      text-align:center;padding:20px 12px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);transition:border-color .2s;
      position:relative;
    }
    .plat:hover{border-color:var(--border)}
    .plat h4{font-size:14px;font-weight:700;margin-bottom:6px}
    .plat p{font-size:11px;color:var(--text-4);line-height:1.5}
    .plat code{font-size:10px}
    .plat-tag{
      display:inline-block;font-size:9px;font-weight:700;letter-spacing:.5px;
      padding:2px 8px;border-radius:999px;margin-bottom:10px;
    }
    .plat-tag-ref{background:rgba(16,185,129,.1);color:var(--accent);border:1px solid rgba(16,185,129,.2)}
    .plat-tag-native{background:rgba(34,211,238,.1);color:var(--cyan);border:1px solid rgba(34,211,238,.2)}

    /* Responsive */
    @media(max-width:1024px){
      .plat-grid{grid-template-columns:repeat(3,1fr)}
    }
    @media(max-width:768px){
      .cli-grid,.sub-grid,.dp-layout{grid-template-columns:1fr}
      .plat-grid{grid-template-columns:1fr 1fr}
      .cli-item{flex-direction:column;align-items:flex-start;gap:6px}
      .cli-item .cmd{min-width:auto}
    }
    @media(max-width:480px){
      .plat-grid{grid-template-columns:1fr}
    }`,
]

const externalStyles: string[] = ['https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap']

export function V1ArchitecturePage(): React.JSX.Element {
  return (
    <PageFrame pageId="v1-architecture" title="DevKeel — 架构设计" description="DevKeel 项目知识框架的核心架构、路由机制、CLI 命令。" styles={styles} externalStyles={externalStyles}>
      <div data-template-version={V1_TEMPLATES_VERSION}>
        <MarketingNav activePage="architecture" />
        <ArchitectureHero />
        <CoreArchitecture />
        <RoutingMechanism />
        <BaselinePackages />
        <DomainPackages />
        <MultiPlatformSection />
        <CliCommandsSection />
        <ArchitectureFooter />
      </div>
    </PageFrame>
  )
}

function ArchitectureHero(): React.JSX.Element {
  return (
    <section style={{padding: '80px 24px 60px'}}>
      <div className="container">
        <div className="tag">架构设计</div>
        <h2 className="stitle" style={{fontSize: 42}}>架构设计</h2>
        <p className="sdesc">核心架构、路由机制、CLI 命令</p>
      </div>
    </section>
  )
}

function CoreArchitecture(): React.JSX.Element {
  return (
    <section id="core" className="section-alt">
      <div className="container">
        <div className="tag">核心架构</div>
        <h2 className="stitle">三个目录，各司其职</h2>
        <p className="sdesc">
          <code>.harness/</code> 放能力配置，<code>AGENTS.md</code> 做执行契约，<code>openspec/</code> 管知识产出。零运行时状态。
        </p>
        <div className="pillars" style={{marginBottom: 40}}>
          <div className="pillar pillar-harness">
            <h3>.harness/</h3>
            <div className="pillar-role">能力配置</div>
            <p>项目级业务 skills、代码规范 rules、自定义 agent 定义。"团队怎么做事"沉淀在这里。</p>
          </div>
          <div className="pillar pillar-agents">
            <h3>AGENTS.md</h3>
            <div className="pillar-role">执行契约</div>
            <p>路由表 + 执行基线 + 验证要求 + 收尾流程。Agent 进入项目的唯一入口，跨平台共享。</p>
          </div>
          <div className="pillar pillar-openspec">
            <h3>openspec/</h3>
            <div className="pillar-role">知识真源</div>
            <p>所有正式产出物通过 openspec 管理：changes → specs → archive。Schema 约束格式，入 Git 持久化。</p>
          </div>
        </div>
        <div className="tree-box">
          <pre className="mono"><span className="d">my-project/</span>{"\n"}├── <span className="d">.harness/</span>{"                    "}<span className="n"># 能力配置（唯一真源）</span>{"\n"}│{"   "}├── <span className="f">config.yml</span>{"               "}<span className="n"># 项目元信息</span>{"\n"}│{"   "}├── <span className="f">versions.yml</span>{"             "}<span className="n"># 组件版本清单</span>{"\n"}│{"   "}├── <span className="d">skills/</span>{"                  "}<span className="n"># 业务 skills（需求分析、技术设计、代码审查…）</span>{"\n"}│{"   "}├── <span className="d">rules/</span>{"                   "}<span className="n"># 代码规范与约束</span>{"\n"}│{"   "}├── <span className="d">agents/</span>{"                  "}<span className="n"># 自定义 agent 定义</span>{"\n"}│{"   "}└── <span className="d">commands/</span>{"                "}<span className="n"># 自定义 slash commands</span>{"\n"}│{"\n"}├── <span className="d">openspec/</span>{"                    "}<span className="n"># 知识产出的唯一真源</span>{"\n"}│{"   "}├── <span className="f">config.yaml</span>{"              "}<span className="n"># openspec 配置</span>{"\n"}│{"   "}├── <span className="d">schemas/</span>{"                  "}<span className="n"># 变更流程的 schema 定义</span>{"\n"}│{"   "}├── <span className="d">changes/</span>{"                 "}<span className="n"># 进行中的变更</span>{"\n"}│{"   "}├── <span className="d">specs/</span>{"                   "}<span className="n"># 正式规格</span>{"\n"}│{"   "}└── <span className="d">archive/</span>{"                 "}<span className="n"># 归档</span>{"\n"}│{"\n"}├── <span className="s">.claude/</span>{"                     "}<span className="n"># → .harness/ 的 symlink（Claude Code）</span>{"\n"}│{"   "}├── <span className="s">skills/</span> → .harness/skills/{"\n"}│{"   "}├── <span className="s">rules/</span> → .harness/rules/{"\n"}│{"   "}├── <span className="s">agents/</span> → .harness/agents/{"\n"}│{"   "}└── <span className="s">commands/</span> → .harness/commands/{"\n"}│{"\n"}├── <span className="s">.agents/</span>{"                     "}<span className="n"># → .harness/ 的 symlink（Codex CLI）</span>{"\n"}├── <span className="s">.cursor/</span>{"                     "}<span className="n"># → .harness/rules/ 的 symlink（Cursor）</span>{"\n"}├── <span className="s">.github/</span>{"                     "}<span className="n"># copilot-instructions.md（GitHub Copilot）</span>{"\n"}│{"\n"}├── <span className="f">AGENTS.md</span>{"                    "}<span className="n"># 执行契约（唯一入口）</span>{"\n"}├── <span className="s">CLAUDE.md</span>{"                    "}<span className="n"># @AGENTS.md 引用</span>{"\n"}├── <span className="s">GEMINI.md</span>{"                    "}<span className="n"># 引导到 AGENTS.md</span>{"\n"}│{"\n"}├── <span className="d">frontend/</span>{"                    "}<span className="n"># 子仓库 — 前端</span>{"\n"}│{"   "}├── <span className="d">.harness/</span>{"                "}<span className="n"># 领域能力配置</span>{"\n"}│{"   "}│{"   "}├── <span className="d">skills/</span>{"              "}<span className="n"># 前端专属 skills</span>{"\n"}│{"   "}│{"   "}├── <span className="d">rules/</span>{"               "}<span className="n"># 前端代码规范</span>{"\n"}│{"   "}│{"   "}└── <span className="d">agents/</span>{"              "}<span className="n"># 前端 agent 定义</span>{"\n"}│{"   "}├── <span className="s">.claude/</span>{"                 "}<span className="n"># → .harness/ 的 symlink</span>{"\n"}│{"   "}└── <span className="f">AGENTS.md</span>{"                "}<span className="n"># 子项目执行契约</span>{"\n"}│{"\n"}└── <span className="d">backend/</span>{"                     "}<span className="n"># 子仓库 — 后端</span>{"\n"}{"    "}├── <span className="d">.harness/</span>{"                "}<span className="n"># 领域能力配置</span>{"\n"}{"    "}│{"   "}├── <span className="d">skills/</span>{"              "}<span className="n"># 后端专属 skills</span>{"\n"}{"    "}│{"   "}├── <span className="d">rules/</span>{"               "}<span className="n"># 后端代码规范</span>{"\n"}{"    "}│{"   "}└── <span className="d">agents/</span>{"              "}<span className="n"># 后端 agent 定义</span>{"\n"}{"    "}├── <span className="s">.claude/</span>{"                 "}<span className="n"># → .harness/ 的 symlink</span>{"\n"}{"    "}└── <span className="f">AGENTS.md</span>{"                "}<span className="n"># 子项目执行契约</span></pre>
        </div>
      </div>
    </section>
  )
}

function RoutingMechanism(): React.JSX.Element {
  return (
    <section id="routing">
      <div className="container">
        <div className="tag">路由机制</div>
        <h2 className="stitle">两层短路，精准分流</h2>
        <p className="sdesc">
          两层短路分流：L0 原子操作直达 skill，L1 OpenSpec 分流器判断走正式流程还是按基线推进。Agent 读一遍路由表，即知道走哪条路。
        </p>
        <div className="route-diagram">
          <div className="route-flow">
            <div className="route-step">
              <div className="route-num route-num-1">1</div>
              <div className="route-content">
                <h4>Agent 进入项目，读取 AGENTS.md</h4>
                <p>AGENTS.md 是唯一入口。Claude Code 通过 <code>CLAUDE.md</code> 的 <code>@AGENTS.md</code> 引用加载，Codex / Cursor 原生加载。</p>
              </div>
            </div>
            <div className="route-arrow">↓</div>
            <div className="route-step">
              <div className="route-num route-num-2">2</div>
              <div className="route-content">
                <h4>L0：原子操作短路</h4>
                <p>代码审查、测试用例设计、缺陷管理、调试排错、原子提交 — 这 5 类任务直接短路到对应 skill（<code>review-orchestrator</code>、<code>test-case-designer</code>、<code>defect-orchestrator</code>、<code>automated-instrumented-debugging</code>、<code>commit</code>），不进入 openspec 分流器。</p>
              </div>
            </div>
            <div className="route-arrow">↓</div>
            <div className="route-step">
              <div className="route-num route-num-3">3</div>
              <div className="route-content">
                <h4>L1：OpenSpec 分流器</h4>
                <p>未被 L0 短路的任务进入 openspec 分流器：新功能、架构变更、需求分析、方案设计 → 走 <code>/opsx</code> 编排；Bug fix、测试补充、typo、配置调整 → 按默认基线直接推进。<strong>流程仪式感与风险成正比。</strong></p>
              </div>
            </div>
            <div className="route-arrow">↓</div>
            <div className="route-step">
              <div className="route-num route-num-4">4</div>
              <div className="route-content">
                <h4>Brainstorm 收敛 → 正式流程</h4>
                <p>设计讨论先走 brainstorming，满足 5 条收敛标准（范围锁定、分歧解决、依赖映射、验收可陈述、对话在收敛）后，提议 <code>/opsx:new</code> 进入正式 change 流程。</p>
              </div>
            </div>
          </div>
        </div>
        {/* Submodule: Visual Diagram */}
        <h3 style={{fontSize: 20, fontWeight: 700, marginBottom: 8}}>Submodule 模式：多项目统一上下文</h3>
        <p style={{fontSize: 15, color: 'var(--text-3)', marginBottom: 28, lineHeight: '1.8'}}>
          主仓库的 AGENTS.md 统一路由，子项目各自沉淀领域知识。Agent 在任意子项目工作时，<strong style={{color: 'var(--text)'}}>同时获得全局上下文和领域专属规范</strong>。
        </p>
        <div className="mono-diagram">
          {/* Root node */}
          <div className="mono-root">
            <h4>AGENTS.md</h4>
            <p>主仓库 · 统一路由 · 通用 skills · 全局 rules</p>
          </div>
          {/* SVG connector */}
          <div className="mono-svg-wrap">
            <svg width={608} height={72} viewBox="0 0 608 72" fill="none">
              <line x1={304} y1={0} x2={304} y2={28} stroke="#3f3f46" strokeWidth={2} />
              <rect x={222} y={18} width={164} height={20} rx={4} fill="#18181b" />
              <text x={304} y={32} textAnchor="middle" fill="#71717a" fontSize={10} fontWeight={700} letterSpacing="1.5" fontFamily="Inter,sans-serif">HARNESS SUBMODULE</text>
              <line x1={304} y1={38} x2={304} y2={52} stroke="#3f3f46" strokeWidth={2} />
              <line x1={140} y1={52} x2={468} y2={52} stroke="#3f3f46" strokeWidth={2} />
              <line x1={140} y1={52} x2={140} y2={72} stroke="#22d3ee" strokeWidth={2} strokeOpacity=".5" />
              <line x1={468} y1={52} x2={468} y2={72} stroke="#a78bfa" strokeWidth={2} strokeOpacity=".5" />
            </svg>
          </div>
          {/* Two columns */}
          <div className="mono-cols">
            <div className="mono-col">
              <div className="mono-sub mono-sub-fe">frontend/</div>
              <div className="mono-assets">
                <span><span className="ico" style={{color: 'var(--cyan)'}}>▶</span> AGENTS.md — 前端执行契约</span>
                <span><span className="ico" style={{color: 'var(--cyan)'}}>▶</span> skills/ — React 组件规范、状态管理</span>
                <span><span className="ico" style={{color: 'var(--cyan)'}}>▶</span> rules/ — ESLint 规范、CSS 约束</span>
              </div>
            </div>
            <div className="mono-col">
              <div className="mono-sub mono-sub-be">backend/</div>
              <div className="mono-assets">
                <span><span className="ico" style={{color: 'var(--purple)'}}>▶</span> AGENTS.md — 后端执行契约</span>
                <span><span className="ico" style={{color: 'var(--purple)'}}>▶</span> skills/ — API 设计、数据库迁移</span>
                <span><span className="ico" style={{color: 'var(--purple)'}}>▶</span> rules/ — Java/Go 代码规范</span>
              </div>
            </div>
          </div>
          {/* Context inheritance note */}
          <div className="mono-context-box">
            <div className="ico">↷</div>
            <div>
              <p><strong>上下文继承</strong> — Agent 在 <code>frontend/</code> 工作时，同时加载主仓库通用 skills（需求分析、代码审查、提交规范）和前端专属 rules。领域规则优先级高于全局规则，实现<strong>统一路由、各自深耕</strong>。</p>
              <p style={{marginTop: 8}}><strong>一键生成</strong> — <code>devkeel submodule</code> 为每个子项目自动生成 AGENTS.md + .harness/ 目录，无需手动配置。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function BaselinePackages(): React.JSX.Element {
  return (
    <section id="baseline-packages">
      <div className="container">
        <div className="tag">通用基线包</div>
        <h2 className="stitle">内置 19 个 Skills + 1 个 Agent + 1 个 Rule</h2>
        <p className="sdesc">
          <code>devkeel init</code> 时自动安装，<code>devkeel update</code> 增量更新。
        </p>
        <table>
          <thead><tr><th>类型</th><th>名称</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td><strong>Skill</strong></td><td>工程方法论 × 7</td><td>需求分析、方案设计、测试设计、代码审查、缺陷管理、系统化调试、原子提交</td></tr>
            <tr><td><strong>Skill</strong></td><td>openspec 工作流 × 11</td><td>explore / propose / new / continue / apply / verify / archive / ff / bulk-archive / onboard / sync-specs</td></tr>
            <tr><td><strong>Skill</strong></td><td>开发辅助 × 11</td><td>brainstorming、domain-init、架构图、环境配置、计划编写与执行、TDD、代码审查请求、分支收尾、worktree 隔离、子代理并行</td></tr>
            <tr><td><strong>Agent</strong></td><td>code-reviewer</td><td>通用代码审查 agent</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DomainPackages(): React.JSX.Element {
  return (
    <section id="domain-packages">
      <div className="container">
        <div className="tag">领域包</div>
        <h2 className="stitle">智能扫描，按需生成</h2>
        <p className="sdesc">
          <code>domain-init</code> 扫描项目代码，识别技术栈和编码习惯，通过多 subAgent 并行分析，自动生成专属的 rules、skills 和 agents。
        </p>
        {/* domain-init 四阶段流程 */}
        <div className="route-diagram">
          <h4 style={{marginBottom: 20, fontSize: 15, fontWeight: 700}}>domain-init 工作流程</h4>
          <div className="route-flow">
            <div className="route-step">
              <div className="route-num route-num-1">1</div>
              <div className="route-content">
                <h4>领域识别</h4>
                <p>扫描信号表（<code>package.json</code>、框架配置、目录结构），自动推断领域类型和技术栈。用户确认后进入下一步。</p>
              </div>
            </div>
            <div className="route-step">
              <div className="route-num route-num-2">2</div>
              <div className="route-content">
                <h4>Baseline 生成</h4>
                <p>多个 subAgent 并行采样真实代码（10-20 个文件），提取编码规范、测试策略、命名风格等约定。每条 rule 都有代码依据，不是通用模板话术。</p>
              </div>
            </div>
            <div className="route-step">
              <div className="route-num route-num-3">3</div>
              <div className="route-content">
                <h4>交互式增强</h4>
                <p>展示增强维度池（安全规范、性能优化、状态管理…），头脑风暴扩散后收拢。用户选择维度和优先级，subAgent 并行生成增强项。</p>
              </div>
            </div>
            <div className="route-step">
              <div className="route-num route-num-4">4</div>
              <div className="route-content">
                <h4>收尾</h4>
                <p>更新 <code>.harness/config.yml</code>、检查平台 symlink、同步子模块 skills、输出生成报告。</p>
              </div>
            </div>
          </div>
        </div>
        {/* 核心能力说明 */}
        <div className="dp-flow">
          <h4>核心机制</h4>
          <div className="dp-flow-steps">
            <div className="dp-flow-step" style={{borderColor: 'rgba(16,185,129,.3)'}}>代码驱动 — 基于真实采样</div>
            <span className="dp-flow-arrow">+</span>
            <div className="dp-flow-step" style={{borderColor: 'rgba(34,211,238,.3)', color: 'var(--cyan)'}}>并行扫描 — 多 subAgent 同时工作</div>
            <span className="dp-flow-arrow">+</span>
            <div className="dp-flow-step" style={{borderColor: 'rgba(167,139,250,.3)', color: 'var(--purple)'}}>Review 门禁 — 用户确认后才写入</div>
          </div>
        </div>
        {/* 产出示例 */}
        <p style={{fontSize: 13, color: 'var(--text-4)', margin: '32px 0 12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em'}}>◆ 产出示例</p>
        <div className="dp-layout">
          {/* Frontend */}
          <div className="dp-card dp-card-fe">
            <h4><span style={{fontSize: 18}}>◆</span> 前端领域包</h4>
            <ul className="dp-list">
              <li><span className="dp-type dp-type-rule">Rule</span> TypeScript 严格模式与导入规范</li>
              <li><span className="dp-type dp-type-rule">Rule</span> React 函数组件、Hooks、性能优化</li>
              <li><span className="dp-type dp-type-rule">Rule</span> Zustand 原子订阅、Store Slice 模式</li>
              <li><span className="dp-type dp-type-rule">Rule</span> UnoCSS 工具类与间距规范</li>
              <li><span className="dp-type dp-type-rule">Rule</span> 依赖管理、图片资产处理</li>
              <li><span className="dp-type dp-type-rule">Rule</span> Sentry 可观测性接入</li>
              <li><span className="dp-type dp-type-skill">Skill</span> frontend-code-reviewer — 前端代码审查</li>
              <li><span className="dp-type dp-type-skill">Skill</span> playwright-spec-writer — E2E 测试编写</li>
              <li><span className="dp-type dp-type-skill">Skill</span> e2e-case-designer — E2E 用例设计</li>
            </ul>
          </div>
          {/* Backend */}
          <div className="dp-card dp-card-be">
            <h4><span style={{fontSize: 18}}>◆</span> 后端领域包</h4>
            <ul className="dp-list">
              <li><span className="dp-type dp-type-rule">Rule</span> Java 8 + Spring Boot 代码风格</li>
              <li><span className="dp-type dp-type-rule">Rule</span> MyBatis 持久层与 XML 映射规范</li>
              <li><span className="dp-type dp-type-rule">Rule</span> API 契约设计规范</li>
              <li><span className="dp-type dp-type-rule">Rule</span> Apollo 运行时配置管理</li>
              <li><span className="dp-type dp-type-rule">Rule</span> 集成层与外部系统对接规范</li>
              <li><span className="dp-type dp-type-rule">Rule</span> 后端测试规范</li>
              <li><span className="dp-type dp-type-skill">Skill</span> gateway-code-reviewer — 后端代码审查</li>
              <li><span className="dp-type dp-type-skill">Skill</span> gateway-api-implementation — API 实现</li>
              <li><span className="dp-type dp-type-skill">Skill</span> jvm-request-diagnosis — JVM 请求诊断</li>
              <li><span className="dp-type dp-type-skill">Skill</span> gateway-java-codegen — Java 代码生成</li>
            </ul>
          </div>
        </div>
        {/* How review-orchestrator routes */}
        <div className="dp-flow">
          <h4>跨域协作：review-orchestrator 自动路由</h4>
          <div className="dp-flow-steps">
            <div className="dp-flow-step" style={{borderColor: 'rgba(16,185,129,.3)'}}>git diff 分析</div>
            <span className="dp-flow-arrow">→</span>
            <div className="dp-flow-step">判断变更范围</div>
            <span className="dp-flow-arrow">→</span>
            <div className="dp-flow-step" style={{borderColor: 'rgba(34,211,238,.3)', color: 'var(--cyan)'}}>仅前端 → frontend-code-reviewer</div>
            <span className="dp-flow-arrow" style={{margin: '4px 0'}}>/</span>
            <div className="dp-flow-step" style={{borderColor: 'rgba(167,139,250,.3)', color: 'var(--purple)'}}>仅后端 → gateway-code-reviewer</div>
            <span className="dp-flow-arrow" style={{margin: '4px 0'}}>/</span>
            <div className="dp-flow-step" style={{borderColor: 'rgba(251,191,36,.3)', color: 'var(--yellow)'}}>混合变更 → 两个 reviewer 并行</div>
          </div>
        </div>
        {/* Bottom note */}
        <div className="dp-note">
          <strong>代码即规范</strong> — domain-init 不生成通用最佳实践，而是从你的代码中提取真实约定。每个 subAgent 先采样代码、再对比开源标杆项目、最后标记团队内部不一致的地方并推荐统一方向。所有产出必须经 review 确认后才写入 <code>.harness/</code>。
        </div>
      </div>
    </section>
  )
}

function MultiPlatformSection(): React.JSX.Element {
  return (
    <section id="multi-platform" className="section-alt">
      <div className="container">
        <div className="tag">多平台</div>
        <h2 className="stitle">一份 AGENTS.md，五个平台</h2>
        <p className="sdesc">
          各平台入口文件仅做引用或转发，不重复内容。
        </p>
        <div className="plat-hub">
          <div className="plat-hub-badge">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            <code>AGENTS.md</code>
          </div>
          <div className="plat-hub-arrow">↓</div>
        </div>
        <div className="plat-grid">
          <div className="plat">
            <span className="plat-tag plat-tag-ref">@引用</span>
            <h4>Claude Code</h4>
            <p><code>CLAUDE.md</code></p>
            <p style={{marginTop: 4}}><code>@AGENTS.md</code></p>
          </div>
          <div className="plat">
            <span className="plat-tag plat-tag-ref">@引用</span>
            <h4>GitHub Copilot</h4>
            <p><code>.github/</code></p>
            <p style={{marginTop: 4}}><code>copilot-instructions.md</code></p>
          </div>
          <div className="plat">
            <span className="plat-tag plat-tag-native">原生加载</span>
            <h4>Codex CLI</h4>
            <p><code>AGENTS.md</code></p>
            <p style={{marginTop: 4}}>自动识别</p>
          </div>
          <div className="plat">
            <span className="plat-tag plat-tag-native">原生加载</span>
            <h4>Cursor</h4>
            <p><code>AGENTS.md</code></p>
            <p style={{marginTop: 4}}>自动识别</p>
          </div>
          <div className="plat">
            <span className="plat-tag plat-tag-ref">@引用</span>
            <h4>Gemini CLI</h4>
            <p><code>GEMINI.md</code></p>
            <p style={{marginTop: 4}}>引导到 AGENTS.md</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function CliCommandsSection(): React.JSX.Element {
  return (
    <section id="cli">
      <div className="container">
        <div className="tag">CLI 命令</div>
        <h2 className="stitle">五个脚手架命令</h2>
        <p className="sdesc">只做项目初始化和维护，不做运行时编排。</p>
        <div className="cli-grid">
          <div className="cli-item"><code className="cmd mono">devkeel init</code><span className="desc">交互式初始化：元信息、openspec/、通用基线包</span></div>
          <div className="cli-item"><code className="cmd mono">devkeel update</code><span className="desc">增量更新通用 skills / rules / schemas</span></div>
          <div className="cli-item"><code className="cmd mono">devkeel submodule</code><span className="desc">为子模块生成领域配置：AGENTS.md + skills + rules</span></div>
          <div className="cli-item"><code className="cmd mono">devkeel migrate</code><span className="desc">将旧知识产物搬运到 openspec/archive/</span></div>
          <div className="cli-item" style={{gridColumn: '1/-1', maxWidth: 'calc(50% - 6px)'}}><code className="cmd mono">devkeel doctor</code><span className="desc">检查目录结构、AGENTS.md、入口文件是否就绪</span></div>
        </div>
      </div>
    </section>
  )
}

function ArchitectureFooter(): React.JSX.Element {
  return (
    <footer>
      <div className="container">
        <p style={{fontSize: 14, color: 'var(--text-3)', marginBottom: 8}}>
          <a href="./index.html">首页</a> · <a href="./workflow.html">工作流</a> · <a href="./best-practices.html">最佳实践</a> · <a href="../changelog.html">变更日志</a>
        </p>
        <p>DevKeel — 编排 · 规范 · 沉淀，AI 协作的项目知识框架。</p>
      </div>
    </footer>
  )
}
