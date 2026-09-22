/*HDBG:__HDBG_SESSION__:B*/
(function installHdbg(scope) {
  const endpoint = scope.__HDBG_ENDPOINT || '__HDBG_ENDPOINT__';
  const session = '__HDBG_SESSION__';
  const runtime = '__HDBG_RUNTIME__';

  scope.__hdbg = function hdbg(event, data) {
    try {
      const controller = typeof scope.AbortController === 'function'
        ? new scope.AbortController()
        : undefined;
      const timer = controller && typeof scope.setTimeout === 'function'
        ? scope.setTimeout(() => controller.abort(), 250)
        : undefined;
      const url = `${endpoint.replace(/\/$/, '')}/log`
        + `?s=${encodeURIComponent(session)}`
        + `&r=${encodeURIComponent(runtime)}`
        + `&e=${encodeURIComponent(String(event))}`;
      return scope.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: data === undefined ? null : data }),
        keepalive: true,
        signal: controller && controller.signal,
      })
        .catch(() => undefined)
        .finally(() => {
          if (timer !== undefined && typeof scope.clearTimeout === 'function') {
            scope.clearTimeout(timer);
          }
        });
    } catch {
      return Promise.resolve(undefined);
    }
  };
})(globalThis);
/*HDBG:__HDBG_SESSION__:E*/
