import { useCallback, useMemo, useState } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import BoardColumn from '../components/BoardColumn.jsx'
import BoardCard from '../components/BoardCard.jsx'
import { useTasks } from '../tasks/useTasks.js'
import { useToast } from '../toast/useToast.js'
import { useTaskModal } from '../modal/useTaskModal.js'
import { useNow } from '../hooks/useNow.js'
import { groupForBoard } from '../utils/dates.js'
import { fieldClass, panelClass } from '../utils/ui.js'

const COLUMNS = [
  { key: 'past', title: 'Past Due', color: 'red', empty: 'No past due tasks', icon: '🎉' },
  { key: 'today', title: 'Today', color: 'blue', empty: 'No tasks scheduled for today', icon: '☀️' },
  { key: 'tomorrow', title: 'Tomorrow', color: 'yellow', empty: 'No tasks for tomorrow', icon: '🌤️' },
  { key: 'upcoming', title: 'Upcoming', color: 'green', empty: 'No upcoming tasks', icon: '🔭' },
]

const NO_DATE_COLUMN = {
  key: 'nodate',
  title: 'No date set',
  color: 'slate',
  empty: 'Nothing here',
  icon: '🗂️',
}

const EASE = [0.16, 1, 0.3, 1]

export default function Board() {
  const { tasks, toggleStatus, deleteTask } = useTasks()
  const { showNotification } = useToast()
  const { openTaskModal } = useTaskModal()
  const now = useNow()

  const [search, setSearch] = useState('')
  const [priority, setPriority] = useState('all')
  const [showDone, setShowDone] = useState(false)

  const visible = useMemo(() => {
    const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return tasks.filter(
      (t) =>
        words.every((w) => (t.title || '').toLowerCase().includes(w)) &&
        (priority === 'all' || t.priority === priority),
    )
  }, [tasks, search, priority])

  const groups = useMemo(() => groupForBoard(visible, now), [visible, now])
  const columns = groups.nodate.length > 0 ? [...COLUMNS, NO_DATE_COLUMN] : COLUMNS

  const handleComplete = useCallback(
    (id) => {
      toggleStatus(id)
      showNotification('Task completed.', 'success', {
        action: { label: 'Undo', onClick: () => toggleStatus(id) },
      })
    },
    [toggleStatus, showNotification],
  )

  const handleReopen = useCallback(
    (id) => {
      toggleStatus(id)
      showNotification('Task moved back to pending.', 'info')
    },
    [toggleStatus, showNotification],
  )

  const handleDelete = useCallback(
    (id) => {
      if (window.confirm('Are you sure you want to delete this task?')) {
        deleteTask(id)
        showNotification('Task deleted.', 'info')
      }
    },
    [deleteTask, showNotification],
  )

  const renderCard = (task) => (
    <BoardCard
      key={task.id}
      task={task}
      onToggle={task.isCompleted ? handleReopen : handleComplete}
      onEdit={openTaskModal}
      onDelete={handleDelete}
    />
  )

  return (
    <LayoutGroup>
      <div className="space-y-6">
        {/* Search + priority */}
        <div className={`${panelClass} grid gap-3 p-4 md:grid-cols-3`}>
          <div className="relative md:col-span-2">
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search the board..."
              className={`${fieldClass} pl-10`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className={fieldClass} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Columns: one row, left to right, full screen width */}
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          <div className="grid auto-cols-[minmax(17rem,1fr)] grid-flow-col gap-5">
            {columns.map((col, i) => (
              <motion.div
                key={col.key}
                className="h-full"
                initial={{ x: -70, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.05 + i * 0.07 }}
              >
                <BoardColumn title={col.title} color={col.color} count={groups[col.key].length}>
                  {groups[col.key].length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/70 text-xl">
                        {col.icon}
                      </span>
                      <p className="text-sm text-slate-500">{col.empty}</p>
                    </div>
                  ) : (
                    groups[col.key].map(renderCard)
                  )}
                </BoardColumn>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Completed */}
        <section className="rounded-2xl border border-slate-700/60 bg-panel shadow-lg shadow-black/20">
          <button
            type="button"
            onClick={() => setShowDone((s) => !s)}
            aria-expanded={showDone}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="text-sm font-bold tracking-wide text-slate-200 uppercase">Completed</span>
              <span className="rounded-full bg-slate-900/60 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                {groups.completed.length}
              </span>
            </span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${showDone ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDone && (
            <div className="border-t border-slate-800 p-4">
              {groups.completed.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">Nothing completed yet.</p>
              ) : (
                <div className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
                  {groups.completed.map(renderCard)}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </LayoutGroup>
  )
}