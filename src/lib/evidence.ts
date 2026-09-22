import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

export interface BaseSubmoduleSnapshot {
  path: string
  sha: string
}

export interface BaseSnapshot {
  change: string
  baseFile: string
  mainSha: string | null
  submodules: BaseSubmoduleSnapshot[]
  warnings: string[]
}

export interface RepositoryCommitEvidence {
  path: string
  base: string | null
  head: string | null
  branch: string | null
  worktreeRoot: string | null
  count: number
  workingTreeChangeCount: number
  stagedChangeCount: number
  unstagedChangeCount: number
  untrackedChangeCount: number
  available: boolean
}

export interface EvidenceReport {
  change: string
  baseFile: string
  baseExists: boolean
  commitCount: number
  workingTreeChangeCount: number
  stagedChangeCount: number
  unstagedChangeCount: number
  untrackedChangeCount: number
  hasImplementationEvidence: boolean
  completedTasks: number
  main: RepositoryCommitEvidence
  submodules: RepositoryCommitEvidence[]
  warnings: string[]
}

interface ParsedBaseSnapshot {
  mainSha: string | null
  submodules: BaseSubmoduleSnapshot[]
}

interface WorkingTreeEvidence {
  workingTreeChangeCount: number
  stagedChangeCount: number
  unstagedChangeCount: number
  untrackedChangeCount: number
}

export function writeBaseSnapshot(projectRoot: string, change: string): BaseSnapshot {
  const baseFile = getBaseFile(projectRoot, change)
  const warnings: string[] = []
  const mainSha = getGitSha(projectRoot, 'HEAD')
  const submodules: BaseSubmoduleSnapshot[] = []

  if (!mainSha) {
    warnings.push('main repository HEAD unavailable')
    return { change, baseFile, mainSha, submodules, warnings }
  }

  for (const submodulePath of readSubmodulePaths(projectRoot)) {
    const absolutePath = path.join(projectRoot, submodulePath)
    const sha = getGitSha(absolutePath, 'HEAD')
    if (sha) {
      submodules.push({ path: submodulePath, sha })
    } else {
      warnings.push(`submodule unavailable: ${submodulePath}`)
    }
  }

  fs.mkdirSync(path.dirname(baseFile), { recursive: true })
  const lines = [mainSha ?? '', ...submodules.map(sub => `${sub.sha} ${sub.path}`)]
  fs.writeFileSync(baseFile, `${lines.join('\n')}\n`, 'utf-8')

  return { change, baseFile, mainSha, submodules, warnings }
}

export function collectEvidence(projectRoot: string, change: string): EvidenceReport {
  const baseFile = getBaseFile(projectRoot, change)
  const baseExists = fs.existsSync(baseFile)
  const parsed = baseExists ? readBaseSnapshot(baseFile) : { mainSha: null, submodules: [] }
  const warnings: string[] = []

  if (!baseExists) warnings.push(`base snapshot missing: ${baseFile}`)
  if (baseExists && !parsed.mainSha) warnings.push(`main repository base missing: ${baseFile}`)

  const main = collectRepositoryEvidence(projectRoot, '.', parsed.mainSha, [
    `openspec/changes/${change}`,
  ])
  const submodules = parsed.submodules.map(sub => {
    const evidence = collectRepositoryEvidence(path.join(projectRoot, sub.path), sub.path, sub.sha)
    if (!evidence.available) warnings.push(`submodule unavailable: ${sub.path}`)
    return evidence
  })
  const completedTasks = countCompletedTasks(path.join(projectRoot, 'openspec', 'changes', change, 'tasks.md'))
  const commitCount = main.count + submodules.reduce((sum, sub) => sum + sub.count, 0)
  const workingTreeChangeCount = main.workingTreeChangeCount
    + submodules.reduce((sum, sub) => sum + sub.workingTreeChangeCount, 0)
  const stagedChangeCount = main.stagedChangeCount
    + submodules.reduce((sum, sub) => sum + sub.stagedChangeCount, 0)
  const unstagedChangeCount = main.unstagedChangeCount
    + submodules.reduce((sum, sub) => sum + sub.unstagedChangeCount, 0)
  const untrackedChangeCount = main.untrackedChangeCount
    + submodules.reduce((sum, sub) => sum + sub.untrackedChangeCount, 0)

  return {
    change,
    baseFile,
    baseExists,
    commitCount,
    workingTreeChangeCount,
    stagedChangeCount,
    unstagedChangeCount,
    untrackedChangeCount,
    hasImplementationEvidence: commitCount > 0 || workingTreeChangeCount > 0,
    completedTasks,
    main,
    submodules,
    warnings,
  }
}

