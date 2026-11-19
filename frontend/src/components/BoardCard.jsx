import { memo } from 'react'
import { motion } from 'framer-motion'
import { getCategoryStyle } from '../utils/styles.js'
import { formatTaskDate } from '../utils/dates.js'

const PRIORITY = {
  High: { edge: 'bg-rose-400', dot: 'bg-rose-400', text: 'text-rose-300' },
  Medium: { edge: 'bg-sky-400', dot: 'bg-sky-400', text: 'text-sky-300' },
  Low: { edge: 'bg-emerald-400', dot: 'bg-emerald-400', text: 'text-emerald-300' },
}

const TYPE_ICON = { schedule: '📅', work: '🧱', recurring: '🔁' }

function BoardCard({ task, onToggle, onEdit, onDelete }) {
  const done = Boolean(task.isCompleted)
  const p = PRIORITY[task.priority] || PRIORITY.Medium
  const subtasks = Array.isArray(task.subtasks) ? task.subtasks : []
  const doneCount = subtasks.filter((s) => s.completed).length
  const notified = task.hasBeenNotified || task.isNotified

  return (
    <motion.div
      layout="position"
      layoutId={`task-${task.id}`}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className={`relative mb-3 overflow-hidden rounded-xl border bg-raised p-3.5 pl-4 shadow-md shadow-black/20 ${done ? 'border-slate-700/40 opacity-70' : 'border-slate-700/60'
        }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${done ? 'bg-slate-600' : p.edge}`} />

      <div className="flex items-start justify-between gap-2">
        <h6
          className={`line-clamp-2 min-w-0 flex-1 text-sm leading-snug font-semibold ${done ? 'text-slate-500 line-through' : 'text-white'
            }`}
          title={task.title}
        >
          {task.title}
        </h6>
        <div className="flex shrink-0 gap-1 text-xs">
          {notified && <span title="Reminder sent">🔔</span>}
          {task.tzAnchored && <span title="Adjusts to your timezone">🌐</span>}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-xs">
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

      <div className="mt-2.5 space-y-1 text-xs text-slate-400">
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
        <div className="mt-2.5 flex items-center gap-2">
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

      <div className="mt-3 flex items-center justify-between border-t border-slate-700/60 pt-3">
        <button
          type="button"
          onClick={() => onToggle(task.id)}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${done
              ? 'border-slate-500/50 text-slate-300 hover:bg-slate-700/60'
              : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
            }`}
        >
          {done ? '↩ Undo' : '✓ Done'}
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(task.id)}
            aria-label="Edit task"
            title="Edit"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 13l-1 4 4-1 8.5-8.5a2.5 2.5 0 00-3.536-3.536L9 13z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default memo(BoardCard)