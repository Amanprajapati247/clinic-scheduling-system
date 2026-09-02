import React from 'react';
import { 
  History, 
  RefreshCw, 
  UserPlus, 
  UserMinus, 
  Ban, 
  FileText, 
  ArrowRightLeft, 
  CalendarPlus,
  ShieldCheck
} from 'lucide-react';

const actionConfig = {
  APPOINTMENT_CREATED: {
    label: 'Appointment Created',
    icon: CalendarPlus,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  STATUS_CHANGE: {
    label: 'Status Transition',
    icon: RefreshCw,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  SUPPORTING_PROVIDER_ADDED: {
    label: 'Supporting Provider Added',
    icon: UserPlus,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  SUPPORTING_PROVIDER_REMOVED: {
    label: 'Supporting Provider Removed',
    icon: UserMinus,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  CANCELLATION: {
    label: 'Appointment Cancelled',
    icon: Ban,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  VISIT_NOTE_CREATED: {
    label: 'Visit Note Logged',
    icon: FileText,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  APPOINTMENT_REASSIGNED: {
    label: 'Provider Reassigned',
    icon: ArrowRightLeft,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
};

export const TimelineViewer = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 font-medium">No timeline events recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Immutable Audit Trail ({timeline.length} events)
          </span>
        </div>
        <span className="text-xs text-slate-400">Append-Only Ledger</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {timeline.map((event) => {
          const config = actionConfig[event.actionType] || {
            label: event.actionType,
            icon: History,
            color: 'text-slate-600 bg-slate-50 border-slate-200',
          };
          const Icon = config.icon;
          const formattedDate = new Date(event.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div key={event.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center shadow-xs ${config.color}`}
              >
                <Icon className="w-3 h-3" />
              </div>

              {/* Event Card */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">
                    {config.label}
                  </span>
                  <time className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formattedDate}
                  </time>
                </div>

                {/* Diff info */}
                <div className="mt-1.5 text-xs text-slate-600 space-y-1">
                  {event.oldValue && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className="font-medium text-slate-400">Previous:</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] line-through text-slate-500">
                        {event.oldValue}
                      </span>
                    </div>
                  )}
                  {event.newValue && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-medium text-slate-500">
                        {event.oldValue ? 'Updated to:' : 'Value:'}
                      </span>
                      <span className="bg-teal-50 text-teal-800 border border-teal-100 px-1.5 py-0.5 rounded text-[11px] font-medium">
                        {event.newValue}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actor info */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Action by:{' '}
                    <strong className="text-slate-600 font-medium">
                      {event.user?.name || 'System'}
                    </strong>
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    {event.user?.role || 'SYSTEM'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineViewer;
