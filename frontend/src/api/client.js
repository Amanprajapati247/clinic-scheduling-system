import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('care_sync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token and redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('care_sync_token');
        localStorage.removeItem('care_sync_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