function getBaseFile(projectRoot: string, change: string): string {
  return path.join(projectRoot, 'openspec', 'changes', change, '.base-sha')
}

function readSubmodulePaths(projectRoot: string): string[] {
  const gitmodulesPath = path.join(projectRoot, '.gitmodules')
  if (!fs.existsSync(gitmodulesPath)) return []

  const paths: string[] = []
  const content = fs.readFileSync(gitmodulesPath, 'utf-8')
  for (const line of content.split('\n')) {
    const match = line.trim().match(/^path\s*=\s*(.+)$/)
    if (match?.[1]) paths.push(match[1])
  }
  return paths
}

function readBaseSnapshot(baseFile: string): ParsedBaseSnapshot {
  const lines = fs.readFileSync(baseFile, 'utf-8').split('\n').map(line => line.trim()).filter(Boolean)
  const [mainSha, ...submoduleLines] = lines
  const submodules: BaseSubmoduleSnapshot[] = []

  for (const line of submoduleLines) {
    const separatorIndex = line.search(/\s/)
    if (separatorIndex < 0) continue
    const rawSha = line.slice(0, separatorIndex)
    const submodulePath = line.slice(separatorIndex).trim()
    const sha = rawSha?.replace(/^[-+U]/, '')
    if (sha && submodulePath) submodules.push({ sha, path: submodulePath })
  }

  return { mainSha: mainSha ?? null, submodules }
}

function collectRepositoryEvidence(
  cwd: string,
  displayPath: string,
  base: string | null,
  excludedPaths: string[] = [],
): RepositoryCommitEvidence {
  const head = getGitSha(cwd, 'HEAD')
  const available = Boolean(head)
  const workingTree = available ? collectWorkingTreeEvidence(cwd, excludedPaths) : emptyWorkingTreeEvidence()
  return {
    path: displayPath,
    base,
    head,
    branch: available ? getGitOutput(cwd, ['branch', '--show-current']) : null,
    worktreeRoot: available ? getGitOutput(cwd, ['rev-parse', '--show-toplevel']) : null,
    count: available && base ? countCommits(cwd, base) : 0,
    ...workingTree,
    available,
  }
}

function collectWorkingTreeEvidence(cwd: string, excludedPaths: string[]): WorkingTreeEvidence {
  const args = ['status', '--porcelain=v1', '--untracked-files=all', '--', '.']
  for (const excludedPath of excludedPaths) {
    args.push(`:(exclude)${excludedPath}`)
  }

  const output = getGitRawOutput(cwd, args)
  if (!output) return emptyWorkingTreeEvidence()

  const lines = output.split('\n').filter(Boolean)
  let stagedChangeCount = 0
  let unstagedChangeCount = 0
  let untrackedChangeCount = 0

  for (const line of lines) {
    if (line.startsWith('??')) {
      untrackedChangeCount += 1
      continue
    }
    if (line[0] !== ' ') stagedChangeCount += 1
    if (line[1] !== ' ') unstagedChangeCount += 1
  }

  return {
    workingTreeChangeCount: lines.length,
    stagedChangeCount,
    unstagedChangeCount,
    untrackedChangeCount,
  }
}

function emptyWorkingTreeEvidence(): WorkingTreeEvidence {
  return {
    workingTreeChangeCount: 0,
    stagedChangeCount: 0,
    unstagedChangeCount: 0,
    untrackedChangeCount: 0,
  }
}

function getGitSha(cwd: string, ref: string): string | null {
  try {
    return execFileSync('git', ['rev-parse', ref], { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}

function getGitOutput(cwd: string, args: string[]): string | null {
  const output = getGitRawOutput(cwd, args)
  return output?.trim() || null
}

function getGitRawOutput(cwd: string, args: string[]): string | null {
  try {
    const output = execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.replace(/\r?\n$/, '') || null
  } catch {
    return null
  }
}

function countCommits(cwd: string, base: string): number {
  try {
    const output = execFileSync('git', ['rev-list', '--count', `${base}..HEAD`], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return Number.parseInt(output, 10) || 0
  } catch {
    return 0
  }
}

function countCompletedTasks(tasksPath: string): number {
  if (!fs.existsSync(tasksPath)) return 0
  const content = fs.readFileSync(tasksPath, 'utf-8')
  return content.split('\n').filter(line => /^- \[x\]/i.test(line.trim())).length
}
