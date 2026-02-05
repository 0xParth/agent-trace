import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Wrench, 
  Network, 
  Grid3X3,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', shortcut: '1' },
  { to: '/tools', icon: Wrench, label: 'Tool Registry', shortcut: '2' },
  { to: '/blast-radius', icon: Network, label: 'Blast Radius', shortcut: '3' },
  { to: '/matrix', icon: Grid3X3, label: 'Capability Matrix', shortcut: '4' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">AgentTrace</h1>
          <p className="text-xs text-zinc-500">v1.0.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                    'hover:bg-zinc-800/50',
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1">{item.label}</span>
                <span className="kbd text-[10px]">{item.shortcut}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          <p>Press <span className="kbd">?</span> for keyboard shortcuts</p>
        </div>
      </div>
    </aside>
  );
}
