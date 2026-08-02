import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { navSections } from './nav-items';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'sidebar.collapsedSections';

function loadCollapsed(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsed);

  if (!user) return null;

  const toggleSection = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex items-center justify-center size-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <Activity className="size-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">{t('app.name')}</h1>
          <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">{t('app.tagline')}</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {navSections.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(user.role));
          if (items.length === 0) return null;
          const isCollapsed = !!collapsed[section.key];
          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                aria-expanded={!isCollapsed}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-sidebar-accent/30"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {t(section.labelKey)}
                </span>
                <ChevronDown
                  className={cn(
                    'size-3.5 text-sidebar-foreground/30 transition-transform duration-150',
                    isCollapsed && '-rotate-90',
                  )}
                />
              </button>
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
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
                      {t(`nav.${item.key}`)}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
