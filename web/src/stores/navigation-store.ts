import { create } from 'zustand'

interface NavigationState {
  currentPath: string
  setCurrentPath: (path: string) => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPath: typeof window === 'undefined'
    ? '/'
    : `${window.location.pathname}${window.location.search}${window.location.hash}`,
  setCurrentPath: (path: string) => set({ currentPath: path || '/' }),
}))
