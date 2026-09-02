import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  CheckCheck, 
  UserX, 
  Ban 
} from 'lucide-react';

const statusConfig = {
  Requested: {
    label: 'Requested',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  Confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
    icon: CheckCircle2,
  },
  CheckedIn: {
    label: 'Checked In',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    dot: 'bg-teal-500',
    icon: UserCheck,
  },
  Completed: {
    label: 'Completed',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCheck,
  },
  NoShow: {
    label: 'No Show',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
    icon: UserX,
  },
  Cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
    icon: Ban,
  },
};

export const StatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const config = statusConfig[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
  };

  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.bg} ${sizeClasses}`}
    >
      {showIcon ? (
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
