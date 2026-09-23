import { useEffect, useState } from 'react'

import { MARKETING_FONT_STYLESHEET, MarketingNav } from '../components/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { useVersionCatalog } from '../hooks/useVersionCatalog'
import { getVersionSectionId, type VersionCatalogResponse } from '../lib/version-catalog'
import { usePageUiStore } from '../stores/page-ui-store'
import { VersionPanel } from './changelog/VersionPanel'

const styles = [
  `:root{--max-w:960px}
    .container{max-width:var(--max-w);margin:0 auto;padding:0 24px}

    /* Hero */
    .hero{
      padding:80px 24px 60px;text-align:center;
      background:radial-gradient(ellipse 60% 50% at 50% -5%,rgba(16,185,129,.06),transparent);
    }
    .hero h1{font-size:42px;font-weight:900;letter-spacing:-.03em;margin-bottom:12px}
    .hero h1 .hl{
      background:linear-gradient(135deg,var(--accent),#34d399);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hero-sub{font-size:16px;color:var(--text-3);max-width:500px;margin:0 auto}

    /* Version Section */
    .version-section{padding:64px 24px;border-top:1px solid var(--border-d)}
    .version-section:first-of-type{border-top:none}
    .version-header{display:flex;align-items:center;gap:16px;margin-bottom:32px;flex-wrap:wrap}
    .version-badge{
      font-size:24px;font-weight:900;letter-spacing:-.02em;
      padding:8px 20px;border-radius:var(--r);
      background:var(--bg-r);border:2px solid;
    }
    .version-badge-latest{border-color:var(--accent);color:var(--accent)}
    .version-badge-minor{border-color:var(--cyan);color:var(--cyan)}
    .version-badge-legacy{border-color:var(--text-4);color:var(--text-4)}
    .version-title{font-size:15px;color:var(--text-3);font-weight:500;flex-basis:100%}
    .version-date{font-size:12px;color:var(--text-4);font-weight:500;letter-spacing:.3px}

    /* Change Cards */
    .changes{display:flex;flex-direction:column;gap:16px}
    .change-group{
      padding:24px;border-radius:var(--r-lg);
      background:var(--bg-r);border:1px solid var(--border-d);
    }
    .change-group h3{
      font-size:15px;font-weight:700;margin-bottom:12px;
      display:flex;align-items:center;gap:10px;
    }
    .change-type{
      font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
      padding:3px 8px;border-radius:4px;flex-shrink:0;
    }
    .type-feat{background:rgba(16,185,129,.12);color:var(--accent)}
    .type-refactor{background:rgba(167,139,250,.12);color:var(--purple)}
    .type-fix{background:rgba(251,191,36,.12);color:var(--yellow)}
    .type-breaking{background:rgba(248,113,113,.12);color:var(--red)}
    .type-perf{background:rgba(34,211,238,.12);color:var(--cyan)}
    .type-docs{background:rgba(96,165,250,.12);color:#60a5fa}
    .change-list{list-style:none;display:flex;flex-direction:column;gap:8px}
    .change-list li{
      font-size:13px;color:var(--text-3);line-height:1.7;
      padding-left:16px;position:relative;
    }
    .change-list li::before{
      content:'';position:absolute;left:0;top:10px;
      width:6px;height:6px;border-radius:50%;background:var(--text-4);
    }
    .change-list li strong{color:var(--text-2);font-weight:600}
    .change-list li code{white-space:normal;overflow-wrap:anywhere;word-break:break-word}

    /* Version Update Banner */
    .version-update-banner{
      display:none;margin:0 0 32px;padding:24px 28px;border-radius:var(--r-lg);
      background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(16,185,129,.06));
      border:2px solid rgba(251,191,36,.4);animation:banner-in .4s ease-out;
    }
    .version-update-banner.visible{display:block}
    .version-update-banner h2{font-size:18px;font-weight:800;margin-bottom:8px;color:var(--yellow)}
    .version-update-banner .bv{font-size:15px;color:var(--text-2);margin-bottom:12px;font-weight:600}
    .version-update-banner .bv .arrow{color:var(--accent);margin:0 8px}
    .version-update-banner code{
      display:inline-block;font-family:'JetBrains Mono',monospace;font-size:13px;
      padding:6px 14px;border-radius:var(--r);background:var(--bg-in);color:var(--accent);
    }
    .version-update-banner .bx{
      float:right;background:none;border:none;color:var(--text-4);
      font-size:18px;cursor:pointer;padding:0 4px;line-height:1;
    }
    .version-update-banner .bx:hover{color:var(--text-2)}
    @keyframes banner-in{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}

    /* Update Tip */
    .update-tip{
      margin:0 0 48px;padding:24px 28px;border-radius:var(--r-lg);
      background:linear-gradient(135deg,rgba(16,185,129,.06),rgba(34,211,238,.04));
      border:1px solid rgba(16,185,129,.25);
    }
    .update-tip h2{font-size:16px;font-weight:700;margin-bottom:12px;color:var(--accent);display:flex;align-items:center;gap:8px}
    .update-tip code{
      display:block;font-family:'JetBrains Mono',monospace;font-size:13px;
      padding:12px 16px;border-radius:var(--r);
      background:var(--bg-in);color:var(--text-2);line-height:1.8;
      white-space:pre-wrap;overflow-wrap:anywhere;
    }
    .update-tip .tip-note{font-size:12px;color:var(--text-4);margin-top:10px}
    .update-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .update-method-grid code{white-space:pre-wrap;overflow-wrap:normal;word-break:normal}

    /* Tab layout */
    .changelog-tabs{margin:0 0 0}
    .tab-bar{display:flex;gap:4px;border-bottom:2px solid var(--border-d);margin-bottom:40px}
    .tab-btn{
      padding:12px 24px;font-size:15px;font-weight:700;
      background:none;border:none;cursor:pointer;
      color:var(--text-4);border-bottom:2px solid transparent;
      margin-bottom:-2px;transition:color .2s,border-color .2s;
      display:flex;align-items:center;gap:10px;
    }
    .tab-btn:hover{color:var(--text-2)}
    .tab-btn.active{color:var(--accent);border-bottom-color:var(--accent)}
    .tab-btn.active[data-tab="cli"]{color:var(--cyan);border-bottom-color:var(--cyan)}
    .tab-panel{display:none}
    .tab-panel.active{display:block}
    .tab-panel .version-section:first-of-type{border-top:none;padding-top:0}
    #panel-templates .version-badge-latest{border-color:var(--accent);color:var(--accent)}
    #panel-templates .version-badge-minor{border-color:var(--purple);color:var(--purple)}
    #panel-cli .version-badge-latest{border-color:var(--cyan);color:var(--cyan)}
    #panel-cli .version-badge-minor{border-color:var(--text-4);color:var(--text-4)}

    /* History archive */
    .history-archive{border-top:1px solid var(--border-d);padding-top:24px;margin-top:64px}
    .history-archive details{cursor:pointer}
    .history-archive summary{font-size:15px;font-weight:700;color:var(--text-3);padding:12px 0;list-style:none;display:flex;align-items:center;gap:8px}
    .history-archive summary::before{content:'▶';font-size:10px;transition:transform .2s}
    .history-archive details[open] summary::before{transform:rotate(90deg)}
    .history-archive .version-section{padding:32px 0}

    /* Update tip dual version */
    .update-tip-versions{display:flex;gap:8px;margin-left:auto;align-items:center}
    .version-chip{font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap}
    .version-chip-cli{background:rgba(34,211,238,.15);color:var(--cyan)}
    .version-chip-tpl{background:rgba(16,185,129,.15);color:var(--accent)}

    /* Back link */
    .back-link{
      display:inline-flex;align-items:center;gap:6px;
      font-size:13px;font-weight:600;color:var(--text-3);
      margin-bottom:24px;
    }
    .back-link:hover{color:var(--accent)}

    /* Responsive */
    @media(max-width:768px){
      .hero h1{font-size:30px}
      .update-tip h2{align-items:flex-start;flex-direction:column}
      .update-tip-versions{margin-left:0;flex-wrap:wrap}
      .update-method-grid{grid-template-columns:1fr}
    }`,
]

