import { useCallback, useEffect, useState } from 'react'
import { pingTemplates } from '../api/templates.js'

export default function ApiBanner() {
  const [offline, setOffline] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const check = useCallback(async () => {
    const ok = await pingTemplates()
    setOffline(!ok)
    if (!ok) setDismissed(false)
  }, [])

  useEffect(() => {
    check()
  }, [check])

  if (!offline || dismissed) return null

  return (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
          ⚠️
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-200">Template server offline</p>
          <p className="mt-0.5 text-sm text-amber-200/70">
            Could not reach <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">/templates</code>. Run{' '}
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">npm run api</code> in the backend
            folder to enable task templates.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={check}
          className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/15"
        >
          Retry
        </button>
        <button
          aria-label="Close"
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-amber-200/70 transition-colors hover:bg-amber-400/15 hover:text-amber-100"
        >
          &times;
        </button>
      </div>
    </div>
  )
}