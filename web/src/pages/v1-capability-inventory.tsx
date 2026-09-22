import { PageFrame } from '../components/PageFrame'
import { usePageInteractions } from '../interactions/usePageInteractions'

const styles = [
  `:root {
    --bg: #0a0e14; --surface: #131920; --surface-2: #1a2230; --border: #253040;
    --text: #e6edf3; --muted: #7b8da0; --accent: #58a6ff; --accent-glow: #58a6ff30;
    --green: #3fb950; --yellow: #d29922; --red: #f85149; --purple: #bc8cff;
    --orange: #f0883e; --teal: #39d353; --cyan: #56d4dd;
    --radius: 10px; --radius-sm: 6px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    background: var(--bg); color: var(--text); line-height: 1.6;
    padding: 2.5rem; min-height: 100vh;
    background-image: radial-gradient(ellipse at 50% 0%, #1a2a4020 0%, transparent 70%);
  }

  /* Header */
  .header { margin-bottom: 2.5rem; position: relative; }
  .header::after {
    content: ''; position: absolute; bottom: -1rem; left: 0; right: 0;
    height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent);
  }
  h1 {
    font-size: 2rem; font-weight: 700;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .subtitle { color: var(--muted); margin-top: .35rem; font-size: .95rem; letter-spacing: .02em; }

  h2 {
    font-size: 1.25rem; margin: 2.5rem 0 1rem; color: var(--accent);
    border-bottom: 1px solid var(--border); padding-bottom: .5rem;
    display: flex; align-items: center; gap: .5rem;
  }
  h2::before { content: ''; width: 3px; height: 1.1em; background: var(--accent); border-radius: 2px; }
  h3 { font-size: 1.05rem; margin: 1.8rem 0 .6rem; color: var(--purple); }

  /* Stats Cards */
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .75rem; margin-bottom: 2.5rem; }
  .stat {
    background: linear-gradient(135deg, var(--surface), var(--surface-2));
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 1.1rem 1.3rem; position: relative; overflow: hidden;
    transition: transform .2s, border-color .2s, box-shadow .2s;
  }
  .stat:hover {
    transform: translateY(-2px); border-color: var(--accent);
    box-shadow: 0 8px 24px -8px var(--accent-glow);
  }
  .stat::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--accent), var(--purple));
    opacity: 0; transition: opacity .2s;
  }
  .stat:hover::before { opacity: 1; }
  .stat .num { font-size: 2rem; font-weight: 700; color: var(--accent); line-height: 1.2; }
  .stat .label { color: var(--muted); font-size: .8rem; margin-top: .15rem; }

  /* Tabs */
  .tabs {
    display: flex; gap: 0; margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border); position: relative;
    overflow-x: auto; -webkit-overflow-scrolling: touch;
  }
  .tab {
    padding: .6rem 1.3rem; cursor: pointer; color: var(--muted);
    border-bottom: 2px solid transparent; margin-bottom: -2px;
    transition: all .2s; font-size: .9rem; white-space: nowrap;
    user-select: none; position: relative;
  }
  .tab:hover { color: var(--text); background: var(--surface); border-radius: var(--radius-sm) var(--radius-sm) 0 0; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
  .tab-content { display: none; animation: fadeIn .3s ease; }
  .tab-content.active { display: block; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  /* Tables */
  table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 1.5rem; font-size: .85rem; border-radius: var(--radius); border: 1px solid var(--border); }
  th, td { padding: .55rem .75rem; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }
  th { background: var(--surface-2); color: var(--accent); font-weight: 600; position: sticky; top: 0; z-index: 2; font-size: .8rem; text-transform: uppercase; letter-spacing: .04em; }
  tr:first-child th:first-child { border-radius: var(--radius) 0 0 0; }
  tr:first-child th:last-child { border-radius: 0 var(--radius) 0 0; }
  tr:last-child td:first-child { border-radius: 0 0 0 var(--radius); }
  tr:last-child td:last-child { border-radius: 0 0 var(--radius) 0; }
  td { background: var(--surface); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--surface-2); }
  tbody tr { transition: background .15s; }

  /* Badges */
  .badge { display: inline-flex; align-items: center; gap: .3rem; padding: 2px 10px; border-radius: 12px; font-size: .75rem; font-weight: 500; white-space: nowrap; }
  .b-green { background: #23863618; color: var(--green); border: 1px solid #23863640; }
  .b-yellow { background: #d2992218; color: var(--yellow); border: 1px solid #d2992240; }
  .b-red { background: #f8514918; color: var(--red); border: 1px solid #f8514940; }
  .b-purple { background: #bc8cff18; color: var(--purple); border: 1px solid #bc8cff40; }
  .b-blue { background: #58a6ff18; color: var(--accent); border: 1px solid #58a6ff40; }
  .b-orange { background: #f0883e18; color: var(--orange); border: 1px solid #f0883e40; }
  .b-muted { background: #8b949e10; color: var(--muted); border: 1px solid #8b949e25; }
  .b-cyan { background: #56d4dd18; color: var(--cyan); border: 1px solid #56d4dd40; }

  /* Flow Steps */
  .flow-row { display: flex; align-items: center; gap: .3rem; flex-wrap: wrap; margin: .3rem 0; }
  .flow-step {
    padding: 3px 10px; border-radius: var(--radius-sm); font-size: .75rem;
    white-space: nowrap; cursor: default; position: relative;
    transition: transform .15s, box-shadow .15s;
  }
  .flow-step:hover { transform: translateY(-1px); }
  .flow-step.required { font-weight: 600; }
  .flow-step.optional { opacity: .75; font-style: italic; }
  .flow-arrow { color: var(--muted); font-size: .65rem; }

  /* Tooltip */
  .flow-step[data-tooltip] { cursor: help; }
  .flow-step[data-tooltip]:hover { z-index: 100; }
  .tooltip {
    display: none; position: absolute; top: calc(100% + 8px); left: 50%;
    transform: translateX(-50%); background: var(--surface-2); color: var(--text);
    border: 1px solid var(--accent); border-radius: var(--radius-sm);
    padding: .5rem .75rem; font-size: .78rem; white-space: normal;
    min-width: 180px; max-width: 280px; line-height: 1.5;
    box-shadow: 0 8px 24px -4px rgba(0,0,0,.5); pointer-events: none;
    z-index: 200; font-style: normal; font-weight: 400;
  }
  .tooltip::after {
    content: ''; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
    border: 6px solid transparent; border-bottom-color: var(--accent);
  }
  .tooltip .tip-title { font-weight: 600; color: var(--accent); margin-bottom: .25rem; display: block; }
  .tooltip .tip-provider { font-size: .7rem; color: var(--muted); margin-top: .25rem; display: block; }
  .flow-step[data-tooltip]:hover .tooltip { display: block; }

  /* Misc */
  code { background: var(--surface-2); padding: 2px 7px; border-radius: 4px; font-size: .8rem; color: var(--orange); font-family: 'SF Mono', 'Fira Code', monospace; }
  .note { color: var(--muted); font-size: .82rem; margin-top: .5rem; padding: .5rem .75rem; background: var(--surface); border-left: 3px solid var(--accent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
  .check { color: var(--green); }
  .cross { color: var(--red); }
  .dash { color: var(--muted); }
  .unused { background: #f8514908; }
  .section { margin-bottom: 3rem; }

  /* Scenario Pipeline */
  .pipeline {
    display: flex; align-items: center; gap: .2rem; flex-wrap: wrap;
    margin: 1rem 0; padding: .75rem 1rem; background: var(--surface);
    border: 1px solid var(--border); border-radius: var(--radius);
  }
  .pipeline .stage-chip {
    padding: 4px 12px; border-radius: 20px; font-size: .8rem; font-weight: 500;
    transition: transform .15s, box-shadow .15s; cursor: default; position: relative;
  }
  .pipeline .stage-chip:hover { transform: scale(1.05); }
  .pipeline .stage-chip.skippable { opacity: .6; border-style: dashed; }
  .pipeline .pipe-arrow { color: var(--muted); font-size: .6rem; margin: 0 .1rem; }

  /* Adapter header card */
  .adapter-header {
    display: flex; align-items: center; gap: .75rem; padding: .75rem 1rem;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    margin: 1.5rem 0 .75rem;
  }
  .adapter-header .adapter-count { font-size: .8rem; color: var(--muted); margin-left: auto; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }

  @media (max-width: 768px) {
    body { padding: 1rem; }
    h1 { font-size: 1.5rem; }
    .stats { grid-template-columns: repeat(3, 1fr); }
    table { font-size: .78rem; }
    .tooltip { min-width: 150px; max-width: 220px; left: 0; transform: none; }
    .tooltip::after { left: 20px; }
  }`,
]

