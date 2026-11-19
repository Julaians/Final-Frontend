export const DEFAULT_LEADS = { Low: 30, Medium: 60, High: 180 }

export function formatLead(min) {
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'}`
  const h = Math.floor(min / 60)
  const m = min % 60
  const hours = `${h} hour${h === 1 ? '' : 's'}`
  return m ? `${hours} ${m} minute${m === 1 ? '' : 's'}` : hours
}

export const LEAD_OPTIONS = [5, 15, 30, 45, 60, 90, 120, 180, 240, 360, 720, 1440].map((value) => ({
  value,
  label: formatLead(value),
}))

const keyFor = (userId) => `planit_notify_${userId}`

export function loadLeads(userId) {
  try {
    return { ...DEFAULT_LEADS, ...JSON.parse(localStorage.getItem(keyFor(userId))) }
  } catch {
    return { ...DEFAULT_LEADS }
  }
}

export function saveLeads(userId, leads) {
  localStorage.setItem(keyFor(userId), JSON.stringify(leads))
}

export function leadFor(task, leads) {
  return leads[task.priority] ?? leads.Medium
}