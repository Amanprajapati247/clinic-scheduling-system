import React, { useEffect, useState } from 'react';
import { appointmentApi, scheduleApi, authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  Download,
  Filter,
  User,
  Users,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProviderSchedule = () => {
  const { user, isFrontDesk, isProvider } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    isProvider ? user?.provider?.id || '' : ''
  );
  const [providers, setProviders] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load providers for Front Desk
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await authApi.getProviders();
        if (res.data.success) {
          setProviders(res.data.data);
          if (isProvider && user?.provider?.id) {
            setSelectedProviderId(user.provider.id);
          } else if (res.data.data.length > 0 && !selectedProviderId) {
            setSelectedProviderId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };
    fetchProviders();
  }, [isProvider, user]);

  // Fetch Daily Appointments
  const fetchDailySchedule = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {
        startDate: selectedDate,
        endDate: selectedDate,
        providerId: selectedProviderId || undefined,
        limit: 100,
        sortBy: 'time',
        sortOrder: 'asc',
      };

      const res = await appointmentApi.searchAppointments(params);
      if (res.data.success) {
        setAppointments(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchDailySchedule();
    }
  }, [selectedDate, selectedProviderId]);

  // Export Daily Schedule CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await scheduleApi.exportDailyScheduleCSV(selectedDate, selectedProviderId || undefined);
    } catch (err) {
      setErrorMessage('Failed to generate CSV export');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isProvider ? 'My Daily Clinical Schedule' : 'Provider Daily Schedule & CSV'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Inspect scheduled visits, supporting care commitments, and download standard daily CSV reports.
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={exporting || appointments.length === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exporting ? 'Generating CSV...' : 'Export Daily Schedule CSV'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Date & Provider Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-slate-700">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {isFrontDesk && (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">Provider:</span>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name} ({p.specialty})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto text-xs text-slate-400">
          Showing <strong>{appointments.length}</strong> scheduled appointment(s)
        </div>
      </div>

      {/* Daily Schedule Timeline View */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading day's schedule...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No appointments scheduled for {selectedDate}.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Pick a different date or schedule new patient visits from open slots.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => {
            const isSupporting = apt.supportingProviders?.some(
              (sp) => sp.providerId === user?.provider?.id
            );

            return (
              <div
                key={apt.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Time Block */}
                  <div className="p-3 bg-teal-50 text-teal-800 rounded-xl font-mono text-center shrink-0 min-w-[90px]">
                    <div className="text-sm font-bold">{apt.slot?.startTime}</div>
                    <div className="text-[10px] text-teal-600">{apt.slot?.duration} mins</div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{apt.patientName}</span>
                      <StatusBadge status={apt.status} size="sm" />
                      {isSupporting && (
                        <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                          Supporting Care
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>
                        Primary: <strong>{apt.schedulingProvider?.user?.name}</strong>
                      </span>
                      <span>•</span>
                      <span>{apt.reasonForVisit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Link
                    to={`/appointments/${apt.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Open Case
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProviderSchedule;
