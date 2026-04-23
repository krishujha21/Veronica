import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const client = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('veronica_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => client.post('/api/auth/login', { email, password }),
  register: (email, password, username) => client.post('/api/auth/register', { email, password, username }),
  getMe: () => client.get('/api/auth/me'),
};

export const chatAPI = {
  send: (message, history, model, systemPrompt, temperature, attachments = [], useWebSearch = false) =>
    client.post('/api/chat', { message, history, model, systemPrompt, temperature, attachments, useWebSearch }),
  streamUrl: `${BASE}/api/chat/stream`,
  system: () => client.get('/api/system')
};

export const memoryAPI = {
  get: () => client.get('/api/memory'),
  save: (bio) => client.post('/api/memory', { bio }),
  clear: () => client.delete('/api/memory'),
};

export const tasksAPI = {
  list: () => client.get('/api/tasks'),
  create: (text, priority = 'medium') => client.post('/api/tasks', { text, priority }),
  toggle: (id, completed) => client.patch(`/api/tasks/${id}`, { completed }),
  update: (id, data) => client.patch(`/api/tasks/${id}`, data),
  remove: (id) => client.delete(`/api/tasks/${id}`),
};

export const weatherAPI = {
  get: () => client.get('/api/weather'),
};

export const notesAPI = {
  list: () => client.get('/api/notes'),
  create: (content, title = '', color = 'yellow') => client.post('/api/notes', { content, title, color }),
  remove: (id) => client.delete(`/api/notes/${id}`),
  search: (q) => client.get(`/api/notes/search?q=${encodeURIComponent(q)}`),
};

export const sandboxAPI = {
  run: (code, language) => client.post('/api/sandbox/run', { code, language }, { timeout: 15000 }),
};

export const searchAPI = {
  query: (q) => client.get(`/api/search?q=${encodeURIComponent(q)}`),
};

export default client;
