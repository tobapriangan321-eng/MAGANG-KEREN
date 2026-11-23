import { CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react';
import type { ApplicationStatus } from '../types';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'Diterima':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 whitespace-nowrap shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>Diterima</span>
        </span>
      );
    case 'Sedang Diproses':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 whitespace-nowrap shrink-0">
          <RefreshCw className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
          <span>Sedang Diproses</span>
        </span>
      );
    case 'Ditolak':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 whitespace-nowrap shrink-0">
          <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
          <span>Ditolak</span>
        </span>
      );
    case 'Menunggu Review':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 whitespace-nowrap shrink-0">
          <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
          <span>Menunggu Review</span>
        </span>
      );
  }
}
