import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Database, BrainCircuit, BarChart3, FileText } from 'lucide-react'

const links = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/datasets',   icon: Database,        label: 'Datasets'   },
  { to: '/train',      icon: BrainCircuit,    label: 'Train Model'},
  { to: '/compare',    icon: BarChart3,       label: 'Compare'    },
  { to: '/reports',    icon: FileText,        label: 'Reports'    },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pt-6 pb-4">
      <nav className="flex flex-col gap-1 px-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
