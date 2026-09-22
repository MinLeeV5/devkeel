import { usePageUiStore } from '../../stores/page-ui-store'

export function QuickStartSection(): React.JSX.Element {
  const quickStartTab = usePageUiStore((state) => state.quickStartTab)
  const setQuickStartTab = usePageUiStore((state) => state.setQuickStartTab)

  return (
    <section id="quickstart">
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="tag">快速开始</div>
        <h2 className="stitle" style={{ textAlign: 'center' }}>一条命令，项目就绪</h2>
        <p className="sdesc" style={{ margin: '0 auto 44px', textAlign: 'center' }}>
          让 Agent 自动完成，或者自己手动交互式初始化。
        </p>
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 999, background: 'var(--bg-2)', border: '1px solid var(--border)', marginBottom: 32 }}>
          <button type="button" className={`qs-tab${quickStartTab === 'agent' ? ' qs-tab-active' : ''}`} onClick={() => setQuickStartTab('agent')} aria-pressed={quickStartTab === 'agent'} style={quickStartTabButtonStyle}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: 4 }}><path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4z" /><rect x={3} y={10} width={18} height={12} rx={2} /><circle cx={9} cy={16} r={1} /><circle cx={15} cy={16} r={1} /></svg>
            Agent 执行
          </button>
          <button type="button" className={`qs-tab${quickStartTab === 'manual' ? ' qs-tab-active' : ''}`} onClick={() => setQuickStartTab('manual')} aria-pressed={quickStartTab === 'manual'} style={quickStartTabButtonStyle}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ verticalAlign: '-2px', marginRight: 4 }}><polyline points="4 17 10 11 4 5" /><line x1={12} y1={19} x2={20} y2={19} /></svg>
            手动执行
          </button>
        </div>
        {quickStartTab === 'agent' ? <AgentQuickStartTimeline /> : <ManualQuickStartTimeline />}
      </div>
    </section>
  )
}

const quickStartTabButtonStyle = {
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 20px',
  transition: 'all .2s',
}

function AgentQuickStartTimeline(): React.JSX.Element {
  return (
    <div className="wf-timeline" style={{ textAlign: 'left', maxWidth: 720, margin: '0 auto' }}>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>给 Agent 一个 URL</h4>
          <span className="wf-badge wf-badge-agent">Agent 执行</span>
        </div>
        <p>将安装文档 URL 发给你的 Coding Agent（Claude Code / Codex / Cursor），Agent 会自动推断参数并完成全部初始化。</p>
        <div className="code-window" style={{ marginTop: 10 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Agent Session</span>
          </div>
          <div className="code-body mono">
            <span className="c"># 发给 Agent 的 prompt</span><br />
            按照 <span className="y">https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md</span> 完成项目初始化
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>Agent 自动完成</h4>
          <span className="wf-badge wf-badge-auto">全自动</span>
        </div>
        <p>Agent 读取文档后，自动执行以下流程：</p>
        <div className="wf-gate" style={{ marginTop: 10 }}>
          <strong>自动推断</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item">从 package.json 推断项目名称</span>
            <span className="wf-gate-item">从依赖和文件结构推断项目类型</span>
            <span className="wf-gate-item">从已有平台目录推断目标平台</span>
            <span className="wf-gate-item">从 .gitmodules 推断仓库类型</span>
          </div>
        </div>
        <div className="wf-gate" style={{ marginTop: 10 }}>
          <strong>自动执行</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>npx devkeel@latest init</span> 非交互初始化</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>npx devkeel@latest doctor</span> 验证配置</span>
            <span className="wf-gate-item">补充 AGENTS.md / CLAUDE.md 项目信息</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>git commit</span> 提交产出</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>npx devkeel@latest openspec</span> 验证 OpenSpec</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--accent)' }}>/domain-init</span> 领域能力生成</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--accent)' }}>/verify-init</span> 测试基建搭建</span>
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>确认少量交互</h4>
          <span className="wf-badge wf-badge-user">用户确认</span>
        </div>
        <p>Agent 无法确定的参数会向你确认，通常只需回答 1-2 个问题：</p>
        <div className="wf-gate" style={{ marginTop: 10 }}>
          <strong>可能询问</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item">无法推断时：项目类型是什么？</span>
            <span className="wf-gate-item">无平台目录时：目标平台选哪些？</span>
            <span className="wf-gate-item">是否执行 /domain-init？</span>
            <span className="wf-gate-item">是否执行 /verify-init？</span>
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>完成</h4>
          <span className="wf-badge wf-badge-agent">Agent 就绪</span>
        </div>
        <p>Agent 已具备完整的项目上下文，进入项目即知边界，可以开始协作。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <span className="wf-gate-item" style={{ fontSize: 12 }}>Claude Code</span>
          <span className="wf-gate-item" style={{ fontSize: 12 }}>Codex CLI</span>
          <span className="wf-gate-item" style={{ fontSize: 12 }}>Cursor</span>
          <span className="wf-gate-item" style={{ fontSize: 12 }}>GitHub Copilot</span>
          <span className="wf-gate-item" style={{ fontSize: 12 }}>Gemini CLI</span>
        </div>
      </div>
    </div>
  )
}

