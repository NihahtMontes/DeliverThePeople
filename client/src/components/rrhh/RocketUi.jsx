import { Inbox } from 'lucide-react'

export function PageHeader({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-600"><Icon size={25} /></div>
          <h1 className="text-2xl font-extrabold text-gray-900">{title}</h1>
        </div>
        <p className="mt-2 text-sm font-medium text-gray-500">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

export function KpiCard({ icon: Icon, label, value, color = 'bg-blue-100 text-blue-600' }) {
  return (
    <div className="glass-card flex items-center gap-4 p-5">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}><Icon size={23} /></div>
      <div>
        <p className="text-sm font-semibold text-gray-500">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid animate-pulse gap-4 px-6 py-5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (__, col) => <div key={col} className="h-8 rounded-lg bg-gray-100" />)}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4 text-gray-400"><Inbox size={30} /></div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  )
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-white/70 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${active === tab.value ? 'bg-orange-600 text-white shadow-md' : 'text-gray-600 hover:bg-white/80'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
