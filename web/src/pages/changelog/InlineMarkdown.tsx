import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'

interface InlineMarkdownProps {
  children: string
}

const components: Components = {
  a: ({ children, href }) => {
    if (!href || !isSafeLink(href)) return <>{children}</>

    const isExternal = isExternalHttpLink(href)
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    )
  },
  p: ({ children }) => <>{children}</>,
}

export function InlineMarkdown({ children }: InlineMarkdownProps): React.JSX.Element {
  return (
    <ReactMarkdown
      allowedElements={['p', 'em', 'strong', 'code', 'a', 'br']}
      components={components}
      remarkPlugins={[remarkBreaks, remarkInlineOnly]}
      unwrapDisallowed
      urlTransform={(url) => url}
    >
      {children}
    </ReactMarkdown>
  )
}

function isSafeLink(href: string): boolean {
  const normalized = href.trim().toLowerCase()
  if (normalized.startsWith('javascript:') || normalized.startsWith('data:') || normalized.startsWith('vbscript:')) {
    return false
  }

  const protocol = normalized.match(/^([a-z][a-z\d+.-]*):/i)?.[1]
  return protocol === undefined || protocol === 'http' || protocol === 'https'
}

function isExternalHttpLink(href: string): boolean {
  try {
    const baseUrl = new URL(typeof window === 'undefined' ? 'http://localhost/' : window.location.href)
    const linkUrl = new URL(href, baseUrl)
    return (linkUrl.protocol === 'http:' || linkUrl.protocol === 'https:') && linkUrl.origin !== baseUrl.origin
  } catch {
    return false
  }
}

interface MarkdownNode {
  children?: unknown[]
  type: string
  value?: unknown
}

function remarkInlineOnly() {
  return (tree: unknown): void => {
    replaceBlockCode(tree)
  }
}

function replaceBlockCode(value: unknown): void {
  if (!isMarkdownNode(value) || !value.children) return

  value.children = value.children.map((child) => {
    if (!isMarkdownNode(child)) return child
    if (child.type === 'code') {
      return { type: 'text', value: typeof child.value === 'string' ? child.value : '' }
    }
    replaceBlockCode(child)
    return child
  })
}

function isMarkdownNode(value: unknown): value is MarkdownNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}
