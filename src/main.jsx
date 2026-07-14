import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StudyProvider } from './context/StudyContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StudyProvider>
      <App />
    </StudyProvider>
  </StrictMode>,
)
