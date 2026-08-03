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

export interface NavSection {
  key: string;
  labelKey: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    key: 'overview',
    labelKey: 'nav.sections.overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
      },
    ],
  },
  {
    key: 'operations',
    labelKey: 'nav.sections.operations',
    items: [
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
        key: 'queue',
        label: 'Queue',
        href: '/queue',
        icon: ClipboardList,
        roles: ['admin', 'nurse', 'receptionist'],
      },
      {
        key: 'bookingRequests',
        label: 'Booking Requests',
        href: '/booking-requests',
        icon: CalendarPlus,
        roles: ['admin', 'receptionist'],
      },
      {
        key: 'myQueue',
        label: 'My Queue',
        href: '/doctor',
        icon: ClipboardList,
        roles: ['doctor'],
      },
    ],
  },
  {
    key: 'clinical',
    labelKey: 'nav.sections.clinical',
    items: [
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
        roles: ['admin', 'doctor', 'nurse', 'cashier'],
      },
      {
        key: 'labOrders',
        label: 'Lab Orders',
        href: '/lab-orders',
        icon: FlaskConical,
        roles: ['admin', 'doctor', 'lab_tech'],
      },
    ],
  },
  {
    key: 'financial',
    labelKey: 'nav.sections.financial',
    items: [
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
    ],
  },
  {
    key: 'configuration',
    labelKey: 'nav.sections.configuration',
    items: [
      {
        key: 'schedules',
        label: 'Schedules',
        href: '/schedules',
        icon: Calendar,
        roles: ['admin'],
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
        key: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'cashier'],
      },
    ],
  },
];
