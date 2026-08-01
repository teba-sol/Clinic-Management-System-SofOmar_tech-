import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Doctor {
  id: string;
  name: string;
}

interface Slot {
  time: string;
  label: string;
}

interface BookingConfirmation {
  id: string;
  queueNumber: number;
  scheduledAt: string;
  doctorName: string;
  patientName: string;
  status: string;
}

type Step = 'doctor' | 'date' | 'slots' | 'info' | 'confirm';

function BookingPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('doctor');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const { data: doctors, isFetching: loadingDoctors } = useQuery<Doctor[]>({
    queryKey: ['booking-doctors'],
    queryFn: () => fetch(`${API}/booking/doctors`).then((r) => r.json()),
  });

  const { data: slots, isFetching: loadingSlots } = useQuery<Slot[]>({
    queryKey: ['booking-slots', selectedDoctor?.id, selectedDate],
    queryFn: () =>
      fetch(`${API}/booking/doctors/${selectedDoctor!.id}/slots?date=${selectedDate}`).then((r) =>
        r.json(),
      ),
    enabled: !!selectedDoctor && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/booking/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor!.id,
          scheduledAt: `${selectedDate}T${selectedSlot!.time}:00`,
          patientFirstName: firstName,
          patientLastName: lastName,
          patientPhone: phone,
          patientDateOfBirth: dob,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Booking failed' }));
        throw new Error(err.message || 'Booking failed');
      }
      return res.json() as Promise<BookingConfirmation>;
    },
    onSuccess: (data) => {
      setConfirmation(data);
      setStep('confirm');
      toast.success('Appointment booked!');
    },
    onError: (e) => toast.error(e.message),
  });

  const today = new Date().toISOString().split('T')[0];

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 0);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-blue-50/40">
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <span className="text-sm font-bold tracking-tight">{t('app.name')}</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/queue-display" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.queueDisplay')}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Book an Appointment</h1>
          <p className="text-muted-foreground mt-1">Schedule your visit in just a few steps</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {(['doctor', 'date', 'info', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center size-8 rounded-full text-xs font-bold transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['doctor', 'date', 'info'].indexOf(s) < ['doctor', 'date', 'info'].indexOf(step) || confirmation
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {['doctor', 'date', 'info'].indexOf(s) < ['doctor', 'date', 'info'].indexOf(step) || confirmation ? '✓' : i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline capitalize">{s === 'info' ? 'Your Info' : s}</span>
              {i < 3 && <ChevronRight className="size-3 text-muted-foreground/40" />}
            </div>
          ))}
        </div>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>
              {step === 'doctor' && 'Select a Doctor'}
              {step === 'date' && 'Pick a Date & Time'}
              {step === 'slots' && 'Choose a Time Slot'}
              {step === 'info' && 'Your Information'}
              {step === 'confirm' && 'Appointment Confirmed'}
            </CardTitle>
            <CardDescription>
              {step === 'doctor' && 'Choose the doctor you\'d like to see'}
              {step === 'date' && `Selected: ${selectedDoctor?.name}`}
              {step === 'info' && `Dr. ${selectedDoctor?.name} — ${selectedDate} at ${selectedSlot?.label}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'doctor' && (
              <div className="space-y-2">
                {loadingDoctors ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  doctors?.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSelectedDate('');
                        setSelectedSlot(null);
                        setStep('date');
                      }}
                      className="w-full flex items-center gap-3 p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {doc.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">Doctor</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground ml-auto" />
                    </button>
                  ))
                )}
              </div>
            )}

            {step === 'date' && (
              <div className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot(null);
                      setStep('slots');
                    }}
                    min={minDate.toISOString().split('T')[0]}
                    max={maxDate.toISOString().split('T')[0]}
                    className="mt-1.5"
                  />
                </div>

                {selectedDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4" />
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('doctor')} className="gap-1.5">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                </div>
              </div>
            )}

            {step === 'slots' && (
              <div className="space-y-4">
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : slots && slots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep('info');
                        }}
                        className={cn(
                          'flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors',
                          selectedSlot?.time === slot.time
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:border-primary/50 hover:bg-primary/5',
                        )}
                      >
                        <Clock className="size-3.5" />
                        {slot.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="size-8 mx-auto mb-2 opacity-40" />
                    <p>No available slots for this date</p>
                    <p className="text-xs mt-1">Try a different date</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep('date')} className="gap-1.5">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                </div>
              </div>
            )}

            {step === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251-XXX-XXXXXX" type="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth</Label>
                  <Input value={dob} onChange={(e) => setDob(e.target.value)} type="date" />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep('slots')} className="gap-1.5">
                    <ChevronLeft className="size-4" /> Back
                  </Button>
                  <Button
                    onClick={() => bookMutation.mutate()}
                    disabled={!firstName || !lastName || !phone || !dob || bookMutation.isPending}
                    className="gap-1.5"
                  >
                    {bookMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCircle className="size-4" />
                    )}
                    {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'confirm' && confirmation && (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <CheckCircle className="size-8" />
                </div>
                <h2 className="text-xl font-bold mb-1">Appointment Booked!</h2>
                <p className="text-muted-foreground mb-6">Your appointment has been confirmed</p>

                <div className="max-w-sm mx-auto space-y-3 text-left">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Queue Number</span>
                    <span className="text-2xl font-bold text-primary">#{confirmation.queueNumber}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Doctor</span>
                    <span className="text-sm font-medium">{confirmation.doctorName}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm font-medium">
                      {new Date(confirmation.scheduledAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Time</span>
                    <span className="text-sm font-medium">
                      {new Date(confirmation.scheduledAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <span className="text-sm text-muted-foreground">Patient</span>
                    <span className="text-sm font-medium">{confirmation.patientName}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button render={<Link to="/" />} variant="outline">
                    Back to Home
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setSelectedDate('');
                      setSelectedSlot(null);
                      setFirstName('');
                      setLastName('');
                      setPhone('');
                      setDob('');
                      setConfirmation(null);
                      setStep('doctor');
                    }}
                  >
                    Book Another
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BookingPage;
