import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const analyzeCode = (code, filename) => 
  api.post('/analyze', { code, filename });

export const analyzeFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getHistory = (page = 1, perPage = 20) =>
  api.get('/history', { params: { page, per_page: perPage } });

export const getScanDetail = (scanId) =>
  api.get(`/history/${scanId}`);

export const getStats = () =>
  api.get('/statistics');

export const getTrends = (days = 30) =>
  api.get('/trends', { params: { days } });

export const getDashboard = () =>
  api.get('/dashboard');

export const getReport = (requestId) =>
  api.get(`/report/${requestId}`);

export const register = (username, email, password) =>
  api.post('/register', { username, email, password });

export const login = (email, password) =>
  api.post('/login', { email, password });

export const getCurrentUser = () =>
  api.get('/me');

export const refreshToken = () =>
  api.post('/refresh');

export default api;
