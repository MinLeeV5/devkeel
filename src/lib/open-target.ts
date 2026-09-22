import { execFile } from 'node:child_process'

export interface OpenCommand {
  command: string
  args: string[]
}

export interface OpenTargetResult {
  ok: boolean
  error?: string
}

export interface OpenTargetOptions {
  platform?: NodeJS.Platform
  runner?: (command: string, args: string[]) => Promise<void>
}

export function getOpenCommand(target: string, platform: NodeJS.Platform = process.platform): OpenCommand {
  switch (platform) {
    case 'darwin':
      return { command: 'open', args: [target] }
    case 'win32':
      return { command: 'cmd', args: ['/c', 'start', '""', target] }
    default:
      return { command: 'xdg-open', args: [target] }
  }
}

export async function openTarget(target: string, options?: OpenTargetOptions): Promise<OpenTargetResult> {
  const openCommand = getOpenCommand(target, options?.platform)
  const runner = options?.runner ?? runOpenCommand

  try {
    await runner(openCommand.command, openCommand.args)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error && error.message ? error.message : '无法打开目标',
    }
  }
}

function runOpenCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(command, args, (error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}
