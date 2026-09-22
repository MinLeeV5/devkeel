import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function resolveOpenspecBin(): string {
  const mainEntry = require.resolve('@fission-ai/openspec')
  const packageRoot = path.dirname(path.dirname(mainEntry))
  return path.join(packageRoot, 'bin', 'openspec.js')
}

export function getOpenspecVersion(): string {
  try {
    const mainEntry = require.resolve('@fission-ai/openspec')
    const packageRoot = path.dirname(path.dirname(mainEntry))
    const pkgJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'))
    return pkgJson.version || 'unknown'
  } catch {
    return 'unknown'
  }
}

export async function runOpenspec(args: string[]): Promise<void> {
  const child = spawn(process.execPath, [resolveOpenspecBin(), ...args], {
    stdio: 'inherit',
    env: { ...process.env, OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1' },
  })

  const exitCode = await new Promise<number>((resolve) => {
    child.on('exit', (code) => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
  process.exit(exitCode)
}

export async function interceptOpenspec(): Promise<void> {
  const idx = process.argv.indexOf('openspec', 2)
  if (idx === -1) return
  await runOpenspec(process.argv.slice(idx + 1))
}
