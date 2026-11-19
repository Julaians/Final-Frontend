const FALLBACK = 'bg-slate-500/15 text-slate-300 ring-slate-400/25'

const categoryStyles = {
  Study: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/25',
  Work: 'bg-amber-500/15 text-amber-300 ring-amber-400/25',
  Personal: 'bg-rose-500/15 text-rose-300 ring-rose-400/25',
}

const priorityStyles = {
  High: 'bg-rose-500/15 text-rose-300 ring-rose-400/25',
  Medium: 'bg-sky-500/15 text-sky-300 ring-sky-400/25',
  Low: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/25',
}

export const getCategoryStyle = (cat) => categoryStyles[cat] || FALLBACK
export const getPriorityStyle = (pri) => priorityStyles[pri] || FALLBACK