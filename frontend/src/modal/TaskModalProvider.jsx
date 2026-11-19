import { useCallback, useMemo, useState } from 'react'
import { TaskModalContext } from './taskModalContext.js'
import TaskModal from '../components/TaskModal.jsx'

export default function TaskModalProvider({ children }) {
  const [modal, setModal] = useState({ open: false, taskId: null })

  const openTaskModal = useCallback((taskId = null) => setModal({ open: true, taskId }), [])
  const closeTaskModal = useCallback(() => setModal({ open: false, taskId: null }), [])

  const value = useMemo(() => ({ openTaskModal, closeTaskModal }), [openTaskModal, closeTaskModal])

  return (
    <TaskModalContext.Provider value={value}>
      {children}
      <TaskModal open={modal.open} taskId={modal.taskId} onClose={closeTaskModal} />
    </TaskModalContext.Provider>
  )
}