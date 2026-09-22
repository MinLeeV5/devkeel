import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'

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

export const __test__ = process.env['VITEST'] ? { resolveNpmInvocation } : undefined