const externalStyles: string[] = []

export function V1CapabilityInventoryPage(): React.JSX.Element {
  const { handleAction } = usePageInteractions('v1-capability-inventory')

  return (
    <PageFrame pageId="v1-capability-inventory" title="DevKeel v1.4 能力清单" description="" styles={styles} externalStyles={externalStyles} onAction={handleAction}>
      <div>
        <div className="header">
          <h1>DevKeel v1.4 能力清单</h1>
          <p className="subtitle">5 个适配器 / 6 个配置工具 / 12 个阶段 / 3 个场景 / 62 项独立能力</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="num">5</div><div className="label">适配器</div></div>
          <div className="stat"><div className="num">6</div><div className="label">配置工具</div></div>
          <div className="stat"><div className="num">12</div><div className="label">工作阶段</div></div>
          <div className="stat"><div className="num">3</div><div className="label">开发场景</div></div>
          <div className="stat"><div className="num">62</div><div className="label">适配器能力</div></div>
          <div className="stat"><div className="num">32</div><div className="label">配置流程步骤</div></div>
        </div>
        <div className="tabs">
          <div className="tab active" data-action="showTab('adapters', this)">适配器</div>
          <div className="tab" data-action="showTab('config', this)">配置流程</div>
          <div className="tab" data-action="showTab('matrix', this)">阶段 × 能力</div>
          <div className="tab" data-action="showTab('scenarios', this)">场景管道</div>
          <div className="tab" data-action="showTab('unused', this)">差距分析</div>
        </div>
        {/* ==================== TAB: ADAPTERS ==================== */}
        <div id="tab-adapters" className="tab-content active section">
          <h2>适配器能力注册表</h2>
          <p className="note">每个适配器声明自己能提供的能力（capabilities），由 config.yml 的 tools 节引用。</p>
          <div className="adapter-header">
            <span className="badge b-blue">openspec</span>
            <strong>OpenSpec — 规范驱动的变更管理</strong>
            <span className="adapter-count">12 项能力</span>
          </div>
          <table>
            <tbody><tr><th>能力 ID</th><th>Kind</th><th>调用方式</th><th>适用阶段</th><th>用途说明</th></tr>
              <tr><td>context.explore</td><td>slash-command</td><td><code>/opsx:explore</code></td><td>需求、设计、计划、审查</td><td>探索已有规范、变更和归档</td></tr>
              <tr><td>context.onboard</td><td>slash-command</td><td><code>/opsx:onboard</code></td><td>需求、设计</td><td>初始化 OpenSpec 项目上下文</td></tr>
              <tr><td>change.new</td><td>slash-command</td><td><code>/opsx:new</code></td><td>需求</td><td>创建 change 并初始化 Living brainstorm</td></tr>
              <tr><td>change.fast-forward</td><td>slash-command</td><td><code>/opsx:ff</code></td><td>设计、计划</td><td>在快照确认后快速投影 Apply 前置产物</td></tr>
              <tr><td>change.refine</td><td>slash-command</td><td><code>/opsx:continue</code></td><td>需求、设计、计划</td><td>继续完善提案 / 设计 / 任务 / 规范</td></tr>
              <tr><td>change.apply</td><td>slash-command</td><td><code>/opsx:apply</code></td><td>implement</td><td>根据变更任务执行实现</td></tr>
              <tr><td>change.verify</td><td>slash-command</td><td><code>/opsx:verify</code></td><td>verify</td><td>验证实现是否满足产物要求</td></tr>
              <tr><td>change.sync</td><td>slash-command</td><td><code>/opsx:sync</code></td><td>计划、验证、复盘</td><td>同步增量规范到当前规范</td></tr>
              <tr><td>change.archive</td><td>slash-command</td><td><code>/opsx:archive</code></td><td>复盘</td><td>归档已完成的变更</td></tr>
              <tr><td>change.bulk-archive</td><td>slash-command</td><td><code>/opsx:bulk-archive</code></td><td>复盘</td><td>批量归档多个已完成变更</td></tr>
              <tr><td>artifact.update-instructions</td><td>cli-command</td><td><code>openspec update</code></td><td>需求、设计、计划</td><td>刷新 OpenSpec Agent 指令</td></tr>
              <tr><td>workflow.status</td><td>cli-command</td><td><code>openspec list</code></td><td>全部</td><td>查看活跃变更列表</td></tr>
            </tbody></table>
          <div className="adapter-header">
            <span className="badge b-purple">omc</span>
            <strong>oh-my-claudecode — 智能多代理编排</strong>
            <span className="adapter-count">30 项能力</span>
          </div>
          <table>
            <tbody><tr><th>能力 ID</th><th>Kind</th><th>调用方式</th><th>适用阶段</th><th>用途说明</th></tr>
              <tr><td>context.onboard</td><td>skill</td><td><code>/setup</code></td><td>需求、设计、计划</td><td>安装或刷新 OMC 插件</td></tr>
              <tr><td>change.propose</td><td>skill</td><td><code>/deep-interview</code></td><td>需求、设计</td><td>苏格拉底式访谈，深度澄清需求</td></tr>
              <tr><td>plan.create</td><td>skill</td><td><code>/ralplan</code></td><td>plan</td><td>形成架构与实施计划</td></tr>
              <tr><td>plan.review</td><td>skill</td><td><code>/ralplan</code></td><td>计划、审查</td><td>迭代达成计划共识</td></tr>
              <tr><td>context.explore</td><td>agent</td><td><code>explore</code></td><td>需求、设计、计划、审查</td><td>快速探索代码库结构</td></tr>
              <tr><td>context.search-docs</td><td>agent</td><td><code>document-specialist</code></td><td>设计、实现、验证</td><td>查询外部文档与参考资料</td></tr>
              <tr><td>design.architecture</td><td>agent</td><td><code>architect</code></td><td>design</td><td>分析架构边界与风险</td></tr>
              <tr><td>design.review</td><td>agent</td><td><code>critic</code></td><td>设计、审查</td><td>审查方案质量与合理性</td></tr>
              <tr><td>plan.decompose</td><td>agent</td><td><code>planner</code></td><td>任务、计划</td><td>拆分为可执行的子任务</td></tr>
              <tr><td>implementation.autonomous</td><td>skill</td><td><code>/autopilot</code></td><td>implement</td><td>从需求到代码全自动执行</td></tr>
              <tr><td>implementation.execute</td><td>skill</td><td><code>/ralph</code></td><td>implement</td><td>持久化完成循环，直到任务完成</td></tr>
              <tr><td>implementation.parallel</td><td>skill</td><td><code>/ultrawork</code></td><td>任务、实现</td><td>并行处理多个独立任务</td></tr>
              <tr><td>implementation.fix</td><td>agent</td><td><code>debugger</code></td><td>诊断、实现、验证</td><td>定位并修复问题</td></tr>
              <tr><td>verification.cycle</td><td>skill</td><td><code>/ultraqa</code></td><td>verify</td><td>测试→诊断→修复循环</td></tr>
              <tr><td>verification.acceptance</td><td>agent</td><td><code>verifier</code></td><td>verify</td><td>对照需求进行验收</td></tr>
              <tr><td>review.code</td><td>agent</td><td><code>code-reviewer</code></td><td>review</td><td>代码缺陷与质量审查</td></tr>
              <tr><td>review.security</td><td>agent</td><td><code>security-reviewer</code></td><td>review</td><td>安全风险审查</td></tr>
              <tr><td>review.test-coverage</td><td>agent</td><td><code>test-engineer</code></td><td>审查、验证</td><td>测试覆盖率审查</td></tr>
              <tr><td>review.visual</td><td>skill</td><td><code>/visual-verdict</code></td><td>审查、验证</td><td>视觉实现评审</td></tr>
              <tr><td>workflow.team</td><td>skill</td><td><code>/team</code></td><td>任务、实现、验证</td><td>会话内多代理团队协作</td></tr>
              <tr><td>workflow.team-cli</td><td>cli-command</td><td><code>omc team</code></td><td>任务、实现、验证、审查</td><td>tmux CLI 工作者模式</td></tr>
              <tr><td>workflow.ask-expert</td><td>skill</td><td><code>/ask</code></td><td>设计、计划、审查</td><td>调用外部专家模型</td></tr>
              <tr><td>workflow.tri-model</td><td>skill</td><td><code>/ccg</code></td><td>设计、计划、审查</td><td>Codex + Gemini + Claude 综合审查</td></tr>
              <tr><td>workflow.cancel</td><td>skill</td><td><code>cancelomc</code></td><td>全部</td><td>取消当前工作流</td></tr>
              <tr><td>workflow.status</td><td>cli-command</td><td><code>omc wait</code></td><td>实现、验证、观测</td><td>查看运行状态</td></tr>
              <tr><td>workflow.observe</td><td>cli-command</td><td><code>omc hud</code></td><td>实现、验证、观测</td><td>HUD 实时观察面板</td></tr>
              <tr><td>workflow.resume</td><td>cli-command</td><td><code>omc wait --start</code></td><td>实现、验证</td><td>自动恢复中断的工作</td></tr>
              <tr><td>artifact.update-instructions</td><td>cli-command</td><td><code>omc setup</code></td><td>全部</td><td>刷新项目指引文件</td></tr>
              <tr><td>workflow.skill-manage</td><td>skill</td><td><code>/skill list</code></td><td>实现、验证、审查</td><td>管理 OMC 技能列表</td></tr>
              <tr><td>workflow.skill-extract</td><td>skill</td><td><code>/skillify</code></td><td>复盘</td><td>提取可复用技能</td></tr>
            </tbody></table>
          <div className="adapter-header">
            <span className="badge b-green">superpowers</span>
            <strong>Superpowers — 方法论与过程指导</strong>
            <span className="adapter-count">10 项能力</span>
          </div>
          <table>
            <tbody><tr><th>能力 ID</th><th>Kind</th><th>调用方式</th><th>适用阶段</th><th>用途说明</th></tr>
              <tr><td>context.explore</td><td>skill</td><td><code>ask</code></td><td>设计、计划、审查</td><td>辅助理解代码和设计背景</td></tr>
              <tr><td>change.propose</td><td>skill</td><td><code>brainstorming</code></td><td>需求、设计</td><td>结构化澄清意图、约束和方向</td></tr>
              <tr><td>design.architecture</td><td>skill</td><td><code>brainstorming</code></td><td>design</td><td>发散与收敛式架构探索</td></tr>
              <tr><td>plan.create</td><td>skill</td><td><code>writing-plans</code></td><td>plan</td><td>编写可执行的实施计划</td></tr>
              <tr><td>implementation.execute</td><td>skill</td><td><code>tdd-workflow</code></td><td>implement</td><td>TDD 流程指导实现</td></tr>
              <tr><td>implementation.parallel</td><td>skill</td><td><code>subagent-driven-development</code></td><td>任务、实现</td><td>子代理并行执行策略</td></tr>
              <tr><td>implementation.fix</td><td>skill</td><td><code>systematic-debugging</code></td><td>诊断、实现、验证</td><td>系统化调试方法</td></tr>
              <tr><td>verification.before-completion</td><td>skill</td><td><code>verification-before-completion</code></td><td>验证、审查</td><td>完成前收集验证证据</td></tr>
              <tr><td>review.code</td><td>skill</td><td><code>requesting-code-review</code></td><td>review</td><td>发起代码审查请求</td></tr>
              <tr><td>review.architecture</td><td>skill</td><td><code>receiving-code-review</code></td><td>review</td><td>处理并响应评审反馈</td></tr>
            </tbody></table>
          <div className="adapter-header">
            <span className="badge b-orange">omx</span>
            <strong>oh-my-codex — Codex 运行时编排</strong>
            <span className="adapter-count">24 项能力</span>
          </div>
          <table>
            <tbody><tr><th>能力 ID</th><th>Kind</th><th>调用方式</th><th>适用阶段</th><th>用途说明</th></tr>
              <tr><td>context.onboard</td><td>cli-command</td><td><code>omx setup</code></td><td>需求、设计、计划</td><td>安装或刷新 Codex 配置</td></tr>
              <tr><td>context.explore</td><td>cli-command</td><td><code>omx explore</code></td><td>需求、设计、计划、审查</td><td>只读探索代码仓库</td></tr>
              <tr><td>context.search-docs</td><td>cli-command</td><td><code>omx explore</code></td><td>设计、实现、验证</td><td>查找文档上下文</td></tr>
              <tr><td>change.propose</td><td>skill</td><td><code>$deep-interview</code></td><td>需求、设计</td><td>深度澄清需求和边界</td></tr>
              <tr><td>plan.create / review / decompose</td><td>skill</td><td><code>$ralplan</code></td><td>计划、任务</td><td>计划创建 / 审查 / 拆分</td></tr>
              <tr><td>implementation.autonomous / execute</td><td>skill</td><td><code>$ralph</code></td><td>implement</td><td>持久化完成循环</td></tr>
              <tr><td>implementation.parallel</td><td>skill</td><td><code>$team</code></td><td>任务、实现</td><td>并行执行多项任务</td></tr>
              <tr><td>implementation.fix</td><td>cli-command</td><td><code>omx sparkshell</code></td><td>诊断、实现、验证</td><td>Shell 原生检查与修复</td></tr>
              <tr><td>verification.test / build / lint</td><td>cli-command</td><td><code>omx sparkshell</code></td><td>验证、部署</td><td>有界验证输出</td></tr>
              <tr><td>verification.acceptance</td><td>cli-command</td><td><code>omx exec</code></td><td>verify</td><td>Codex 运行时验证</td></tr>
              <tr><td>workflow.team / resume / cancel / status / observe</td><td>cli-command</td><td><code>omx team / cancel / doctor / hud</code></td><td>多个阶段</td><td>团队与状态管理</td></tr>
              <tr><td>workflow.multi-goal</td><td>skill</td><td><code>$ultragoal</code></td><td>计划、任务、实现</td><td>多目标切换执行</td></tr>
              <tr><td>artifact.update-instructions / archive / publish</td><td>cli-command</td><td><code>omx update / wiki</code></td><td>多个阶段</td><td>指令刷新与知识库管理</td></tr>
            </tbody></table>
          <div className="adapter-header">
            <span className="badge b-yellow">agent-skills</span>
            <strong>Agent Skills — 领域专项技能</strong>
            <span className="adapter-count">16 项能力</span>
          </div>
          <table>
            <tbody><tr><th>能力 ID</th><th>Kind</th><th>调用方式</th><th>适用阶段</th><th>用途说明</th></tr>
              <tr><td>verification.design</td><td>skill</td><td><code>test-driven-development</code></td><td>实现、验证</td><td>TDD 方法论（Beyoncé 规则、80/15/5 比例）</td></tr>
              <tr><td>verification.browser</td><td>skill</td><td><code>browser-testing-with-devtools</code></td><td>verify</td><td>Chrome DevTools 浏览器端验证</td></tr>
              <tr><td>review.code</td><td>skill</td><td><code>code-review-and-quality</code></td><td>review</td><td>五轴代码审查体系</td></tr>
              <tr><td>review.security</td><td>skill</td><td><code>security-and-hardening</code></td><td>review</td><td>安全加固（OWASP 标准）</td></tr>
              <tr><td>review.performance</td><td>skill</td><td><code>performance-optimization</code></td><td>审查、验证</td><td>性能优化（Core Web Vitals）</td></tr>
              <tr><td>review.simplification</td><td>skill</td><td><code>code-simplification</code></td><td>review</td><td>代码简化与可维护性提升</td></tr>
              <tr><td>ship.checklist</td><td>skill</td><td><code>shipping-and-launch</code></td><td>部署</td><td>上线前检查清单</td></tr>
              <tr><td>debug.diagnose</td><td>skill</td><td><code>debugging-and-error-recovery</code></td><td>诊断、实现、验证</td><td>五步排障法</td></tr>
              <tr><td>implementation.tdd</td><td>skill</td><td><code>test-driven-development</code></td><td>implement</td><td>TDD 增量实现</td></tr>
              <tr><td>implementation.incremental</td><td>skill</td><td><code>incremental-implementation</code></td><td>implement</td><td>纵向切片式增量开发</td></tr>
              <tr><td>implementation.doubt</td><td>skill</td><td><code>doubt-driven-development</code></td><td>实现、验证</td><td>怀疑驱动开发</td></tr>
              <tr><td>design.api</td><td>skill</td><td><code>api-and-interface-design</code></td><td>design</td><td>API 设计（Hyrum 定律）</td></tr>
              <tr><td>plan.decompose</td><td>skill</td><td><code>planning-and-task-breakdown</code></td><td>计划、任务</td><td>任务分解策略</td></tr>
              <tr><td>ship.deprecation</td><td>skill</td><td><code>deprecation-and-migration</code></td><td>部署、实现</td><td>废弃与迁移策略</td></tr>
              <tr><td>ship.cicd</td><td>skill</td><td><code>ci-cd-and-automation</code></td><td>部署</td><td>CI/CD 管道设计</td></tr>
              <tr><td>artifact.adr</td><td>skill</td><td><code>documentation-and-adrs</code></td><td>设计、复盘</td><td>架构决策记录纪律</td></tr>
            </tbody></table>
        </div>
        {/* ==================== TAB: CONFIG FLOW ==================== */}
        <div id="tab-config" className="tab-content section">
          <h2>配置流程（当前项目实际配置）</h2>
          <p className="note">每个阶段的流程步骤按顺序执行。<strong>粗体</strong> = 必选步骤，<em>斜体</em> = 可选步骤。悬停步骤查看详细说明。</p>
          <table>
            <tbody><tr><th>阶段</th><th>启用</th><th>工具</th><th>技能</th><th>流程步骤</th><th>解析后的提供者</th></tr>
              <tr>
                <td><span className="badge b-blue">prd（需求分析）</span></td><td className="check">✓</td><td>openspec</td><td>stage-prd</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">context.explore</span>探索已有规范、变更记录和归档产物，为需求分析提供上下文<span className="tip-provider">提供者: openspec</span></span>context.explore</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">change.new</span>创建新的变更单元，初始化变更跟踪流程<span className="tip-provider">提供者: openspec</span></span>change.new</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">change.refine</span>通过 Living brainstorm 一次确认一个决定<span className="tip-provider">提供者: openspec</span></span>change.refine</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">artifact.publish</span>将阶段产物发布到 wiki/ 目录供团队查阅<span className="tip-provider">提供者: DevKeel</span></span>artifact.publish</span>
                  </div>
                </td>
                <td>openspec → openspec → openspec → DevKeel</td>
              </tr>
              <tr>
                <td><span className="badge b-muted">uidesign（UI 设计）</span></td><td className="dash">—</td><td>figma-mcp</td><td>stage-uidesign</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">design.interaction</span>设计交互原型和 UI 布局，定义用户操作流程<span className="tip-provider">提供者: figma-mcp</span></span>design.interaction</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">artifact.publish</span>将设计产物发布到 wiki/ 目录供团队查阅<span className="tip-provider">提供者: DevKeel</span></span>artifact.publish</span>
                  </div>
                </td>
                <td><em>已禁用</em></td>
              </tr>
              <tr>
                <td><span className="badge b-blue">design（技术设计）</span></td><td className="check">✓</td><td>openspec</td><td>stage-design</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">context.explore</span>探索现有代码架构和设计文档，了解系统现状<span className="tip-provider">提供者: openspec</span></span>context.explore</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">change.refine</span>把已确认决定封闭投影为技术视图<span className="tip-provider">提供者: openspec</span></span>change.refine</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">design.architecture</span>深度分析架构边界、模块依赖和潜在风险<span className="tip-provider">提供者: 未配置</span></span>design.architecture</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">design.api</span>设计 API 接口，遵循 Hyrum 定律考量兼容性<span className="tip-provider">提供者: 未配置</span></span>design.api</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">design.review</span>审查方案的质量、合理性和可行性<span className="tip-provider">提供者: 未配置</span></span>design.review</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">artifact.publish</span>将设计产物发布到 wiki/ 目录供团队查阅<span className="tip-provider">提供者: DevKeel</span></span>artifact.publish</span>
                  </div>
                </td>
                <td>openspec → openspec → 未配置 → 未配置 → 未配置 → DevKeel</td>
              </tr>
              <tr>
                <td><span className="badge b-blue">plan（执行计划）</span></td><td className="check">✓</td><td>openspec</td><td>stage-plan</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">change.refine</span>将已确认方案机械拆分为可验证任务<span className="tip-provider">提供者: openspec</span></span>change.refine</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">plan.review</span>迭代审查计划的完整性和可执行性<span className="tip-provider">提供者: 未配置</span></span>plan.review</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">artifact.publish</span>将计划产物发布到 wiki/ 目录供团队查阅<span className="tip-provider">提供者: DevKeel</span></span>artifact.publish</span>
                  </div>
                </td>
                <td>openspec → 未配置 → DevKeel</td>
              </tr>
              <tr>
                <td><span className="badge b-orange">diagnose（问题诊断）</span></td><td className="check">✓</td><td>auto</td><td>stage-diagnose</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">context.explore</span>快速探索相关代码和日志，收集问题线索<span className="tip-provider">提供者: openspec</span></span>context.explore</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">debug.diagnose</span>运用五步排障法系统化定位根因<span className="tip-provider">提供者: agent-skills</span></span>debug.diagnose</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">implementation.fix</span>基于诊断结果实施修复方案<span className="tip-provider">提供者: omc</span></span>implementation.fix</span>
                  </div>
                </td>
                <td>openspec → agent-skills → omc</td>
              </tr>
              <tr>
                <td><span className="badge b-purple">task（任务拆分）</span></td><td className="check">✓</td><td>omc</td><td>stage-task</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">plan.decompose</span>将执行计划拆分为可独立执行的子任务<span className="tip-provider">提供者: omc</span></span>plan.decompose</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">workflow.team</span>将子任务分配给多个代理并行执行<span className="tip-provider">提供者: omc</span></span>workflow.team</span>
                  </div>
                </td>
                <td>omc → omc</td>
              </tr>
              <tr>
                <td><span className="badge b-purple">implement（代码实现）</span></td><td className="check">✓</td><td>omc</td><td>stage-implement</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">change.apply</span>根据 OpenSpec 变更任务中的定义执行代码实现<span className="tip-provider">提供者: openspec</span></span>change.apply</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">implementation.execute</span>启动持久化执行循环，持续推进直到实现完成<span className="tip-provider">提供者: omc</span></span>implementation.execute</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">verification.test</span>运行测试套件验证实现的正确性<span className="tip-provider">提供者: omc</span></span>verification.test</span>
                  </div>
                </td>
                <td>openspec → omc → omc</td>
              </tr>
              <tr>
                <td><span className="badge b-purple">verify（测试验证）</span></td><td className="check">✓</td><td>omc</td><td>stage-verify</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">change.verify</span>对照 OpenSpec 产物验证实现是否满足规范要求<span className="tip-provider">提供者: openspec</span></span>change.verify</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">verification.design</span>使用 TDD 方法论验证测试设计的完整性<span className="tip-provider">提供者: agent-skills</span></span>verification.design</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">verification.browser</span>使用 Chrome DevTools 在浏览器端进行端到端验证<span className="tip-provider">提供者: agent-skills</span></span>verification.browser</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">verification.cycle</span>执行测试→诊断→修复的迭代循环直到全部通过<span className="tip-provider">提供者: omc</span></span>verification.cycle</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">verification.before-completion</span>完成前最终检查，收集可观察的验证证据<span className="tip-provider">提供者: superpowers</span></span>verification.before-completion</span>
                  </div>
                </td>
                <td>openspec → agent-skills → agent-skills → omc → superpowers</td>
              </tr>
              <tr>
                <td><span className="badge b-yellow">review（代码审查）</span></td><td className="check">✓</td><td>review-agent</td><td>stage-review</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">review.code</span>全面审查代码质量、逻辑正确性和设计合理性<span className="tip-provider">提供者: review-agent</span></span>review.code</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">review.security</span>检查安全漏洞，遵循 OWASP 标准进行安全审计<span className="tip-provider">提供者: agent-skills</span></span>review.security</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">review.performance</span>审查性能瓶颈，关注 Core Web Vitals 指标<span className="tip-provider">提供者: agent-skills</span></span>review.performance</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">review.test-coverage</span>审查测试覆盖率和测试质量<span className="tip-provider">提供者: review-agent</span></span>review.test-coverage</span>
                  </div>
                </td>
                <td>review-agent → agent-skills → agent-skills → review-agent</td>
              </tr>
              <tr>
                <td><span className="badge b-muted">deploy（部署发布）</span></td><td className="dash">—</td><td>项目部署工具</td><td>stage-deploy</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">ship.checklist</span>执行上线前检查清单，确认所有前置条件<span className="tip-provider">提供者: agent-skills</span></span>ship.checklist</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">verification.build</span>执行构建验证，确保产物可正确编译和打包<span className="tip-provider">提供者: 项目部署工具</span></span>verification.build</span>
                  </div>
                </td>
                <td><em>已禁用</em></td>
              </tr>
              <tr>
                <td><span className="badge b-green">observe（运行观测）</span></td><td className="check">✓</td><td>custom</td><td>stage-observe</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">artifact.publish</span>发布观测报告和运行指标到 wiki/ 目录<span className="tip-provider">提供者: DevKeel</span></span>artifact.publish</span>
                  </div>
                </td>
                <td>DevKeel</td>
              </tr>
              <tr>
                <td><span className="badge b-muted">retro（迭代复盘）</span></td><td className="dash">—</td><td>harness-retro</td><td>stage-retro</td>
                <td>
                  <div className="flow-row">
                    <span className="flow-step optional b-muted" data-tooltip><span className="tooltip"><span className="tip-title">change.archive</span>将已完成的变更归档，清理工作区<span className="tip-provider">提供者: openspec</span></span>change.archive</span>
                    <span className="flow-arrow">→</span>
                    <span className="flow-step required b-green" data-tooltip><span className="tooltip"><span className="tip-title">artifact.archive</span>归档本次迭代的所有产物和文档<span className="tip-provider">提供者: DevKeel</span></span>artifact.archive</span>
                  </div>
                </td>
                <td><em>已禁用</em></td>
              </tr>
            </tbody></table>
          <h3>提供者优先级（claude-code 环境）</h3>
          <table>
            <tbody><tr><th>优先级键</th><th>提供者</th><th>影响范围</th></tr>
              <tr><td>default</td><td>omc</td><td>所有未匹配能力的兜底提供者</td></tr>
              <tr><td>change</td><td>openspec</td><td>change.* 系列能力</td></tr>
              <tr><td>process</td><td>superpowers</td><td>方法论和过程类技能</td></tr>
              <tr><td>verification_design</td><td>agent-skills</td><td>verification.design 测试设计</td></tr>
              <tr><td>verification_run</td><td>omc</td><td>verification.test, verification.cycle 测试执行</td></tr>
              <tr><td>verification_browser</td><td>agent-skills</td><td>verification.browser 浏览器验证</td></tr>
              <tr><td>review_security</td><td>agent-skills</td><td>review.security 安全审查</td></tr>
              <tr><td>review_performance</td><td>agent-skills</td><td>review.performance 性能审查</td></tr>
              <tr><td>ship</td><td>agent-skills</td><td>ship.checklist, ship.cicd 发布相关</td></tr>
              <tr><td>debug</td><td>agent-skills</td><td>debug.diagnose 调试诊断</td></tr>
              <tr><td>artifact</td><td>DevKeel</td><td>artifact.publish, artifact.archive 产物管理</td></tr>
            </tbody></table>
        </div>
        {/* ==================== TAB: MATRIX ==================== */}
        <div id="tab-matrix" className="tab-content section">
          <h2>阶段 × 能力矩阵</h2>
          <p className="note">config.yml 流程中实际引用的能力，按阶段交叉展示。<span className="badge b-green">必</span> = 必选, <span className="badge b-muted">选</span> = 可选</p>
          <table>
            <tbody><tr>
                <th>能力</th>
                <th>prd</th><th>uidesign</th><th>design</th><th>plan</th><th>diagnose</th><th>task</th><th>implement</th><th>verify</th><th>review</th><th>deploy</th><th>observe</th><th>retro</th>
              </tr>
              <tr><td>context.explore</td><td><span className="badge b-muted">选</span></td><td /><td><span className="badge b-muted">选</span></td><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>change.new</td><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>change.refine</td><td><span className="badge b-green">必</span></td><td /><td><span className="badge b-green">必</span></td><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>change.apply</td><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /></tr>
              <tr><td>change.verify</td><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /></tr>
              <tr><td>change.archive</td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td></tr>
              <tr><td>design.interaction</td><td /><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>design.architecture</td><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>design.api</td><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>design.review</td><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>plan.decompose</td><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>plan.review</td><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>debug.diagnose</td><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>implementation.execute</td><td /><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /></tr>
              <tr><td>implementation.fix</td><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>verification.test</td><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /></tr>
              <tr><td>verification.design</td><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /></tr>
              <tr><td>verification.browser</td><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /></tr>
              <tr><td>verification.cycle</td><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /></tr>
              <tr><td>verification.before-completion</td><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /><td /><td /></tr>
              <tr><td>verification.build</td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /></tr>
              <tr><td>review.code</td><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td><td /><td /><td /></tr>
              <tr><td>review.security</td><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /></tr>
              <tr><td>review.performance</td><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /></tr>
              <tr><td>review.test-coverage</td><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /></tr>
              <tr><td>workflow.team</td><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /></tr>
              <tr><td>ship.checklist</td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /><td /></tr>
              <tr><td>artifact.publish</td><td><span className="badge b-muted">选</span></td><td><span className="badge b-muted">选</span></td><td><span className="badge b-muted">选</span></td><td><span className="badge b-muted">选</span></td><td /><td /><td /><td /><td /><td /><td><span className="badge b-muted">选</span></td><td /></tr>
              <tr><td>artifact.archive</td><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td /><td><span className="badge b-green">必</span></td></tr>
            </tbody></table>
        </div>
        {/* ==================== TAB: SCENARIOS ==================== */}
        <div id="tab-scenarios" className="tab-content section">
          <h2>场景管道</h2>
          <p className="note">? 后缀表示该阶段可跳过（虚线边框）。每个场景列出完整的阶段链和能力调用。</p>
          <h3><span className="badge b-green">feat</span> 新功能开发</h3>
          <div className="pipeline">
            <span className="stage-chip skippable b-muted">prd?</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-muted">uidesign?</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-blue">design</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-blue">plan</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">task</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">implement</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">verify</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-yellow">review</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-muted">deploy?</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-green">observe</span>
          </div>
          <table>
            <tbody><tr><th>阶段</th><th>工具</th><th>必选能力</th><th>可选能力</th></tr>
              <tr><td>prd?</td><td>openspec</td><td>change.new, change.refine</td><td>context.explore, artifact.publish</td></tr>
              <tr><td>uidesign?</td><td>figma-mcp</td><td>design.interaction</td><td>artifact.publish</td></tr>
              <tr><td>design</td><td>openspec</td><td>change.refine</td><td>context.explore, design.architecture, design.api, design.review, artifact.publish</td></tr>
              <tr><td>plan</td><td>openspec</td><td>change.refine</td><td>plan.review, artifact.publish</td></tr>
              <tr><td>task</td><td>omc</td><td>plan.decompose</td><td>workflow.team</td></tr>
              <tr><td>implement</td><td>omc</td><td>implementation.execute</td><td>change.apply, verification.test</td></tr>
              <tr><td>verify</td><td>omc</td><td>verification.before-completion</td><td>change.verify, verification.design, verification.browser, verification.cycle</td></tr>
              <tr><td>review</td><td>review-agent</td><td>review.code</td><td>review.security, review.performance, review.test-coverage</td></tr>
              <tr><td>deploy?</td><td>项目部署工具</td><td>verification.build</td><td>ship.checklist</td></tr>
              <tr><td>observe</td><td>custom</td><td /><td>artifact.publish</td></tr>
            </tbody></table>
          <h3><span className="badge b-orange">fix</span> 缺陷修复</h3>
          <div className="pipeline">
            <span className="stage-chip b-orange">diagnose</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-blue">design?</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">implement</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">verify</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-yellow">review</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-muted">deploy?</span>
          </div>
          <h3><span className="badge b-purple">refactor</span> 代码重构</h3>
          <div className="pipeline">
            <span className="stage-chip b-blue">design</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-blue">plan</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-purple">task?</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">implement</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-purple">verify</span><span className="pipe-arrow">→</span>
            <span className="stage-chip b-yellow">review</span><span className="pipe-arrow">→</span>
            <span className="stage-chip skippable b-muted">deploy?</span>
          </div>
        </div>
        {/* ==================== TAB: GAP ANALYSIS ==================== */}
        <div id="tab-unused" className="tab-content section">
          <h2>差距分析：适配器中未被配置引用的能力</h2>
          <p className="note">适配器已声明但 config.yml 流程中未引用的能力。这些是可以按需启用的潜在能力储备。</p>
          <h3>适配器已声明但配置未引用的能力</h3>
          <table>
            <tbody><tr><th>适配器</th><th>能力 ID</th><th>用途说明</th><th>未引用原因</th></tr>
              <tr className="unused"><td>openspec</td><td>context.onboard</td><td>初始化 OpenSpec 项目上下文</td><td>配置未包含入门引导流程</td></tr>
              <tr className="unused"><td>openspec</td><td>change.fast-forward</td><td>快照确认后快速投影</td><td>默认配置使用逐步 change.refine</td></tr>
              <tr className="unused"><td>openspec</td><td>change.sync</td><td>同步增量规范</td><td>配置未包含规范同步步骤</td></tr>
              <tr className="unused"><td>openspec</td><td>change.bulk-archive</td><td>批量归档</td><td>配置仅使用 change.archive</td></tr>
              <tr className="unused"><td>openspec</td><td>artifact.update-instructions</td><td>刷新 OpenSpec Agent 指令</td><td>配置用 devkeel sync 代替</td></tr>
              <tr className="unused"><td>openspec</td><td>workflow.status</td><td>查看活跃变更列表</td><td>配置用 devkeel openspec status 代替</td></tr>
              <tr className="unused"><td>omc</td><td>context.onboard</td><td>安装或刷新 OMC</td><td>初始化在配置外执行</td></tr>
              <tr className="unused"><td>omc</td><td>change.propose</td><td>深度访谈澄清需求</td><td>配置走 openspec 的 change.refine</td></tr>
              <tr className="unused"><td>omc</td><td>plan.create</td><td>形成实施计划</td><td>配置走 openspec 的 change.refine</td></tr>
              <tr className="unused"><td>omc</td><td>plan.review</td><td>审查计划</td><td>配置未指定计划审查提供者</td></tr>
              <tr className="unused"><td>omc</td><td>context.search-docs</td><td>查询外部文档</td><td>配置未包含文档查询步骤</td></tr>
              <tr className="unused"><td>omc</td><td>design.architecture</td><td>架构分析</td><td>设计阶段未配置提供者</td></tr>
              <tr className="unused"><td>omc</td><td>design.review</td><td>方案审查</td><td>设计阶段未配置提供者</td></tr>
              <tr className="unused"><td>omc</td><td>implementation.autonomous</td><td>全自动执行</td><td>配置用 implementation.execute 映射</td></tr>
              <tr className="unused"><td>omc</td><td>implementation.parallel</td><td>并行执行</td><td>配置未将其纳入流程步骤</td></tr>
              <tr className="unused"><td>omc</td><td>verification.acceptance</td><td>需求验收</td><td>配置未引用</td></tr>
              <tr className="unused"><td>omc</td><td>review.visual</td><td>视觉评审</td><td>配置未包含视觉审查步骤</td></tr>
              <tr className="unused"><td>omc</td><td>workflow.team-cli</td><td>tmux CLI 工作者</td><td>配置仅使用会话内团队模式</td></tr>
              <tr className="unused"><td>omc</td><td>workflow.ask-expert</td><td>调用外部专家</td><td>配置未包含</td></tr>
              <tr className="unused"><td>omc</td><td>workflow.tri-model</td><td>三模型综合审查</td><td>配置未包含</td></tr>
              <tr className="unused"><td>omc</td><td>workflow.observe / resume / skill-manage / skill-extract</td><td>运行时管理</td><td>非流程步骤，按需手动调用</td></tr>
              <tr className="unused"><td>superpowers</td><td>context.explore (ask)</td><td>辅助理解代码</td><td>配置走 openspec/omc 的 explore</td></tr>
              <tr className="unused"><td>superpowers</td><td>change.propose (brainstorming)</td><td>澄清意图</td><td>配置走 openspec 的 change.refine</td></tr>
              <tr className="unused"><td>superpowers</td><td>design.architecture (brainstorming)</td><td>发散收敛</td><td>设计阶段未配置提供者</td></tr>
              <tr className="unused"><td>superpowers</td><td>plan.create (writing-plans)</td><td>编写执行计划</td><td>配置走 openspec 的 change.refine</td></tr>
              <tr className="unused"><td>superpowers</td><td>implementation.execute (tdd-workflow)</td><td>TDD 实现</td><td>配置走 omc 的 autopilot</td></tr>
              <tr className="unused"><td>superpowers</td><td>implementation.parallel</td><td>子代理并行</td><td>配置未包含</td></tr>
              <tr className="unused"><td>superpowers</td><td>review.code</td><td>发起审查</td><td>配置走 review-agent</td></tr>
              <tr className="unused"><td>superpowers</td><td>review.architecture</td><td>处理反馈</td><td>配置未包含</td></tr>
              <tr className="unused"><td>agent-skills</td><td>review.simplification</td><td>代码简化</td><td>配置未包含简化步骤</td></tr>
              <tr className="unused"><td>agent-skills</td><td>implementation.tdd</td><td>TDD 增量实现</td><td>配置走 omc 的 implementation.execute</td></tr>
              <tr className="unused"><td>agent-skills</td><td>implementation.incremental</td><td>纵向切片增量</td><td>配置未包含</td></tr>
              <tr className="unused"><td>agent-skills</td><td>implementation.doubt</td><td>怀疑驱动开发</td><td>配置未包含</td></tr>
              <tr className="unused"><td>agent-skills</td><td>design.api</td><td>API 设计</td><td>设计阶段未配置提供者</td></tr>
              <tr className="unused"><td>agent-skills</td><td>plan.decompose</td><td>任务分解</td><td>配置走 omc 的 plan.decompose</td></tr>
              <tr className="unused"><td>agent-skills</td><td>ship.deprecation</td><td>废弃迁移策略</td><td>配置未包含</td></tr>
              <tr className="unused"><td>agent-skills</td><td>ship.cicd</td><td>CI/CD 管道设计</td><td>配置未包含</td></tr>
              <tr className="unused"><td>agent-skills</td><td>artifact.adr</td><td>架构决策记录</td><td>配置未包含</td></tr>
            </tbody></table>
          <h3>配置流程中无匹配提供者的能力（解析缺口）</h3>
          <table>
            <tbody><tr><th>阶段</th><th>能力</th><th>问题描述</th></tr>
              <tr className="unused"><td>design</td><td>design.architecture</td><td>openspec 适配器无此能力；omc / superpowers 有但配置 tools 节未指定</td></tr>
              <tr className="unused"><td>design</td><td>design.api</td><td>仅 agent-skills 适配器提供（api-and-interface-design），配置 tools 节未指定</td></tr>
              <tr className="unused"><td>design</td><td>design.review</td><td>omc 适配器提供（critic 代理），配置 tools 节未指定</td></tr>
              <tr className="unused"><td>plan</td><td>plan.review</td><td>omc 适配器提供（/ralplan），配置 tools 节未指定</td></tr>
              <tr className="unused"><td>uidesign</td><td>design.interaction</td><td>无适配器提供此能力（需自定义 figma-mcp 工具）</td></tr>
            </tbody></table>
        </div>
      </div>
    </PageFrame>
  )
}
