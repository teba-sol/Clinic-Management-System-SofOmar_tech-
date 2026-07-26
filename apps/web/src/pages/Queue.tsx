import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Card } from '@/components/ui/card';

interface Appointment {
  id: string;
  queueNumber: number;
  status: string;
  scheduledAt: string;
}

export default function Queue() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user) return;
    const socket = io('http://localhost:3000');

    socket.on(`queue:${user.id}`, (data: Appointment[]) => {
      setQueue(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-teal-700">Live Queue</h1>
      <div className="grid gap-4 max-w-md">
        {queue.length === 0 && <p className="text-slate-500">No patients in queue yet.</p>}
        {queue.map((appt) => (
          <Card key={appt.id} className="p-4 flex justify-between items-center border-l-4 border-l-amber-500">
            <span className="text-xl font-bold">#{appt.queueNumber}</span>
            <span className="text-sm uppercase text-slate-600">{appt.status}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
