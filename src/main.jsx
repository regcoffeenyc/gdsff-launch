import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App'
import './index.css'

const LANGS = ['ka', 'en']

// Language prefix comes from the URL: /ka/... or /en/...
const match = window.location.pathname.match(/^\/(ka|en)(?=\/|$)/)
const lang = match ? match[1] : null

if (!lang) {
  // Server redirects handle this in production; this is the dev/fallback path.
  let preferred = 'ka'
  try {
    const stored = window.localStorage.getItem('gdsff-language')
    if (LANGS.includes(stored)) preferred = stored
  } catch {
    // Ignore storage failures.
  }
  const { pathname, search, hash } = window.location
  window.location.replace(`/${preferred}${pathname === '/' ? '/' : pathname}${search}${hash}`)
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter basename={`/${lang}`}>
        <App language={lang} />
        <Analytics />
        <SpeedInsights />
      </BrowserRouter>
    </React.StrictMode>,
  )
}
