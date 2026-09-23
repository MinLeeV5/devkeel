interface NotFoundPageProps {
  currentPath: string
}

export function NotFoundPage({ currentPath }: NotFoundPageProps): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <section className="max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">404</p>
        <h1 className="mb-4 text-2xl font-bold">页面不存在</h1>
        <p className="mb-6 text-sm leading-6 text-zinc-400">
          当前路径 <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-cyan-300">{currentPath || '/'}</code> 没有对应的 DevKeel 页面。
        </p>
        <a className="inline-flex rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400" href={`${import.meta.env.BASE_URL}index.html`}>
          返回首页
        </a>
      </section>
    </main>
  )
}
