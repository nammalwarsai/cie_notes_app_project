import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add user email to requests (NO TOKEN - Just email)
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (user.email) {
      config.headers['x-user-email'] = user.email;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors (Simplified - no auth redirect)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============ AUTH API ============

export const authAPI = {
  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    // Store user info (no token needed)
    if (response.data.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // Store user info (no token needed)
    if (response.data.user) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getProfile: async (email) => {
    const response = await api.get('/auth/profile', { params: { email } });
    return response.data;
  },

  updatePassword: async (email, newPassword) => {
    const response = await api.put('/auth/password', { email, newPassword });
    return response.data;
  }
};

// ============ NOTES API ============

export const notesAPI = {
  getAllNotes: async () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const response = await api.get('/notes', { params: { email: user.email } });
    return response.data;
  },

  getNote: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  createNote: async (noteData) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const response = await api.post('/notes', { ...noteData, userEmail: user.email });
    return response.data;
  },

  updateNote: async (id, noteData) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const response = await api.put(`/notes/${id}`, { ...noteData, userEmail: user.email });
    return response.data;
  },

  deleteNote: async (id) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const response = await api.delete(`/notes/${id}`, { params: { email: user.email } });
    return response.data;
  }
};

// ============ STATS API ============

export const statsAPI = {
  getUserStats: async () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const response = await api.get('/stats', { params: { email: user.email } });
    return response.data;
  }
};

// ============ HEALTH CHECK ============

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
