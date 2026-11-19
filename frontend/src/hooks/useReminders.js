import { useEffect, useRef } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { useTasks } from '../tasks/useTasks.js'
import { useToast } from '../toast/useToast.js'
import { sendEmail } from '../api/email.js'
import { getReminderMessage } from '../utils/reminders.js'
import { loadLeads } from '../utils/notifySettings.js'

const CHECK_INTERVAL_MS = 60000

const SUBJECT_PREFIX = {
  High: '🚨 URGENT',
  Medium: '⏰ Reminder',
  Low: '🔔 Heads up',
}

export function useReminders() {
  const { user } = useAuth()
  const { tasks, markNotified } = useTasks()
  const { showNotification } = useToast()

  // The timer is created once, so it reads the latest values through a ref
  const latest = useRef({ tasks, user, markNotified, showNotification })
  useEffect(() => {
    latest.current = { tasks, user, markNotified, showNotification }
  })

  useEffect(() => {
    const check = () => {
      const { tasks, user, markNotified, showNotification } = latest.current
      const now = new Date()
      // Read every check, so changes on the Settings page apply right away
      const leads = loadLeads(user?.id)

      tasks
        .filter((t) => !t.isCompleted && !t.hasBeenNotified && !t.isNotified)
        .forEach((task) => {
          const message = getReminderMessage(task, now, leads)
          if (!message) return

          showNotification(message, 'warning')
          markNotified(task.id)

          const to = user?.email || 'test@example.com'
          const prefix = SUBJECT_PREFIX[task.priority] || SUBJECT_PREFIX.Medium
          sendEmail({
            to,
            subject: `${prefix}: "${task.title}" (${task.priority || 'Medium'} priority)`,
            message,
            task,
          }).then((result) => {
            if (result.ok) {
              showNotification(`Email alert dispatched to ${result.recipient || to}!`, 'success')
            } else {
              showNotification(result.error, 'error')
            }
          })
        })
    }

    const firstCheck = setTimeout(check, 2000)
    const timer = setInterval(check, CHECK_INTERVAL_MS)
    return () => {
      clearTimeout(firstCheck)
      clearInterval(timer)
    }
  }, [])
}