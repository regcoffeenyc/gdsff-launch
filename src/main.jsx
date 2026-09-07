import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App'
import './index.css'

const languageMatch = window.location.pathname.match(/^\/(ka|en)(?:\/|$)/)
const initialLanguage = languageMatch?.[1] ?? 'ka'
const basename = languageMatch ? `/${initialLanguage}` : undefined

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App initialLanguage={initialLanguage} />
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </React.StrictMode>,
)
