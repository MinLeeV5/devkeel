import { fillUserSlots } from './templates.js'

export const ROOT_AGENTS_TEMPLATE = 'agents-md.md'
export const DOMAIN_AGENTS_TEMPLATE = 'agents-domain-md.md'
export const DOMAIN_AGENTS_MARKER = '<!-- harness:domain-agents -->'
const CARRIED_ROUTING_HEADING = '### 保留的专项路由'

function markdownLines(content: string): RegExpExecArray[] {
  let fence: string | undefined
  return [...content.matchAll(/^.+$/gm)].filter(line => {
    const delimiter = /^ {0,3}(`{3,}|~{3,})/.exec(line[0])?.[1]
    if (delimiter) {
      if (!fence) fence = delimiter
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length
        && line[0].trimEnd().endsWith(delimiter)) fence = undefined
      return false
    }
    return !fence
  })
}

function userSlotRanges(content: string): { name: string; body: string; start: number; end: number }[] {
  const ranges = []
  let opening: { name: string; start: number; bodyStart: number } | undefined
  for (const line of markdownLines(content)) {
    const marker = /^<!-- (\/)?harness:user:(\S+) -->$/.exec(line[0].trimEnd())
    if (!marker) continue
    if (!marker[1] && !opening) {
      opening = { name: marker[2]!, start: line.index, bodyStart: line.index + line[0].length + 1 }
    } else if (marker[1] && opening && opening.name === marker[2]) {
      ranges.push({ ...opening, body: content.slice(opening.bodyStart, line.index), end: line.index + line[0].length })
      opening = undefined
    }
  }
  return ranges
}

function userSlots(content: string): Map<string, string> {
  return new Map(userSlotRanges(content).map(({ name, body }) => [name, body]))
}

function frameworkContent(content: string): string {
  let framework = content
  for (const { start, end } of userSlotRanges(content).reverse()) {
    framework = `${framework.slice(0, start)}${framework.slice(end)}`
  }
  return framework.trim()
}

/** Keep unfilled placeholders editable; completed slots are ordinary Markdown. */
export function cleanAgentsMdSlots(content: string, sources: string[]): string {
  const expectedSlots = userSlots(content)
  let cleaned = content
  for (const { body, start, end } of userSlotRanges(content).reverse()) {
    if (!meaningfulSlotContent(body) || /\{\{\w+\}\}/.test(body)) continue
    const candidate = `${cleaned.slice(0, start)}${body.trim()}${cleaned.slice(end)}`
    const restored = restoreAgentsMdSlots(candidate, sources)
    const recoveredSlots = userSlots(restored ?? '')
    if ([...expectedSlots].every(([name, value]) => recoveredSlots.get(name)?.trim() === value.trim())) {
      cleaned = candidate
    }
  }
  return cleaned
}

/** Recover completed slots only when every boundary in a known template is unambiguous. */
export function restoreAgentsMdSlots(existing: string, sources: string[]): string | null {
  const content = existing.replace(/\r\n/g, '\n')
  const markedSlots = userSlots(content)
  const markedRanges = userSlotRanges(content)
  if (markedSlots.size !== markedRanges.length) return null
  const lines = markdownLines(content)
  const positions = (anchor: string) => lines.filter(line => (
    line[0] === anchor && !markedRanges.some(range => line.index >= range.start && line.index < range.end)
  )).map(line => line.index)
  const appendix = positions(CARRIED_ROUTING_HEADING)
  const endOfBody = appendix.length === 1 ? appendix[0]! : content.length
  const rankedSources = sources.map(source => ({
    source,
    score: [...frameworkContent(source).matchAll(/^#{1,3} .+$/gm)]
      .filter(heading => positions(heading[0]).length > 0).length,
  }))
  const bestScore = Math.max(0, ...rankedSources.map(({ score }) => score))
  if (bestScore < 2) return null

  for (const { source, score } of rankedSources) {
    if (score !== bestScore) continue
    const slots = userSlotRanges(source)
    if (slots.length === 0) continue
    if (appendix.length === 1 && slots.some(slot => slot.name === 'l0-custom')) continue
    const ranges: { name: string; start: number; end: number }[] = []
    let valid = appendix.length < 2
    for (const slot of slots) {
      const { name } = slot
      if (markedSlots.has(name)) continue
      const before = source.slice(0, slot.start).trimEnd().split('\n').at(-1) ?? ''
      const after = source.slice(slot.end).trimStart().split('\n')[0] ?? ''
      const starts = positions(before)
      const ends = after ? positions(after) : [endOfBody]
      if (starts.length !== 1 || ends.length !== 1) {
        valid = false
        break
      }
      const start = starts[0]! + before.length
      const end = ends[0]!
      if (start > end || end > endOfBody || markedRanges.some(range => start < range.end && end > range.start)) {
        valid = false
        break
      }
      ranges.push({ name, start, end })
    }
    if (!valid) continue
    if (appendix.length === 1 && !markedSlots.has('l0-custom')) {
      ranges.push({ name: 'l0-custom', start: endOfBody + CARRIED_ROUTING_HEADING.length, end: content.length })
    }
    ranges.sort((a, b) => a.start - b.start)
    if (ranges.some((range, index) => index > 0 && range.start < ranges[index - 1]!.end)) continue
    let restored = content
    for (const { name, start, end } of ranges.reverse()) {
      const body = content.slice(start, end).trim()
      restored = `${restored.slice(0, start)}\n\n<!-- harness:user:${name} -->\n${body ? `${body}\n` : ''}<!-- /harness:user:${name} -->\n\n${restored.slice(end)}`
    }
    return restored
  }

  return null
}

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
  const restored = restoreAgentsMdSlots(existing, managedSources)
  const sourceContent = restored ?? existing
  const targetSlots = userSlots(renderedTarget)
  const mergedSlots = new Map<string, string>()
  const existingSlots = userSlots(sourceContent)
  let carriedRouting: string | undefined
  const isManagedSource = restored !== null

  if (isManagedSource) {
    const unmatched: string[] = []
    let legacyDomain: string | undefined
    for (const [name, content] of existingSlots) {
      if (!meaningfulSlotContent(content) && name !== 'l0-custom') continue
      if (targetSlots.has(name)) {
        mergedSlots.set(name, content)
      } else if (name === 'domain' && targetSlots.has('project')) {
        legacyDomain = content
      } else if (name === 'l0-custom') {
        carriedRouting = content
      } else {
        unmatched.push(`### 原 \`${name}\` 定制区\n\n${content.trim()}`)
      }
    }
    if (legacyDomain) appendProjectContent(mergedSlots, legacyDomain)
    if (unmatched.length > 0) appendProjectContent(mergedSlots, unmatched.join('\n\n'))

    const defaultRouting = (targetSlots.get('l0-custom')
      ?? managedSources.map(source => userSlots(source).get('l0-custom')).find(Boolean))?.trim()
    const customRouting = (mergedSlots.get('l0-custom') ?? carriedRouting)?.trim()
    if (defaultRouting && frameworkContent(sourceContent).includes(defaultRouting)) {
      const routing = customRouting && meaningfulSlotContent(customRouting)
        ? (customRouting.includes(defaultRouting) ? customRouting : `${defaultRouting}\n\n${customRouting}`)
        : defaultRouting
      if (targetSlots.has('l0-custom')) {
        mergedSlots.set('l0-custom', `${routing}\n`)
      } else {
        carriedRouting = `${routing}\n`
      }
    }
  } else {
    appendProjectContent(
      mergedSlots,
      `### 从原 AGENTS.md 保留的内容\n\n${neutralizeUserSlotMarkers(existing.trim())}`,
    )
  }

  const merged = fillUserSlots(renderedTarget, mergedSlots)
  return carriedRouting === undefined
    ? merged
    : `${merged.trimEnd()}\n\n${CARRIED_ROUTING_HEADING}\n\n<!-- harness:user:l0-custom -->\n${carriedRouting}<!-- /harness:user:l0-custom -->\n`
}
