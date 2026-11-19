import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTasks } from '../tasks/useTasks.js'
import { useToast } from '../toast/useToast.js'
import { breakdownTask } from '../api/ai.js'
import { fieldClass, primaryBtn } from '../utils/ui.js'

const labelClass = 'mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase'
const errorClass = 'mt-1.5 text-xs font-medium text-rose-300'

const TYPES = [
  { value: 'schedule', icon: '📅', title: 'Schedule', sub: 'Single-day meeting or event' },
  { value: 'work', icon: '🧱', title: 'Work', sub: 'Multi-day project' },
  { value: 'recurring', icon: '🔁', title: 'Recurring', sub: 'Weekly routine' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function emptyForm() {
  return {
    title: '',
    type: 'schedule',
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    category: '',
    priority: 'Medium',
    tzAnchored: false,
    recurDays: [],
  }
}

function formFromTask(task) {
  return {
    title: task.title || '',
    type: task.type || 'schedule',
    startDate: task.startDate || task.date || '',
    endDate: task.endDate || task.startDate || task.date || '',
    startTime: task.startTime || '09:00',
    endTime: task.endTime || '10:00',
    category: task.category || '',
    priority: task.priority || 'Medium',
    tzAnchored: Boolean(task.tzAnchored),
    recurDays: Array.isArray(task.recurDays) ? task.recurDays : [],
  }
}

function SectionTitle({ children }) {
  return (
    <div className="mt-7 mb-4 flex items-center gap-3">
      <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase">{children}</span>
      <span className="h-px flex-1 bg-slate-700/60" />
    </div>
  )
}

function TaskForm({ task, onClose }) {
  const { addTask, updateTask } = useTasks()
  const { showNotification } = useToast()

  const [form, setForm] = useState(() => (task ? formFromTask(task) : emptyForm()))
  const [subtasks, setSubtasks] = useState(() =>
    Array.isArray(task?.subtasks) ? task.subtasks.map((s) => ({ ...s })) : [],
  )
  const [newSubtask, setNewSubtask] = useState('')
  const [errors, setErrors] = useState({})
  const [aiTip, setAiTip] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const isWork = form.type === 'work'
  const isRecurring = form.type === 'recurring'

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Pause the background animation while the modal is open (less lag)
  useEffect(() => {
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [])

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  const changeType = (type) => {
    setForm((f) => ({
      ...f,
      type,
      endDate: type === 'work' ? f.endDate : '',
      recurDays: f.recurDays ?? [],
    }))
  }

  const toggleRecurDay = (day) => {
    setForm((f) => {
      const days = Array.isArray(f.recurDays) ? f.recurDays : []
      return {
        ...f,
        recurDays: days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
      }
    })
  }

  // ---- Subtasks -------------------------------------------------------------
  const toggleSubtask = (i) =>
    setSubtasks((list) => list.map((s, idx) => (idx === i ? { ...s, completed: !s.completed } : s)))

  const removeSubtask = (i) => setSubtasks((list) => list.filter((_, idx) => idx !== i))

  const addSubtask = () => {
    const title = newSubtask.trim()
    if (!title) return
    setSubtasks((list) => [...list, { id: `sub_${Date.now()}`, title, completed: false }])
    setNewSubtask('')
  }

  // ---- AI breakdown ---------------------------------------------------------
  const handleAi = async () => {
    const title = form.title.trim()
    if (!title) {
      setErrors((er) => ({ ...er, title: 'Please type a task title first so AI can analyze it!' }))
      return
    }

    setAiLoading(true)
    try {
      const r = await breakdownTask(title, form.category, form.type)
      setForm((f) => {
        const type = f.type === 'recurring' ? 'recurring' : r.suggestedType || f.type
        return {
          ...f,
          category: r.suggestedCategory || f.category,
          priority: r.suggestedPriority || f.priority,
          type,
          endDate: type === 'work' ? f.endDate : '',
        }
      })
      setAiTip(r.aiTip || '')
      setSubtasks(Array.isArray(r.subtasks) ? r.subtasks : [])
      showNotification('✨ AI breakdown generated smart subtasks & tags!', 'info')
    } finally {
      setAiLoading(false)
    }
  }

  // ---- Submit ---------------------------------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault()

    const title = form.title.trim()
    const { type, startDate, startTime, endTime, category, priority, tzAnchored, recurDays } = form
    const endDate = isWork ? form.endDate : startDate

    const next = {}
    if (!title) next.title = 'Task title is required.'

    if (isRecurring) {
      if (!Array.isArray(recurDays) || recurDays.length === 0) next.recurDays = 'Select at least one day.'
    } else {
      if (!startDate) next.date = 'Date is required.'
    }

    if (isWork) {
      if (!endDate) next.endDate = 'End Date is required for projects.'
      else if (startDate && endDate < startDate) {
        next.endDate = 'End date cannot be earlier than start date.'
      }
    }

    if (!startTime) next.startTime = 'Required.'
    if (!endTime) next.endTime = 'Required.'
    else if (!isWork && startTime && endTime <= startTime) {
      next.endTime = 'End time must be after start time.'
    }

    if (!category) next.category = 'Category is required.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    const data = {
      title,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      category,
      priority,
      subtasks,
      ...(isRecurring ? { recurDays } : {}),
      tzAnchored,
    }

    if (task) {
      updateTask(task.id, data)
      showNotification('Task updated successfully!', 'success')
    } else {
      addTask({ ...data, aiSuggested: subtasks.length > 0 })
      showNotification('Task created successfully!', 'success')
    }
    onClose()
  }

  const typeHint = isRecurring
    ? 'Repeats every week on the selected days. No specific date needed.'
    : isWork
      ? 'Multi-day projects enable end-date tracking. Reminder timing follows the task priority (see Settings).'
      : 'Single-slot event or meeting on a specific date.'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-700/60 bg-[#181e2c] shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.18) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase">
              {task ? 'Editing' : 'New'}
            </p>
            <h5 id="modal-title" className="mt-0.5 text-xl font-bold text-white">
              {task ? 'Edit Task' : 'Add New Task'}
            </h5>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-4">
            {/* Title + AI */}
            <SectionTitle>Basics</SectionTitle>
            <div className="mb-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="task-title" className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Task Title
                </label>
                <button
                  type="button"
                  onClick={handleAi}
                  disabled={aiLoading}
                  className="rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 px-2.5 py-1 text-xs font-semibold text-fuchsia-300 transition-colors hover:bg-fuchsia-500/20 disabled:opacity-60"
                >
                  {aiLoading ? '✨ Analyzing...' : '✨ AI Breakdown'}
                </button>
              </div>
              <input
                id="task-title"
                type="text"
                className={fieldClass}
                placeholder="e.g. Database Migration to Postgres or Q3 Design Review"
                value={form.title}
                onChange={setField('title')}
              />
              {errors.title && <div className={errorClass}>{errors.title}</div>}
            </div>

            {aiTip && (
              <div className="mb-4 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-200">
                <span className="font-bold">💡 AI Suggestion:</span> {aiTip}
              </div>
            )}

            {/* Type */}
            <div className="mb-2">
              <span className={labelClass}>Task Type</span>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => {
                  const active = form.type === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => changeType(t.value)}
                      aria-pressed={active}
                      className={`rounded-xl border p-3 text-left transition-all ${active
                        ? 'border-indigo-400/60 bg-indigo-500/15 ring-2 ring-indigo-400/20'
                        : 'border-slate-700/80 bg-slate-800/50 hover:border-slate-600'
                        }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className={`mt-1 block text-sm font-bold ${active ? 'text-white' : 'text-slate-300'}`}>
                        {t.title}
                      </span>
                      <span className="block text-[11px] leading-snug text-slate-500">{t.sub}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500">{typeHint}</p>
            </div>

            {/* When */}
            <SectionTitle>When</SectionTitle>

            {isRecurring ? (
              <div className="mb-4">
                <span className={labelClass}>Repeat Every</span>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, i) => {
                    const on = (form.recurDays ?? []).includes(i)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleRecurDay(i)}
                        aria-pressed={on}
                        className={`h-11 w-12 rounded-xl border text-sm font-semibold transition-all ${on
                          ? 'border-indigo-400 bg-indigo-500 text-white shadow-md shadow-indigo-950/50'
                          : 'border-slate-700/80 bg-slate-800/60 text-slate-400 hover:border-slate-500 hover:text-slate-100'
                          }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
                {errors.recurDays && <div className={errorClass}>{errors.recurDays}</div>}
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="task-start-date" className={labelClass}>
                    {isWork ? 'Start Date' : 'Date'}
                  </label>
                  <input
                    id="task-start-date"
                    type="date"
                    className={fieldClass}
                    value={form.startDate}
                    onChange={setField('startDate')}
                  />
                  {errors.date && <div className={errorClass}>{errors.date}</div>}
                </div>
                {isWork && (
                  <div>
                    <label htmlFor="task-end-date" className={labelClass}>
                      End Date / Deadline
                    </label>
                    <input
                      id="task-end-date"
                      type="date"
                      className={fieldClass}
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={setField('endDate')}
                    />
                    {errors.endDate && <div className={errorClass}>{errors.endDate}</div>}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-start-time" className={labelClass}>
                  {isWork ? 'Work Start Time' : 'Start Time'}
                </label>
                <input
                  id="task-start-time"
                  type="time"
                  className={fieldClass}
                  value={form.startTime}
                  onChange={setField('startTime')}
                />
                {errors.startTime && <div className={errorClass}>{errors.startTime}</div>}
              </div>
              <div>
                <label htmlFor="task-end-time" className={labelClass}>
                  {isWork ? 'Project Due Time' : 'End Time'}
                </label>
                <input
                  id="task-end-time"
                  type="time"
                  className={fieldClass}
                  value={form.endTime}
                  onChange={setField('endTime')}
                />
                {errors.endTime && <div className={errorClass}>{errors.endTime}</div>}
              </div>
            </div>

            {/* Timezone */}
            <label className="mb-2 flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4 transition-colors hover:bg-indigo-500/10">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-indigo-500"
                checked={form.tzAnchored}
                onChange={(e) => setForm((f) => ({ ...f, tzAnchored: e.target.checked }))}
              />
              <span>
                <span className="text-sm font-semibold text-slate-100">🌐 Adjust to my timezone</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">
                  {isRecurring
                    ? 'Turn on for a routine tied to a real moment, like a weekly meeting in another location. Its days and times shift when you change timezone. Leave it off for routines like jogging that stay at the same clock time wherever you are.'
                    : 'Turn on for things tied to a real moment, like a meeting in another location. Leave it off for routines like jogging that stay at the same clock time wherever you are.'}
                </span>
              </span>
            </label>

            {/* Details */}
            <SectionTitle>Details</SectionTitle>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-category" className={labelClass}>
                  Category
                </label>
                <select
                  id="task-category"
                  className={fieldClass}
                  value={form.category}
                  onChange={setField('category')}
                >
                  <option value="">Select Category...</option>
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
                {errors.category && <div className={errorClass}>{errors.category}</div>}
              </div>
              <div>
                <label htmlFor="task-priority" className={labelClass}>
                  Priority
                </label>
                <select
                  id="task-priority"
                  className={fieldClass}
                  value={form.priority}
                  onChange={setField('priority')}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Subtasks */}
            <div className="mb-2">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Checklist / Subtasks
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                  {subtasks.length} items
                </span>
              </div>

              <div className="mb-2 max-h-36 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-800/40 p-1.5">
                {subtasks.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    Click &quot;✨ AI Breakdown&quot; or add subtasks below.
                  </div>
                ) : (
                  subtasks.map((st, i) => (
                    <div
                      key={st.id ?? i}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-slate-700/30"
                    >
                      <label className="flex min-w-0 items-center gap-2.5 text-sm">
                        <input
                          type="checkbox"
                          className="size-4 shrink-0 accent-emerald-500"
                          checked={Boolean(st.completed)}
                          onChange={() => toggleSubtask(i)}
                        />
                        <span className={st.completed ? 'text-slate-500 line-through' : 'text-slate-200'}>
                          {st.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        aria-label="Remove subtask"
                        onClick={() => removeSubtask(i)}
                        className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-lg leading-none text-rose-300 transition-colors hover:bg-rose-500/15"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  className={fieldClass}
                  placeholder="Add a subtask step..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSubtask()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="shrink-0 rounded-xl border border-slate-600 px-4 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-700/60 hover:text-white"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer (solid, no blur) */}
          <div className="border-t border-slate-800 bg-[#161b28] px-6 py-4">
            <button type="submit" className={`${primaryBtn} w-full py-3`}>
              Save Task
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function TaskModal({ open, taskId, onClose }) {
  const { tasks } = useTasks()

  const task = open && taskId ? tasks.find((t) => t.id === taskId) : null
  const show = open && (!taskId || Boolean(task))

  return (
    <AnimatePresence>
      {show && <TaskForm key={taskId ?? 'new'} task={task} onClose={onClose} />}
    </AnimatePresence>
  )
}