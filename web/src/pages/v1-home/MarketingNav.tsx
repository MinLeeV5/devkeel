import type { ReactNode } from 'react'

export type MarketingNavPage = 'home' | 'workflow' | 'architecture' | 'best-practices' | 'sharing' | 'changelog'

interface MarketingNavProps {
  activePage: MarketingNavPage
}

const navItems: Array<{ href: string; id: MarketingNavPage; label: string }> = [
  { href: './index.html', id: 'home', label: '首页' },
  { href: './workflow.html', id: 'workflow', label: '工作流' },
  { href: './architecture.html', id: 'architecture', label: '架构设计' },
  { href: './best-practices.html', id: 'best-practices', label: '最佳实践' },
  { href: './sharing.html', id: 'sharing', label: '⭐️ 技术分享' },
  { href: '../changelog.html', id: 'changelog', label: '变更日志' },
]

export function MarketingNav({ activePage }: MarketingNavProps): React.JSX.Element {
  return (
    <nav>
      <div className="nav-inner">
        <a href="./index.html" className="nav-logo" aria-label="DevKeel 首页">
          <div className="nav-mark">
            <img src="../assets/favicon.ico" style={{ width: 16, height: 16 }} alt="" />
          </div>
          DevKeel
        </a>
        <div className="nav-links">
          {navItems.map((item) => (
            <a key={item.id} href={item.href} className={item.id === activePage ? 'active' : undefined}>
              {item.label}
            </a>
          ))}
          <a
            href="../index.html"
            aria-label="升级到 V2"
            style={{
              alignItems: 'center',
              background: 'rgba(16,185,129,.1)',
              border: '1px solid rgba(16,185,129,.35)',
              borderRadius: 999,
              color: 'var(--accent)',
              display: 'inline-flex',
              fontWeight: 700,
              gap: 4,
              padding: '4px 11px',
            }}
          >
            升级到 V2 <span aria-hidden="true">→</span>
          </a>
          <a
            href="https://github.com/MinLeeV5/devkeel"
            target="_blank"
            rel="noopener"
            title="GitHub"
            style={{ display: 'inline-flex', alignItems: 'center' }}
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </nav>
  )
}

function GitHubIcon(): ReactNode {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.795 23.385c.6.11.82-.26.82-.577v-2.234c-3.338.725-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.808 1.305 3.493.998.108-.776.418-1.305.762-1.605-2.665-.303-5.467-1.333-5.467-5.932 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.006 0c2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.769.84 1.235 1.911 1.235 3.221 0 4.611-2.807 5.625-5.479 5.922.43.372.823 1.102.823 2.222v3.293c0 .32.216.694.825.576A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}
