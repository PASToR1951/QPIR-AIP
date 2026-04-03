export const auth = {
  getUser:    ()  => JSON.parse(sessionStorage.getItem('user') || 'null'),
  getExpiry:  ()  => parseInt(sessionStorage.getItem('tokenExpiry') || '0', 10),
  isExpired:  ()  => Date.now() / 1000 >= auth.getExpiry(),
  setSession: (user, exp) => {
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('tokenExpiry', String(exp));
  },
  clearSession: async () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tokenExpiry');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST', credentials: 'include'
      });
    } catch {
      // Ignore network errors on logout
    }
  }
};
