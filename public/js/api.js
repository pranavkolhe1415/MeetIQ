/**
 * MeetIQ API Client
 * Handles all HTTP requests to the backend
 */
const API_BASE = '/api';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('meetiq_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('meetiq_token', token);
    else localStorage.removeItem('meetiq_token');
  }

  getToken() {
    return this.token || localStorage.getItem('meetiq_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...options.headers };

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          localStorage.removeItem('meetiq_user');
          if (typeof showAuth === 'function') showAuth('login');
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  get(endpoint) { return this.request(endpoint); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  async uploadFile(file, title, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/meetings/upload`);
      if (this.getToken()) xhr.setRequestHeader('Authorization', `Bearer ${this.getToken()}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.message || 'Upload failed'));
        } catch { reject(new Error('Upload failed')); }
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  }

  // Auth
  signup(data) { return this.post('/auth/signup', data); }
  login(data) { return this.post('/auth/login', data); }
  getProfile() { return this.get('/auth/profile'); }
  updateProfile(data) { return this.put('/auth/profile', data); }
  updatePassword(data) { return this.put('/auth/password', data); }
  updateSettings(data) { return this.put('/auth/settings', data); }

  // Meetings
  getDashboard() { return this.get('/meetings/dashboard'); }
  getMeetings(params = '') { return this.get(`/meetings${params ? '?' + params : ''}`); }
  getMeeting(id) { return this.get(`/meetings/${id}`); }
  analyzeMeeting(id) { return this.post(`/meetings/${id}/analyze`); }
  getProgress(id) { return this.get(`/meetings/${id}/progress`); }
  getReport(id) { return this.get(`/meetings/${id}/report`); }
  deleteMeeting(id) { return this.delete(`/meetings/${id}`); }
  downloadPDF(id) { return `${API_BASE}/meetings/${id}/pdf?token=${this.getToken()}`; }

  // Chat
  sendChat(meetingId, message) { return this.post('/chat', { meetingId, message }); }
  getChatHistory(meetingId) { return this.get(`/chat/${meetingId}`); }

  // Notifications
  getNotifications() { return this.get('/notifications'); }
  markNotificationRead(id) { return this.put(`/notifications/${id}/read`); }
  markAllRead() { return this.put('/notifications/all/read'); }
}

const api = new APIClient();
