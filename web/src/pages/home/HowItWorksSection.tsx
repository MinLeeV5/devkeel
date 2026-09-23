import { ProjectArchitectureDiagram } from './ArchitectureDiagrams'
import { SectionHeading } from './SectionHeading'

export function HowItWorksSection(): React.JSX.Element {
  return (
    <section id="how-it-works" className="home-section">
      <SectionHeading
        eyebrow="05 / 工作原理"
        title="规则、能力、记忆与反馈，各有自己的位置"
        summary="AGENTS.md 维护执行入口与读取条件，docs/ 保存项目知识，.harness/ 提供规则与能力；OpenSpec 保存当前规范与变更过程，Lite / Full schema 定义相应编排。"
      />
      <ProjectArchitectureDiagram />
      <div className="architecture-notes">
        <p><strong>编排由 schema 定义：</strong>Lite 与 Full 共用 OpenSpec 能力，但 artifacts、门禁与收尾强度不同。</p>
        <p><strong>仓库即共享环境：</strong>项目文档、规则、Skills、Agents 与必要协作记忆都可版本化。</p>
        <p><strong>完成由证据决定：</strong>Agent 读取反馈继续修正，而不是用总结替代验证。</p>
      </div>
    </section>
  )
}
