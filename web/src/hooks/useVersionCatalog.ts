import { useCallback, useEffect, useRef, useState } from 'react'

import type { VersionCatalogResponse } from '../lib/version-catalog'

interface VersionCatalogState {
  data: VersionCatalogResponse | null
  error: Error | null
  isLoading: boolean
  isRetrying: boolean
  reload: () => void
}

export function useVersionCatalog(): VersionCatalogState {
  const [data, setData] = useState<VersionCatalogResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRetrying, setIsRetrying] = useState(false)
  const [requestKey, setRequestKey] = useState(0)
  const requestInFlight = useRef(false)

  const reload = useCallback(() => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setIsRetrying(true)
    setRequestKey((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    requestInFlight.current = true

    void fetch('/api/versions', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`请求失败（HTTP ${response.status}）`)
        }
        return response.json() as Promise<VersionCatalogResponse>
      })
      .then((catalog) => {
        setData(catalog)
        setError(null)
        setIsLoading(false)
        setIsRetrying(false)
        requestInFlight.current = false
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason : new Error(String(reason)))
        setIsLoading(false)
        setIsRetrying(false)
        requestInFlight.current = false
      })

    return () => controller.abort()
  }, [requestKey])

  return { data, error, isLoading, isRetrying, reload }
}
