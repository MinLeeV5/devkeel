import { useCallback, type MouseEventHandler } from 'react'

import type { PageId } from '../routes'
import { usePageUiStore } from '../stores/page-ui-store'

interface PageInteractions {
  handleAction: MouseEventHandler<HTMLElement>
}

export function usePageInteractions(pageId: PageId): PageInteractions {
  const handleAction = useCallback<MouseEventHandler<HTMLElement>>((event) => {
    const actionElement = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')
    if (!actionElement) return

    const action = actionElement.dataset['action'] ?? ''
    if (action.startsWith('showTab')) {
      event.preventDefault()
      showCapabilityTab(pageId, readQuotedArg(action), actionElement)
      return
    }
  }, [pageId])

  return { handleAction }
}

function readQuotedArg(action: string): string {
  return action.match(/['"]([^'"]+)['"]/)?.[1] ?? ''
}

function showCapabilityTab(pageId: PageId, name: string, actionElement: HTMLElement): void {
  usePageUiStore.getState().setCapabilityTab(pageId, name)
  document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'))
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'))
  document.getElementById(`tab-${name}`)?.classList.add('active')
  actionElement.classList.add('active')
}
