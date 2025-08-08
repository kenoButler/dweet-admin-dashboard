import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Shield,
  Activity,
  Users,
  Eye,
  Database,
  LifeBuoy,
  Settings,
  Lock,
  Gift,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Overview', icon: Activity },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/impersonation', label: 'Impersonation', icon: Eye },
  { to: '/data', label: 'Data', icon: Database },
  { to: '/gift-codes', label: 'Gift Codes', icon: Gift },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/security', label: 'Security', icon: Lock },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout({ headerRight, children }: { headerRight?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-white">
        <div className="px-4 py-4 flex items-center gap-2 border-b">
          <Shield className="h-5 w-5 text-blue-600" />
          <div className="font-semibold">Dweet Admin</div>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent',
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <main className="bg-gray-50">
        <div className="border-b bg-white">
          <div className="h-14 container mx-auto px-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Support & Management Console</div>
            <div>{headerRight}</div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6">{children}</div>
      </main>
    </div>
  )
} 