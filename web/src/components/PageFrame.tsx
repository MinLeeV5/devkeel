import { useEffect, type MouseEventHandler, type ReactNode } from 'react'

import { getSystemTheme, useThemeStore } from '../stores/theme-store'

interface PageFrameProps {
  children: ReactNode
  description?: string
  externalStyles?: string[]
  onAction?: MouseEventHandler<HTMLElement>
  pageId: string
  styles?: string[]
  title: string
}

export function PageFrame({
  children,
  description,
  externalStyles = [],
  onAction,
  pageId,
  styles = [],
  title,
}: PageFrameProps): React.JSX.Element {
  const supportsTheme = pageId === 'home' || pageId === 'changelog'
  const preference = useThemeStore((state) => state.preference)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const syncSystemTheme = useThemeStore((state) => state.syncSystemTheme)

  useEffect(() => {
    const previousTitle = document.title
    const descriptionMeta = ensureDescriptionMeta()
    const previousDescription = descriptionMeta.getAttribute('content')
    const appendedLinks = externalStyles.map((href) => appendStylesheet(href, pageId))

    document.title = title
    if (description) descriptionMeta.setAttribute('content', description)

    return () => {
      document.title = previousTitle
      if (previousDescription === null) {
        descriptionMeta.removeAttribute('content')
      } else {
        descriptionMeta.setAttribute('content', previousDescription)
      }
      appendedLinks.forEach((link) => link.remove())
    }
  }, [description, externalStyles, pageId, title])

  useEffect(() => {
    if (!supportsTheme || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = (): void => syncSystemTheme(getSystemTheme())

    syncTheme()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', syncTheme)
      return () => media.removeEventListener('change', syncTheme)
    }
    media.addListener(syncTheme)
    return () => media.removeListener(syncTheme)
  }, [supportsTheme, syncSystemTheme])

  useEffect(() => {
    if (!supportsTheme) return
    const root = document.documentElement
    const previousTheme = root.getAttribute('data-theme')
    const previousColorScheme = root.style.colorScheme

    root.setAttribute('data-theme', resolvedTheme)
    root.style.colorScheme = resolvedTheme

    return () => {
      if (previousTheme === null) {
        root.removeAttribute('data-theme')
      } else {
        root.setAttribute('data-theme', previousTheme)
      }
      root.style.colorScheme = previousColorScheme
    }
  }, [resolvedTheme, supportsTheme])

  return (
    <main
      className="react-page min-h-screen bg-zinc-950 text-zinc-50"
      data-page={pageId}
      data-theme={resolvedTheme}
      data-theme-preference={preference}
      onClick={onAction}
    >
      {styles.map((style, index) => (
        <style key={`${pageId}-style-${index}`}>{style}</style>
      ))}
      {children}
    </main>
  )
}

function ensureDescriptionMeta(): HTMLMetaElement {
  const existing = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (existing) return existing

  const meta = document.createElement('meta')
  meta.setAttribute('name', 'description')
  document.head.appendChild(meta)
  return meta
}

function appendStylesheet(href: string, pageId: string): HTMLLinkElement {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset['page'] = pageId
  document.head.appendChild(link)
  return link
}
