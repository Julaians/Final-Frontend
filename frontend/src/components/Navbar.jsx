import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useNow } from '../hooks/useNow.js'

const ICONS = {
  dashboard: [
    'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z',
  ],
  tasks: [
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  ],
  board: [
    'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
  ],
  settings: [
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
    'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  ],
  logout: [
    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  ],
  eye: [
    'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  ],
}

function Icon({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      {ICONS[name].map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" d={d} />
      ))}
    </svg>
  )
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/tasks', label: 'Tasks', icon: 'tasks' },
  { to: '/board', label: 'Schedule Board', icon: 'board' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const EASE = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

function Brand() {
  return (
    <NavLink to="/dashboard" className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-black tracking-tight text-indigo-300 ring-1 ring-indigo-400/30">
        OTS
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-white">Online Task Scheduler</span>
        <span className="block text-[11px] text-slate-500">Calm, timezone-aware planning</span>
      </span>
    </NavLink>
  )
}

export default function Navbar({ username = '', onLogout }) {
  const [open, setOpen] = useState(false)
  const [clear, setClear] = useState(() => {
    try {
      return localStorage.getItem('ots_pill_clear') === '1'
    } catch {
      return false
    }
  })
  const { pathname } = useLocation()
  const onBoard = pathname.startsWith('/board')
  const now = useNow(30000)
  const initial = (username || 'U').charAt(0).toUpperCase()

  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const toggleClear = () => {
    const next = !clear
    setClear(next)
    try {
      localStorage.setItem('ots_pill_clear', next ? '1' : '0')
    } catch {
      /* storage unavailable, the toggle still works for this visit */
    }
  }

  return (
    <>
      {/* Desktop sidebar (slides out to the left on the board) */}
      <aside
        inert={onBoard}
        className={`fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800/80 bg-panel p-5 transition-transform duration-500 will-change-transform lg:flex ${EASE} ${onBoard ? '-translate-x-full' : 'translate-x-0'
          }`}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{
            background:
              'radial-gradient(circle at 30% 0%, rgba(99, 102, 241, 0.14) 0%, transparent 70%)',
          }}
        />
        <div className="relative">
          <Brand />
        </div>

        <p className="relative mt-9 mb-3 px-3 text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
          Workspace
        </p>
        <nav className="relative flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-500/15 text-indigo-200'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-indigo-400 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                  />
                  <Icon name={link.icon} />
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative mt-auto rounded-2xl border border-slate-700/60 bg-raised/80 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-950/50">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-semibold text-slate-100">{username || 'User'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Icon name="logout" className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Desktop floating pill (slides in from the left on the board) */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-40 hidden justify-center overflow-hidden px-4 py-2 lg:flex">
        <div
          inert={!onBoard}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-2xl border p-2 transition-[transform,opacity,background-color,border-color,box-shadow] duration-500 will-change-transform ${EASE} ${clear
              ? 'border-white/10 bg-transparent'
              : 'border-slate-700/60 bg-panel shadow-2xl shadow-black/40'
            } ${onBoard ? 'translate-x-0 opacity-100' : '-translate-x-[110vw] opacity-0'}`}>
          <NavLink
            to="/dashboard"
            aria-label="Go to dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-black tracking-tight text-indigo-300 ring-1 ring-indigo-400/30"
          >
            OTS
          </NavLink>

          <span className="mx-1 h-6 w-px bg-slate-700/70" />

          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive
                    ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/25'
                    : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                  }`
                }
              >
                <Icon name={link.icon} className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <span className="mx-1 h-6 w-px bg-slate-700/70" />

          <div className="px-2 text-right leading-tight">
            <p className="font-mono text-sm font-semibold text-slate-100">{clock}</p>
            <p className="text-[11px] text-slate-500">{dateLabel}</p>
          </div>

          <span className="mx-1 h-6 w-px bg-slate-700/70" />

          <div className="flex items-center gap-2 pr-1">
            <button
              type="button"
              onClick={toggleClear}
              aria-pressed={clear}
              aria-label="Toggle transparent navbar"
              title={clear ? 'Make navbar solid' : 'Make navbar transparent'}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${clear
                ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-200'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                }`}
            >
              <Icon name="eye" className="h-4 w-4" />
            </button>
            <span
              title={username || 'User'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-950/50"
            >
              {initial}
            </span>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Logout"
              title="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-app/85 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-800 bg-panel px-4 py-4">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? 'bg-indigo-500/15 text-indigo-200'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                    }`
                  }
                >
                  <Icon name={link.icon} />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-indigo-600 text-sm font-bold text-white">
                  {initial}
                </span>
                <span className="text-sm font-semibold text-slate-100">{username || 'User'}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-sm font-semibold text-slate-300 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  )
}