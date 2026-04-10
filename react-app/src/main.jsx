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
