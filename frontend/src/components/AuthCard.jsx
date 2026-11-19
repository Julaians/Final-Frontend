import { useState, useEffect } from 'react'

const TIMEZONES = [
  { code: 'WITA', city: 'Makassar', iana: 'Asia/Makassar', offset: 'GMT+8' },
  { code: 'JST', city: 'Tokyo', iana: 'Asia/Tokyo', offset: 'GMT+9' },
  { code: 'GMT', city: 'London', iana: 'Europe/London', offset: 'GMT+0' },
]

export default function AuthCard({
  title,
  subtitle = 'Sign in to pick up right where you left off.',
  error,
  children,
  footer,
}) {
  const [selectedTz, setSelectedTz] = useState(0)
  const [now, setNow] = useState(new Date())
  
  const activeTz = TIMEZONES[selectedTz]

  // Update the time every minute so the clock stays live
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Format the current time based on the selected timezone
  const liveTime = new Intl.DateTimeFormat('en-US', {
    timeZone: activeTz.iana,
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)

  return (
    <div className="flex min-h-screen bg-[#111520] text-slate-100">
      {/* Left Inviting Showcase Panel */}
      <div className="relative hidden flex-col justify-between gap-8 border-r border-slate-800/80 bg-[#161B28] p-10 xl:p-14 lg:flex lg:w-[54%]">
        {/* Isolated Decorative Glow Wrapper */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 20% 25%, rgba(99, 102, 241, 0.16) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
            <span className="text-sm font-black tracking-tight">OTS</span>
          </div>
          <div>
            <p className="text-base font-bold leading-snug text-white">Online Task Scheduler</p>
            <p className="mt-0.5 text-xs text-slate-400">Calm, timezone-aware planning</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto max-w-lg space-y-8 py-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300">
              <span>✦</span>
              <span>Own your time, shape your day</span>
            </span>
            <h2 className="text-3xl font-bold leading-snug tracking-tight text-white xl:text-4xl">
              A calmer way to stay ahead of every deadline.
            </h2>
            <p className="text-base leading-relaxed text-slate-400">
              Organize daily schedules and multi-day projects in one clean workspace that adapts automatically when you switch timezones.
            </p>
          </div>

          {/* Unified Interactive Task + Timezone Card */}
          <div className="rounded-2xl border border-slate-700/60 bg-[#1C2232]/90 p-5 sm:p-6 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-400">Try switching timezone</span>
              <div className="flex gap-1 rounded-lg bg-slate-900/70 p-1">
                {TIMEZONES.map((tz, idx) => (
                  <button
                    key={tz.code}
                    type="button"
                    onClick={() => setSelectedTz(idx)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      selectedTz === idx
                        ? 'bg-indigo-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tz.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                {/* Live Pulsing Indicator */}
                <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{activeTz.city} Team Sprint Check-In</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {activeTz.city} · {activeTz.offset}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-indigo-500/15 px-3 py-1 font-mono text-sm font-semibold text-indigo-300">
                {liveTime}
              </span>
            </div>
          </div>

          {/* Simple Feature Highlights */}
          <ul className="space-y-3 text-sm leading-relaxed text-slate-300">
            {[
              'Organise tasks with smart boards and priorities',
              'Stay on schedule with automated email reminders',
              'Shift your schedule smoothly across global timezones',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-slate-500">
          © {now.getFullYear()} OTS. All rights reserved.
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 sm:py-12">
        <div className="my-auto mx-auto w-full max-w-[460px]">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xs font-black text-indigo-300 ring-1 ring-indigo-400/30">
              OTS
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Online Task Scheduler
            </span>
          </div>

          <div className="rounded-2xl border border-slate-700/60 bg-[#181E2C] p-7 shadow-xl shadow-black/25 sm:p-10">
            <div className="mb-7 space-y-1.5">
              <h1 className="text-2xl font-bold leading-tight tracking-tight text-white">{title}</h1>
              <p className="text-sm leading-relaxed text-slate-400">{subtitle}</p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-relaxed font-medium text-rose-300"
              >
                {error}
              </div>
            )}

            {children}

            <div className="mt-7 border-t border-slate-800 pt-6 text-center text-sm leading-relaxed text-slate-400">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}