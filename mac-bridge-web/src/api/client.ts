import axios from 'axios';

const bridgeUrl = import.meta.env.VITE_BRIDGE_URL || '';

export const apiClient = axios.create({
  baseURL: bridgeUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mac_bridge_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mac_bridge_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
