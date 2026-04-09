import axios from 'axios';
import { getFriendlyError } from './errorMessages.js';

export const API = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

let redirectingForAuth = false;

function clearStoredSession() {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('tokenExpiry');
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const rawError = error.response?.data?.error;
    error.friendlyMessage = getFriendlyError(rawError);

    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/api/auth/login') &&
      !redirectingForAuth
    ) {
      redirectingForAuth = true;
      clearStoredSession();
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export default api;
