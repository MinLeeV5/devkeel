import { Suspense } from 'react'

import { PAGE_COMPONENTS } from '../pages/registry'
import type { PageRoute } from '../routes'

interface RoutePageProps {
  route: PageRoute
}

export function RoutePage({ route }: RoutePageProps): React.JSX.Element {
  const Page = PAGE_COMPONENTS[route.pageId]
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}
