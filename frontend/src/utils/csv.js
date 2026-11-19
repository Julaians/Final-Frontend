export function exportTasksToCSV(tasks, username = 'user') {
  const headers = [
    'ID', 'Title', 'Type', 'Start Date / Recur Days', 'End Date', 'Start Time', 'End Time',
    'Category', 'Priority', 'Status', 'Subtasks', 'Notified',
  ]

  const rows = tasks.map((task) => {
    const isRecurring = task.type === 'recurring'
    const dateCol = isRecurring
      ? (Array.isArray(task.recurDays) ? task.recurDays.map((d) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join('/') : 'N/A')
      : (task.startDate || task.date || 'N/A')
    return [
      task.id,
      `"${(task.title || '').replace(/"/g, '""')}"`,
      task.type || 'schedule',
      dateCol,
      isRecurring ? 'N/A' : (task.endDate || task.startDate || task.date || 'N/A'),
      task.startTime || 'N/A',
      task.endTime || 'N/A',
      task.category || 'General',
      task.priority || 'Medium',
      task.isCompleted ? 'Completed' : 'Pending',
      Array.isArray(task.subtasks) ? task.subtasks.length : 0,
      task.hasBeenNotified || task.isNotified ? 'Yes' : 'No',
    ].join(',')
  })

  const blob = new Blob([[headers.join(','), ...rows].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `planit_${username || 'user'}_tasks.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}