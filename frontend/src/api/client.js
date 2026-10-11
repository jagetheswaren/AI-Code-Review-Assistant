import axios from 'axios';
import { getErrorMessage } from '../utils/errorUtils';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
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
    const message = getErrorMessage(error, 'API request failed.');
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      const publicPaths = ['/', '/landing', '/review'];
      if (!publicPaths.includes(window.location.pathname)) {
        const destination = encodeURIComponent(window.location.pathname);
        window.location.href = `/?authRequired=1&destination=${destination}`;
      }
    }
    const normalized = new Error(message);
    normalized.name = error.name || 'ApiError';
    normalized.response = error.response;
    normalized.status = error.response?.status;
    normalized.code = error.code;
    return Promise.reject(normalized);
  }
);

export const analyzeCode = (code, filename) =>
  api.post('/analyze', { code, filename });

export const claimScan = (requestId) =>
  api.post(`/scan/${requestId}/claim`);

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

export const getGitHubStatus = () =>
  api.get('/github/status');

export const getGitHubAuthUrl = () =>
  api.get('/github/oauth/authorize').then(res => res.data);

export const getGitHubOAuthUrl = getGitHubAuthUrl;

export const getGitHubRepos = () =>
  api.get('/github/repos');

export const connectGitHubPAT = (token) =>
  api.post('/github/pat/connect', { token });

export const disconnectGitHub = () =>
  api.post('/github/disconnect');

export const getRepoInfo = (repoFullName) =>
  api.get(`/github/repos/${repoFullName}`);

export const getRepoBranches = (repoFullName) =>
  api.get(`/github/repos/${repoFullName}/branches`);

export const getRepoPullRequests = (repoFullName) =>
  api.get(`/github/repos/${repoFullName}/pull-requests`);

export const getPRDetails = (repoFullName, prNumber) =>
  api.get(`/github/repos/${repoFullName}/pull-requests/${prNumber}`);

export const getPRFiles = (repoFullName, prNumber) =>
  api.get(`/github/repos/${repoFullName}/pull-requests/${prNumber}/files`);

export const analyzePullRequest = (repoFullName, prNumber, postComment = false) =>
  api.post(`/github/repos/${repoFullName}/pull-requests/${prNumber}/analyze`, { post_comment: postComment })
    .then(res => res.data);

export const postPRComment = (repoFullName, prNumber) =>
  api.post(`/github/repos/${repoFullName}/pull-requests/${prNumber}/comment`);

export const getNotifications = (params = {}) =>
  api.get('/notifications', { params });

export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all');

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`);

export const getSettings = () =>
  api.get('/settings');

export const updateSettings = (data) =>
  api.put('/settings', data);

export const getProfile = () =>
  api.get('/profile');

export const updateProfile = (data) =>
  api.put('/profile', data);

export const changePassword = (current_password, new_password) =>
  api.put('/profile/password', { current_password, new_password });

export const deleteAccount = () =>
  api.delete('/account', { data: { confirm: true } });

export const exportJSON = (scanId) =>
  api.get(`/export/json/${scanId}`, { responseType: 'blob' });

export const exportCSV = (scanId) =>
  api.get(`/export/csv/${scanId}`, { responseType: 'blob' });

export const exportPDF = (scanId) =>
  api.get(`/export/pdf/${scanId}`, { responseType: 'blob' });

export const getAiStatus = () =>
  api.get('/ai/status');

export const reloadMlModel = () =>
  api.post('/admin/model/reload');

export default api;
