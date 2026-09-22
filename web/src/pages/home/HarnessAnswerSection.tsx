import { SectionHeading } from './SectionHeading'

export function HarnessAnswerSection(): React.JSX.Element {
  return (
    <div id="why-v2" className="comparison-solution">
      <SectionHeading
        eyebrow="解决方案 / DevKeel V2"
        title="把力气花在项目还没有提供的地方"
        summary="DevKeel 不再接管每一步，而是把项目本身变成 Agent 可以持续工作的环境：知道边界、找到能力、获得反馈。"
      />
      <div className="answer-principles">
        <article>
          <span>PROJECT KNOWLEDGE</span>
          <h3>让 Agent 读懂项目</h3>
          <p>把真实代码中已经存在的架构、术语、规范和专业能力沉淀进仓库，而不是每次会话重新解释。</p>
        </article>
        <article>
          <span>PROGRESSIVE GOVERNANCE</span>
          <h3>让流程强度匹配任务</h3>
          <p>小任务直接完成，需要协作记忆才建 Lite，只有已确认风险值得时才进入 Full。</p>
        </article>
        <article>
          <span>FEEDBACK LOOPS</span>
          <h3>让结果能够自证</h3>
          <p>测试、类型检查、运行态工具和邻近验证为 Agent 提供真实反馈，完成由证据而不是措辞决定。</p>
        </article>
      </div>
      <p className="answer-summary">不是另一套更大的流程，而是一套会根据项目与任务主动收缩的工程环境。</p>
    </div>
  )
}
