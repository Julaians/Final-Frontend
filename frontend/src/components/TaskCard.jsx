import { getCategoryStyle } from '../utils/styles.js'
import { formatTaskDate } from '../utils/dates.js'
import { memo } from 'react'

const PRIORITY = {
  High: { edge: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-rose-300' },
  Medium: { edge: 'bg-sky-400', dot: 'bg-sky-400', text: 'text-sky-300' },
  Low: { edge: 'bg-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-300' },
}

const TYPE_ICON = { schedule: '📅', work: '🧱', recurring: '🔁' }

function TaskCard({ task }) {
  const done = Boolean(task.isCompleted)
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []
  const doneCount = subtasks.filter((s) => s.completed).length
  const notified = task.hasBeenNotified || task.isNotified
  const p = PRIORITY[task.priority] || PRIORITY.Medium

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface p-4 pl-5 shadow-lg shadow-black/20 ${
        done ? 'border-slate-700/40 opacity-60' : 'border-slate-700/60'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${done ? 'bg-slate-600' : p.edge}`} />

      <div className="flex items-start gap-3">
        <span
          title={done ? 'Completed' : 'Pending'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            done ? 'border-emerald-400 bg-emerald-400 text-slate-900' : 'border-slate-600 text-transparent'
          }`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>

        <h5
          className={`line-clamp-2 min-w-0 flex-1 text-[15px] leading-snug font-semibold ${
            done ? 'text-slate-500 line-through' : 'text-white'
          }`}
          title={task.title}
        >
          {task.title}
        </h5>

        <div className="flex shrink-0 gap-1 text-xs">
          {task.aiSuggested && <span title="AI-suggested subtasks">✨</span>}
          {notified && <span title="Reminder sent">🔔</span>}
          {task.tzAnchored && <span title="Adjusts to your timezone">🌐</span>}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${p.text}`}>
          <span className={`h-2 w-2 rounded-full ${p.dot}`} />
          {task.priority}
        </span>
        <span className="text-slate-600">•</span>
        <span
          className={`truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${getCategoryStyle(task.category)}`}
        >
          {task.category}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>⏰</span>
          <span className="font-medium text-slate-200">
            {task.startTime || '09:00'} – {task.endTime || '10:00'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>{TYPE_ICON[task.type] || TYPE_ICON.schedule}</span>
          <span className="truncate font-medium text-slate-200" title={formatTaskDate(task)}>
            {formatTaskDate(task)}
          </span>
        </div>
      </div>

      {subtasks.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700/70">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {doneCount}/{subtasks.length}
          </span>
        </div>
      )}

      <div className="mt-auto pt-4">
        <span
          className={`text-[11px] font-semibold tracking-wide uppercase ${
            done ? 'text-emerald-400' : 'text-amber-300'
          }`}
        >
          {done ? 'Completed' : 'Pending'}
        </span>
      </div>
    </div>
  )
}

export default memo(TaskCard)