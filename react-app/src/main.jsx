import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { BrandingProvider } from './context/BrandingContext.jsx'
import NoConnectionScreen from './components/ui/NoConnectionScreen.jsx'
import { OnboardingProvider } from './hooks/useOnboarding.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'fill' }}>
      <BrandingProvider>
        <AccessibilityProvider>
          <OnboardingProvider>
            <NoConnectionScreen>
              <App />
            </NoConnectionScreen>
          </OnboardingProvider>
        </AccessibilityProvider>
      </BrandingProvider>
    </IconContext.Provider>
  </StrictMode>,
)
