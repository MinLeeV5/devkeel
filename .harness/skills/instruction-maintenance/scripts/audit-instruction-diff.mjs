#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
let base = 'HEAD'
let maxLength = 120
const scopePaths = []

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--base' && args[i + 1]) {
    base = args[++i]
  } else if (args[i] === '--max-length' && args[i + 1]) {
    maxLength = Number(args[++i])
  } else if (args[i] === '--path' && args[i + 1]) {
    scopePaths.push(args[++i])
  } else {
    console.error(
      'Usage: audit-instruction-diff.mjs [--base <git-ref>] '
      + '[--max-length <characters>] [--path <file-or-directory>]...',
    )
    process.exit(2)
  }
}

if (!Number.isFinite(maxLength) || maxLength < 40) {
  console.error('--max-length must be a number of at least 40')
  process.exit(2)
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
}).trim()

const normalizedScopePaths = scopePaths.map((scopePath) => {
  const absolute = path.resolve(root, scopePath)
  const relative = path.relative(root, absolute)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    console.error(`--path must stay inside the repository: ${scopePath}`)
    process.exit(2)
  }
  if (!fs.existsSync(absolute)) {
    console.error(`--path does not exist: ${scopePath}`)
    process.exit(2)
  }
  return (relative || '.').split(path.sep).join('/')
})

function git(argv) {
  return execFileSync('git', argv, { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean)
}

const changed = new Set([
  ...git(['diff', '--name-only', '--diff-filter=ACMR', base, '--']),
  ...git(['ls-files', '--others', '--exclude-standard']),
  ...normalizedScopePaths.flatMap(scopePath => (
    git(['ls-files', '--cached', '--others', '--exclude-standard', '--', scopePath])
  )),
])

function isInstructionFile(relativePath) {
  return (
    /(^|\/)AGENTS\.md$/.test(relativePath)
    || /(^|\/)SKILL\.md$/.test(relativePath)
    || /(^|\/)schema\.ya?ml$/.test(relativePath)
    || /(^|\/)commands\/.*\.md$/.test(relativePath)
    || /(^|\/)schemas\/.*\/templates\/.*\.md$/.test(relativePath)
    || /(^|\/)rules\/.*\.md$/.test(relativePath)
  )
}

function canonicalPath(relativePath) {
  const mappings = [
    ['.harness/skills/', 'templates/skills/'],
    ['.harness/commands/', 'templates/commands/'],
    ['openspec/schemas/', 'templates/openspec/schemas/'],
  ]
  for (const [mirrorPrefix, templatePrefix] of mappings) {
    if (relativePath.startsWith(mirrorPrefix)) {
      const candidate = templatePrefix + relativePath.slice(mirrorPrefix.length)
      if (fs.existsSync(path.join(root, candidate))) return candidate
    }
  }
  if (relativePath === 'AGENTS.md' && fs.existsSync(path.join(root, 'templates/agents-md.md'))) {
    return 'templates/agents-md.md'
  }
  return relativePath
}

function mirrorPath(relativePath) {
  const mappings = [
    ['templates/skills/', '.harness/skills/'],
    ['templates/commands/', '.harness/commands/'],
    ['templates/openspec/schemas/', 'openspec/schemas/'],
  ]
  for (const [templatePrefix, mirrorPrefix] of mappings) {
    if (relativePath.startsWith(templatePrefix)) {
      return mirrorPrefix + relativePath.slice(templatePrefix.length)
    }
  }
  return null
}

const files = [...new Set(
  [...changed]
    .filter(isInstructionFile)
    .map(canonicalPath)
    .filter(relativePath => fs.existsSync(path.join(root, relativePath))),
)].sort()

const narrationPatterns = [
  /thin entrypoint/i,
  /保持上游/,
  /不承载/,
  /不新增/,
  /共用此模板/,
  /仅作为内部/,
  /方法论/,
  /不属于.*(?:schema|流程|门禁)/i,
  /本 (?:skill|文件|命令).*(?:负责|用于|类型)/i,
]

const longLines = []
const narration = []
for (const relativePath of files) {
  const lines = fs.readFileSync(path.join(root, relativePath), 'utf8').split(/\r?\n/)
  let fenced = false
  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced
      return
    }
    if (fenced) return
    const length = [...line].length
    if (length > maxLength) longLines.push({ relativePath, line: index + 1, length })
    if (narrationPatterns.some(pattern => pattern.test(line))) {
      narration.push({ relativePath, line: index + 1, text: line.trim() })
    }
  })
}

const mirrorMismatches = []
for (const relativePath of files) {
  const mirror = mirrorPath(relativePath)
  if (!mirror) continue
  const templatePath = path.join(root, relativePath)
  const mirrorFullPath = path.join(root, mirror)
  if (!fs.existsSync(mirrorFullPath)) {
    mirrorMismatches.push(`${relativePath} -> missing ${mirror}`)
  } else if (fs.readFileSync(templatePath, 'utf8') !== fs.readFileSync(mirrorFullPath, 'utf8')) {
    mirrorMismatches.push(`${relativePath} != ${mirror}`)
  }
}

console.log('Instruction files:')
for (const relativePath of files) console.log(`- ${relativePath}`)

console.log(`\nLong lines (> ${maxLength} characters):`)
if (longLines.length === 0) console.log('- none')
for (const item of longLines) {
  console.log(`- ${item.relativePath}:${item.line} (${item.length})`)
}

console.log('\nNarration candidates:')
if (narration.length === 0) console.log('- none')
for (const item of narration) {
  console.log(`- ${item.relativePath}:${item.line}: ${item.text}`)
}

console.log('\nMirror mismatches:')
if (mirrorMismatches.length === 0) {
  console.log('- none')
} else {
  for (const mismatch of mirrorMismatches) console.log(`- ${mismatch}`)
  process.exitCode = 1
}