const externalStyles = [MARKETING_FONT_STYLESHEET]


const stateStyles = [
  '.catalog-state{margin:0 0 40px;padding:40px 24px;border:1px solid var(--border-d);border-radius:var(--r-lg);background:var(--bg-r);color:var(--text-3);text-align:center}.catalog-state p{font-size:13px;line-height:1.7}.catalog-state-error{border-color:rgba(248,113,113,.35)}.catalog-state-error p{color:var(--red);margin-bottom:14px}.catalog-state-error .catalog-retrying{color:var(--text-3)}.catalog-retry{padding:8px 18px;border:1px solid var(--border-d);border-radius:var(--r);background:var(--bg-in);color:var(--text-2);font-size:13px;font-weight:700;cursor:pointer}.catalog-retry:hover{border-color:var(--accent);color:var(--accent)}.catalog-retry:disabled{cursor:wait;opacity:.65}.catalog-skeleton{display:flex;flex-direction:column;gap:12px;margin-top:20px}.catalog-skeleton-line{height:12px;border-radius:999px;background:linear-gradient(90deg,var(--bg-in),var(--border-d),var(--bg-in));background-size:200% 100%;animation:catalog-pulse 1.4s ease-in-out infinite}.catalog-skeleton-line:nth-child(2){width:72%}.catalog-skeleton-line:nth-child(3){width:46%}@keyframes catalog-pulse{from{background-position:200% 0}to{background-position:-200% 0}}.change-name{color:var(--text-2);font-weight:600}.version-update-open{cursor:pointer}.version-update-open:focus-visible{outline:2px solid var(--yellow);outline-offset:3px}',
]

