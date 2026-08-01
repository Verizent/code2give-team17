import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SiteProvider } from '@/components/site-provider'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AuthTokenBridge } from '@/features/auth/AuthTokenBridge'
import App from '@/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SiteProvider>
        <AuthProvider>
          <AuthTokenBridge />
          <App />
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  </StrictMode>,
)
