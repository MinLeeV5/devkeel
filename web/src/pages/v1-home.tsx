import { MarketingNav } from './v1-home/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { CommunitySection } from './v1-home/CommunitySection'
import { HomeHero } from './v1-home/HomeHero'
import { HomeOverview } from './v1-home/HomeOverview'
import { MarketingFooter } from './v1-home/MarketingFooter'
import { QuickStartSection } from './v1-home/QuickStartSection'
import { WorkflowIntro } from './v1-home/WorkflowIntro'
import { V1_TEMPLATES_VERSION } from './v1-template'

const styles = [
  `/* Hero */
    .hero{
      text-align:center;padding:128px 24px 108px;position:relative;overflow:hidden;
      background:
        radial-gradient(ellipse 60% 50% at 50% -5%,rgba(16,185,129,.07),transparent),
        radial-gradient(ellipse 80% 40% at 50% 0%,rgba(34,211,238,.03),transparent);
    }
    .hero::before{
      content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:600px;height:1px;
      background:linear-gradient(90deg,transparent,rgba(16,185,129,.35),transparent);
    }
    .hero h1{
      font-size:56px;font-weight:900;line-height:1.08;margin-bottom:24px;letter-spacing:-.04em;
    }
    .hero h1 .hl{
      background:linear-gradient(135deg,var(--accent),#34d399);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hero-sub{font-size:18px;color:var(--text-3);max-width:540px;margin:0 auto 44px;line-height:1.8}
    .hero-formula{
      display:inline-flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;
      padding:14px 28px;border-radius:var(--r);
      background:var(--bg-r);border:1px solid var(--border-d);
      font-size:14px;color:var(--text-2);margin-bottom:44px;
    }
    .hero-formula .sym{color:var(--accent);font-weight:700}
    .hero-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}

    /* Workflow */
    .wf-timeline{position:relative;padding-left:28px}
    .wf-timeline::before{
      content:'';position:absolute;left:11px;top:8px;bottom:8px;width:2px;
      background:linear-gradient(to bottom,var(--accent),var(--cyan),var(--purple));
      border-radius:2px;opacity:.3;
    }
    .wf-step{position:relative;padding:12px 0 20px 20px}
    .wf-step::before{
      content:'';position:absolute;left:-21px;top:18px;
      width:10px;height:10px;border-radius:50%;
      border:2px solid var(--accent);background:var(--bg);
    }
    .wf-step:nth-child(3n+2)::before{border-color:var(--cyan)}
    .wf-step:nth-child(3n)::before{border-color:var(--purple)}
    .wf-step-head{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}
    .wf-step h4{font-size:14px;font-weight:700}
    .wf-badge{
      font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;
      letter-spacing:.5px;
    }
    .wf-badge-user{background:rgba(251,191,36,.1);color:var(--yellow);border:1px solid rgba(251,191,36,.2)}
    .wf-badge-agent{background:rgba(16,185,129,.1);color:var(--accent);border:1px solid rgba(16,185,129,.2)}
    .wf-badge-auto{background:rgba(167,139,250,.1);color:var(--purple);border:1px solid rgba(167,139,250,.2)}
    .wf-step p{font-size:13px;color:var(--text-3);line-height:1.65}
    .wf-cmd{
      display:inline-block;margin-top:8px;padding:6px 14px;border-radius:6px;
      background:var(--bg-s);border:1px solid var(--border-d);
      font-size:12px;color:var(--cyan);
    }
    .wf-gate{
      margin-top:10px;padding:10px 16px;border-radius:var(--r);
      background:rgba(251,191,36,.04);border:1px solid rgba(251,191,36,.15);
      font-size:12px;color:var(--text-3);line-height:1.7;
    }
    .wf-gate strong{color:var(--yellow);font-weight:600}
    .wf-gate-items{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px}
    .wf-gate-item{
      padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;
      background:var(--bg-s);border:1px solid var(--border-d);color:var(--text-2);
    }

    /* Responsive */
    @media(max-width:1024px){
      .hero h1{font-size:44px}
    }
    @media(max-width:768px){
      .hero{padding:88px 16px 64px}
      .hero h1{font-size:34px}
      .hero-sub{font-size:15px;padding:0 8px}
    }
    @media(max-width:480px){
      .hero h1{font-size:28px}
      .hero-formula{font-size:12px;padding:12px 16px;gap:4px 8px;display:block;text-align:center;line-height:2.2}
    }`,
  `.qs-tab{background:transparent;color:var(--text-3)}
.qs-tab-active{background:var(--accent)!important;color:#fff!important}
.qs-tab:hover:not(.qs-tab-active){background:var(--bg-3);color:var(--text-1)}`,
]

const externalStyles: string[] = ['https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap']

export function V1HomePage(): React.JSX.Element {
  return (
    <PageFrame pageId="v1-home" title="DevKeel — AI Agent 项目知识框架" description="编排 · 规范 · 沉淀 — 编排最合适的工具组合，注入领域规范与技能，持续沉淀项目知识。让 Agent 进入项目就知道该怎么做。" styles={styles} externalStyles={externalStyles}>
      <div data-template-version={V1_TEMPLATES_VERSION}>
        <MarketingNav activePage="home" />
        <HomeHero />
        <HomeOverview />
        <WorkflowIntro />
        <QuickStartSection />
        <CommunitySection />
        <MarketingFooter />
      </div>
    </PageFrame>
  )
}
