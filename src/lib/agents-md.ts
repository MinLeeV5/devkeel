import {
  extractFrameworkContent,
  extractUserSlots,
  fillUserSlots,
} from './templates.js'

export const ROOT_AGENTS_TEMPLATE = 'agents-md.md'
export const DOMAIN_AGENTS_TEMPLATE = 'agents-domain-md.md'
export const DOMAIN_AGENTS_MARKER = '<!-- harness:domain-agents -->'

function meaningfulSlotContent(content: string): boolean {
  return content.replace(/<!--[\s\S]*?-->/g, '').trim().length > 0
}

function neutralizeUserSlotMarkers(content: string): string {
  return content
    .replaceAll('<!-- harness:user:', '<!-- migrated:harness:user:')
    .replaceAll('<!-- /harness:user:', '<!-- /migrated:harness:user:')
}

function appendProjectContent(
  slots: Map<string, string>,
  addition: string,
): void {
  const current = slots.get('project')?.trim()
  slots.set('project', `${current ? `${current}\n\n` : ''}${addition.trim()}\n`)
}

/**
 * Merge an existing AGENTS.md into a rendered DevKeel template without dropping content.
 * Managed templates contribute their user slots; unknown documents are retained verbatim.
 */
export function mergeAgentsMdContent(
  renderedTarget: string,
  existing: string,
  managedSources: string[],
): string {
  const targetSlots = extractUserSlots(renderedTarget)
  const mergedSlots = new Map<string, string>()
  const existingSlots = extractUserSlots(existing)
  const isManagedSource = existingSlots.size > 0 || managedSources.some(source => (
    extractFrameworkContent(source) === extractFrameworkContent(existing)
  ))

  if (isManagedSource) {
    const unmatched: string[] = []
    for (const [name, content] of existingSlots) {
      if (!meaningfulSlotContent(content)) continue
      if (targetSlots.has(name)) {
        mergedSlots.set(name, content)
      } else {
        unmatched.push(`### 原 \`${name}\` 定制区\n\n${content.trim()}`)
      }
    }
    if (unmatched.length > 0) appendProjectContent(mergedSlots, unmatched.join('\n\n'))
  } else {
    appendProjectContent(
      mergedSlots,
      `### 从原 AGENTS.md 保留的内容\n\n${neutralizeUserSlotMarkers(existing.trim())}`,
    )
  }

  return fillUserSlots(renderedTarget, mergedSlots)
}
