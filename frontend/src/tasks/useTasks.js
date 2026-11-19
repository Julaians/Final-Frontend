import { useContext } from 'react'
import { TasksContext } from './tasksContext.js'

export function useTasks() {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used inside <TasksProvider>')
  return ctx
}