const styles = {
  red: { dot: 'bg-rose-400', title: 'text-rose-300', glow: 'rgba(244, 63, 94, 0.12)' },
  blue: { dot: 'bg-indigo-400', title: 'text-indigo-300', glow: 'rgba(99, 102, 241, 0.14)' },
  yellow: { dot: 'bg-amber-400', title: 'text-amber-300', glow: 'rgba(245, 158, 11, 0.12)' },
  green: { dot: 'bg-emerald-400', title: 'text-emerald-300', glow: 'rgba(16, 185, 129, 0.12)' },
  slate: { dot: 'bg-slate-400', title: 'text-slate-300', glow: 'rgba(148, 163, 184, 0.10)' },
}

export default function BoardColumn({ title, color, count, children }) {
  const s = styles[color]
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/60 bg-panel shadow-lg shadow-black/20">
      <div
        className="flex items-center justify-between rounded-t-2xl border-b border-slate-800 px-4 py-3.5"
        style={{ background: `linear-gradient(180deg, ${s.glow}, transparent)` }}
      >
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
          <h5 className={`text-sm font-bold tracking-wide uppercase ${s.title}`}>{title}</h5>
        </div>
        {count !== undefined && (
          <span className="rounded-full bg-slate-900/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 p-3">{children}</div>
    </div>
  )
}