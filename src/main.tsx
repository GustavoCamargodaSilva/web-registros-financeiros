import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { queryClient } from './api/queryClient'
import { AuthProvider } from './context/AuthContext'
import { CompetenciaProvider } from './context/CompetenciaContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/toast/ToastProvider'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <CompetenciaProvider>
                <App />
              </CompetenciaProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
