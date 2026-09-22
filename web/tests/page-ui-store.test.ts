import { beforeEach, describe, expect, it } from 'vitest'

import { usePageUiStore } from '../src/stores/page-ui-store'

describe('page UI store', () => {
  beforeEach(() => {
    usePageUiStore.setState({
      activeWorkflowPhase: 'phase-spec',
      capabilityTabs: {},
      changelogTab: 'templates',
      quickStartTab: 'agent',
    })
  })

  it('should keep page-specific tab state independent', () => {
    usePageUiStore.getState().setQuickStartTab('manual')
    usePageUiStore.getState().setChangelogTab('cli')
    usePageUiStore.getState().setCapabilityTab('capability-inventory', 'matrix')

    expect(usePageUiStore.getState().quickStartTab).toBe('manual')
    expect(usePageUiStore.getState().changelogTab).toBe('cli')
    expect(usePageUiStore.getState().capabilityTabs['capability-inventory']).toBe('matrix')
  })

  it('should track the active workflow phase separately from route state', () => {
    usePageUiStore.getState().setActiveWorkflowPhase('phase-growth')

    expect(usePageUiStore.getState().activeWorkflowPhase).toBe('phase-growth')
  })
})
