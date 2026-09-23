import { useState } from 'react'

import { HarnessAnswerSection } from './HarnessAnswerSection'
import { SectionHeading } from './SectionHeading'

type ProductId = 'harnessV2' | 'harnessV1' | 'matt' | 'superpowers'

interface ComparisonCell {
  detail: string
  score: number
}

interface ComparisonRow {
  dimension: string
  products: Record<ProductId, ComparisonCell>
}

interface ComparisonProduct {
  featured?: boolean
  href?: string
  id: ProductId
  name: string
  summary: string
  version: string
}

export const COMPARISON_PRODUCTS: readonly ComparisonProduct[] = [
  {
    id: 'harnessV2',
    name: 'DevKeel',
    version: 'V2',
    featured: true,
    summary: '保留项目初始化能力，把任务改为按协作成本与风险渐进分流。',
  },
  {
    id: 'harnessV1',
    name: 'DevKeel V1',
    version: 'templates v1.3.0',
    href: './v1/index.html',
    summary: '同样提供 domain-init 与 verify-init，并用 OpenSpec + Superpowers 串联完整交付流程。',
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    version: 'v6.2.0',
    href: 'https://github.com/obra/superpowers/releases/tag/v6.2.0',
    summary: '用强制技能纪律覆盖设计、TDD、Review 与收尾，强调过程一致性。',
  },
  {
    id: 'matt',
    name: 'Matt Skills',
    version: 'v1.1.0',
    href: 'https://github.com/mattpocock/skills/releases/tag/v1.1.0',
    summary: '把工程方法拆成可组合的小型 Skills，强调按需调用与自由定制。',
  },
]

