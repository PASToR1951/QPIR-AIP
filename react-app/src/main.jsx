import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import App from './App.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import NoConnectionScreen from './components/ui/NoConnectionScreen.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'fill' }}>
      <AccessibilityProvider>
        <NoConnectionScreen>
          <App />
        </NoConnectionScreen>
      </AccessibilityProvider>
    </IconContext.Provider>
  </StrictMode>,
)
