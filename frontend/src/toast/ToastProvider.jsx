import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext.js'

const STYLES = {
  success: { edge: 'border-l-emerald-400', tile: 'bg-emerald-500/15', icon: '✅' },
  error: { edge: 'border-l-rose-400', tile: 'bg-rose-500/15', icon: '❌' },
  warning: { edge: 'border-l-amber-400', tile: 'bg-amber-500/15', icon: '⚠️' },
  info: { edge: 'border-l-indigo-400', tile: 'bg-indigo-500/15', icon: '✨' },
}

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // options.action = { label, onClick } adds a button (e.g. Undo) and keeps the toast longer
  const showNotification = useCallback(
    (message, type = 'success', options = {}) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, type, action: options.action }])
      setTimeout(() => dismiss(id), options.action ? 7000 : 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showNotification }), [showNotification])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-0 bottom-0 z-[9999] flex flex-col gap-2 p-4">
        {toasts.map((t) => {
          const s = STYLES[t.type] || STYLES.success
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-slide-in-up pointer-events-auto flex w-[22rem] max-w-[90vw] items-center gap-3 rounded-xl border border-l-4 border-slate-700/60 bg-raised/95 py-3 pr-3 pl-3 shadow-xl shadow-black/40 backdrop-blur ${s.edge}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${s.tile}`}>
                {s.icon}
              </span>
              <div className="flex-1 text-sm leading-snug font-medium text-slate-100">{t.message}</div>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action.onClick()
                    dismiss(t.id)
                  }}
                  className="rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-200 transition-colors hover:bg-indigo-500/30"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => dismiss(t.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
              >
                &times;
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}