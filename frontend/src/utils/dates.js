export function parseDateTime(date, time) {
  const d = new Date(`${date}T${time}:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function getDeviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// Pins a task to the exact moment it happens, using the device timezone it was saved in
export function anchorTask(data) {
  const start = parseDateTime(data.startDate, data.startTime)
  const end = parseDateTime(data.endDate || data.startDate, data.endTime)
  if (!start || !end) return { tzAnchored: false }
  return {
    tzAnchored: true,
    anchorTz: getDeviceTimezone(),
    startInstant: start.toISOString(),
    endInstant: end.toISOString(),
  }
}

function toZonedParts(date, tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type).value
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

// ---- Recurring tasks with timezone adjustment ------------------------------

function tzOffsetMs(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUTC - Math.floor(date.getTime() / 1000) * 1000
}

// The exact moment a wall-clock time happens in the given timezone
function wallToInstant(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, mi] = String(timeStr).split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h || 0, mi || 0)
  const first = guess - tzOffsetMs(new Date(guess), tz)
  return new Date(guess - tzOffsetMs(new Date(first), tz))
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

// Pins a recurring task to the timezone it was saved in
export function anchorRecurring(data) {
  const days = Array.isArray(data.recurDays) ? data.recurDays : []
  if (days.length === 0 || !data.startTime || !data.endTime) return { tzAnchored: false }
  return {
    tzAnchored: true,
    anchorTz: getDeviceTimezone(),
    anchorDays: [...days],
    anchorStart: data.startTime,
    anchorEnd: data.endTime,
    startInstant: null,
    endInstant: null,
  }
}

// Re-expresses an anchored recurring task's days and times in the given timezone
function localizeRecurring(task, tz) {
  if (!task.tzAnchored || !task.anchorTz || !Array.isArray(task.anchorDays) || task.anchorDays.length === 0) {
    return task
  }
  if (task.anchorTz === tz) {
    return { ...task, recurDays: task.anchorDays, startTime: task.anchorStart, endTime: task.anchorEnd }
  }

  // Use this week's dates in the anchor timezone, so daylight saving is applied correctly
  const today = toZonedParts(new Date(), task.anchorTz).date
  const todayDow = weekdayOf(today)

  const localDays = new Set()
  let startTime = task.anchorStart
  let endTime = task.anchorEnd

  task.anchorDays.forEach((d, i) => {
    const date = addDays(today, d - todayDow)
    const start = toZonedParts(wallToInstant(date, task.anchorStart, task.anchorTz), tz)
    localDays.add(weekdayOf(start.date))
    if (i === 0) {
      startTime = start.time
      endTime = toZonedParts(wallToInstant(date, task.anchorEnd, task.anchorTz), tz).time
    }
  })

  return {
    ...task,
    recurDays: [...localDays].sort((a, b) => a - b),
    startTime,
    endTime,
  }
}

// Re-expresses an anchored task in the given timezone. Other tasks pass through untouched.
// Re-expresses an anchored task in the given timezone. Other tasks pass through untouched.
export function localizeTask(task, tz) {
  if (task.type === 'recurring') return localizeRecurring(task, tz)
  if (!task.tzAnchored || !task.startInstant || !task.endInstant) return task
  const s = toZonedParts(new Date(task.startInstant), tz)
  const e = toZonedParts(new Date(task.endInstant), tz)
  return { ...task, startDate: s.date, startTime: s.time, endDate: e.date, endTime: e.time }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatRecurDays(recurDays) {
  if (!Array.isArray(recurDays) || recurDays.length === 0) return 'No days set'
  const sorted = [...recurDays].sort((a, b) => a - b)
  return sorted.map((d) => DAY_NAMES[d]).join(', ')
}

export function getTargetDate(task) {
  if (task.type === 'recurring') return null
  return task.type === 'work'
    ? task.endDate || task.startDate
    : task.startDate || task.date
}

// A converted meeting can end on a different date than it starts (e.g. 23:30 to 00:30)
function getEndDate(task) {
  return task.endDate || task.startDate || task.date
}

export function getDeadline(task) {
  if (task.type === 'recurring') return null
  const date = getEndDate(task)
  if (!date) return null
  return parseDateTime(date, task.endTime || '23:59')
}

export function getBoardColumn(task, now) {
  if (task.type === 'recurring') {
    const days = Array.isArray(task.recurDays) ? task.recurDays : []
    if (days.length === 0) return null

    const todayDow = now.getDay()

    // Today is one of its days and it isn't done yet: Today, or Past Due once the end time passes
    if (days.includes(todayDow) && !task.isCompleted) {
      const end = parseDateTime(dateKey(now), task.endTime || '23:59')
      return end && now > end ? 'past' : 'today'
    }

    // Otherwise it waits for its next occurrence
    return days.includes((todayDow + 1) % 7) ? 'tomorrow' : 'upcoming'
  }

  const date = getTargetDate(task)
  if (!date) return null

  const end = parseDateTime(getEndDate(task), task.endTime || '23:59')
  const day = parseDateTime(date, '00:00')
  if (!end || !day) return 'upcoming'

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (now > end) return 'past'
  if (day.getTime() === today.getTime()) return 'today'
  if (day.getTime() === tomorrow.getTime()) return 'tomorrow'
  return 'upcoming'
}

export function getTaskBucket(task, now) {
  if (!task.isCompleted || task.type === 'recurring') return getBoardColumn(task, now)

  const date = getTargetDate(task)
  const day = date ? parseDateTime(date, '00:00') : null
  if (!day) return null

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (day < today) return null
  if (day.getTime() === today.getTime()) return 'today'
  if (day.getTime() === tomorrow.getTime()) return 'tomorrow'
  return 'upcoming'
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// One-line date text shared by the Tasks cards and the Board cards
export function formatTaskDate(task) {
  if (task.type === 'recurring') {
    const days = Array.isArray(task.recurDays) ? [...task.recurDays].sort((a, b) => a - b) : []
    return days.length ? days.map((d) => DAY_SHORT[d]).join(' · ') : 'No days set'
  }
  const start = task.startDate || task.date || 'No date'
  const end = task.endDate || start
  return task.type === 'work' ? `${start} → ${end}` : start
}

const toMinutes = (t) => {
  const [h, m] = String(t || '00:00').split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

const sortTime = (task) =>
  task.type === 'work' ? task.endTime || '23:59' : task.startTime || '09:00'

const cmp = (x, y) => (x === y ? 0 : x < y ? -1 : 1)

// Next time a recurring task happens (used to order the Upcoming column)
function nextRecurring(task, now) {
  const days = Array.isArray(task.recurDays) ? task.recurDays : []
  const [h, m] = String(task.startTime || '09:00').split(':').map(Number)
  for (let i = 1; i <= 8; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    if (days.includes(d.getDay())) {
      d.setHours(h || 0, m || 0, 0, 0)
      return d.getTime()
    }
  }
  return Infinity
}

function boardKey(task, col, now) {
  if (col === 'today' || col === 'tomorrow') return toMinutes(sortTime(task))
  if (task.type === 'recurring') {
    if (col === 'past') {
      const at = parseDateTime(dateKey(now), task.startTime || '09:00')
      return at ? at.getTime() : Infinity
    }
    return nextRecurring(task, now)
  }
  const date = getTargetDate(task)
  const at = date ? parseDateTime(date, sortTime(task)) : null
  return at ? at.getTime() : Infinity
}

export function groupForBoard(tasks, now) {
  const cols = { past: [], today: [], tomorrow: [], upcoming: [], nodate: [], completed: [] }

  tasks.forEach((task) => {
    if (task.isCompleted && task.type !== 'recurring') {
      cols.completed.push(task)
      return
    }
    cols[getBoardColumn(task, now) || 'nodate'].push(task)
  })

    // Past Due: most overdue first. Today/Tomorrow: earliest time first. Upcoming: date, then time.
    ;['past', 'today', 'tomorrow', 'upcoming'].forEach((key) => {
      cols[key] = cols[key]
        .map((t) => ({ t, k: boardKey(t, key, now) }))
        .sort((a, b) => cmp(a.k, b.k) || (a.t.title || '').localeCompare(b.t.title || ''))
        .map((x) => x.t)
    })

  cols.completed.sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
  return cols
}

// Local calendar date as YYYY-MM-DD (device clock, same as the rest of the app)
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}