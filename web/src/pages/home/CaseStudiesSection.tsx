import { SectionHeading } from './SectionHeading'

export function CaseStudiesSection(): React.JSX.Element {
  return (
    <section id="real-world-cases" className="home-section case-studies-section">
      <SectionHeading
        eyebrow="06 / 真实项目案例"
        title="同一套 DevKeel，落到两种完全不同的仓库"
        summary="下面不是理想化模板，而是两个本地项目的实际结构与提交证据：大型项目让上下文沿 submodule 边界分层，小型项目从一份普通 Vite 应用开始逐步补齐知识与验证。"
      />

      <article className="case-study case-study-enterprise">
        <header className="case-study-header">
          <div>
            <span>大型项目 · MULTI-REPO</span>
            <h3>example-workspace：根仓只做路由，知识跟着子仓边界生长</h3>
            <p>5 个业务 submodule 共享一个产品上下文，但前端、Java 网关与其他服务各自拥有更小作用域的 AGENTS.md、rules、skills 和验证方式。</p>
          </div>
          <dl className="case-facts" aria-label="example-workspace 仓库事实">
            <div><dt>5</dt><dd>业务 submodules</dd></div>
            <div><dt>2</dt><dd>独立知识 submodules</dd></div>
            <div><dt>41</dt><dd>前后端项目 rules</dd></div>
            <div><dt>18</dt><dd>前后端专项 skills</dd></div>
          </dl>
        </header>

        <div className="case-study-grid case-study-grid-enterprise">
          <div className="repository-xray">
            <div className="repository-xray-title"><span>REPOSITORY X-RAY</span><code>example-workspace/</code></div>
            <pre aria-label="example-workspace 目录结构"><code>{`example-workspace/
├── AGENTS.md                   # 全局路由与子模块索引
├── .harness/                   # 独立 submodule：共享能力
├── openspec/                   # 独立 submodule：schema 与变更记忆
├── frontend/                  # 前端 submodule
│   ├── AGENTS.md               # React / Electron 任务入口
│   └── .harness/               # 23 rules · 7 skills · 1 agent
├── backend/                   # 后端 submodule
│   ├── AGENTS.md               # Java 网关强制执行协议
│   └── .harness/               # 18 rules · 11 skills · 4 agents
└── … 3 个业务 submodule`}</code></pre>
          </div>

          <div className="context-routing">
            <h4>一次任务如何获得刚刚好的上下文</h4>
            <ol>
              <li><b>01</b><span><strong>根 AGENTS.md 识别作用域</strong>只加载全局执行契约与 submodule 索引。</span></li>
              <li><b>02</b><span><strong>进入目标子仓</strong>前端与网关各自的 AGENTS.md 覆盖更具体的边界。</span></li>
              <li><b>03</b><span><strong>按触发矩阵加载资产</strong>Playwright 任务进入 E2E Skills；Java API 任务进入 Spring、MyBatis 与契约规则。</span></li>
              <li><b>04</b><span><strong>使用子仓验证</strong>前端运行目标 package 检查，网关先确认 JDK 8 再执行模块编译。</span></li>
              <li><b>05</b><span><strong>需要协作记忆才进入 OpenSpec</strong>Lite / Full schema 与业务代码独立版本化。</span></li>
            </ol>
          </div>
        </div>

        <div className="case-outcome">
          <strong>上下文工程的结果</strong>
          <p>Agent 不必一次吞下整个产品的所有规范。根仓负责找对边界，子仓负责给出领域知识、专项能力和反馈命令；<code>.agents/</code> 再通过 symlink 复用同一份 <code>.harness/</code> 真源。</p>
        </div>
      </article>

      <article className="case-study case-study-demo">
        <header className="case-study-header">
          <div>
            <span>小型项目 · VITE TODO APP</span>
            <h3>devkeel-demo-project：先读懂现有结构，再诚实暴露验证缺口</h3>
            <p>项目起点只有 React 19、TypeScript 6、Vite 8 与 Zustand 5。DevKeel 没有重排业务代码，而是围绕现有 feature 目录生成知识层，并把尚未建立的测试基建留在授权门禁前。</p>
          </div>
          <dl className="case-facts" aria-label="devkeel-demo-project 仓库事实">
            <div><dt>8</dt><dd>domain-init rules</dd></div>
            <div><dt>1</dt><dd>前端 reviewer</dd></div>
            <div><dt>3</dt><dd>Agent 平台入口</dd></div>
            <div><dt>1</dt><dd>完整归档 change</dd></div>
          </dl>
        </header>

        <div className="case-study-grid case-study-grid-demo">
          <div className="repository-xray">
            <div className="repository-xray-title"><span>AFTER DOMAIN-INIT</span><code>devkeel-demo-project/</code></div>
            <pre aria-label="devkeel-demo-project 目录结构"><code>{`devkeel-demo-project/
├── AGENTS.md
├── .harness/
│   ├── rules/                  # 8 条项目专属规则
│   ├── skills/                 # 工作流与专业能力
│   └── agents/fe-code-reviewer.md
├── openspec/                   # Lite / Full schema + 归档变更
└── src/features/todo/
    ├── components/             # TodoInput / Item / List
    ├── store/useTodoStore.ts   # Zustand 状态与 actions
    └── types/todo.ts           # 领域类型`}</code></pre>
          </div>

          <div className="demo-evolution">
            <div className="evolution-step is-complete">
              <span>01 · devkeel init</span>
              <h4>建立统一入口</h4>
              <p>加入 AGENTS.md、.harness、openspec，并为 Claude Code、Codex、OpenCode 建立兼容入口。</p>
            </div>
            <div className="evolution-step is-complete">
              <span>02 · domain-init</span>
              <h4>从代码生成项目知识</h4>
              <p>一次提交新增 8 条 rules 与 1 个前端 reviewer，内容直接对应 React、Zustand、feature 目录、依赖与命名约定。</p>
            </div>
            <div className="evolution-step is-pending">
              <span>03 · verify-init</span>
              <h4>把测试缺口变成可确认清单</h4>
              <p>当前 package.json 没有 test scripts、Vitest、Testing Library 或 jsdom；verify-init 会先报告这些差距，得到授权后才补配置与示例。</p>
            </div>
            <div className="evolution-step is-complete">
              <span>04 · OpenSpec 实战</span>
              <h4>完成并归档 Todo 状态变更</h4>
              <p>真实 change 留下 brainstorm、design、spec、tasks、verify 与 retrospective，最终把可观察行为同步进主规格。</p>
            </div>
          </div>
        </div>

        <div className="verification-gap" aria-label="verify-init 当前检测结果">
          <div><span>当前可执行反馈</span><code>pnpm build</code><code>pnpm lint</code></div>
          <b aria-hidden="true">→</b>
          <div><span>用户确认后补齐</span><code>pnpm test</code><code>Vitest + RTL + jsdom</code></div>
        </div>
      </article>
    </section>
  )
}
