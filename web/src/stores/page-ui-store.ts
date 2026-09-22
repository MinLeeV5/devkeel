import { create } from 'zustand'

export type QuickStartTab = 'agent' | 'manual'
export type ChangelogTab = 'cli' | 'templates'
export type WorkflowPhase = 'phase-code' | 'phase-growth' | 'phase-spec'

interface PageUiState {
  activeWorkflowPhase: WorkflowPhase
  capabilityTabs: Record<string, string>
  changelogTab: ChangelogTab
  quickStartTab: QuickStartTab
  setActiveWorkflowPhase: (phase: WorkflowPhase) => void
  setCapabilityTab: (pageId: string, tab: string) => void
  setChangelogTab: (tab: ChangelogTab) => void
  setQuickStartTab: (tab: QuickStartTab) => void
}

export const usePageUiStore = create<PageUiState>((set) => ({
  activeWorkflowPhase: 'phase-spec',
  capabilityTabs: {},
  changelogTab: 'templates',
  quickStartTab: 'agent',
  setActiveWorkflowPhase: (phase: WorkflowPhase) => set({ activeWorkflowPhase: phase }),
  setCapabilityTab: (pageId: string, tab: string) => set((state) => ({
    capabilityTabs: { ...state.capabilityTabs, [pageId]: tab },
  })),
  setChangelogTab: (tab: ChangelogTab) => set({ changelogTab: tab }),
  setQuickStartTab: (tab: QuickStartTab) => set({ quickStartTab: tab }),
}))
