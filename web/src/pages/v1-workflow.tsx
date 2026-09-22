import { MarketingNav } from './v1-home/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { V1_TEMPLATES_VERSION } from './v1-template'
import { CodePhase } from './v1-workflow/CodePhase'
import { GrowthPhase } from './v1-workflow/GrowthPhase'
import { SceneLookupSection } from './v1-workflow/SceneLookupSection'
import { SpecPhase } from './v1-workflow/SpecPhase'
import { ThreeLayerModel } from './v1-workflow/ThreeLayerModel'
import { WorkflowFooter } from './v1-workflow/WorkflowFooter'
import { WorkflowHero } from './v1-workflow/WorkflowHero'
import { WorkflowPhaseNav } from './v1-workflow/WorkflowPhaseNav'

const styles = [
  `/* Scrollbar */
    ::-webkit-scrollbar{width:8px;height:8px}
    ::-webkit-scrollbar-track{background:var(--bg)}
    ::-webkit-scrollbar-thumb{background:var(--bg-s);border-radius:4px}
    ::-webkit-scrollbar-thumb:hover{background:var(--border)}

    /* Hero */
    .hero{
      text-align:center;padding:128px 24px 88px;position:relative;overflow:hidden;
      background:
        radial-gradient(ellipse 60% 50% at 50% -5%,rgba(167,139,250,.07),transparent),
        radial-gradient(ellipse 80% 40% at 50% 0%,rgba(34,211,238,.03),transparent);
    }
    .hero::before{
      content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:600px;height:1px;
      background:linear-gradient(90deg,transparent,rgba(167,139,250,.35),transparent);
    }
    .hero h1{
      font-size:48px;font-weight:900;line-height:1.12;margin-bottom:24px;letter-spacing:-.04em;
    }
    .hero h1 .hl{
      background:linear-gradient(135deg,var(--purple),var(--cyan));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hero-sub{font-size:17px;color:var(--text-3);max-width:580px;margin:0 auto 48px;line-height:1.8}
    .pain-points{
      display:grid;grid-template-columns:repeat(3,1fr);gap:16px;
      max-width:720px;margin:0 auto 48px;text-align:left;
    }
    .pain-point{
      padding:18px 20px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
    }
    .pain-point .icon{font-size:20px;margin-bottom:8px}
    .pain-point h4{font-size:13px;font-weight:700;margin-bottom:4px;color:var(--red)}
    .pain-point p{font-size:12px;color:var(--text-4);line-height:1.5}

    /* Three Layer Model */
    .model-section{text-align:center}
    .model-desc{font-size:15px;color:var(--text-3);max-width:640px;margin:0 auto 40px;line-height:1.7}
    .pillar-openspec{border-top-color:var(--purple)}
    .pillar-superpowers{border-top-color:var(--accent)}
    .pillar-omc{border-top-color:var(--cyan)}

    /* Step Indicator */
    .step-indicator{
      transition:opacity .3s,transform .3s;
      position:sticky;top:56px;z-index:50;
      background:rgba(9,9,11,.92);backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      border-bottom:1px solid var(--border-d);
      padding:16px 24px;
    }
    .step-indicator.hidden{opacity:0;pointer-events:none;transform:translateY(-100%)}
    .step-bar{
      display:flex;align-items:center;justify-content:center;gap:0;
      max-width:480px;margin:0 auto;
    }
    .step-node{
      width:36px;height:36px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;cursor:pointer;
      border:2px solid var(--border);background:var(--bg-r);color:var(--text-4);
      transition:all .3s;flex-shrink:0;
    }
    .step-node.active{border-color:var(--accent);color:var(--accent);background:var(--accent-g)}
    .step-line{flex:1;height:2px;background:var(--border-d);transition:background .3s}
    .step-line.active{background:var(--accent)}
    .step-labels{
      display:flex;justify-content:space-between;
      max-width:480px;margin:8px auto 0;
    }
    .step-label{
      font-size:11px;font-weight:600;color:var(--text-4);
      width:36px;text-align:center;cursor:pointer;transition:color .3s;
      background:transparent;border:0;padding:0;
    }
    .step-label.active{color:var(--accent)}

    /* Phase Sections */
    .phase-section{padding:80px 24px}
    .phase-header{margin-bottom:48px}
    .phase-header h2{font-size:32px;font-weight:800;margin-bottom:8px}
    .phase-header p{font-size:15px;color:var(--text-3);max-width:560px;line-height:1.7}
    .phase-steps{display:grid;gap:24px}
    .phase-step{
      padding:28px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
      transition:border-color .2s;
    }
    .phase-step:hover{border-color:var(--border)}
    .phase-step-head{display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
    .phase-num{
      width:28px;height:28px;border-radius:50%;
      display:inline-flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;flex-shrink:0;
    }
    .phase-num-spec{background:rgba(167,139,250,.12);color:var(--purple);border:1px solid rgba(167,139,250,.25)}
    .phase-num-code{background:rgba(16,185,129,.12);color:var(--accent);border:1px solid rgba(16,185,129,.25)}
    .phase-num-growth{background:rgba(34,211,238,.12);color:var(--cyan);border:1px solid rgba(34,211,238,.25)}
    .phase-step-head h4{font-size:15px;font-weight:700}
    .phase-badge{
      font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;
      background:var(--bg-s);border:1px solid var(--border-d);color:var(--text-4);
    }
    .phase-step>p{font-size:14px;color:var(--text-3);line-height:1.7}
    .phase-example{margin-top:16px}
    .phase-example .code-window{margin:0;max-width:100%}
    .phase-example .code-body{font-size:12.5px;line-height:1.8;max-height:200px;overflow-y:auto}
    .phase-example .code-body::-webkit-scrollbar{width:6px}
    .phase-example .code-body::-webkit-scrollbar-track{background:transparent}
    .phase-example .code-body::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
    .phase-example .code-body::-webkit-scrollbar-thumb:hover{background:var(--text-4)}
    .phase-highlight{
      margin-top:12px;padding:12px 16px;border-radius:var(--r);
      background:rgba(16,185,129,.04);border:1px solid rgba(16,185,129,.12);
      font-size:13px;color:var(--text-3);line-height:1.6;
    }
    .phase-highlight strong{color:var(--accent);font-weight:600}

    /* Responsive */
    @media(max-width:1024px){
      .hero h1{font-size:38px}
      .pain-points{grid-template-columns:1fr 1fr}
    }
    @media(max-width:768px){
      .hero{padding:88px 16px 64px}
      .hero h1{font-size:30px}
      .pain-points{grid-template-columns:1fr}
      .step-indicator{transition:opacity .3s,transform .3s;padding:12px 16px}
      .step-bar,.step-labels{max-width:320px}
      .phase-section{padding:60px 20px}
      .phase-header h2{font-size:26px}
    }
    @media(max-width:480px){
      .hero h1{font-size:26px}
    }`,
]

const externalStyles: string[] = ['https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap']

export function V1WorkflowPage(): React.JSX.Element {
  return (
    <PageFrame pageId="v1-workflow" title="工作流分解 — DevKeel" description="从需求到交付，Spec → Code → Growth 三阶段完整闭环。OpenSpec 编排流程，SuperPowers 提供方法论，OMC 负责运行时执行。" styles={styles} externalStyles={externalStyles}>
      <div data-template-version={V1_TEMPLATES_VERSION}>
        <MarketingNav activePage="workflow" />
        <WorkflowHero />
        <ThreeLayerModel />
        <WorkflowPhaseNav />
        <SpecPhase />
        <CodePhase />
        <GrowthPhase />
        <SceneLookupSection />
        <WorkflowFooter />
      </div>
    </PageFrame>
  )
}
