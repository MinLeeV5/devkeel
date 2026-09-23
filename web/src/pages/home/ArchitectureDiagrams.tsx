import { useThemeStore } from '../../stores/theme-store'

interface ThemedDiagramProps {
  alt: string
  className: string
  darkSrc: string
  height?: number
  lightSrc: string
  loading?: 'eager' | 'lazy'
  width?: number
}

function ThemedDiagram({ alt, className, darkSrc, height, lightSrc, loading, width }: ThemedDiagramProps): React.JSX.Element {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const src = resolvedTheme === 'dark' ? darkSrc : lightSrc

  return <img className={className} src={src} alt={alt} width={width} height={height} loading={loading} decoding="async" />
}

export function OnboardingFlowDiagram(): React.JSX.Element {
  return (
    <div className="home-diagram-frame home-diagram-frame--onboarding">
      <ThemedDiagram
        className="home-diagram onboarding-flow-diagram"
        alt="DevKeel 从安装自检、domain-init、用户 Review、verify-init 到 Agent-ready 的项目接入流程图"
        lightSrc="./diagrams/onboarding-flow.svg"
        darkSrc="./diagrams/onboarding-flow-dark.svg"
        width={960}
        height={440}
      />
    </div>
  )
}

export function ProgressivePathDiagram(): React.JSX.Element {
  return (
    <div className="home-diagram-frame home-diagram-frame--path">
      <ThemedDiagram
        className="home-diagram path-diagram"
        alt="自上而下的渐进工作流：从一句话需求开始，Agent 核对缺口，按需通过 brainstorming 引用需求与技术设计维度逐题讨论，最后选择 Direct、Lite 或 Full"
        lightSrc="./diagrams/progressive-path.svg"
        darkSrc="./diagrams/sharing-v2-routing.svg"
        loading="lazy"
      />
    </div>
  )
}

export function ProjectArchitectureDiagram(): React.JSX.Element {
  return (
    <div className="home-diagram-frame home-diagram-frame--architecture">
      <ThemedDiagram
        className="home-diagram architecture-diagram"
        alt="DevKeel 编排、规则与验证能力落到仓库载体并驱动 Coding Agent 交付的架构图"
        lightSrc="./diagrams/project-architecture.svg"
        darkSrc="./diagrams/sharing-v2-harness-architecture.svg"
        loading="lazy"
      />
    </div>
  )
}
