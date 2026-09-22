#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const input = process.argv[2]

if (!input) {
  process.stderr.write('Usage: planning-state.mjs <brainstorm.md>\n')
  process.exit(2)
}

const filePath = path.resolve(input)
if (!fs.existsSync(filePath)) {
  process.stdout.write(`${JSON.stringify({
    state: 'MISSING',
    valid: false,
    applyReady: false,
    file: filePath,
    reasons: ['brainstorm.md 不存在'],
  })}\n`)
  process.exit(0)
}

const source = fs.readFileSync(filePath, 'utf8')
const statusLines = source.match(/^> \*\*状态：\*\* `(?:DRAFT|CONFIRMED)`[^\n]*$/gmu) ?? []

if (statusLines.length === 0) {
  process.stdout.write(`${JSON.stringify({
    state: 'LEGACY',
    valid: false,
    applyReady: false,
    file: filePath,
    reasons: ['缺少 Living Artifact 状态行，需要迁移并由用户确认'],
  })}\n`)
  process.exit(0)
}

const reasons = []
if (statusLines.length !== 1) reasons.push(`状态行数量必须为 1，实际为 ${statusLines.length}`)

const statusLine = statusLines[0] ?? ''
const draftMatch = statusLine.match(/^> \*\*状态：\*\* `DRAFT` · \*\*实施准备度：\*\* (\d+)%$/u)
const confirmedMatch = statusLine.match(
  /^> \*\*状态：\*\* `CONFIRMED` · \*\*确认项：\*\* (\d+) D \/ (\d+) A \/ (\d+) O$/u,
)

if (!draftMatch && !confirmedMatch) reasons.push('状态行格式无效')

const historyStart = source.search(/^## 决策变更记录\s*$/mu)
const activeSource = historyStart >= 0 ? source.slice(0, historyStart) : source
const decisionMatches = [...activeSource.matchAll(/^#### (D|A|O)-(\d+)\b.*$/gmu)]
const ids = decisionMatches.map(match => `${match[1]}-${match[2]}`)
const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))]
if (duplicates.length > 0) reasons.push(`存在重复确认项：${duplicates.join(', ')}`)

const counts = { D: 0, A: 0, O: 0 }
for (const id of new Set(ids)) counts[id[0]] += 1

const downstreamMatches = [...source.matchAll(/^- \*\*下游状态：\*\* `(NONE|CURRENT|STALE)`\s*$/gmu)]
if (downstreamMatches.length !== 1) {
  reasons.push(`下游状态行数量必须为 1，实际为 ${downstreamMatches.length}`)
}
const downstream = downstreamMatches[0]?.[1] ?? 'UNKNOWN'

let state = 'INVALID'
let readiness = null

if (draftMatch) {
  state = 'DRAFT'
  readiness = Number(draftMatch[1])
  if (readiness < 0 || readiness > 95 || readiness % 5 !== 0) {
    reasons.push('DRAFT 实施准备度必须为 0～95 且按 5% 递增')
  }
}

if (confirmedMatch) {
  state = 'CONFIRMED'
  const declared = {
    D: Number(confirmedMatch[1]),
    A: Number(confirmedMatch[2]),
    O: Number(confirmedMatch[3]),
  }
  for (const kind of ['D', 'A', 'O']) {
    if (declared[kind] !== counts[kind]) {
      reasons.push(`${kind} 计数不一致：状态行为 ${declared[kind]}，正文为 ${counts[kind]}`)
    }
  }
  if (counts.O > 0) reasons.push('CONFIRMED 不能包含开放项 O-*')
}

const valid = reasons.length === 0
const applyReady = valid && state === 'CONFIRMED' && downstream === 'CURRENT'

process.stdout.write(`${JSON.stringify({
  state,
  valid,
  applyReady,
  readiness,
  counts,
  downstream,
  duplicates,
  file: filePath,
  reasons,
})}\n`)
