import * as p from '@clack/prompts'

interface Log {
  intro: (title?: string) => void
  outro: (message?: string) => void
  success: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
  warn: (message: string) => void
}

export function createLog(): Log {
  if (process.stdout.isTTY) {
    return {
      intro: p.intro,
      outro: p.outro,
      success: p.log.success,
      info: p.log.info,
      warning: p.log.warning,
      error: p.log.error,
      warn: p.log.warn,
    }
  }
  return {
    intro: (title?: string) => { if (title) process.stdout.write(title + '\n') },
    outro: (message?: string) => { if (message) process.stdout.write(message + '\n') },
    success: (message: string) => process.stdout.write(`✔ ${message}\n`),
    info: (message: string) => process.stdout.write(`  ${message}\n`),
    warning: (message: string) => process.stdout.write(`⚠ ${message}\n`),
    error: (message: string) => process.stderr.write(`✘ ${message}\n`),
    warn: (message: string) => process.stdout.write(`⚠ ${message}\n`),
  }
}
