export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'lab_tech' | 'cashier';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  createdAt: string;
}

export type AppointmentStatus = 'booked' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'triaged';

export type AppointmentPriority = 'routine' | 'urgent' | 'emergency';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  queueNumber: number;
  status: AppointmentStatus;
  priority?: AppointmentPriority;
  priorityReason?: string | null;
  priorityChangedBy?: string | null;
  priorityChangedAt?: string | null;
  returnedForRecheck?: boolean;
  createdAt: string;
}

export interface Visit {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  addendum?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
}

export type PrescriptionStatus = 'pending' | 'dispensed' | 'cancelled';

export interface Prescription {
  id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
  pdfUrl?: string;
  status?: PrescriptionStatus;
  dispensedByUserId?: string | null;
  dispensedAt?: string | null;
  createdAt: string;
}

export type LabOrderStatus = 'ordered' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';

export interface LabOrder {
  id: string;
  visitId: string;
  patientId: string;
  orderedByDoctorId: string;
  orderedByDoctorName?: string;
  testType: string;
  status: LabOrderStatus;
  resultText?: string;
  resultPdfUrl?: string;
  completedByLabTechId?: string;
  patient?: Patient;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'cancelled';
export type PaymentMethod = 'cash' | 'telebirr' | 'cbe_birr' | 'insurance';

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  visitId?: string;
  totalAmount: string;
  amountPaid: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  defaultPrice: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface CreateScheduleDto {
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
}

export interface CreateVisitDto {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  completeAppointment?: boolean;
}

export interface CreatePrescriptionDto {
  visitId: string;
  patientId: string;
  doctorId: string;
  items: PrescriptionItem[];
}

export interface CreateLabOrderDto {
  visitId: string;
  patientId: string;
  orderedByDoctorId: string;
  testType: string;
}

export interface UpdateLabOrderDto {
  status?: string;
  resultText?: string;
  completedByLabTechId?: string;
}

export interface CreateInvoiceDto {
  patientId: string;
  visitId?: string;
  items: { serviceId?: string | null; description: string; quantity: number; unitPrice: number; sourceType?: string; sourceId?: string }[];
}

export interface InvoiceAutoFillMedication {
  key: string;
  drugName: string;
  dosage: string | null;
  serviceId: string | null;
  suggestedPrice: number | null;
  unitPrice: number;
}

export interface InvoiceAutoFillLab {
  key: string;
  testType: string;
  status: string;
  serviceId: string | null;
  suggestedPrice: number | null;
  unitPrice: number;
}

export interface InvoiceAutoFill {
  visitId: string | null;
  hasVisit: boolean;
  medications: InvoiceAutoFillMedication[];
  labs: InvoiceAutoFillLab[];
}

export interface PayInvoiceDto {
  amount: number;
  paymentMethod: string;
}

export interface Vital {
  id: string;
  appointmentId: string;
  patientId: string;
  recordedByNurseId: string;
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  weight?: string;
  height?: string;
  bmi?: string;
  chiefComplaint?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateVitalDto {
  appointmentId: string;
  patientId: string;
  recordedByNurseId: string;
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  weight?: string;
  height?: string;
  chiefComplaint?: string;
  notes?: string;
}

export interface UpdateVitalDto {
  bloodPressure?: string;
  temperature?: string;
  pulse?: string;
  weight?: string;
  height?: string;
  chiefComplaint?: string;
  notes?: string;
}

export interface DiagnosisCode {
  id: string;
  code: string;
  description: string;
  category?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role: string;
}

export type BookingRequestStatus = 'pending' | 'contacted' | 'converted' | 'declined';
export type PreferredTime = 'morning' | 'afternoon' | 'evening';

export interface BookingRequest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  department: string;
  preferredDate: string;
  preferredTime: PreferredTime;
  doctorId?: string;
  doctorName?: string;
  reason?: string;
  status: BookingRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequestDto {
  name: string;
  phone: string;
  email?: string;
  department: string;
  preferredDate: string;
  preferredTime: PreferredTime;
  doctorId?: string;
  reason?: string;
}

export type WorkingDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ClinicHoliday {
  date: string;
  label: string;
}

export interface ClinicSettings {
  id: number;
  clinicName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  workingDays: WorkingDay[];
  workingHoursStart: string;
  workingHoursEnd: string;
  holidays: ClinicHoliday[];
  logoData?: string | null;
  logoMimeType?: string | null;
  updatedAt: string;
}

export interface AuthSession {
  id: string;
  createdAt: string;
  expiresAt: string;
}