export const COMPARISON_ROWS: readonly ComparisonRow[] = [
  {
    dimension: '现有项目改造',
    products: {
      harnessV2: { score: 5, detail: 'domain-init + verify-init 扫描代码并增量补齐领域与测试资产；代价是生成结果需要人工确认。' },
      harnessV1: { score: 5, detail: '同样用 domain-init + verify-init 改造现有项目；代价是生成结果需要人工确认。' },
      superpowers: { score: 2, detail: '为仓库安装通用开发方法与 Agent 适配；代价是不生成项目专属领域或测试脚手架。' },
      matt: { score: 3, detail: '用 setup skill 配置 tracker 与文档位置；代价是项目能力仍要逐项选择和沉淀。' },
    },
  },
  {
    dimension: '项目知识生成',
    products: {
      harnessV2: { score: 5, detail: 'domain-init 从代码维护 docs 并提炼 rules、skills、agents；代价是需要人工确认结论。' },
      harnessV1: { score: 5, detail: 'domain-init 从真实代码提炼 rules、skills、agents；代价是需要人工确认结论。' },
      superpowers: { score: 2, detail: '提供跨项目通用纪律；代价是不生成项目专属知识层。' },
      matt: { score: 4, detail: '用 domain-modeling 与 CONTEXT/ADR 建立共同语言；代价是依赖对话式维护。' },
    },
  },
  {
    dimension: '验证基建建设',
    products: {
      harnessV2: { score: 5, detail: 'verify-init 增量补齐框架、规范和验证 Agent；代价是变更前需要授权。' },
      harnessV1: { score: 5, detail: 'verify-init 增量补齐框架、规范和验证 Agent；代价是变更前需要授权。' },
      superpowers: { score: 3, detail: '强制 TDD 与完成前验证；代价是项目需先有可运行测试接缝。' },
      matt: { score: 3, detail: '提供 TDD 与诊断 Skills；代价是框架和反馈环境要由项目准备。' },
    },
  },
  {
    dimension: '轻重任务适配',
    products: {
      harnessV2: { score: 5, detail: '按协作成本选择 Skill、Direct、Lite 或 Full；代价是团队要理解分流边界。' },
      harnessV1: { score: 2, detail: '按 OpenSpec 与 Superpowers 的完整链路推进；代价是小任务也会承担较多固定步骤。' },
      superpowers: { score: 2, detail: '把完整工作流定义为 mandatory；代价是小任务也会承担较多步骤。' },
      matt: { score: 5, detail: '小型 Skills 可单独组合并由 ask-matt 推荐；代价是路径一致性靠团队维护。' },
    },
  },
  {
    dimension: '交付时间',
    products: {
      harnessV2: { score: 5, detail: 'Direct 跳过不必要的 artifacts，Lite/Full 只在协作记忆或风险需要时启用；代价是首次初始化与路径判断仍需投入时间。' },
      harnessV1: { score: 2, detail: 'OpenSpec 与 Superpowers 的完整链路提供稳定步骤；代价是普通任务也要承担规划、实现与多轮审查时间。' },
      superpowers: { score: 2, detail: '默认执行设计、计划、TDD、Review 与收尾；代价是过程一致但短任务交付周期更长。' },
      matt: { score: 4, detail: '按需组合小型 Skills，简单任务可以快速进入执行；代价是路径选择与团队协调不一致时可能产生返工。' },
    },
  },
  {
    dimension: 'Token 成本',
    products: {
      harnessV2: { score: 5, detail: '复用仓库知识并让 Direct 保持最小上下文，按需才加载 Lite/Full artifacts；代价是 domain-init 与项目资产维护会产生前置成本。' },
      harnessV1: { score: 2, detail: 'OpenSpec artifacts 与 Superpowers 流程共同保存上下文；代价是重复加载完整链路会占用更多 Token。' },
      superpowers: { score: 2, detail: '规格、计划、Skills、子 Agent 与多轮 Review 提供充分上下文；代价是默认流程的 Token 消耗较高。' },
      matt: { score: 4, detail: '小型 Skills 与 CONTEXT 共同语言减少无关上下文；代价是多 Skill 串联和分散文档仍会增加读取成本。' },
    },
  },
  {
    dimension: '跨会话与团队协作',
    products: {
      harnessV2: { score: 4, detail: 'Lite/Full 用 openspec 保存变更记忆；代价是 Direct 有意不持久化。' },
      harnessV1: { score: 5, detail: '用 OpenSpec artifacts 与 plan-scoped SDD 台账续跑；代价是需要维护两类持久化状态。' },
      superpowers: { score: 4, detail: '将设计、计划与 plan-scoped SDD 进度落盘；代价是记忆主要围绕实施计划。' },
      matt: { score: 5, detail: '把 CONTEXT、ADR、tickets 与 handoff 接入本地文件或 tracker；代价是团队要治理多种载体。' },
    },
  },
  {
    dimension: '过程约束与审查',
    products: {
      harnessV2: { score: 4, detail: 'Full 提供完整治理；代价是常规任务不会自动获得全部门禁。' },
      harnessV1: { score: 5, detail: '串联 OpenSpec、独立实现、任务审查、全分支审查与完成前验证；代价是执行链条较长。' },
      superpowers: { score: 5, detail: '规范澄清、计划、TDD、双重 Review 与收尾；代价是流程投入最高。' },
      matt: { score: 4, detail: '组合 spec、tickets、implement、TDD、review；代价是没有统一强制流程。' },
    },
  },
  {
    dimension: '跨平台复用',
    products: {
      harnessV2: { score: 4, detail: '以 AGENTS.md 统一入口并向平台目录分发；代价是要维护适配映射。' },
      harnessV1: { score: 4, detail: '通过 templates 向多个 Agent 平台分发 OpenSpec 与技能；代价是平台适配仍需同步维护。' },
      superpowers: { score: 5, detail: '为多个主流 Coding Agent 提供安装与工具映射；代价是不同 DevKeel 仍需分别安装。' },
      matt: { score: 4, detail: '遵循 Agent Skills 标准并提供 Claude 插件；代价是团队要决定安装方式。' },
    },
  },
  {
    dimension: '技能组合与定制',
    products: {
      harnessV2: { score: 5, detail: '项目维护自己的 rules、skills、agents 与路由；代价是团队要治理这些资产。' },
      harnessV1: { score: 4, detail: '可修改模板、规则与技能组合；代价是定制通常与 OpenSpec、Superpowers 编排结构耦合。' },
      superpowers: { score: 4, detail: 'Skills 可独立扩展并覆盖完整开发环节；代价是核心 mandatory 纪律不适合随意裁剪。' },
      matt: { score: 5, detail: '鼓励复制、修改与重组小型 Skills；代价是分叉后需自行维护一致性。' },
    },
  },
]