export function ChangelogPage(): React.JSX.Element {
  const changelogTab = usePageUiStore((state) => state.changelogTab)
  const { data, error, isLoading, isRetrying, reload } = useVersionCatalog()

  return (
    <PageFrame
      pageId="changelog"
      title="DevKeel — CLI 与 Templates 版本记录"
      description="DevKeel CLI 与 Templates 两条独立版本流的当前版本、升级方式和完整历史记录。"
      styles={[...styles, ...stateStyles]}
      externalStyles={externalStyles}
    >
      <div>
        <MarketingNav activePage="changelog" />
        <ChangelogHero />
        <div className="container">
          <VersionUpdateBanner latest={data?.cli.latest ?? null} />
          <UpdateTip catalog={data} />
          <div className="changelog-tabs">
            <ChangelogTabs />
            {isLoading ? <CatalogLoading /> : null}
            {!isLoading && error ? <CatalogError error={error} isRetrying={isRetrying} onRetry={reload} /> : null}
            {!isLoading && !error && data ? (
              <>
                <div id="panel-templates" className={'tab-panel' + (changelogTab === 'templates' ? ' active' : '')}>
                  <VersionPanel catalog={data.templates} stream="templates" />
                </div>
                <div id="panel-cli" className={'tab-panel' + (changelogTab === 'cli' ? ' active' : '')}>
                  <VersionPanel catalog={data.cli} stream="cli" />
                </div>
              </>
            ) : null}
          </div>
        </div>
        <ChangelogFooter />
      </div>
    </PageFrame>
  )
}

function ChangelogHero(): React.JSX.Element {
  return (
    <section className="hero">
      <div className="container">
        <h1>版本<span className="hl">事实与历史</span></h1>
        <p className="hero-sub">CLI 与 Templates 独立发布、独立排序；当前能力与设计说明回到对应产品页面。</p>
      </div>
    </section>
  )
}

interface VersionUpdateBannerProps {
  latest: string | null
}

function VersionUpdateBanner({ latest }: VersionUpdateBannerProps): React.JSX.Element | null {
  const [fromVersion] = useState(readFromVersion)
  const [visible, setVisible] = useState(true)
  const setChangelogTab = usePageUiStore((state) => state.setChangelogTab)

  useEffect(() => {
    if (!fromVersion || !latest) return
    setChangelogTab('cli')
    const animationFrame = requestAnimationFrame(() => {
      const target = document.getElementById(getVersionSectionId('cli', [latest]))
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => cancelAnimationFrame(animationFrame)
  }, [fromVersion, latest, setChangelogTab])

  if (!visible || !fromVersion || !latest) return null

  return (
    <div className="version-update-banner visible">
      <button
        type="button"
        className="bx"
        onClick={() => setVisible(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            setVisible(false)
          }
        }}
        title="关闭"
        aria-label="关闭更新提示"
      >
        ×
      </button>
      <div className="version-update-open">
        <h2>🔔 你有更新的版本</h2>
        <p className="bv"><span>v{fromVersion}</span><span className="arrow">→</span><span>v{latest}</span></p>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>运行以下命令升级到最新版本：</p>
        <code>npx devkeel@latest update</code>
      </div>
    </div>
  )
}

function readFromVersion(): string | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('from')?.trim()
  return value ? value.replace(/^v/i, '') : null
}

interface UpdateTipProps {
  catalog: VersionCatalogResponse | null
}