function ManualQuickStartTimeline(): React.JSX.Element {
  return (
    <div className="wf-timeline" style={{ textAlign: 'left', maxWidth: 720, margin: '0 auto' }}>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>安装 DevKeel CLI</h4>
          <span className="wf-badge wf-badge-user">用户操作</span>
        </div>
        <p>需要 Node.js ≥ 20。</p>
        <div className="code-window" style={{ marginTop: 10 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Terminal</span>
          </div>
          <div className="code-body mono">
            <span className="c"># 1. 使用公共 npm 仓库（仅首次）</span><br />
            <span className="c"># 2. 免安装直接执行</span><br />
            <span className="g">npx</span> <span className="y">devkeel@latest</span> init
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>交互式初始化</h4>
          <span className="wf-badge wf-badge-user">用户操作</span>
        </div>
        <p>在项目根目录运行 <code>npx devkeel@latest init</code>，交互式回答几个问题，自动生成知识框架骨架。</p>
        <div className="code-window" style={{ marginTop: 10 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Terminal</span>
          </div>
          <div className="code-body mono">
            <span className="g">cd</span> <span className="w">your-project</span><br />
            <span className="g">npx devkeel@latest</span> init
          </div>
        </div>
        <div className="wf-gate" style={{ marginTop: 10 }}>
          <strong>交互问答</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item">项目名称</span>
            <span className="wf-gate-item">仓库类型（主仓库 / 领域子仓库）</span>
            <span className="wf-gate-item">项目类型（Frontend / Backend / Other）</span>
            <span className="wf-gate-item">目标平台（Claude Code / Codex / Cursor / Copilot / Gemini）</span>
            <span className="wf-gate-item">子模块领域配置</span>
          </div>
        </div>
        <div className="wf-gate" style={{ marginTop: 10 }}>
          <strong>自动生成</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>.harness/</span> skills + rules + agents</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>AGENTS.md</span> 执行契约</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>CLAUDE.md</span> @AGENTS.md 引用</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>openspec/</span> 知识产出目录</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>.claude/ .cursor/ .github/</span> 平台 symlink</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--cyan)' }}>.gitignore</span> 自动维护</span>
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>检查配置健康度</h4>
          <span className="wf-badge wf-badge-auto">自动检测</span>
        </div>
        <p>验证生成的文件结构、symlink 和 .gitignore 是否正确。</p>
        <div className="code-window" style={{ marginTop: 10 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Terminal</span>
          </div>
          <div className="code-body mono">
            <span className="g">npx devkeel@latest</span> doctor
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>提交并验证</h4>
          <span className="wf-badge wf-badge-user">用户操作</span>
        </div>
        <p>init 完成且 doctor 健康后，确认 <code>.claude/</code>、<code>.cursor/</code>、<code>.github/</code> 等平台目录已正确生成，然后将所有产出提交到 Git。</p>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>确认 OpenSpec 可用</h4>
          <span className="wf-badge wf-badge-auto">自动就绪</span>
        </div>
        <p>OpenSpec 已作为 DevKeel 依赖内置，无需单独安装。验证调用正常即可开始变更管理。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <a href="https://github.com/Fission-AI/OpenSpec" target="_blank" rel="noopener" className="wf-gate-item" style={{ fontSize: 12, textDecoration: 'none', color: 'var(--accent)' }}>OpenSpec<span style={{ color: 'var(--text-4)', marginLeft: 4 }}>内置 · 知识管理</span></a>
        </div>
        <div className="code-window" style={{ marginTop: 12 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Terminal</span>
          </div>
          <div className="code-body mono">
            <span className="c"># 验证 OpenSpec 工具链</span><br />
            <span className="g">npx devkeel@latest</span> openspec list
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>领域知识初始化</h4>
          <span className="wf-badge" style={{ background: 'rgba(16,185,129,.12)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>强烈建议</span>
        </div>
        <p>一键搭建项目专属的领域规范，让 DevKeel 发挥最大的栅栏作用。扫描项目技术栈和业务特征，量身定制符合你项目领域的 rules 和 skills 包。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>前端</span>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>后台</span>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>C++</span>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>Windows</span>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>音视频</span>
          <span className="wf-gate-item" style={{ fontSize: 12, borderColor: 'rgba(16,185,129,.25)', color: 'var(--accent)' }}>Android</span>
        </div>
        <div className="code-window" style={{ marginTop: 12 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Agent Session</span>
          </div>
          <div className="code-body mono">
            <span className="c"># 自动扫描并生成领域规范</span><br />
            <span style={{ color: 'var(--accent)' }}>/domain-init</span>
          </div>
        </div>
      </div>
      <div className="wf-step">
        <div className="wf-step-head">
          <h4>测试基建初始化</h4>
          <span className="wf-badge" style={{ background: 'rgba(34,211,238,.12)', borderColor: 'var(--cyan)', color: 'var(--cyan)' }}>建议</span>
        </div>
        <p>扫描项目已有测试框架，增量补齐缺失的单测/e2e/API 脚手架，生成通用 testing 规范和验证 agent——让 Agent 能自主验证代码输出，为后续 TDD 与 verify 提供可执行落点。</p>
        <div className="wf-gate" style={{ marginTop: 12 }}>
          <strong>产出</strong>
          <div className="wf-gate-items">
            <span className="wf-gate-item">测试框架 + config + 示例 + scripts（项目根）</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>.harness/rules/testing.md</span> 通用测试规范</span>
            <span className="wf-gate-item"><span className="mono" style={{ color: 'var(--purple)' }}>.harness/agents/test-verifier.md</span> 验证 agent</span>
          </div>
        </div>
        <div className="code-window" style={{ marginTop: 12 }}>
          <div className="code-titlebar">
            <span className="code-dot" /><span className="code-dot" /><span className="code-dot" />
            <span className="code-titlebar-t">Agent Session</span>
          </div>
          <div className="code-body mono">
            <span className="c"># 检测已有框架 → 补齐缺失 → 生成验证 agent</span><br />
            <span style={{ color: 'var(--cyan)' }}>/verify-init</span>
          </div>
        </div>
      </div>
    </div>
  )
}
