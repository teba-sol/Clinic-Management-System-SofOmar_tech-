import { NavLink } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getFilteredNavItems } from './nav-items';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export function Sidebar() {
  const { user } = useAuth();
  const items = user ? getFilteredNavItems(user.role) : [];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex items-center justify-center size-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="size-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">SofOmar Clinic</h1>
          <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">Management System</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="rounded-xl bg-sidebar-accent/50 px-3 py-3">
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider mb-1">Logged in as</p>
          <p className="text-sm font-semibold truncate">{user?.name}</p>
          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sidebar-primary/20 text-sidebar-primary">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>
    </aside>
  );
}
