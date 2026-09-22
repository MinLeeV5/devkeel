#!/usr/bin/env node

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_FILE = fileURLToPath(import.meta.url)
const DEFAULT_WEB_DIR = path.resolve(path.dirname(SCRIPT_FILE), '..')
const DEFAULT_REPOSITORY_DIR = path.resolve(DEFAULT_WEB_DIR, '..')

export const APP_ARCHIVE_ENTRIES = [
  'dist',
  'package.json',
  'server.ts',
  'page-redirects.ts',
  'version-catalog.ts',
  'src/lib/version-catalog.ts',
  'node_modules',
  'version.json',
]

export function writeVersionFile(packageJsonPath, versionFilePath) {
  const { version } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  fs.writeFileSync(versionFilePath, JSON.stringify({ version }))
}

function runCommand(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? 'unknown'}`)
  }
}

function assertArchiveEntries(webDir) {
  const missingEntries = APP_ARCHIVE_ENTRIES.filter((entry) => !fs.existsSync(path.join(webDir, entry)))
  if (missingEntries.length > 0) {
    throw new Error(`Missing application package entries:\n${missingEntries.map((entry) => `- ${entry}`).join('\n')}`)
  }
}

export function createAppPackage({
  repositoryDir = DEFAULT_REPOSITORY_DIR,
  webDir = DEFAULT_WEB_DIR,
  runCommand: executeCommand = runCommand,
} = {}) {
  const temporaryArchive = path.join(webDir, 'app.tar.gz.tmp')
  const outputArchive = path.join(repositoryDir, 'app.tar.gz')

  executeCommand('pnpm', ['build'], webDir)
  writeVersionFile(path.join(repositoryDir, 'package.json'), path.join(webDir, 'version.json'))
  assertArchiveEntries(webDir)
  fs.rmSync(temporaryArchive, { force: true })

  try {
    executeCommand('tar', ['-zcf', temporaryArchive, ...APP_ARCHIVE_ENTRIES], webDir)
    fs.renameSync(temporaryArchive, outputArchive)
  } finally {
    fs.rmSync(temporaryArchive, { force: true })
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  createAppPackage()
}
