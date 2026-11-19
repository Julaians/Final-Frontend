import { parseDateTime, dateKey } from './dates.js'
import { leadFor, formatLead } from './notifySettings.js'

// Finds the moment the reminder counts down to
function getTarget(task, now) {
  if (task.type === 'recurring') {
    const days = Array.isArray(task.recurDays) ? task.recurDays : []
    if (!days.includes(now.getDay())) return null
    const time = task.startTime || '09:00'
    const at = parseDateTime(dateKey(now), time)
    return at && { at, kind: 'routine', time }
  }

  if (task.type === 'work') {
    const date = task.endDate || task.startDate || task.date
    const time = task.endTime || '23:59'
    if (!date) return null
    const at = parseDateTime(date, time)
    return at && { at, kind: 'work', date, time }
  }

  const date = task.startDate || task.date
  const time = task.startTime || '09:00'
  if (!date) return null
  const at = parseDateTime(date, time)
  return at && { at, kind: 'schedule', date, time }
}

// Returns the alert message if the task is inside its priority's alert window, otherwise null
export function getReminderMessage(task, now, leads) {
  const target = getTarget(task, now)
  if (!target) return null

  const diff = Math.floor((target.at.getTime() - now.getTime()) / 60000)
  if (diff < 0 || diff > leadFor(task, leads)) return null

  const left = formatLead(diff)

  if (target.kind === 'routine') {
    const desc = diff === 0 ? 'starting right now' : `starts in ${left}`
    return `Routine Reminder: "${task.title}" ${desc}! (${target.time})`
  }
  if (target.kind === 'work') {
    const desc = diff === 0 ? 'is due now' : `is due in ${left}`
    return `Project Deadline Alert: "${task.title}" ${desc}! (Due: ${target.date} at ${target.time})`
  }
  const desc = diff === 0 ? 'starting right now' : `starts in ${left}`
  return `Upcoming Meeting: "${task.title}" ${desc}! (${target.time})`
}