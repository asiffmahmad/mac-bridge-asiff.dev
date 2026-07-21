import axios from 'axios';
import { useSettingsStore } from '../store/settings';
import { useAuthStore } from '../store/auth';

export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically set baseURL and add JWT
apiClient.interceptors.request.use(
  (config) => {
    // Dynamically pull baseURL from settings store instead of static VITE_BRIDGE_URL
    const { bridgeUrl } = useSettingsStore.getState();
    config.baseURL = bridgeUrl;

    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept refresh token request itself
      if (originalRequest.url.includes('/api/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, updateTokens, logout } = useAuthStore.getState();
      const { bridgeUrl } = useSettingsStore.getState();

      if (!refreshToken) {
        isRefreshing = false;
        logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${bridgeUrl}/api/auth/refresh`, {
          refreshToken
        });
        
        updateTokens(data.token, data.refreshToken);
        
        processQueue(null, data.token);
        isRefreshing = false;
        
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axios(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
