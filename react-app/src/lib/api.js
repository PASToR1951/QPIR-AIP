import axios from 'axios';
import { API_BASE_URL } from './apiBase.js';
import { getFriendlyError } from './errorMessages.js';
import { auth } from './auth.js';

export const API = API_BASE_URL;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

let redirectingForAuth = false;

function clearStoredSession() {
  auth.clearBrowserSession({ clearDrafts: false });
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
