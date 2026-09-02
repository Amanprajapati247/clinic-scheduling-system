import React, { useEffect, useState } from 'react';
import { slotApi, scheduleApi, authApi, appointmentApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  Calendar,
  Clock,
  Plus,
  Repeat,
  Archive,
  RotateCcw,
  Edit2,
  CalendarCheck,
  Filter,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Trash2,
  CalendarPlus
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
  { id: 0, name: 'Sunday' },
];

export const SlotManagement = () => {
  const { user, isFrontDesk, isProvider } = useAuth();
  const [slots, setSlots] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterProvider, setFilterProvider] = useState(
    isProvider ? user?.provider?.id || '' : ''
  );
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, AVAILABLE, BOOKED, ARCHIVED

  // Create Single Slot Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSlotProviderId, setNewSlotProviderId] = useState(
    isProvider ? user?.provider?.id || '' : ''
  );
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
  const [newSlotDuration, setNewSlotDuration] = useState(30);

  // Edit Slot Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editDuration, setEditDuration] = useState(30);

  // Bulk Generator Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkProviderId, setBulkProviderId] = useState(
    isProvider ? user?.provider?.id || '' : ''
  );
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [bulkSchedules, setBulkSchedules] = useState([
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
    { dayOfWeek: 3, startTime: '14:00', endTime: '18:00', slotDuration: 30 },
  ]);

  // Book Appointment Modal (Fast Booking directly on slot)
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await authApi.getProviders();
        if (res.data.success) {
          setProviders(res.data.data);
          if (isProvider && user?.provider?.id) {
            setFilterProvider(user.provider.id);
            setNewSlotProviderId(user.provider.id);
            setBulkProviderId(user.provider.id);
          }
        }
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };
    fetchProviders();
  }, [isProvider, user]);

  // Fetch Slots
  const fetchSlots = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const params = {};
      if (filterProvider) params.providerId = filterProvider;
      if (filterDate) params.date = filterDate;

      if (filterStatus === 'AVAILABLE') {
        params.isBooked = false;
        params.isArchived = false;
      } else if (filterStatus === 'BOOKED') {
        params.isBooked = true;
      } else if (filterStatus === 'ARCHIVED') {
        params.isArchived = true;
      }

      const res = await slotApi.getSlots(params);
      if (res.data.success) {
        setSlots(res.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load availability slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [filterProvider, filterDate, filterStatus]);

  // Handle Create Slot
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await slotApi.createSlot({
        providerId: newSlotProviderId,
        date: newSlotDate,
        startTime: newSlotStartTime,
        duration: Number(newSlotDuration),
      });
      if (res.data.success) {
        setSuccessMessage('Availability slot created successfully.');
        setCreateModalOpen(false);
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Slot Modal
  const handleOpenEdit = (slot) => {
    setSelectedSlotForEdit(slot);
    setEditDate(slot.date);
    setEditStartTime(slot.startTime);
    setEditDuration(slot.duration);
    setEditModalOpen(true);
  };

  // Handle Update Slot
  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!selectedSlotForEdit) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await slotApi.updateSlot(selectedSlotForEdit.id, {
        date: editDate,
        startTime: editStartTime,
        duration: Number(editDuration),
      });
      if (res.data.success) {
        setSuccessMessage('Slot details updated successfully.');
        setEditModalOpen(false);
        setSelectedSlotForEdit(null);
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update slot');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Archive Slot
  const handleArchive = async (slotId) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await slotApi.archiveSlot(slotId);
      if (res.data.success) {
        setSuccessMessage('Slot archived.');
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to archive slot');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Restore Slot
  const handleRestore = async (slotId) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await slotApi.restoreSlot(slotId);
      if (res.data.success) {
        setSuccessMessage('Slot restored to active pool.');
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to restore slot');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Bulk Generation
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await scheduleApi.generateBulkSlots({
        providerId: bulkProviderId,
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        schedules: bulkSchedules,
      });
      if (res.data.success) {
        setSuccessMessage(
          `Generated ${res.data.data.createdSlots} slots (${res.data.data.skippedSlots} skipped collisions)`
        );
        setBulkModalOpen(false);
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Bulk generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const addBulkScheduleRow = () => {
    setBulkSchedules([
      ...bulkSchedules,
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotDuration: 30 },
    ]);
  };

  const removeBulkScheduleRow = (idx) => {
    setBulkSchedules(bulkSchedules.filter((_, i) => i !== idx));
  };

  const updateBulkScheduleRow = (idx, field, value) => {
    const updated = [...bulkSchedules];
    updated[idx][field] = field === 'dayOfWeek' || field === 'slotDuration' ? Number(value) : value;
    setBulkSchedules(updated);
  };

  // Handle Direct Fast Booking
  const handleDirectBook = async (e) => {
    e.preventDefault();
    if (!selectedSlotForBooking) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.createAppointment({
        slotId: selectedSlotForBooking.id,
        patientName,
        patientEmail,
        patientPhone,
        reasonForVisit,
      });
      if (res.data.success) {
        setSuccessMessage(`Appointment successfully scheduled for ${patientName}`);
        setBookModalOpen(false);
        setSelectedSlotForBooking(null);
        setPatientName('');
        setPatientEmail('');
        setPatientPhone('');
        setReasonForVisit('');
        fetchSlots();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Provider Availability Slots
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, edit unbooked slots, archive/restore, or generate bulk recurring schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setBulkModalOpen(true);
              setErrorMessage('');
            }}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Repeat className="w-4 h-4 text-indigo-600" />
            <span>Bulk Recurring Generator</span>
          </button>

          <button
            onClick={() => {
              setCreateModalOpen(true);
              setErrorMessage('');
            }}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Slot</span>
          </button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
        {isFrontDesk && (
          <div className="sm:col-span-4">
            <label className="block text-slate-500 font-semibold mb-1">Filter Provider</label>
            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">All Clinical Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.name} ({p.specialty})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={isFrontDesk ? 'sm:col-span-4' : 'sm:col-span-6'}>
          <label className="block text-slate-500 font-semibold mb-1">Filter Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div className={isFrontDesk ? 'sm:col-span-4' : 'sm:col-span-6'}>
          <label className="block text-slate-500 font-semibold mb-1">Slot Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            <option value="ALL">All Slots (Active & Archived)</option>
            <option value="AVAILABLE">Available (Open for Booking)</option>
            <option value="BOOKED">Booked (Linked to Appointment)</option>
            <option value="ARCHIVED">Archived Slots</option>
          </select>
        </div>
      </div>

      {/* Slots Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading availability slots...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No availability slots found.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "Add Single Slot" or use the "Bulk Recurring Generator" to create slots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => {
            const isBooked = slot.isBooked || slot.appointment;
            const isArchived = slot.isArchived;

            return (
              <div
                key={slot.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isArchived
                    ? 'bg-slate-100/80 border-slate-200 opacity-70'
                    : isBooked
                    ? 'bg-teal-50/40 border-teal-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {slot.provider?.user?.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {slot.provider?.specialty}
                    </div>
                  </div>

                  {isArchived ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Archived
                    </span>
                  ) : isBooked ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                      Booked
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Open
                    </span>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{slot.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {slot.startTime} – {slot.endTime}
                    </span>
                  </div>
                </div>

                {slot.appointment && (
                  <div className="mt-2.5 p-2 bg-white rounded-lg border border-teal-100 text-[11px]">
                    <span className="font-semibold text-slate-700">Patient: </span>
                    <span className="text-slate-900 font-bold">{slot.appointment.patientName}</span>
                    <span className="ml-1 text-[10px] text-teal-700">({slot.appointment.status})</span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {slot.duration} min slot
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* If Open: can Book patient or Edit */}
                    {!isBooked && !isArchived && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedSlotForBooking(slot);
                            setBookModalOpen(true);
                          }}
                          className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-semibold transition-colors"
                        >
                          Book
                        </button>
                        <button
                          onClick={() => handleOpenEdit(slot)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          title="Edit unbooked slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchive(slot.id)}
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded"
                          title="Archive slot"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {/* If Archived: can Restore */}
                    {isArchived && (
                      <button
                        onClick={() => handleRestore(slot.id)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Single Slot Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Single Availability Slot"
      >
        <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
          {isFrontDesk ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provider</label>
              <select
                required
                value={newSlotProviderId}
                onChange={(e) => setNewSlotProviderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">-- Choose Provider --</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} ({p.specialty})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              Provider: <strong>{user?.name}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time (24h)</label>
              <input
                type="time"
                required
                value={newSlotStartTime}
                onChange={(e) => setNewSlotStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={10}
              max={240}
              step={5}
              required
              value={newSlotDuration}
              onChange={(e) => setNewSlotDuration(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {submitting ? 'Creating...' : 'Create Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Slot Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Unbooked Slot"
      >
        <form onSubmit={handleUpdateSlot} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
            Slots can be modified only while unbooked.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Duration (minutes)</label>
            <input
              type="number"
              min={10}
              max={240}
              step={5}
              required
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Bulk Generator Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title="Bulk Recurring Availability Generator"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-900">
            <strong>Collision Prevention:</strong> The system automatically evaluates all existing slots across the target date range and skips any colliding time intervals.
          </div>

          {isFrontDesk ? (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provider</label>
              <select
                required
                value={bulkProviderId}
                onChange={(e) => setBulkProviderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">-- Choose Provider --</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} ({p.specialty})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              Generating for: <strong>{user?.name}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={bulkStartDate}
                onChange={(e) => setBulkStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={bulkEndDate}
                onChange={(e) => setBulkEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Weekly Schedule Rules */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider">
                Weekly Schedule Days & Hours
              </span>
              <button
                type="button"
                onClick={addBulkScheduleRow}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Day</span>
              </button>
            </div>

            {bulkSchedules.map((row, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[10px] font-semibold text-slate-500">Day</label>
                  <select
                    value={row.dayOfWeek}
                    onChange={(e) => updateBulkScheduleRow(idx, 'dayOfWeek', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500">Start Time</label>
                  <input
                    type="time"
                    required
                    value={row.startTime}
                    onChange={(e) => updateBulkScheduleRow(idx, 'startTime', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-semibold text-slate-500">End Time</label>
                  <input
                    type="time"
                    required
                    value={row.endTime}
                    onChange={(e) => updateBulkScheduleRow(idx, 'endTime', e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-end pt-3 sm:pt-0">
                  {bulkSchedules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBulkScheduleRow(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !bulkProviderId || !bulkStartDate || !bulkEndDate}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Generating Recurring Slots...' : 'Generate Slots'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title="Book Patient on Selected Slot"
        subtitle={`Provider: ${selectedSlotForBooking?.provider?.user?.name} | Slot: ${selectedSlotForBooking?.date} at ${selectedSlotForBooking?.startTime}`}
      >
        <form onSubmit={handleDirectBook} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Visit <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="Reason for visit or clinical complaints..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setBookModalOpen(false)}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !patientName || !patientEmail || !reasonForVisit}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SlotManagement;
