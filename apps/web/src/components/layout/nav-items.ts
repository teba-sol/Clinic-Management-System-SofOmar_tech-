import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  CalendarCheck,
  Stethoscope,
  ClipboardList,
  Pill,
  FlaskConical,
  Receipt,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
  },
  {
    label: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'doctor', 'nurse', 'receptionist'],
  },
  {
    label: 'Appointments',
    href: '/appointments',
    icon: CalendarCheck,
    roles: ['admin', 'receptionist'],
  },
  {
    label: 'Queue',
    href: '/queue',
    icon: ClipboardList,
    roles: ['admin', 'doctor', 'nurse', 'receptionist'],
  },
  {
    label: 'Schedules',
    href: '/schedules',
    icon: Calendar,
    roles: ['admin'],
  },
  {
    label: 'Visits',
    href: '/visits',
    icon: Stethoscope,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: Pill,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    label: 'Lab Orders',
    href: '/lab-orders',
    icon: FlaskConical,
    roles: ['admin', 'doctor', 'lab_tech'],
  },
  {
    label: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'cashier', 'receptionist'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
  },
];

export function getFilteredNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
