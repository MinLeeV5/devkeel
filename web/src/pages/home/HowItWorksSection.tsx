import { ProjectArchitectureDiagram } from './ArchitectureDiagrams'
import { SectionHeading } from './SectionHeading'

export function HowItWorksSection(): React.JSX.Element {
  return (
    <section id="how-it-works" className="home-section">
      <SectionHeading
        eyebrow="05 / 工作原理"
        title="规则、能力、记忆与反馈，各有自己的位置"
        summary="AGENTS.md 负责告诉 Agent 如何行动，.harness/ 提供项目能力；Lite 与 Full 借助 OpenSpec 保存 artifacts，DevKeel 内置的两套 schema 分别定义轻量与完整编排。"
      />
      <ProjectArchitectureDiagram />
      <div className="architecture-notes">
        <p><strong>编排由 schema 定义：</strong>Lite 与 Full 共用 OpenSpec 能力，但 artifacts、门禁与收尾强度不同。</p>
        <p><strong>仓库即共享环境：</strong>规则、Skills、Agents 与必要协作记忆都可版本化。</p>
        <p><strong>完成由证据决定：</strong>Agent 读取反馈继续修正，而不是用总结替代验证。</p>
      </div>
    </section>
  )
}
