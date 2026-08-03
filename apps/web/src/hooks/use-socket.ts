import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Appointment } from '@/types';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export interface LabResultNotification {
  labOrderId: string;
  patientId: string;
  patientName: string;
  status: string;
  createdAt: string;
}

export function useLabResults() {
  const [labResults, setLabResults] = useState<LabResultNotification[]>([]);
  const [lastLabResult, setLastLabResult] = useState<LabResultNotification | null>(null);

  useEffect(() => {
    const s = getSocket();
    s.connect();

    const handleLabResult = (data: LabResultNotification) => {
      setLastLabResult(data);
      setLabResults((prev) => [data, ...prev].slice(0, 20));
    };

    s.on('lab:result', handleLabResult);

    return () => {
      s.off('lab:result', handleLabResult);
    };
  }, []);

  const clearLabResults = useCallback(() => {
    setLabResults([]);
    setLastLabResult(null);
  }, []);

  return { labResults, lastLabResult, clearLabResults };
}

export function useSocket(doctorId: string | null) {
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!doctorId) return;

    const s = getSocket();
    s.connect();

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.emit('joinDoctorQueue', doctorId);

    const handleQueueUpdate = (data: Appointment[]) => {
      setQueue(data);
    };

    s.on(`queue:${doctorId}`, handleQueueUpdate);

    return () => {
      s.off(`queue:${doctorId}`, handleQueueUpdate);
      s.disconnect();
      setConnected(false);
      setQueue([]);
    };
  }, [doctorId]);

  const joinQueue = useCallback((id: string) => {
    const s = getSocket();
    s.emit('joinDoctorQueue', id);
  }, []);

  return { queue, connected, joinQueue };
}
