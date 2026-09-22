#!/usr/bin/env node
/**
 * sync-submodule-skills.mjs
 *
 * 递归发现 git submodule 下的 .harness/skills/ 目录，
 * 将每个 skill 目录通过 symlink 平铺到主仓库的 .harness/skills/，
 * 使 Claude Code / Cursor 等工具能直接加载子模块的 skills。
 *
 * Usage:
 *   node .harness/skills/domain-init/scripts/sync-submodule-skills.mjs [options]
 *
 * Options:
 *   --dry-run       只打印操作，不修改文件系统
 *   --prune         清理已失效的 managed symlink
 *   --source-dir    skill 源目录（可重复或逗号分隔；默认 .harness/skills,.agents/skills）
 *   --target-dir    skill 目标目录名（默认 .harness/skills）
 */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'

function findRepoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
  } catch {
    console.error('Error: not inside a git repository')
    process.exit(1)
  }
}

function discoverSubmodulePaths(repoRoot) {
  try {
    const raw = execSync('git config -f .gitmodules --get-regexp path', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const space = line.indexOf(' ')
        if (space === -1) return null
        const rel = line.slice(space + 1).trim()
        return rel ? path.resolve(repoRoot, rel) : null
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

function normalizeSourceDirs(sourceDir) {
  const dirs = Array.isArray(sourceDir) ? sourceDir : [sourceDir]
  return [...new Set(dirs.flatMap((d) => d.split(',').map((s) => s.trim()).filter(Boolean)))]
}

function isPathInside(targetPath, parentPath) {
  const rel = path.relative(parentPath, targetPath)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

async function pathExists(p) {
  try {
    await fsp.lstat(p)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
    throw err
  }
}

async function resolvedLinkTarget(linkPath) {
  const raw = await fsp.readlink(linkPath)
  return path.resolve(path.dirname(linkPath), raw)
}

async function removePath(p) {
  await fsp.rm(p, { recursive: true, force: true })
}

async function isManagedSubmoduleLink(linkPath, submoduleRoots) {
  let stats
  try {
    stats = await fsp.lstat(linkPath)
  } catch (err) {
    if (err.code === 'ENOENT') return false
    throw err
  }
  if (!stats.isSymbolicLink()) return false
  let resolved
  try {
    resolved = await resolvedLinkTarget(linkPath)
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EINVAL') return false
    throw err
  }
  return submoduleRoots.some((root) => isPathInside(resolved, root))
}

async function createManagedLink(sourcePath, targetPath, platform) {
  const sourceStats = await fsp.stat(sourcePath)
  const sourceIsDir = sourceStats.isDirectory()

  if (platform === 'win32') {
    const linkTarget = sourceIsDir
      ? path.resolve(sourcePath)
      : path.relative(path.dirname(targetPath), sourcePath)
    const linkType = sourceIsDir ? 'junction' : 'file'
    await fsp.symlink(linkTarget, targetPath, linkType)
    return
  }

  const linkTarget = path.relative(path.dirname(targetPath), sourcePath)
  const linkType = sourceIsDir ? 'dir' : 'file'
  await fsp.symlink(linkTarget, targetPath, linkType)
}

async function discoverSkillDirs(root) {
  const out = []
  let entries
  try {
    entries = await fsp.readdir(root, { recursive: true, withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return out
    throw err
  }
  for (const entry of entries) {
    if (!entry.isFile() || entry.name !== 'SKILL.md') continue
    const dir = entry.parentPath ?? entry.path
    out.push(dir)
  }
  return out
}

async function reconcile({ sourceDir, targetPath, result, dryRun, platform }) {
  const exists = await pathExists(targetPath)
  if (!exists) {
    result.created.push({ targetPath, sourceDir })
    if (!dryRun) await createManagedLink(sourceDir, targetPath, platform)
    return
  }

  const stats = await fsp.lstat(targetPath)
  if (!stats.isSymbolicLink()) {
    result.skipped.push({ targetPath, reason: 'real-dir-or-file' })
    return
  }

  const current = await resolvedLinkTarget(targetPath)
  if (current === path.resolve(sourceDir)) {
    result.skipped.push({ targetPath, reason: 'up-to-date' })
    return
  }

  if (!(await isManagedSubmoduleLink(targetPath, result._submoduleRoots))) {
    result.skipped.push({ targetPath, reason: 'unmanaged-link' })
    return
  }

  result.updated.push({ targetPath, sourceDir })
  if (!dryRun) {
    await removePath(targetPath)
    await createManagedLink(sourceDir, targetPath, platform)
  }
}

async function pruneStale({ targetRoot, activeNames, submoduleRoots, result, dryRun }) {
  let entries
  try {
    entries = await fsp.readdir(targetRoot, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return
    throw err
  }

  for (const entry of entries) {
    const name = entry.name
    if (name.startsWith('.')) continue
    const targetPath = path.join(targetRoot, name)

    if (activeNames.has(name)) continue
    if (await isManagedSubmoduleLink(targetPath, submoduleRoots)) {
      result.pruned.push({ targetPath, reason: 'orphan-managed-link' })
      if (!dryRun) await removePath(targetPath)
    }
  }
}

export async function syncSubmoduleSkills({
  dryRun = false,
  prune = false,
  platform = process.platform,
  sourceDir = '.harness/skills,.agents/skills',
  targetDir = '.harness/skills',
} = {}) {
  const repoRoot = findRepoRoot()
  const targetRoot = path.join(repoRoot, targetDir)
  const sourceDirs = normalizeSourceDirs(sourceDir)
  const submodulePaths = discoverSubmodulePaths(repoRoot)
  const submoduleRoots = submodulePaths.flatMap((p) => sourceDirs.map((d) => path.join(p, d)))

  await fsp.mkdir(targetRoot, { recursive: true })

  const result = {
    repoRoot,
    targetRoot,
    sourceDirs,
    submodules: submodulePaths.map((p) => path.relative(repoRoot, p)),
    created: [],
    updated: [],
    skipped: [],
    pruned: [],
    _submoduleRoots: submoduleRoots,
  }
  const claimedNames = new Set()

  for (const subPath of submodulePaths) {
    for (const dirName of sourceDirs) {
      const root = path.join(subPath, dirName)
      if (!fs.existsSync(root)) continue
      const skillDirs = await discoverSkillDirs(root)
      for (const dir of skillDirs) {
        const name = path.basename(dir)
        if (claimedNames.has(name)) {
          result.skipped.push({
            targetPath: path.join(targetRoot, name),
            reason: `name-taken-by-earlier-source (${path.relative(repoRoot, dir)})`,
          })
          continue
        }
        claimedNames.add(name)
        await reconcile({
          sourceDir: dir,
          targetPath: path.join(targetRoot, name),
          result,
          dryRun,
          platform,
        })
      }
    }
  }

  if (prune) await pruneStale({ targetRoot, activeNames: claimedNames, submoduleRoots, result, dryRun })

  delete result._submoduleRoots
  return result
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    prune: false,
    sourceDir: '.harness/skills,.agents/skills',
    targetDir: '.harness/skills',
  }
  let sourceDirOverride = false
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === '--dry-run') opts.dryRun = true
    else if (token === '--prune') opts.prune = true
    else if (token === '--source-dir' && argv[i + 1]) {
      const val = argv[++i]
      if (!sourceDirOverride) {
        opts.sourceDir = val
        sourceDirOverride = true
      } else {
        opts.sourceDir = `${opts.sourceDir},${val}`
      }
    } else if (token === '--target-dir' && argv[i + 1]) opts.targetDir = argv[++i]
    else if (token === '-h' || token === '--help') opts.help = true
    else throw new Error(`Unknown argument: ${token}`)
  }
  return opts
}

function printHelp() {
  console.log(`Usage: node sync-submodule-skills.mjs [--dry-run] [--prune] [--source-dir DIR] [--target-dir DIR]

Recursively discovers SKILL.md directories under each git submodule's
skill directory and creates flat relative symlinks under the main
repo's skill directory so Claude Code / Cursor can auto-load them.

Submodules are auto-discovered via 'git submodule foreach'.

Options:
  --dry-run       Print actions without touching the filesystem.
  --prune         Remove orphan managed symlinks (stale submodule skills).
  --source-dir    Skill source directory within each submodule (repeatable;
                  default: .harness/skills,.agents/skills).
  --target-dir    Skill target directory in the main repo (default: .harness/skills).
  -h, --help      Show this help.
`)
}

function printSummary(result, dryRun) {
  const prefix = dryRun ? '[dry-run] ' : ''
  const { repoRoot } = result
  console.log(`${prefix}repo: ${repoRoot}`)
  console.log(`${prefix}target: ${path.relative(repoRoot, result.targetRoot) || '.'}`)
  console.log(`${prefix}source-dirs: ${result.sourceDirs.join(', ')}`)
  console.log(`${prefix}submodules: ${result.submodules.length ? result.submodules.join(', ') : '(none)'}`)
  for (const action of ['created', 'updated', 'pruned', 'skipped']) {
    for (const item of result[action]) {
      const rel = path.relative(repoRoot, item.targetPath)
      const detail = item.sourceDir
        ? ` -> ${path.relative(repoRoot, item.sourceDir)}`
        : item.reason
          ? ` (${item.reason})`
          : ''
      console.log(`${prefix}${action}: ${rel}${detail}`)
    }
  }
  const total =
    result.created.length + result.updated.length + result.pruned.length + result.skipped.length
  console.log(
    `${prefix}done. created=${result.created.length} updated=${result.updated.length} pruned=${result.pruned.length} skipped=${result.skipped.length} total=${total}`,
  )
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    printHelp()
    return
  }
  const result = await syncSubmoduleSkills(opts)
  printSummary(result, opts.dryRun)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.stack || err.message)
    process.exitCode = 1
  })
}
