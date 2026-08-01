import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Patient, Visit } from '@/types';

interface PatientContextType {
  patient: Patient | null;
  visit: Visit | null;
  setPatient: (patient: Patient | null) => void;
  setVisit: (visit: Visit | null) => void;
  clearContext: () => void;
}

const PatientContext = createContext<PatientContextType | null>(null);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patient, setPatientState] = useState<Patient | null>(null);
  const [visit, setVisitState] = useState<Visit | null>(null);

  const setPatient = useCallback((p: Patient | null) => {
    setPatientState(p);
    if (!p) setVisitState(null);
  }, []);

  const setVisit = useCallback((v: Visit | null) => setVisitState(v), []);

  const clearContext = useCallback(() => {
    setPatientState(null);
    setVisitState(null);
  }, []);

  return (
    <PatientContext.Provider value={{ patient, visit, setPatient, setVisit, clearContext }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientContext() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatientContext must be used within PatientProvider');
  return ctx;
}
