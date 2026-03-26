import { NavLink } from 'react-router-dom'
import { ScanSearch, Video, History, FileText } from 'lucide-react'

const tabs = [
  { to: '/',        label: 'Detect',   icon: ScanSearch },
  { to: '/live',    label: 'Live Cam', icon: Video },
  { to: '/history', label: 'History',  icon: History },
  { to: '/reports', label: 'Reports',  icon: FileText },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-3.5
                    bg-bg/85 backdrop-blur-xl border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2
                        flex items-center justify-center text-sm">
          🔍
        </div>
        Deep<span className="text-accent">Scan</span>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 bg-bg3 border border-border rounded-xl p-1">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200
               ${isActive
                 ? 'bg-card text-white shadow shadow-black/30 border border-border2'
                 : 'text-muted hover:text-white'}`
            }
          >
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2 mono text-xs text-accent
                      bg-accent/5 border border-accent/20 rounded-full px-3 py-1.5">
        <span className="status-dot" />
        SYSTEMS ONLINE
      </div>
    </nav>
  )
}
