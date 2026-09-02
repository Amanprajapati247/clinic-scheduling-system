import React, { useEffect, useState } from 'react';
import { alertApi, appointmentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Eye,
  Calendar,
  User,
  Stethoscope,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Alerts = () => {
  const { isFrontDesk } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await alertApi.getActiveAlerts();
      if (res.data.success) {
        setAlerts(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  // Dismiss Alert
  const handleDismiss = async (appointmentId, alertType) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await alertApi.dismissAlert(appointmentId, alertType);
      if (res.data.success) {
        setSuccessMessage('Alert dismissed.');
        fetchAlerts();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to dismiss alert');
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Confirm
  const handleQuickConfirm = async (appointmentId) => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.updateStatus(appointmentId, 'Confirmed');
      if (res.data.success) {
        setSuccessMessage('Appointment confirmed successfully.');
        fetchAlerts();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Unconfirmed Appointment Alerts
            </h1>
            {alerts.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs animate-pulse">
                {alerts.length} Active
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of unconfirmed appointments scheduled within 24 hours and imminent 1-hour reappearing alerts.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          Refresh Queue
        </button>
      </div>

      {/* Logic rules reminder card */}
      <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1 shadow-xs">
        <div className="font-bold flex items-center gap-1.5 text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Automated Alert Rules Engine:</span>
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
          <li>
            <strong>24-Hour Notice:</strong> Appointments in <code className="font-mono bg-amber-100 px-1 rounded">Requested</code> status within the next 24 hours trigger a Warning alert.
          </li>
          <li>
            <strong>Reappearing 1-Hour Urgent Alert:</strong> If an appointment remains <code className="font-mono bg-amber-100 px-1 rounded">Requested</code> within 1 hour of scheduled time, a Critical Alert <em>reappears</em> regardless of any prior 24h dismissal!
          </li>
        </ul>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Checking unconfirmed appointments...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">Alerts Queue Clear</p>
          <p className="text-xs text-slate-400 mt-1">
            All appointments within the next 24 hours have been confirmed or dismissed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.alertLevel === 'critical';

            return (
              <div
                key={`${alert.id}-${alert.alertType}`}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'bg-rose-50/60 border-rose-200 shadow-sm'
                    : 'bg-amber-50/50 border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 ${isCritical ? 'animate-bounce' : ''}`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {alert.patientName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isCritical
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {isCritical ? '🚨 1-Hour Critical' : '⚠️ 24-Hour Notice'}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {alert.patientPhone}
                      </span>
                    </div>

                    <p
                      className={`text-xs font-medium ${
                        isCritical ? 'text-rose-900 font-semibold' : 'text-amber-900'
                      }`}
                    >
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {alert.slotDate}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {alert.slotStartTime} – {alert.slotEndTime}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        {alert.providerName} ({alert.providerSpecialty})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Link
                    to={`/appointments/${alert.id}`}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold transition-colors"
                    title="View Appointment Case"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleQuickConfirm(alert.id)}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Confirm Now
                  </button>

                  <button
                    onClick={() => handleDismiss(alert.id, alert.alertType)}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors"
                    title="Dismiss alert from active queue"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
