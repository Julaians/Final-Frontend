import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { useAuth } from '../auth/useAuth.js'
import { useTasks } from '../tasks/useTasks.js'
import { useTaskModal } from '../modal/useTaskModal.js'
import { useNow } from '../hooks/useNow.js'
import { getDeadline, getTaskBucket } from '../utils/dates.js'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
ChartJS.defaults.color = '#94a3b8'
ChartJS.defaults.font.family = 'inherit'

const PRIORITIES = [
  { key: 'High', bar: 'bg-rose-400', text: 'text-rose-300', soft: 'bg-rose-500/10 border-rose-500/25' },
  { key: 'Medium', bar: 'bg-sky-400', text: 'text-sky-300', soft: 'bg-sky-500/10 border-sky-500/25' },
  { key: 'Low', bar: 'bg-emerald-400', text: 'text-emerald-300', soft: 'bg-emerald-500/10 border-emerald-500/25' },
]

const STAT_TILES = [
  { key: 'total', label: 'Total Tasks', icon: '🗂️', accent: 'from-indigo-500/20', value: 'text-white' },
  { key: 'pending', label: 'Pending', icon: '⏳', accent: 'from-amber-500/20', value: 'text-amber-300' },
  { key: 'completed', label: 'Completed', icon: '✅', accent: 'from-emerald-500/20', value: 'text-emerald-300' },
  { key: 'late', label: 'Completed Late', icon: '⚠️', accent: 'from-rose-500/20', value: 'text-rose-300' },
]

const TIME_TABS = [
  { key: 'all', label: 'All', dot: 'bg-slate-400' },
  { key: 'past', label: 'Past Due', dot: 'bg-rose-400' },
  { key: 'today', label: 'Today', dot: 'bg-indigo-400' },
  { key: 'tomorrow', label: 'Tomorrow', dot: 'bg-amber-400' },
  { key: 'upcoming', label: 'Upcoming', dot: 'bg-emerald-400' },
]

// Chart options live outside the component so they keep the same identity between renders
const DOUGHNUT_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, boxWidth: 8 },
    },
  },
}

const BAR_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false }, border: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1 },
      grid: { color: 'rgba(148, 163, 184, 0.10)' },
      border: { display: false },
    },
  },
  plugins: { legend: { display: false } },
}

function greeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function CompletionRing({ percent }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10" className="stroke-slate-700/60" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-indigo-400 transition-all duration-700"
          strokeDasharray={`${(percent / 100) * c} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-white">{percent}%</span>
        <span className="text-[11px] font-medium tracking-wider text-slate-400 uppercase">done</span>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-700/60 bg-surface p-6 shadow-lg shadow-black/20 ${className}`}
    >
      <div className="mb-5">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { tasks } = useTasks()
  const { openTaskModal } = useTaskModal()
  const now = useNow()
  const [time, setTime] = useState('all')

  const counts = useMemo(() => {
    const c = { all: tasks.length, past: 0, today: 0, tomorrow: 0, upcoming: 0 }
    tasks.forEach((t) => {
      const bucket = getTaskBucket(t, now)
      if (bucket) c[bucket]++
    })
    return c
  }, [tasks, now])

  const scoped = useMemo(
    () => (time === 'all' ? tasks : tasks.filter((t) => getTaskBucket(t, now) === time)),
    [tasks, now, time],
  )

  const stats = useMemo(() => {
    let onTime = 0
    let late = 0
    let pending = 0

    const priorities = {
      High: { total: 0, pending: 0 },
      Medium: { total: 0, pending: 0 },
      Low: { total: 0, pending: 0 },
    }

    scoped.forEach((task) => {
      const p = priorities[task.priority]
      if (p) {
        p.total++
        if (!task.isCompleted) p.pending++
      }

      if (!task.isCompleted) {
        pending++
        return
      }
      const deadline = getDeadline(task)
      const completedAt = task.completedAt ? new Date(task.completedAt) : now
      if (deadline && completedAt > deadline) late++
      else onTime++
    })

    const categories = { Study: 0, Work: 0, Personal: 0 }
    scoped.forEach((t) => {
      if (categories[t.category] !== undefined) categories[t.category]++
    })

    const completed = onTime + late
    return {
      total: scoped.length,
      pending,
      onTime,
      late,
      completed,
      percent: scoped.length ? Math.round((completed / scoped.length) * 100) : 0,
      categories,
      priorities,
    }
  }, [scoped, now])

  // Chart data is memoized so Chart.js only redraws when the numbers actually change
  const statusData = useMemo(
    () => ({
      labels: ['Completed (On Time)', 'Completed (Late)', 'Pending'],
      datasets: [
        {
          data: [stats.onTime, stats.late, stats.pending],
          backgroundColor: ['#34d399', '#fb7185', '#fbbf24'],
          borderColor: '#181e2c',
          borderWidth: 4,
          hoverOffset: 6,
        },
      ],
    }),
    [stats.onTime, stats.late, stats.pending],
  )

  const categoryData = useMemo(
    () => ({
      labels: ['Study', 'Work', 'Personal'],
      datasets: [
        {
          label: 'Tasks',
          data: [stats.categories.Study, stats.categories.Work, stats.categories.Personal],
          backgroundColor: ['#818cf8', '#fbbf24', '#fb7185'],
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 56,
        },
      ],
    }),
    [stats.categories],
  )

  const priorityTotal = PRIORITIES.reduce((sum, p) => sum + stats.priorities[p.key].total, 0)

  const dateLabel = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-panel p-7 shadow-xl shadow-black/25 sm:p-9">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.22) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(245, 158, 11, 0.10) 0%, transparent 50%)',
          }}
        />
        <div className="relative flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="max-w-lg">
            <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">{dateLabel}</p>
            <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
              {greeting(now.getHours())}, {user?.username || 'there'}.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {stats.total === 0
                ? time === 'all'
                  ? 'Your schedule is empty. Add your first task to get started.'
                  : 'No tasks in this view.'
                : `${time === 'all' ? 'You have' : `In ${TIME_TABS.find((t) => t.key === time).label}:`} ${stats.pending} pending ${stats.pending === 1 ? 'task' : 'tasks'} and ${stats.completed} completed.`}
            </p>
            <button
              onClick={() => openTaskModal()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-950/50 transition-all duration-150 hover:bg-indigo-400 focus:ring-4 focus:ring-indigo-400/25 focus:outline-none active:scale-[0.98]"
            >
              <span className="text-lg leading-none">+</span> Add Task
            </button>
          </div>
          <CompletionRing percent={stats.percent} />
        </div>
      </section>

      {/* Time filter */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-700/60 bg-panel p-1.5">
        {TIME_TABS.map((tab) => {
          const active = time === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setTime(tab.key)}
              aria-pressed={active}
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

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_TILES.map((tile) => (
          <div
            key={tile.key}
            className={`relative overflow-hidden rounded-2xl border border-slate-700/60 bg-linear-to-br ${tile.accent} to-surface to-60% p-5 shadow-lg shadow-black/20`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{tile.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/50 text-base">
                {tile.icon}
              </span>
            </div>
            <p className={`mt-4 text-4xl font-bold tracking-tight ${tile.value}`}>{stats[tile.key]}</p>
          </div>
        ))}
      </div>

      {/* Priority breakdown */}
      <Panel title="Tasks by Priority" subtitle="How your workload is spread, and what's still open">
        <div className="mb-6 flex h-3 w-full overflow-hidden rounded-full bg-slate-700/50">
          {priorityTotal > 0 &&
            PRIORITIES.map((p) => (
              <div
                key={p.key}
                className={`${p.bar} transition-all duration-500`}
                style={{ width: `${(stats.priorities[p.key].total / priorityTotal) * 100}%` }}
              />
            ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {PRIORITIES.map((p) => {
            const { total, pending } = stats.priorities[p.key]
            const done = total - pending
            return (
              <div key={p.key} className={`rounded-xl border p-4 ${p.soft}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold tracking-wider uppercase ${p.text}`}>{p.key}</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${p.bar}`} />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{total}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {pending} pending · {done} done
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-900/50">
                  <div
                    className={`h-full rounded-full ${p.bar} transition-all duration-500`}
                    style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Task Status" subtitle="On time, late and still pending">
          <div className="relative mx-auto h-64 w-full max-w-xs">
            <Doughnut data={statusData} options={DOUGHNUT_OPTIONS} />
          </div>
        </Panel>

        <Panel title="Tasks by Category" subtitle="Study, Work and Personal">
          <div className="h-64 w-full">
            <Bar data={categoryData} options={BAR_OPTIONS} />
          </div>
        </Panel>
      </div>
    </div>
  )
}