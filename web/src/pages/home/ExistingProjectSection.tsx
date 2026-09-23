import { SectionHeading } from './SectionHeading'

export function ExistingProjectSection(): React.JSX.Element {
  return (
    <section id="existing-projects" className="home-section">
      <SectionHeading
        eyebrow="04 / 改造现有项目"
        title="建立统一入口，再让 Agent 读懂项目并获得反馈"
        summary="DevKeel 不要求你重建项目。devkeel init 先建立 AGENTS.md 的全局入口与路由骨架，domain-init 再从真实代码补全项目地图，verify-init 最后接上可执行反馈。"
      />
      <div className="init-foundation" aria-label="项目入口初始化">
        <span className="init-foundation-step">STEP 00 · 前置基座</span>
        <code>devkeel init</code>
        <div className="init-foundation-copy">
          <h3>建立 Agent 的全局项目入口</h3>
          <p>生成 AGENTS.md 的全局路由骨架，并初始化 .harness/、OpenSpec 与平台入口，让 Agent 知道从哪里读取项目知识。</p>
        </div>
      </div>
      <div className="init-foundation-connector" aria-hidden="true">↓</div>
      <div className="init-engines">
        <article className="init-engine init-engine-domain">
          <div className="init-engine-step">STEP 01</div>
          <code>/domain-init</code>
          <h3>让 Agent 读懂项目</h3>
          <p>扫描技术栈、代码结构、领域术语和团队惯例，在 docs 中维护项目知识，提炼专属 rules、skills 与 reviewer agents。</p>
          <ul>
            <li>依据真实代码，不套通用最佳实践</li>
            <li>先检测与采样，再由用户 Review</li>
            <li>已有同名能力合并增强，不覆盖丢失</li>
          </ul>
        </article>
        <div className="engine-connector" aria-hidden="true">→</div>
        <article className="init-engine init-engine-verify">
          <div className="init-engine-step">STEP 02</div>
          <code>/verify-init</code>
          <h3>让 Agent 验证产出</h3>
          <p>检测已有测试框架，只对确认的缺口增量补齐配置、示例与验证 Agent，复用项目已有测试规则和 docs 中的说明。</p>
          <ul>
            <li>已有框架保持不动，缺失项才进入清单</li>
            <li>安装与写配置前必须取得用户同意</li>
            <li>为后续任务建立可执行反馈闭环</li>
          </ul>
        </article>
      </div>
      <div className="project-before-after">
        <article>
          <span>BEFORE</span>
          <h3>Agent 每次临时猜项目</h3>
          <ul>
            <li>规范散落在人脑和历史对话</li>
            <li>Skills 与项目实际技术栈脱节</li>
            <li>没有稳定测试接缝时无法自证</li>
          </ul>
        </article>
        <div className="before-after-arrow" aria-hidden="true">→</div>
        <article>
          <span>AFTER</span>
          <h3>仓库本身成为工作环境</h3>
          <ul>
            <li>AGENTS.md 按任务指向 docs 与 .harness/</li>
            <li>专业能力基于真实代码定制</li>
            <li>测试与 verifier 提供可观察反馈</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
