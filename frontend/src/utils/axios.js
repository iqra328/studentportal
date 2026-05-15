import axios from 'axios';

const API = axios.create({
  baseURL: 'https://studentportal-ut2r.onrender.com/api',  // ← Live backend URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;