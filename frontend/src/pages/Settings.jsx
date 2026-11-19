import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { useToast } from '../toast/useToast.js'
import { DEFAULT_LEADS, LEAD_OPTIONS, loadLeads, saveLeads, formatLead } from '../utils/notifySettings.js'
import { fieldClass, primaryBtn, ghostBtn, panelClass } from '../utils/ui.js'

const ROWS = [
  {
    key: 'High',
    label: 'High priority',
    note: 'Urgent tasks get the earliest warning and a red email.',
    dot: 'bg-rose-400',
    box: 'border-rose-500/25 bg-rose-500/5',
    text: 'text-rose-300',
  },
  {
    key: 'Medium',
    label: 'Medium priority',
    note: 'A balanced heads-up for everyday work.',
    dot: 'bg-sky-400',
    box: 'border-sky-500/25 bg-sky-500/5',
    text: 'text-sky-300',
  },
  {
    key: 'Low',
    label: 'Low priority',
    note: 'A light nudge shortly before it starts.',
    dot: 'bg-emerald-400',
    box: 'border-emerald-500/25 bg-emerald-500/5',
    text: 'text-emerald-300',
  },
]

export default function Settings() {
  const { user } = useAuth()
  const { showNotification } = useToast()
  const [leads, setLeads] = useState(() => loadLeads(user.id))

  const change = (key) => (e) => setLeads((l) => ({ ...l, [key]: Number(e.target.value) }))

  const save = () => {
    saveLeads(user.id, leads)
    showNotification('Notification settings saved!', 'success')
  }

  const reset = () => {
    setLeads({ ...DEFAULT_LEADS })
    saveLeads(user.id, DEFAULT_LEADS)
    showNotification('Notification settings reset to defaults.', 'info')
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-panel p-7 shadow-xl shadow-black/25 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 12% 0%, rgba(99, 102, 241, 0.20) 0%, transparent 55%), radial-gradient(circle at 95% 100%, rgba(245, 158, 11, 0.08) 0%, transparent 50%)',
          }}
        />
        <div className="relative">
          <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">Preferences</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Choose how long before a task you get the toast and email, based on its priority. Tasks that
            have already been notified won&apos;t be notified again unless you edit them.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className={`${panelClass} p-6 lg:col-span-3`}>
          <h3 className="text-base font-bold text-white">Reminder timing</h3>
          <p className="mt-0.5 mb-5 text-xs text-slate-500">One setting per priority level</p>

          <div className="space-y-3">
            {ROWS.map((row) => (
              <div
                key={row.key}
                className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${row.box}`}
              >
                <div className="min-w-0">
                  <label
                    htmlFor={`lead-${row.key}`}
                    className={`flex items-center gap-2 text-sm font-bold ${row.text}`}
                  >
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.dot}`} />
                    {row.label}
                  </label>
                  <p className="mt-1 text-xs text-slate-500">{row.note}</p>
                </div>
                <select
                  id={`lead-${row.key}`}
                  value={leads[row.key]}
                  onChange={change(row.key)}
                  className={`${fieldClass} w-auto min-w-44`}
                >
                  {LEAD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} before
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={save} className={primaryBtn}>
              Save
            </button>
            <button onClick={reset} className={ghostBtn}>
              Reset to defaults
            </button>
          </div>
        </section>

        <aside className={`${panelClass} p-6 lg:col-span-2`}>
          <h3 className="text-base font-bold text-white">How it works</h3>
          <p className="mt-0.5 mb-5 text-xs text-slate-500">With your current settings</p>

          <ul className="space-y-4">
            {ROWS.map((row) => (
              <li key={row.key} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                <p className="text-sm leading-relaxed text-slate-400">
                  A <strong className={row.text}>{row.key}</strong> task alerts you{' '}
                  <strong className="text-slate-100">{formatLead(leads[row.key])}</strong> before it starts or is
                  due.
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-slate-700/60 bg-app/50 p-4 text-xs leading-relaxed text-slate-500">
            Alerts are checked every minute while OTS is open in a browser tab. Changes apply on the next check.
          </div>
        </aside>
      </div>
    </div>
  )
}