import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const DEFAULT_LOGO = '/AIP-PIR-logo.webp';

export const BrandingContext = createContext({
  appLogo: DEFAULT_LOGO,
  reloadBranding: () => {},
});

export function BrandingProvider({ children }) {
  const [appLogo, setAppLogo] = useState(DEFAULT_LOGO);

  const reloadBranding = useCallback(async () => {
    try {
      const res = await api.get('/api/config');
      setAppLogo(res.data.app_logo ?? DEFAULT_LOGO);
    } catch {
      // Silently keep default on network failure.
    }
  }, []);

  useEffect(() => { reloadBranding(); }, [reloadBranding]);

  return (
    <BrandingContext.Provider value={{ appLogo, reloadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useAppLogo = () => useContext(BrandingContext).appLogo;
export const useReloadBranding = () => useContext(BrandingContext).reloadBranding;
