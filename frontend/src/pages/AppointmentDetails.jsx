import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { appointmentApi, visitNotesApi, authApi, timelineApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import TimelineViewer from '../components/TimelineViewer';
import Modal from '../components/Modal';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Users,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  Send,
  Ban
} from 'lucide-react';

export const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isFrontDesk, isProvider } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [providers, setProviders] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');

  // Add Supporting Provider state
  const [addSupportingModalOpen, setAddSupportingModalOpen] = useState(false);
  const [selectedSupportingProviderId, setSelectedSupportingProviderId] = useState('');

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const [aptRes, provRes, timeRes] = await Promise.all([
        appointmentApi.getAppointmentById(id),
        authApi.getProviders(),
        timelineApi.getTimeline(id),
      ]);

      if (aptRes.data.success) {
        setAppointment(aptRes.data.data);
      }
      if (provRes.data.success) {
        setProviders(provRes.data.data);
      }
      if (timeRes.data.success) {
        setTimeline(timeRes.data.data);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  // Handle Status Transition
  const handleTransition = async (targetStatus) => {
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await appointmentApi.updateStatus(id, targetStatus);
      if (res.data.success) {
        setSuccessMessage(`Appointment transitioned to ${targetStatus}`);
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || `Failed to transition status to ${targetStatus}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.cancelAppointment(id, cancellationReason);
      if (res.data.success) {
        setSuccessMessage('Appointment cancelled.');
        setCancelModalOpen(false);
        setCancellationReason('');
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Supporting Provider
  const handleAddSupporting = async () => {
    if (!selectedSupportingProviderId) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.addSupportingProvider(id, selectedSupportingProviderId);
      if (res.data.success) {
        setSuccessMessage('Supporting provider successfully added to care team.');
        setAddSupportingModalOpen(false);
        setSelectedSupportingProviderId('');
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add supporting provider');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Remove Supporting Provider
  const handleRemoveSupporting = async (providerId) => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await appointmentApi.removeSupportingProvider(id, providerId);
      if (res.data.success) {
        setSuccessMessage('Supporting provider removed.');
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove supporting provider');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Visit Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await visitNotesApi.createNote(id, newNoteContent);
      if (res.data.success) {
        setNewNoteContent('');
        setSuccessMessage('Visit note logged successfully.');
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add visit note');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Visit Note
  const handleUpdateNote = async (noteId) => {
    if (!editNoteContent.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await visitNotesApi.updateNote(noteId, editNoteContent);
      if (res.data.success) {
        setEditingNoteId(null);
        setEditNoteContent('');
        setSuccessMessage('Visit note updated.');
        fetchAppointmentDetails();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to edit visit note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading Clinical Case Details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-600 font-medium">Appointment record not found.</p>
        <Link to="/appointments" className="text-teal-600 text-xs font-semibold mt-2 inline-block">
          Return to Appointments
        </Link>
      </div>
    );
  }

  const isCareTeamMember =
    appointment.schedulingProviderId === user?.provider?.id ||
    appointment.supportingProviders?.some((sp) => sp.providerId === user?.provider?.id);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/appointments')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{appointment.patientName}</h1>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Case ID: <span className="font-mono">{appointment.id}</span>
            </p>
          </div>
        </div>

        {/* Workflow State Machine Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {appointment.status === 'Requested' && (
            <button
              onClick={() => handleTransition('Confirmed')}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Confirm Appointment
            </button>
          )}
          {appointment.status === 'Confirmed' && (
            <>
              <button
                onClick={() => handleTransition('CheckedIn')}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Check In Patient
              </button>
              <button
                onClick={() => handleTransition('NoShow')}
                disabled={submitting}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Mark No Show
              </button>
            </>
          )}
          {appointment.status === 'CheckedIn' && (
            <button
              onClick={() => handleTransition('Completed')}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Complete Visit
            </button>
          )}
          {(appointment.status === 'Requested' || appointment.status === 'Confirmed') && (
            <button
              onClick={() => {
                setCancellationReason('');
                setCancelModalOpen(true);
              }}
              disabled={submitting}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
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

      {/* Main Grid: Overview (8 cols) & Timeline (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Details, Care Team, Notes */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Patient & Schedule Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Appointment Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">Patient:</span> {appointment.patientName}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">Email:</span> {appointment.patientEmail}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span className="font-medium">Phone:</span> {appointment.patientPhone}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Date:</span> {appointment.slot?.date}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Time:</span> {appointment.slot?.startTime} – {appointment.slot?.endTime} ({appointment.slot?.duration} min)
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Status:</span> {appointment.status}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 block mb-1">Reason for Visit:</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {appointment.reasonForVisit}
              </p>
            </div>

            {appointment.cancellationReason && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                <strong>Cancellation Reason:</strong> {appointment.cancellationReason}
              </div>
            )}
          </div>

          {/* Card 2: Care Team (Primary & Supporting Providers) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Care Team
                </h2>
              </div>
              <button
                onClick={() => setAddSupportingModalOpen(true)}
                className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Supporting Provider</span>
              </button>
            </div>

            {/* Primary Scheduling Provider */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  MD
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {appointment.schedulingProvider?.user?.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {appointment.schedulingProvider?.specialty} ({appointment.schedulingProvider?.department})
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-teal-100 text-teal-800 rounded">
                Primary Provider
              </span>
            </div>

            {/* Supporting Providers List */}
            {appointment.supportingProviders && appointment.supportingProviders.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Supporting Consultants ({appointment.supportingProviders.length})
                </span>
                {appointment.supportingProviders.map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                      <div>
                        <span className="font-semibold text-slate-800">
                          {sp.provider?.user?.name}
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          ({sp.provider?.specialty})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveSupporting(sp.providerId)}
                      disabled={submitting}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove from care team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Clinical Visit Notes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Clinical Visit Notes
              </h2>
            </div>

            {/* Notes List (Chronological) */}
            <div className="space-y-3">
              {appointment.visitNotes?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl">
                  No clinical notes recorded yet for this appointment.
                </p>
              ) : (
                appointment.visitNotes?.map((note) => {
                  const isAuthor = user?.provider?.id === note.providerId;
                  const isEditing = editingNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {note.provider?.user?.name}
                          </span>
                          <span className="text-slate-400">
                            ({new Date(note.createdAt).toLocaleString()})
                          </span>
                        </div>
                        {isAuthor && !isEditing && (
                          <button
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditNoteContent(note.content);
                            }}
                            className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors"
                            title="Edit your visit note"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={editNoteContent}
                            onChange={(e) => setEditNoteContent(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              className="px-2.5 py-1 text-slate-600 text-xs font-medium hover:bg-slate-200 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={submitting}
                              className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Note Form (Only for Providers on Care Team) */}
            {isProvider && isCareTeamMember && (
              <form onSubmit={handleAddNote} className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Log New Clinical Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Type clinical observations, assessment, diagnosis, or treatment plan..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteContent.trim() || submitting}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Visit Note</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Immutable Audit Timeline (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-20">
            <TimelineViewer timeline={timeline} />
          </div>
        </div>
      </div>

      {/* Add Supporting Provider Modal */}
      <Modal
        isOpen={addSupportingModalOpen}
        onClose={() => setAddSupportingModalOpen(false)}
        title="Add Supporting Provider to Care Team"
        subtitle={`Patient: ${appointment.patientName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Provider to Add
            </label>
            <select
              value={selectedSupportingProviderId}
              onChange={(e) => setSelectedSupportingProviderId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">-- Choose Provider --</option>
              {providers
                .filter(
                  (p) =>
                    p.id !== appointment.schedulingProviderId &&
                    !appointment.supportingProviders?.some((sp) => sp.providerId === p.id)
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.name} — {p.specialty}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddSupportingModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSupporting}
              disabled={!selectedSupportingProviderId || submitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add to Care Team'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
        subtitle={`Patient: ${appointment.patientName}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="State reason for cancellation..."
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
              disabled={!cancellationReason.trim() || submitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentDetails;
