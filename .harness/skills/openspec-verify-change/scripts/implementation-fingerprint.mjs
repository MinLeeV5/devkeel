#!/usr/bin/env node

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const ALGORITHM = 'harness-implementation-fingerprint-v1'

function fail(message, exitCode = 1) {
  process.stderr.write(`${message}\n`)
  process.exit(exitCode)
}

function parseArgs(argv) {
  const result = { changeDir: '', expect: '' }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--change-dir') {
      result.changeDir = argv[index + 1] ?? ''
      index += 1
    } else if (arg === '--expect') {
      result.expect = argv[index + 1] ?? ''
      index += 1
    } else if (arg === '-h' || arg === '--help') {
      process.stdout.write(
        'Usage: implementation-fingerprint.mjs --change-dir <path> [--expect <sha256>]\n',
      )
      process.exit(0)
    } else {
      fail(`Unknown argument: ${arg}`)
    }
  }

  if (!result.changeDir) fail('Missing required --change-dir <path>')
  if (result.expect && !/^[a-f0-9]{64}$/u.test(result.expect)) {
    fail('--expect must be a lowercase SHA-256 digest')
  }
  return result
}

function runGit(repoRoot, args, encoding = 'utf8', allowFailure = false) {
  const result = spawnSync('git', ['-c', 'core.autocrlf=false', ...args], {
    cwd: repoRoot,
    encoding,
    env: { ...process.env, LC_ALL: 'C', LANG: 'C' },
    maxBuffer: 128 * 1024 * 1024,
  })
  if (result.error) fail(`git ${args[0]} failed: ${result.error.message}`)
  if (result.status !== 0 && !allowFailure) {
    const stderr = Buffer.isBuffer(result.stderr)
      ? result.stderr.toString('utf8')
      : String(result.stderr ?? '')
    fail(`git ${args[0]} failed (${result.status}): ${stderr.trim()}`)
  }
  return result
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function normalizeRelative(repoRoot, inputPath) {
  const absolute = path.resolve(process.cwd(), inputPath)
  const relative = path.relative(repoRoot, absolute)
  if (
    !relative
    || relative === '.'
    || relative === '..'
    || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative)
  ) {
    fail('--change-dir must resolve to a directory inside the Git repository')
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isDirectory()) {
    fail(`Change directory does not exist: ${inputPath}`)
  }
  return relative.split(path.sep).join('/')
}

function splitNull(value) {
  return value.split('\0').filter(Boolean)
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

function digestUntracked(repoRoot, relativePath) {
  const absolute = path.join(repoRoot, ...relativePath.split('/'))
  const stat = fs.lstatSync(absolute)
  if (stat.isSymbolicLink()) {
    return {
      path: relativePath,
      type: 'symlink',
      mode: stat.mode & 0o777,
      digest: sha256(Buffer.from(fs.readlinkSync(absolute))),
    }
  }
  if (stat.isFile()) {
    return {
      path: relativePath,
      type: 'file',
      mode: stat.mode & 0o777,
      digest: sha256(fs.readFileSync(absolute)),
    }
  }
  return {
    path: relativePath,
    type: 'special',
    mode: stat.mode & 0o777,
    digest: sha256(Buffer.from(`${stat.mode}:${stat.size}`)),
  }
}

const options = parseArgs(process.argv.slice(2))
const rootResult = runGit(process.cwd(), ['rev-parse', '--show-toplevel'])
const repoRoot = path.resolve(rootResult.stdout.trim())
const changeDir = normalizeRelative(repoRoot, options.changeDir)
const excludedPaths = [
  `${changeDir}/human-review.html`,
  `${changeDir}/retrospective.md`,
  `${changeDir}/verify.md`,
].sort(compareText)
const pathspec = ['.', ...excludedPaths.map(item => `:(exclude)${item}`)]

const head = runGit(repoRoot, ['rev-parse', 'HEAD']).stdout.trim()
const branchResult = runGit(
  repoRoot,
  ['symbolic-ref', '--quiet', '--short', 'HEAD'],
  'utf8',
  true,
)
const branch = branchResult.status === 0 ? branchResult.stdout.trim() : 'DETACHED'

const diffResult = runGit(
  repoRoot,
  [
    'diff',
    '--no-color',
    '--no-ext-diff',
    '--no-textconv',
    '--binary',
    '--full-index',
    '--no-renames',
    '--submodule=short',
    'HEAD',
    '--',
    ...pathspec,
  ],
  null,
)
const trackedDiff = Buffer.isBuffer(diffResult.stdout)
  ? diffResult.stdout
  : Buffer.from(diffResult.stdout ?? '')

const trackedPaths = splitNull(
  runGit(
    repoRoot,
    ['diff', '--name-only', '-z', '--no-renames', 'HEAD', '--', ...pathspec],
  ).stdout,
).sort(compareText)

const excluded = new Set(excludedPaths)
const untrackedPaths = splitNull(
  runGit(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z', '--', '.']).stdout,
)
  .filter(item => !excluded.has(item))
  .sort(compareText)
const untracked = untrackedPaths.map(item => digestUntracked(repoRoot, item))

const payload = {
  algorithm: ALGORITHM,
  branch,
  head,
  changeDir,
  trackedDiffDigest: sha256(trackedDiff),
  trackedPaths,
  untracked,
}
const fingerprint = sha256(Buffer.from(JSON.stringify(payload)))
const output = { ...payload, excludedPaths, fingerprint }

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
if (options.expect && options.expect !== fingerprint) {
  process.stderr.write(`Fingerprint mismatch: expected ${options.expect}, observed ${fingerprint}\n`)
  process.exitCode = 2
}
