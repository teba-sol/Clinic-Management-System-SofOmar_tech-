import { Stethoscope, Baby, HeartHandshake, Microscope, Smile, Pill, HeartPulse, Ear, type LucideIcon } from 'lucide-react';

export interface Department {
  icon: LucideIcon;
  nameKey: string;
  descKey: string;
}

export const departments: Department[] = [
  { icon: Stethoscope, nameKey: 'landing.services.general.name', descKey: 'landing.services.general.desc' },
  { icon: Baby, nameKey: 'landing.services.pediatrics.name', descKey: 'landing.services.pediatrics.desc' },
  { icon: HeartHandshake, nameKey: 'landing.services.maternal.name', descKey: 'landing.services.maternal.desc' },
  { icon: Microscope, nameKey: 'landing.services.lab.name', descKey: 'landing.services.lab.desc' },
  { icon: Smile, nameKey: 'landing.services.dentistry.name', descKey: 'landing.services.dentistry.desc' },
  { icon: Pill, nameKey: 'landing.services.pharmacy.name', descKey: 'landing.services.pharmacy.desc' },
  { icon: HeartPulse, nameKey: 'landing.services.cardiology.name', descKey: 'landing.services.cardiology.desc' },
  { icon: Ear, nameKey: 'landing.services.ent.name', descKey: 'landing.services.ent.desc' },
];
