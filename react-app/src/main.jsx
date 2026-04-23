// Safari does not support requestIdleCallback — polyfill before any deps load
if (typeof window !== 'undefined' && !window.requestIdleCallback) {
  window.requestIdleCallback = (cb, options) => {
    const start = Date.now();
    return setTimeout(() => {
      cb({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, options?.timeout ?? 1);
  };
  window.cancelIdleCallback = (id) => clearTimeout(id);
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { BrandingProvider } from './context/BrandingContext.jsx'
import NoConnectionScreen from './components/ui/NoConnectionScreen.jsx'
import { OnboardingProvider } from './hooks/useOnboarding.jsx'
import { PracticeModeProvider } from './context/PracticeModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'fill' }}>
      <BrandingProvider>
        <AccessibilityProvider>
          <OnboardingProvider>
            <PracticeModeProvider>
              <NoConnectionScreen>
                <App />
              </NoConnectionScreen>
            </PracticeModeProvider>
          </OnboardingProvider>
        </AccessibilityProvider>
      </BrandingProvider>
    </IconContext.Provider>
  </StrictMode>,
)
