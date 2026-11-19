import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TaskCard from '../components/TaskCard.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useTasks } from '../tasks/useTasks.js'
import { useToast } from '../toast/useToast.js'
import { useTaskModal } from '../modal/useTaskModal.js'
import { useNow } from '../hooks/useNow.js'
import { fetchTemplates } from '../api/templates.js'
import { exportTasksToCSV } from '../utils/csv.js'
import { getTaskBucket } from '../utils/dates.js'
import { fieldClass, primaryBtn, ghostBtn, panelClass } from '../utils/ui.js'

const TIME_TABS = [
  { key: 'all', label: 'All', dot: 'bg-slate-400' },
  { key: 'past', label: 'Past Due', dot: 'bg-rose-400' },
  { key: 'today', label: 'Today', dot: 'bg-indigo-400' },
  { key: 'tomorrow', label: 'Tomorrow', dot: 'bg-amber-400' },
  { key: 'upcoming', label: 'Upcoming', dot: 'bg-emerald-400' },
]

export default function Tasks() {
  const { user } = useAuth()
  const { tasks, addTask } = useTasks()
  const { showNotification } = useToast()
  const { openTaskModal } = useTaskModal()
  const now = useNow()

  const [filters, setFilters] = useState({
    time: 'all',
    search: '',
    category: 'all',
    priority: 'all',
    status: 'all',
  })

  const update = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))

  const counts = useMemo(() => {
    const c = { all: tasks.length, past: 0, today: 0, tomorrow: 0, upcoming: 0 }
    tasks.forEach((t) => {
      const bucket = getTaskBucket(t, now)
      if (bucket) c[bucket]++
    })
    return c
  }, [tasks, now])

  const filtered = useMemo(() => {
    const words = filters.search.toLowerCase().trim().split(/\s+/).filter(Boolean)
    return tasks.filter((task) => {
      const title = (task.title || '').toLowerCase()
      return (
        (filters.time === 'all' || getTaskBucket(task, now) === filters.time) &&
        words.every((w) => title.includes(w)) &&
        (filters.category === 'all' || task.category === filters.category) &&
        (filters.priority === 'all' || task.priority === filters.priority) &&
        (filters.status === 'all' ||
          (filters.status === 'completed' && task.isCompleted) ||
          (filters.status === 'pending' && !task.isCompleted))
      )
    })
  }, [tasks, now, filters])

  const handleExport = () => {
    if (tasks.length === 0) {
      showNotification('No tasks to export.', 'warning')
      return
    }
    exportTasksToCSV(tasks, user.username)
    showNotification('Tasks exported to CSV successfully!', 'success')
  }

  const handleTemplates = async () => {
    try {
      const templates = await fetchTemplates()
      templates.forEach((tpl) =>
        addTask({
          title: tpl.title,
          type: 'schedule',
          startDate: tpl.date,
          endDate: tpl.date,
          startTime: tpl.startTime || '09:00',
          endTime: tpl.endTime || '10:00',
          category: tpl.category || 'Work',
          priority: tpl.priority || 'Medium',
          subtasks: [],
        }),
      )
      showNotification(`${templates.length} task templates imported!`, 'success')
    } catch {
      showNotification('Failed to fetch templates. Make sure to run: npm run api', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-panel p-7 shadow-xl shadow-black/25 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 0%, rgba(99, 102, 241, 0.20) 0%, transparent 55%), radial-gradient(circle at 95% 100%, rgba(6, 182, 212, 0.08) 0%, transparent 50%)',
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">Your schedule</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Task List</h1>
            <p className="mt-2 text-sm text-slate-400">
              {tasks.length === 0
                ? 'Nothing planned yet.'
                : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} in total, ${filtered.length} shown.`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Edit, complete or delete tasks on the{' '}
              <Link to="/board" className="font-semibold text-indigo-300 hover:underline">
                Schedule Board
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleTemplates} className={ghostBtn}>
              Load Templates
            </button>
            <button onClick={handleExport} className={ghostBtn}>
              Export CSV
            </button>
            <button onClick={() => openTaskModal()} className={primaryBtn}>
              <span className="text-lg leading-none">+</span> Add Task
            </button>
          </div>
        </div>
      </section>

      {/* Time tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-700/60 bg-panel p-1.5">
        {TIME_TABS.map((tab) => {
          const active = filters.time === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilters((f) => ({ ...f, time: tab.key }))}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                active
                  ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
              {tab.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                  active ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className={`${panelClass} grid gap-3 p-4 md:grid-cols-4`}>
        <div className="relative">
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
            placeholder="Search tasks..."
            className={`${fieldClass} pl-10`}
            value={filters.search}
            onChange={update('search')}
          />
        </div>
        <select className={fieldClass} value={filters.category} onChange={update('category')}>
          <option value="all">All Categories</option>
          <option value="Study">Study</option>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
        </select>
        <select className={fieldClass} value={filters.priority} onChange={update('priority')}>
          <option value="all">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select className={fieldClass} value={filters.status} onChange={update('status')}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-panel/50 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl">
            🗓️
          </div>
          <h5 className="text-lg font-semibold text-white">No tasks found matching your filters.</h5>
          <p className="mt-1 text-sm text-slate-500">Try a different tab or filter, or add a new task.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}