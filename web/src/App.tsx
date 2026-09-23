import { useEffect } from 'react'

import { NotFoundPage } from './components/NotFoundPage'
import { RoutePage } from './components/RoutePage'
import { resolvePageRedirect, resolvePageRoute } from './routes'
import { useNavigationStore } from './stores/navigation-store'

export function App(): React.JSX.Element {
  const currentPath = useNavigationStore((state) => state.currentPath)
  const setCurrentPath = useNavigationStore((state) => state.setCurrentPath)
  const redirect = resolvePageRedirect(currentPath, import.meta.env.BASE_URL)
  const route = resolvePageRoute(currentPath, import.meta.env.BASE_URL)

  useEffect(() => {
    function syncPath(): void {
      setCurrentPath(`${window.location.pathname}${window.location.search}${window.location.hash}`)
    }

    syncPath()
    window.addEventListener('popstate', syncPath)
    return () => window.removeEventListener('popstate', syncPath)
  }, [setCurrentPath])

  useEffect(() => {
    if (redirect) window.location.replace(redirect)
  }, [redirect])

  if (redirect) return <></>
  if (!route) return <NotFoundPage currentPath={currentPath} />
  return <RoutePage key={route.routePath} route={route} />
}
