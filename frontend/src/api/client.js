import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !localStorage.getItem('cy_on_login_page')) {
      localStorage.removeItem('cy_token');
      localStorage.removeItem('cy_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
