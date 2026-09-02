import api from './client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  getProviders: () => api.get('/auth/providers'),
};

export const appointmentApi = {
  searchAppointments: (params) => api.get('/appointments', { params }),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  createAppointment: (data) => api.post('/appointments', data),
  updateStatus: (id, status, cancellationReason) =>
    api.patch(`/appointments/${id}/status`, { status, cancellationReason }),
  cancelAppointment: (id, cancellationReason) =>
    api.post(`/appointments/${id}/cancel`, { cancellationReason }),
  reassignProvider: (id, newProviderId, newSlotId) =>
    api.post(`/appointments/${id}/reassign`, { newProviderId, newSlotId }),
  addSupportingProvider: (id, providerId) =>
    api.post(`/appointments/${id}/supporting-providers`, { providerId }),
  removeSupportingProvider: (id, providerId) =>
    api.delete(`/appointments/${id}/supporting-providers/${providerId}`),
};

export const slotApi = {
  getSlots: (params) => api.get('/slots', { params }),
  createSlot: (data) => api.post('/slots', data),
  updateSlot: (id, data) => api.patch(`/slots/${id}`, data),
  archiveSlot: (id) => api.patch(`/slots/${id}/archive`),
  restoreSlot: (id) => api.patch(`/slots/${id}/restore`),
};

export const scheduleApi = {
  generateBulkSlots: (data) => api.post('/schedule/bulk-generate', data),
  exportDailyScheduleCSV: async (date, providerId) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (providerId) params.append('providerId', providerId);

    const response = await api.get(`/schedule/export-csv?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-schedule-${date || 'today'}${providerId ? `-${providerId}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

export const visitNotesApi = {
  getNotes: (appointmentId) => api.get(`/notes/appointment/${appointmentId}`),
  createNote: (appointmentId, content) =>
    api.post(`/notes/appointment/${appointmentId}`, { content }),
  updateNote: (noteId, content) =>
    api.patch(`/notes/${noteId}`, { content }),
};

export const timelineApi = {
  getTimeline: (appointmentId) => api.get(`/timeline/${appointmentId}`),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
};

export const alertApi = {
  getActiveAlerts: () => api.get('/alerts'),
  dismissAlert: (appointmentId, alertType) =>
    api.post('/alerts/dismiss', { appointmentId, alertType }),
};
