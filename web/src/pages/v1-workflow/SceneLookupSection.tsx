export function SceneLookupSection(): React.JSX.Element {
  return (
    <section className="section-alt">
      <div className="container">
        <div className="tag">场景速查</div>
        <h2 className="stitle">遇到什么任务，用什么能力</h2>
        <p className="sdesc">从需求到交付，每个环节都有对应的能力组合。</p>
        <table>
          <thead><tr><th>场景</th><th>能力组合</th><th>提示词模板</th><th>产出物</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>简单需求</strong><br /><span style={{ fontSize: 11, color: 'var(--text-4)' }}>边界清晰、无争议</span></td>
              <td>当前会话可闭环时走 Direct，不为简单任务创建 change</td>
              <td><code>添加退出登录按钮，验证现有退出流程</code></td>
              <td>代码 + 邻近验证</td>
            </tr>
            <tr>
              <td><strong>复杂需求</strong><br /><span style={{ fontSize: 11, color: 'var(--text-4)' }}>需人类参与决策</span></td>
              <td>先在 Brainstorming 中一次确认一个决定；需要恢复、交接或审计时再用 <code>/opsx:new</code> 持久化<br /><span style={{ fontSize: 11, color: 'var(--text-4)' }}>确认完整快照后可用 <code>/opsx:continue</code> 逐个投影，或显式 <code>/opsx:ff</code> 快速投影</span></td>
              <td><code>/opsx:new 实现头像上传功能</code></td>
              <td>Living brainstorm → [design] → [specs] → tasks</td>
            </tr>
            <tr>
              <td><strong>做技术方案</strong></td>
              <td>Brainstorming 可使用 requirement-analysis / technical-design 探针发现下一项缺口；确认后 design 只投影已锁定决定</td>
              <td><code>/opsx:new 优化认证系统架构</code></td>
              <td>Living brainstorm + 有来源链接的 design</td>
            </tr>
            <tr>
              <td><strong>写业务代码</strong></td>
              <td>subagent-driven-development 模式，读取 openspec 任务清单，自动遵守 <code>.harness/rules/</code> 约束</td>
              <td><code>/opsx:apply</code></td>
              <td>符合团队规范的代码</td>
            </tr>
            <tr>
              <td><strong>写测试</strong></td>
              <td><code>test-case-designer</code> skill + TDD 工作流（SuperPowers）</td>
              <td><code>为用户头像上传模块设计测试用例</code></td>
              <td>测试用例 + 覆盖率报告</td>
            </tr>
            <tr>
              <td><strong>修复 Bug</strong></td>
              <td>systematic-debugging 方法论 → <code>automated-instrumented-debugging</code> skill → defect-orchestrator</td>
              <td><code>上传头像后图片未显示，请排查修复</code></td>
              <td>根因分析 + 修复代码 + 回归测试</td>
            </tr>
            <tr>
              <td><strong>代码审查</strong></td>
              <td><code>review-orchestrator</code> skill，自动路由到领域 reviewer（前端/后端）</td>
              <td><code>/review-orchestrator</code></td>
              <td>审查报告 + 修改建议</td>
            </tr>
            <tr>
              <td><strong>提交代码</strong></td>
              <td><code>commit</code> skill，质量检查 → 原子提交 → push</td>
              <td><code>/commit</code></td>
              <td>规范化的 Git 提交</td>
            </tr>
            <tr>
              <td><strong>探索已有知识</strong></td>
              <td><code>brainstorming</code> 的 OpenSpec 模式，按需读取 specs/ 和 archive/</td>
              <td><code>/opsx:explore 头像上传相关的设计决策</code></td>
              <td>上下文理解（不产出新文件）</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
