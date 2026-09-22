import { describe, expect, it } from 'vitest'
import { __test__ } from '../src/lib/npm-command.js'

const { resolveNpmInvocation } = __test__!

describe('npm-command', () => {
  describe('resolveNpmInvocation', () => {
    it('should execute npm directly on non-Windows platforms', () => {
      expect(resolveNpmInvocation(['view', 'devkeel@latest'], 'linux')).toEqual({
        file: 'npm',
        args: ['view', 'devkeel@latest'],
      })
    })

    it('should execute npm.cmd through cmd.exe on Windows', () => {
      expect(resolveNpmInvocation(
        ['view', 'devkeel-templates@latest', 'version', '--json'],
        'win32',
        'C:\\Windows\\System32\\cmd.exe',
      )).toEqual({
        file: 'C:\\Windows\\System32\\cmd.exe',
        args: [
          '/d',
          '/s',
          '/c',
          'npm.cmd',
          'view',
          'devkeel-templates@latest',
          'version',
          '--json',
        ],
      })
    })

    it('should preserve benign Windows arguments containing spaces', () => {
      const value = 'release candidate'

      expect(resolveNpmInvocation(
        ['view', 'devkeel-templates@2.0.2', value],
        'win32',
      ).args).toEqual([
        '/d',
        '/s',
        '/c',
        'npm.cmd',
        'view',
        'devkeel-templates@2.0.2',
        value,
      ])
    })

    it('should reject arguments containing cmd.exe metacharacters on Windows', () => {
      for (const argument of ['C:\\Temp\\A&B', '%TEMP%', 'one|two', 'line\nbreak']) {
        expect(() => resolveNpmInvocation(['pack', argument], 'win32')).toThrow(
          'Windows npm 参数包含不安全字符',
        )
      }
    })
  })
})
