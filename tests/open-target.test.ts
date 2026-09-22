import { describe, it, expect } from 'vitest'
import { getOpenCommand, openTarget } from '../src/lib/open-target.js'

describe('open-target', () => {
  describe('getOpenCommand', () => {
    it('should use open on macOS', () => {
      const command = getOpenCommand('file:///tmp/human-review.html', 'darwin')
      expect(command).toEqual({ command: 'open', args: ['file:///tmp/human-review.html'] })
    })

    it('should use cmd start on Windows', () => {
      const command = getOpenCommand('file:///C:/tmp/human-review.html', 'win32')
      expect(command).toEqual({
        command: 'cmd',
        args: ['/c', 'start', '""', 'file:///C:/tmp/human-review.html'],
      })
    })

    it('should use xdg-open on Linux', () => {
      const command = getOpenCommand('file:///tmp/human-review.html', 'linux')
      expect(command).toEqual({ command: 'xdg-open', args: ['file:///tmp/human-review.html'] })
    })
  })

  describe('openTarget', () => {
    it('should call runner with platform command', async () => {
      let commandSeen = ''
      let argsSeen: string[] = []

      const result = await openTarget('file:///tmp/human-review.html', {
        platform: 'darwin',
        runner: async (command, args) => {
          commandSeen = command
          argsSeen = args
        },
      })

      expect(result.ok).toBe(true)
      expect(commandSeen).toBe('open')
      expect(argsSeen).toEqual(['file:///tmp/human-review.html'])
    })

    it('should return error when runner fails', async () => {
      const result = await openTarget('file:///tmp/human-review.html', {
        runner: async () => {
          throw new Error('open failed')
        },
      })

      expect(result.ok).toBe(false)
      expect(result.error).toBe('open failed')
    })
  })
})
