import { describe, expect, it } from 'vitest'
import {
  getRequiredHarnessDirs,
  shouldValidateRootAssets,
} from '../src/commands/doctor.js'

describe('doctor repository profile', () => {
  it('validates OpenSpec and nested submodules for main repositories', () => {
    expect(shouldValidateRootAssets('main')).toBe(true)
    expect(getRequiredHarnessDirs('main')).toEqual([
      'rules',
      'skills',
      'agents',
      'commands',
    ])
  })

  it('does not require root-only assets for domain repositories', () => {
    expect(shouldValidateRootAssets('domain')).toBe(false)
    expect(getRequiredHarnessDirs('domain')).toEqual(['rules', 'skills', 'agents'])
  })
})
