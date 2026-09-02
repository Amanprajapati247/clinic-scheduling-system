import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentApi, authApi, slotApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Search,
  Filter,
  Calendar,
  User,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  UserCheck,
  CheckCheck,
  UserX,
  Ban,
  ArrowRightLeft,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

export const Appointments = () => {
  const { user, isFrontDesk, isProvider } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalResults: 0,
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  // Search & Filter state
  const [searchName, setSearchName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAptForCancel, setSelectedAptForCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedAptForReassign, setSelectedAptForReassign] = useState(null);
  const [newProviderId, setNewProviderId] = useState('');
  const [availableSlotsForReassign, setAvailableSlotsForReassign] = useState([]);
  const [newSlotId, setNewSlotId] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Providers list for filter dropdown
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await authApi.getProviders();
        if (res.data.success) {
          setProviders(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };
    fetchProviders();
  }, []);

  // Fetch Appointments
  const fetchAppointments = async (page = pagination.currentPage) => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {
        page,
        limit: pagination.limit,
        patientName: searchName || undefined,
        providerId: selectedProvider || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      };

      const res = await appointmentApi.searchAppointments(params);
      if (res.data.success) {
        setAppointments(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to retrieve appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
  }, [selectedProvider, selectedStatus, startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAppointments(1);
  };

  // Status transition execution
  const handleTransition = async (aptId, targetStatus) => {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await appointmentApi.updateStatus(aptId, targetStatus);
      if (res.data.success) {
        setSuccessMessage(`Appointment successfully transitioned to ${targetStatus}`);
        fetchAppointments();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || `Failed to transition status to ${targetStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Execution
  const handleConfirmCancel = async () => {
    if (!selectedAptForCancel || !cancellationReason.trim()) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.cancelAppointment(
        selectedAptForCancel.id,
        cancellationReason
      );
      if (res.data.success) {
        setSuccessMessage('Appointment cancelled successfully.');
        setCancelModalOpen(false);
        setSelectedAptForCancel(null);
        setCancellationReason('');
        fetchAppointments();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reassign Modal & Fetch Open Slots for New Provider
  const handleOpenReassign = async (apt) => {
    setSelectedAptForReassign(apt);
    setNewProviderId('');
    setNewSlotId('');
    setAvailableSlotsForReassign([]);
    setReassignModalOpen(true);
  };

  const handleProviderSelectForReassign = async (provId) => {
    setNewProviderId(provId);
    setNewSlotId('');
    if (!provId) return;
    try {
      const res = await slotApi.getSlots({
        providerId: provId,
        isBooked: false,
        isArchived: false,
      });
      if (res.data.success) {
        setAvailableSlotsForReassign(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load slots for provider:', err);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedAptForReassign || !newProviderId) return;
    setActionLoading(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.reassignProvider(
        selectedAptForReassign.id,
        newProviderId,
        newSlotId || undefined
      );
      if (res.data.success) {
        setSuccessMessage('Appointment successfully reassigned.');
        setReassignModalOpen(false);
        setSelectedAptForReassign(null);
        fetchAppointments();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to reassign provider');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appointments Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isFrontDesk
              ? 'Comprehensive clinical bookings, status management, and provider reassignments.'
              : 'Your scheduled and supporting patient appointments.'}
          </p>
        </div>

        {isFrontDesk && (
          <Link
            to="/slots"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Book from Open Slots</span>
          </Link>
        )}
      </div>

      {/* Alert Notices */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Patient Name Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by patient name..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Provider Filter (Visible to Front Desk) */}
          {isFrontDesk && (
            <div className="sm:col-span-3">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
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

          {/* Status Filter */}
          <div className={isFrontDesk ? 'sm:col-span-3' : 'sm:col-span-5'}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="Requested">Requested (Pending)</option>
              <option value="Confirmed">Confirmed</option>
              <option value="CheckedIn">Checked In</option>
              <option value="Completed">Completed</option>
              <option value="NoShow">No Show</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-2">
            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Date Range & Sorting Sub-Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-600">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            {(startDate || endDate || searchName || selectedProvider || selectedStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchName('');
                  setSelectedProvider('');
                  setSelectedStatus('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-teal-600 hover:underline font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="date">Date</option>
              <option value="time">Time</option>
              <option value="status">Status</option>
              <option value="provider">Provider</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Provider & Care Team</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      <span>Loading appointments...</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No appointments found matching the current search & filters.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const hasSupporting = apt.supportingProviders && apt.supportingProviders.length > 0;

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Patient Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{apt.patientName}</div>
                        <div className="text-[11px] text-slate-400">{apt.patientPhone}</div>
                      </td>

                      {/* Scheduling Provider & Supporting care team */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {apt.schedulingProvider?.user?.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {apt.schedulingProvider?.specialty}
                        </div>
                        {hasSupporting && (
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-medium">
                              +{apt.supportingProviders.length} Supporting
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{apt.slot?.date}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {apt.slot?.startTime} – {apt.slot?.endTime} ({apt.slot?.duration}m)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={apt.status} />
                      </td>

                      {/* Reason & Notes Count */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-600 truncate">{apt.reasonForVisit}</p>
                        {apt._count?.visitNotes > 0 && (
                          <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-medium mt-0.5 inline-block">
                            {apt._count.visitNotes} clinical note(s)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Link
                            to={`/appointments/${apt.id}`}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Full Appointment Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Quick Workflow Actions */}
                          {apt.status === 'Requested' && (
                            <button
                              onClick={() => handleTransition(apt.id, 'Confirmed')}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold transition-colors"
                              title="Confirm Appointment"
                            >
                              Confirm
                            </button>
                          )}

                          {apt.status === 'Confirmed' && (
                            <>
                              <button
                                onClick={() => handleTransition(apt.id, 'CheckedIn')}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded text-[11px] font-semibold transition-colors"
                                title="Check In Patient"
                              >
                                Check In
                              </button>
                              <button
                                onClick={() => handleTransition(apt.id, 'NoShow')}
                                disabled={actionLoading}
                                className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-semibold transition-colors"
                                title="Mark as No Show (allowed only after start time)"
                              >
                                No Show
                              </button>
                            </>
                          )}

                          {apt.status === 'CheckedIn' && (
                            <button
                              onClick={() => handleTransition(apt.id, 'Completed')}
                              disabled={actionLoading}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold transition-colors"
                              title="Complete Visit"
                            >
                              Complete
                            </button>
                          )}

                          {/* Reassign (Front Desk only on active uncompleted appointments) */}
                          {isFrontDesk &&
                            apt.status !== 'Completed' &&
                            apt.status !== 'Cancelled' &&
                            apt.status !== 'NoShow' && (
                              <button
                                onClick={() => handleOpenReassign(apt)}
                                className="p-1.5 text-slate-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Reassign to another provider"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}

                          {/* Cancel (Allowed only before CheckedIn) */}
                          {(apt.status === 'Requested' || apt.status === 'Confirmed') && (
                            <button
                              onClick={() => {
                                setSelectedAptForCancel(apt);
                                setCancellationReason('');
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancel Appointment (requires reason)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {appointments.length > 0 ? (pagination.currentPage - 1) * pagination.limit + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalResults)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{pagination.totalResults}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAppointments(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchAppointments(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
        subtitle={`Patient: ${selectedAptForCancel?.patientName} | Slot: ${selectedAptForCancel?.slot?.date} ${selectedAptForCancel?.slot?.startTime}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
            <strong>Rule:</strong> Cancellation requires a clinical or administrative reason and is permanently recorded in the immutable audit timeline.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g., Patient requested rescheduling due to work conflict..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              disabled={!cancellationReason.trim() || actionLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Front Desk Reassign Provider Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title="Reassign Appointment to Provider"
        subtitle={`Current Provider: Dr. ${selectedAptForReassign?.schedulingProvider?.user?.name} | Patient: ${selectedAptForReassign?.patientName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Target Provider <span className="text-rose-500">*</span>
            </label>
            <select
              value={newProviderId}
              onChange={(e) => handleProviderSelectForReassign(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">-- Choose New Provider --</option>
              {providers
                .filter((p) => p.id !== selectedAptForReassign?.schedulingProviderId)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} — {p.specialty} ({p.department})
                  </option>
                ))}
            </select>
          </div>

          {newProviderId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Optional: Select New Slot for Target Provider
              </label>
              <select
                value={newSlotId}
                onChange={(e) => setNewSlotId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">Retain Current Date/Time ({selectedAptForReassign?.slot?.date} {selectedAptForReassign?.slot?.startTime})</option>
                {availableSlotsForReassign.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.date} from {s.startTime} to {s.endTime} ({s.duration}m)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReassign}
              disabled={!newProviderId || actionLoading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Appointments;
