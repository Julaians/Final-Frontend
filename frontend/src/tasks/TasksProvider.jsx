import { useCallback, useEffect, useMemo, useState } from 'react'
import { TasksContext } from './tasksContext.js'
import { useAuth } from '../auth/useAuth.js'
import { anchorTask, anchorRecurring, localizeTask, dateKey } from '../utils/dates.js'
import { useDeviceTimezone } from '../hooks/useDeviceTimezone.js'
import { useNow } from '../hooks/useNow.js'

const TASKS_KEY = 'planit_tasks'

function readTasks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TASKS_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Random suffix so tasks created in the same millisecond (templates) never share an id
function makeId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// A recurring task is one series, so "completed" and "notified" only mean "today"
function withTodayState(task, today) {
  if (task.type !== 'recurring') return task
  const done = Array.isArray(task.completedDates) && task.completedDates.includes(today)
  const notified = Array.isArray(task.notifiedDates) && task.notifiedDates.includes(today)
  return { ...task, isCompleted: done, hasBeenNotified: notified, isNotified: notified }
}

const toggleIn = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

const NO_ANCHOR = {
  tzAnchored: false,
  anchorTz: null,
  startInstant: null,
  endInstant: null,
  anchorDays: null,
  anchorStart: null,
  anchorEnd: null,
}

export default function TasksProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? 'default_user'
  const tz = useDeviceTimezone()
  const today = dateKey(useNow())

  const [allTasks, setAllTasks] = useState(readTasks)

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(allTasks))
  }, [allTasks])

  // Timezone-checked tasks (one-off and recurring) are re-expressed in the device timezone,
  // recurring tasks also get today's completed/notified state
  const tasks = useMemo(
    () =>
      allTasks
        .filter((t) => !t.userId || t.userId === userId)
        .map((t) => localizeTask(t, tz))
        .map((t) => withTodayState(t, today)),
    [allTasks, userId, tz, today],
  )

  const addTask = useCallback(
    (data) => {
      const type = data.type || 'schedule'
      const isRecurring = type === 'recurring'
      const base = {
        id: makeId(),
        userId,
        title: data.title,
        type,
        recurDays: isRecurring ? data.recurDays || [] : undefined,
        startDate: isRecurring ? undefined : data.startDate,
        endDate: isRecurring
          ? undefined
          : type === 'work'
            ? data.endDate || data.startDate
            : data.startDate,
        startTime: data.startTime || '09:00',
        endTime: data.endTime || '10:00',
        category: data.category || 'Work',
        priority: data.priority || 'Medium',
        subtasks: data.subtasks || [],
        isCompleted: false,
        completedAt: null,
        hasBeenNotified: false,
        isNotified: false,
        aiSuggested: Boolean(data.aiSuggested),
        ...(isRecurring ? { completedDates: [], notifiedDates: [] } : {}),
      }

      const tzFields = data.tzAnchored
        ? isRecurring
          ? anchorRecurring(base)
          : anchorTask(base)
        : { tzAnchored: false }

      const newTask = { ...base, ...tzFields }
      setAllTasks((prev) => [...prev, newTask])
      return newTask
    },
    [userId],
  )

  // Editing resets notification flags (for recurring: today's notification too)
  const updateTask = useCallback((id, updates) => {
    const isRecurring = updates.type === 'recurring'
    const tzFields = updates.tzAnchored
      ? isRecurring
        ? anchorRecurring(updates)
        : anchorTask(updates)
      : NO_ANCHOR

    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              ...tzFields,
              hasBeenNotified: false,
              isNotified: false,
              ...(isRecurring ? { notifiedDates: [] } : {}),
            }
          : t,
      ),
    )
  }, [])

  const toggleStatus = useCallback((id) => {
    const key = dateKey()
    setAllTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (t.type === 'recurring') {
          return { ...t, completedDates: toggleIn(t.completedDates || [], key) }
        }
        return {
          ...t,
          isCompleted: !t.isCompleted,
          completedAt: !t.isCompleted ? new Date().toISOString() : null,
        }
      }),
    )
  }, [])

  const deleteTask = useCallback((id) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const markNotified = useCallback((id) => {
    const key = dateKey()
    setAllTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t
        if (t.type === 'recurring') {
          const seen = t.notifiedDates || []
          return { ...t, notifiedDates: seen.includes(key) ? seen : [...seen, key] }
        }
        return {
          ...t,
          hasBeenNotified: true,
          isNotified: true,
          notifiedAt: new Date().toISOString(),
        }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({ tasks, addTask, updateTask, toggleStatus, deleteTask, markNotified }),
    [tasks, addTask, updateTask, toggleStatus, deleteTask, markNotified],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}