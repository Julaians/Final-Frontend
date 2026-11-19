export default function StatCard({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-surface p-6 shadow-lg shadow-black/20">
      <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl" />
      <p className="relative text-xs font-semibold tracking-wider text-slate-400 uppercase">{label}</p>
      <p className={`relative mt-3 text-5xl font-bold tracking-tight ${valueClass}`}>{value}</p>
    </div>
  )
}