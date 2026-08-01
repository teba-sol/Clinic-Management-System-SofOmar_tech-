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
  Package,
  Monitor,
  CalendarPlus,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
}

export const navItems: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
  },
  {
    key: 'patients',
    label: 'Patients',
    href: '/patients',
    icon: Users,
    roles: ['admin', 'doctor', 'nurse', 'receptionist'],
  },
  {
    key: 'appointments',
    label: 'Appointments',
    href: '/appointments',
    icon: CalendarCheck,
    roles: ['admin', 'receptionist'],
  },
  {
    key: 'myQueue',
    label: 'My Queue',
    href: '/doctor',
    icon: ClipboardList,
    roles: ['doctor'],
  },
  {
    key: 'queue',
    label: 'Queue',
    href: '/queue',
    icon: ClipboardList,
    roles: ['admin', 'nurse', 'receptionist'],
  },
  {
    key: 'schedules',
    label: 'Schedules',
    href: '/schedules',
    icon: Calendar,
    roles: ['admin'],
  },
  {
    key: 'visits',
    label: 'Visits',
    href: '/visits',
    icon: Stethoscope,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    key: 'prescriptions',
    label: 'Prescriptions',
    href: '/prescriptions',
    icon: Pill,
    roles: ['admin', 'doctor', 'nurse'],
  },
  {
    key: 'labOrders',
    label: 'Lab Orders',
    href: '/lab-orders',
    icon: FlaskConical,
    roles: ['admin', 'doctor', 'lab_tech'],
  },
  {
    key: 'invoices',
    label: 'Invoices',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'cashier'],
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'cashier'],
  },
  {
    key: 'services',
    label: 'Services',
    href: '/services',
    icon: Package,
    roles: ['admin'],
  },
  {
    key: 'users',
    label: 'Users',
    href: '/users',
    icon: UserPlus,
    roles: ['admin'],
  },
  {
    key: 'bookingPortal',
    label: 'Booking Portal',
    href: '/booking',
    icon: CalendarPlus,
    roles: ['admin', 'receptionist'],
  },
  {
    key: 'queueDisplay',
    label: 'Queue Display',
    href: '/queue-display',
    icon: Monitor,
    roles: ['admin', 'receptionist', 'nurse'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
  },
];

export function getFilteredNavItems(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
