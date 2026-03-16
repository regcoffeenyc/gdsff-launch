import { Suspense, lazy, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import SportsPage from './pages/SportsPage'
import LeadershipPage from './pages/LeadershipPage'
import MembershipPage from './pages/MembershipPage'
import EventsPage from './pages/EventsPage'
import PartnersPage from './pages/PartnersPage'
import GalleryPage from './pages/GalleryPage'
import DocumentsPage from './pages/DocumentsPage'
import ContactPage from './pages/ContactPage'
import SearchPage from './pages/SearchPage'
import { siteContent } from './siteContent'

const SafetyConsentPage = lazy(() => import('./pages/SafetyConsentPage'))

export default function App() {
  const [language, setLanguage] = useState(() => {
    try {
      return window.localStorage.getItem('gdsff-language') ?? 'en'
    } catch {
      return 'en'
    }
  })
  const copy = siteContent[language] ?? siteContent.en
  const loadingLabel = language === 'ka' ? 'იტვირთება...' : 'Loading...'

  useEffect(() => {
    try {
      window.localStorage.setItem('gdsff-language', language)
    } catch {
      // Ignore storage failures and keep the in-memory preference for the session.
    }
  }, [language])

  return (
    <SiteLayout copy={copy} language={language} setLanguage={setLanguage}>
      <Suspense
        fallback={
          <div className="container page-section">
            <div className="feature-card">
              <span className="card-kicker">{copy.brand.shortName}</span>
              <p>{loadingLabel}</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage copy={copy} />} />
          <Route path="/about" element={<AboutPage copy={copy} />} />
          <Route path="/sports" element={<SportsPage copy={copy} />} />
          <Route path="/leadership" element={<LeadershipPage copy={copy} />} />
          <Route path="/membership" element={<MembershipPage copy={copy} />} />
          <Route path="/events" element={<EventsPage copy={copy} />} />
          <Route path="/partners" element={<PartnersPage copy={copy} />} />
          <Route path="/gallery" element={<GalleryPage copy={copy} />} />
          <Route path="/documents" element={<DocumentsPage copy={copy} />} />
          <Route path="/safety-consent" element={<SafetyConsentPage copy={copy} />} />
          <Route path="/contact" element={<ContactPage copy={copy} />} />
          <Route path="/search" element={<SearchPage copy={copy} />} />
        </Routes>
      </Suspense>
    </SiteLayout>
  )
}
