import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import ApiBanner from '../components/ApiBanner.jsx'
import ToastProvider from '../toast/ToastProvider.jsx'
import TasksProvider from '../tasks/TasksProvider.jsx'
import TaskModalProvider from '../modal/TaskModalProvider.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useReminders } from '../hooks/useReminders.js'

function Shell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const onBoard = pathname.startsWith('/board')
  useReminders()

  return (
    <div className="relative min-h-screen bg-app text-slate-100">
      {/* Ambient color layer */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="animate-drift-a absolute -top-40 -left-32 h-[36rem] w-[36rem] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)' }}
        />
        <div
          className="animate-drift-b absolute top-1/4 -right-40 h-[34rem] w-[34rem] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(217,70,239,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="animate-drift-c absolute -bottom-48 left-1/4 h-[38rem] w-[38rem] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="animate-drift-a absolute right-1/4 -bottom-32 h-[24rem] w-[24rem] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }}
        />
      </div>

      <Navbar username={user.username} onLogout={logout} />
      <div className={`relative ${onBoard ? 'lg:pl-0' : 'lg:pl-64'}`}>
        <main
          className={`relative mx-auto px-4 py-8 pb-16 sm:px-8 ${onBoard ? 'max-w-none lg:pt-28' : 'max-w-7xl'
            }`}
        >
          <ApiBanner />
          <div key={pathname} className="animate-page-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Layout() {
  return (
    <ToastProvider>
      <TasksProvider>
        <TaskModalProvider>
          <Shell />
        </TaskModalProvider>
      </TasksProvider>
    </ToastProvider>
  )
}