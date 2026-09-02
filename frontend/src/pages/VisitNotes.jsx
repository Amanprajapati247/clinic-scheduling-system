import React, { useEffect, useState } from 'react';
import { appointmentApi, visitNotesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  FileText,
  Calendar,
  User,
  Clock,
  Send,
  Edit2,
  CheckCircle,
  AlertCircle,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const VisitNotes = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingApts, setLoadingApts] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch provider's active/completed appointments
  useEffect(() => {
    const fetchApts = async () => {
      try {
        setLoadingApts(true);
        const res = await appointmentApi.searchAppointments({
          limit: 50,
          sortBy: 'date',
          sortOrder: 'desc',
        });
        if (res.data.success) {
          setAppointments(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedAppointment(res.data.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoadingApts(false);
      }
    };
    fetchApts();
  }, []);

  // Fetch notes for selected appointment
  const fetchNotes = async (aptId) => {
    try {
      setLoadingNotes(true);
      const res = await visitNotesApi.getNotes(aptId);
      if (res.data.success) {
        setNotes(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (selectedAppointment) {
      fetchNotes(selectedAppointment.id);
    }
  }, [selectedAppointment]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedAppointment || !newNoteContent.trim()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await visitNotesApi.createNote(selectedAppointment.id, newNoteContent);
      if (res.data.success) {
        setNewNoteContent('');
        setSuccessMessage('Visit note added successfully.');
        fetchNotes(selectedAppointment.id);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

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
        fetchNotes(selectedAppointment.id);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to edit visit note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Clinical Visit Notes Console
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Author and review longitudinal patient visit records. Notes are editable only by the author provider.
        </p>
      </div>

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

      {/* 2-Column Split: Appointment Selector & Notes Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Appointment Cases (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Select Patient Visit ({appointments.length})
          </h2>

          {loadingApts ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading cases...</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {appointments.map((apt) => {
                const isSelected = selectedAppointment?.id === apt.id;
                return (
                  <button
                    key={apt.id}
                    onClick={() => setSelectedAppointment(apt)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-300 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{apt.patientName}</span>
                      <StatusBadge status={apt.status} size="sm" />
                    </div>

                    <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{apt.slot?.date} at {apt.slot?.startTime}</span>
                      <span className="text-purple-600 font-medium">
                        {apt._count?.visitNotes || 0} note(s)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Notes Feed and Editor (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {selectedAppointment ? (
            <>
              {/* Active Appointment Header */}
              <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedAppointment.patientName}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{selectedAppointment.slot?.date}</span>
                    <span>•</span>
                    <span>{selectedAppointment.slot?.startTime} ({selectedAppointment.slot?.duration}m)</span>
                    <span>•</span>
                    <span>Reason: {selectedAppointment.reasonForVisit}</span>
                  </div>
                </div>

                <Link
                  to={`/appointments/${selectedAppointment.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Full Case</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Chronological Notes Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Chronological Clinical Record</span>
                  <span className="text-slate-400 font-normal">Ordered by creation time</span>
                </div>

                {loadingNotes ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading notes...</div>
                ) : notes.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No visit notes recorded for this patient encounter yet.
                  </div>
                ) : (
                  notes.map((note) => {
                    const isAuthor = user?.provider?.id === note.providerId;
                    const isEditing = editingNoteId === note.id;

                    return (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
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
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateNote(note.id)}
                                disabled={submitting}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold"
                              >
                                Save Changes
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

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="pt-4 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Author New Visit Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record clinical summary, patient progress, or follow-up instructions..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none text-xs"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteContent.trim() || submitting}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Select an appointment on the left to review and author visit notes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitNotes;
