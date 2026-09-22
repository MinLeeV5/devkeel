import { create } from 'zustand'

export type ResolvedTheme = 'dark' | 'light'
export type ThemePreference = ResolvedTheme | 'system'

export const THEME_STORAGE_KEY = 'harness-theme'

interface ThemeState {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
  syncSystemTheme: (systemTheme: ResolvedTheme) => void
}

const initialPreference = readStoredPreference()
const initialSystemTheme = getSystemTheme()

export const useThemeStore = create<ThemeState>((set) => ({
  preference: initialPreference,
  resolvedTheme: resolveTheme(initialPreference, initialSystemTheme),
  setPreference: (preference) => {
    persistPreference(preference)
    set({
      preference,
      resolvedTheme: resolveTheme(preference, getSystemTheme()),
    })
  },
  syncSystemTheme: (systemTheme) => set((state) => ({
    resolvedTheme: resolveTheme(state.preference, systemTheme),
  })),
}))

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function persistPreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') return
  try {
    if (preference === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference)
    }
  } catch {
    // Theme selection still works for this session when storage is unavailable.
  }
}

function resolveTheme(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
  return preference === 'system' ? systemTheme : preference
}
