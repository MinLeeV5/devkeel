import { ProgressivePathDiagram } from './ArchitectureDiagrams'
import { SectionHeading } from './SectionHeading'

export function ProgressivePathSection(): React.JSX.Element {
  return (
    <section id="progressive-path" className="home-section">
      <SectionHeading
        eyebrow="03 / 渐进式任务路径"
        title="从一句话需求开始，逐层收敛到充分路径"
        summary="普通开发先依据代码核对缺口；有关键决定未明确时，/brainstorming 按需引用需求与技术设计维度，逐题讨论并收敛方案，再选择 Direct、Lite 或 Full。"
      />
      <ProgressivePathDiagram />
      <div className="path-legend">
        <article><strong>专项 Skill</strong><p>审查、调试、测试用例设计等明确操作直接进入专业能力。</p></article>
        <article><strong>Direct</strong><p>当前会话能完成调查、修改和验证，不创建额外 artifact。</p></article>
        <article><strong>Lite</strong><p>借助 OpenSpec 保存协作记忆；内置 Lite schema 定义最少 artifacts 与轻量收尾编排。</p></article>
        <article><strong>Full</strong><p>同样基于 OpenSpec；内置 Full schema 定义完整设计、规格、验证与归档门禁。</p></article>
      </div>
      <div className="quality-baseline" aria-label="所有路径的质量底线">
        <span>共同底线</span>
        <ol>
          <li>先明确结果与验收</li>
          <li>每项改动使用最近的反馈信号验证</li>
          <li>只有协作记忆或风险需要时才增加流程</li>
        </ol>
      </div>
    </section>
  )
}
