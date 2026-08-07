import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ClinicSettings } from '@/types';

export function useClinicSettings() {
  return useQuery<ClinicSettings>({
    queryKey: ['clinic-settings-public'],
    queryFn: () => api.get('/clinic-settings/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