export function ComparisonSection(): React.JSX.Element {
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [focusedCell, setFocusedCell] = useState<string | null>(null)
  const [dismissedCell, setDismissedCell] = useState<string | null>(null)
  const previewCell = hoveredCell ?? focusedCell
  const visibleCell = previewCell && previewCell === dismissedCell
    ? null
    : previewCell ?? activeCell

  return (
    <section id="comparison" className="home-section home-comparison-section">
      <SectionHeading
        eyebrow="02 / 痛点、现状与解决方案"
        title="模型更强了，项目却仍然没有准备好"
        summary="Agent 已经能完成越来越复杂的任务，但真实项目仍缺少可读的知识、可调用的专业能力和可执行的反馈回路；继续叠加固定流程，只会让每个任务都支付相同成本。"
      />
      <blockquote className="home-thesis">
        真正的瓶颈已经从“Agent 会不会做”，转向“项目有没有告诉它该怎么做，以及如何证明做对了”。
      </blockquote>
      <div className="comparison-stage-heading">
        <span>方案对比 / DevKeel V2 与开源实践</span>
        <h3>DevKeel V2 把项目上下文与渐进治理放在同一条主线上</h3>
      </div>
      <div className="comparison-product-guides" aria-label="方案简介">
        {COMPARISON_PRODUCTS.map((product) => (
          <article key={product.id} data-product={product.id} className={product.featured ? 'is-featured' : undefined}>
            <div>
              <span>{product.version}</span>
              {product.featured ? <b>推荐主方案</b> : null}
            </div>
            <h3>{product.href ? <a href={product.href}>{product.name}</a> : product.name}</h3>
            <p>{product.summary}</p>
            {product.featured ? (
              <ul aria-label="DevKeel V2 核心差异">
                <li>项目知识</li>
                <li>渐进路径</li>
                <li>验证反馈</li>
              </ul>
            ) : null}
          </article>
        ))}
      </div>
      <div className="comparison-intro">
        <p>能力维度：5 = 原生且完整，4 = 原生但需组合，3 = 可配置实现，2 = 间接支持，1 = 非目标。成本维度（交付时间、Token 成本）：5 = 默认开销最低，1 = 默认开销最高。悬停、聚焦或点击查看依据与代价。</p>
        <span>移动端自动按维度展开</span>
      </div>
      <div className="comparison-table-scroll" tabIndex={0} aria-label="方案对比表">
        <table className="comparison-table">
          <colgroup>
            <col className="comparison-col-dimension" />
            {COMPARISON_PRODUCTS.map((product) => (
              <col key={product.id} className={product.featured ? 'comparison-col-featured' : undefined} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">选型维度</th>
              {COMPARISON_PRODUCTS.map((product) => (
                <th key={product.id} scope="col" data-product={product.id}>
                  {product.featured ? <b className="comparison-featured-mark">推荐 · DEVKEEL V2</b> : null}
                  {product.href ? <a href={product.href} target="_blank" rel="noopener noreferrer">{product.name}</a> : product.name}
                  <small>{product.version}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row, rowIndex) => (
              <tr key={row.dimension}>
                <th scope="row">{row.dimension}</th>
                {COMPARISON_PRODUCTS.map((product) => {
                  const cell = row.products[product.id]
                  const cellId = `${product.id}-${rowIndex}`
                  const tooltipId = `comparison-detail-${cellId}`
                  const [method, cost = ''] = cell.detail.split('；')
                  const isOpen = visibleCell === cellId
                  return (
                    <td
                      key={product.id}
                      data-product={product.id}
                      data-product-label={`${product.name} ${product.version}`}
                    >
                      <div
                        className={`comparison-score${isOpen ? ' is-open' : ''}`}
                        onMouseEnter={() => {
                          setDismissedCell((current) => current === cellId ? null : current)
                          setHoveredCell(cellId)
                        }}
                        onMouseLeave={() => setHoveredCell((current) => current === cellId ? null : current)}
                      >
                        <button
                          type="button"
                          aria-describedby={tooltipId}
                          aria-expanded={isOpen}
                          aria-label={`${product.name} ${product.version}：${row.dimension}，${cell.score} / 5。查看说明`}
                          onClick={() => {
                            const isActive = activeCell === cellId
                            setActiveCell(isActive ? null : cellId)
                            setDismissedCell(isActive ? cellId : null)
                          }}
                          onFocus={() => {
                            setDismissedCell((current) => current === cellId ? null : current)
                            setFocusedCell(cellId)
                          }}
                          onBlur={() => setFocusedCell((current) => current === cellId ? null : current)}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              setActiveCell(null)
                              setHoveredCell(null)
                              setFocusedCell(null)
                              setDismissedCell(cellId)
                            }
                          }}
                        >
                          <span className="comparison-stars" aria-hidden="true">{renderStars(cell.score)}</span>
                        </button>
                        <div
                          id={tooltipId}
                          className="comparison-score-detail"
                          role="tooltip"
                          aria-hidden={!isOpen}
                        >
                          <p><strong>怎么做</strong>{method}</p>
                          <p><strong>代价</strong>{cost.replace(/^代价(?:是|：)?/, '')}</p>
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="comparison-source-note">
        比较基于各项目上述版本的公开仓库与文档；评分只表示能力覆盖方式，不把“流程更严格”或“默认更轻量”视为天然更优，也不是基准测试。
      </p>
      <HarnessAnswerSection />
    </section>
  )
}

function renderStars(score: number): string {
  return `${'★'.repeat(score)}${'☆'.repeat(5 - score)}`
}