function UpdateTip({ catalog }: UpdateTipProps): React.JSX.Element {
  return (
    <div className="update-tip">
      <h2>🚀 如何更新
        <span className="update-tip-versions">
          <span className="version-chip version-chip-cli">{catalog ? 'CLI v' + catalog.cli.latest : 'CLI —'}</span>
          <span className="version-chip version-chip-tpl">{catalog ? 'Templates v' + catalog.templates.latest : 'Templates —'}</span>
        </span>
      </h2>
      <code>{[
        '# 通过公共 npm 仓库直接执行',
        'npx devkeel@latest update',
      ].join('\n')}</code>
      <p className="tip-note">无需全局安装，使用 latest 渠道的 CLI 更新当前项目模板。</p>
      <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 'var(--r)', background: 'var(--bg-in)', border: '1px solid var(--border-d)' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>CLI 程序与项目模板独立升级</p>
        <div className="update-method-grid">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 6 }}>已全局安装</p>
            <code style={{ fontSize: 12, padding: '10px 12px', display: 'block', background: 'var(--bg-in)', border: '1px solid var(--border-d)', color: 'var(--text-3)' }}>{[
              'npm install -g devkeel@latest',
              'devkeel update',
            ].join('\n')}</code>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6, lineHeight: '1.6' }}>第一条升级全局 CLI；第二条拉取模板更新。<br />只更新项目模板时，直接运行 devkeel update。</p>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 6 }}>临时使用最新 CLI</p>
            <code style={{ fontSize: 12, padding: '10px 12px', display: 'block', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', color: 'var(--text-3)' }}>{[
              'npx devkeel@latest update',
            ].join('\n')}</code>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6, lineHeight: '1.6' }}>临时使用 latest 渠道的 CLI 拉取模板更新，<br />不改变全局安装的 CLI 版本。</p>
          </div>
        </div>
      </div>
      <p className="tip-note">模板更新选择“全部更新”会覆盖待更新组件的本地修改；需要逐项跳过时选择“逐个确认”。可先加 --dry-run 查看计划。</p>
    </div>
  )
}

function ChangelogTabs(): React.JSX.Element {
  const changelogTab = usePageUiStore((state) => state.changelogTab)
  const setChangelogTab = usePageUiStore((state) => state.setChangelogTab)

  return (
    <div className="tab-bar">
      <button
        type="button"
        className={'tab-btn' + (changelogTab === 'templates' ? ' active' : '')}
        data-tab="templates"
        aria-pressed={changelogTab === 'templates'}
        onClick={() => setChangelogTab('templates')}
      >
        📦 模板资产
      </button>
      <button
        type="button"
        className={'tab-btn' + (changelogTab === 'cli' ? ' active' : '')}
        data-tab="cli"
        aria-pressed={changelogTab === 'cli'}
        onClick={() => setChangelogTab('cli')}
      >
        ⚙️ CLI
      </button>
    </div>
  )
}

function CatalogLoading(): React.JSX.Element {
  return (
    <div className="catalog-state" aria-live="polite">
      <p>正在加载版本记录…</p>
      <div className="catalog-skeleton" aria-hidden="true">
        <span className="catalog-skeleton-line" />
        <span className="catalog-skeleton-line" />
        <span className="catalog-skeleton-line" />
      </div>
    </div>
  )
}

interface CatalogErrorProps {
  error: Error
  isRetrying: boolean
  onRetry: () => void
}

function CatalogError({ error, isRetrying, onRetry }: CatalogErrorProps): React.JSX.Element {
  return (
    <div className="catalog-state catalog-state-error" role="alert" aria-busy={isRetrying}>
      <p>版本记录加载失败：{error.message}</p>
      {isRetrying ? <p className="catalog-retrying">正在重新加载版本记录…</p> : null}
      <button type="button" className="catalog-retry" disabled={isRetrying} onClick={onRetry}>
        {isRetrying ? '重试中…' : '重试'}
      </button>
    </div>
  )
}


function ChangelogFooter(): React.JSX.Element {
  return (
    <footer style={{ padding: '48px 24px', textAlign: 'center', borderTop: '1px solid var(--border-d)' }}>
      <div className="container">
        <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
          <a href="./index.html" style={{ color: 'var(--accent)' }}>← 返回首页</a>
          &nbsp;·&nbsp;
          <a href="./index.html#why-v2">V2 首页</a>
          &nbsp;·&nbsp;
          DevKeel Templates V2
        </p>
      </div>
    </footer>
  )
}
