import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = (path) => `${API_URL}/api/${path}`;

const AUTH_ENDPOINTS = /\/api\/(login|register|verify-email|resend-code|forgot-password|reset-password)\//;

export const clearSession = () => {
    try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
    } catch { }
};

axios.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('auth_token');
        if (token && String(config.url || '').startsWith(API_URL)) {
            config.headers.Authorization = `Token ${token}`;
        }
    } catch { }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = String(error.config?.url || '');
        if (error.response?.status === 401 && !AUTH_ENDPOINTS.test(url)) {
            clearSession();
            window.location.reload();
        }
        return Promise.reject(error);
    },
);
