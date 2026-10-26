import { execFile, execFileSync, type ExecFileOptions, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'
import { promisify } from 'node:util'

interface NpmInvocation {
  file: string
  args: string[]
}

const UNSAFE_WINDOWS_CMD_ARG_RE = /[\r\n&|<>^%!"()]/

function resolveNpmInvocation(
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
  comSpec = process.env['ComSpec'] ?? process.env['COMSPEC'] ?? 'cmd.exe',
): NpmInvocation {
  if (platform === 'win32') {
    if (args.some((arg) => UNSAFE_WINDOWS_CMD_ARG_RE.test(arg))) {
      throw new Error('Windows npm 参数包含不安全字符')
    }
    return {
      file: comSpec,
      args: ['/d', '/s', '/c', 'npm.cmd', ...args],
    }
  }

  return { file: 'npm', args: [...args] }
}

export function execNpmSync(
  args: readonly string[],
  options: ExecFileSyncOptionsWithStringEncoding,
): string {
  const invocation = resolveNpmInvocation(args)
  return execFileSync(invocation.file, invocation.args, options)
}

const execFileAsync = promisify(execFile)

export async function execNpm(
  args: readonly string[],
  options: ExecFileOptions = {},
): Promise<string> {
  const invocation = resolveNpmInvocation(args)
  const { stdout } = await execFileAsync(invocation.file, invocation.args, options)
  return typeof stdout === 'string' ? stdout : stdout.toString()
}

export const __test__ = process.env['VITEST'] ? { resolveNpmInvocation } : undefined
