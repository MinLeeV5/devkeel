import type { ReactNode } from 'react'

import { useThemeStore, type ThemePreference } from '../stores/theme-store'
import './MarketingNav.css'

export const MARKETING_FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap'

export type MarketingNavPage = 'home' | 'changelog'

interface MarketingNavProps {
  activePage: MarketingNavPage
}

const navItems: Array<{ href: string; id?: MarketingNavPage; label: string }> = [
  { href: './sharing.html', label: '技术分享' },
  { href: './changelog.html', id: 'changelog', label: '变更日志' },
  { href: './v1/index.html', label: 'V1' },
]

export function MarketingNav({ activePage }: MarketingNavProps): React.JSX.Element {
  return (
    <nav className="marketing-nav">
      <div className="nav-inner">
        <a href="./index.html" className="nav-logo" aria-label="DevKeel 首页">
          <div className="nav-mark">
            <img src="./assets/favicon.ico" style={{ width: 16, height: 16 }} alt="" />
          </div>
          DevKeel
        </a>
        <div className="nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className={item.id === activePage ? 'active' : undefined} aria-current={item.id === activePage ? 'page' : undefined}>
              {item.label}
            </a>
          ))}
          <ThemeSwitcher />
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

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
  { label: '跟随设备', value: 'system' },
  { label: '浅色主题', value: 'light' },
  { label: '暗色主题', value: 'dark' },
]

function ThemeSwitcher(): React.JSX.Element {
  const preference = useThemeStore((state) => state.preference)
  const setPreference = useThemeStore((state) => state.setPreference)

  return (
    <div className="theme-switcher" role="group" aria-label="主题风格">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className="theme-option"
          aria-label={option.label}
          aria-pressed={preference === option.value}
          title={option.label}
          onClick={() => setPreference(option.value)}
        >
          <ThemeIcon preference={option.value} />
        </button>
      ))}
    </div>
  )
}

function ThemeIcon({ preference }: { preference: ThemePreference }): ReactNode {
  if (preference === 'system') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
        <path d="M8.5 20h7M12 16.5V20" />
      </svg>
    )
  }
  if (preference === 'light') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.4 15.5A8 8 0 0 1 8.5 4.6a8 8 0 1 0 10.9 10.9Z" />
    </svg>
  )
}

function GitHubIcon(): ReactNode {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.795 23.385c.6.11.82-.26.82-.577v-2.234c-3.338.725-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.808 1.305 3.493.998.108-.776.418-1.305.762-1.605-2.665-.303-5.467-1.333-5.467-5.932 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 6.006 0c2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.119 3.176.769.84 1.235 1.911 1.235 3.221 0 4.611-2.807 5.625-5.479 5.922.43.372.823 1.102.823 2.222v3.293c0 .32.216.694.825.576A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}
