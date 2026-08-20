import { Routes, Route, useLocation } from 'react-router-dom'
import SiteLayout from './components/SiteLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import SportsPage from './pages/SportsPage'
import LeadershipPage from './pages/LeadershipPage'
import MembershipPage from './pages/MembershipPage'
import MembershipAdminPage from './pages/MembershipAdminPage'
import EventsPage from './pages/EventsPage'
import PartnersPage from './pages/PartnersPage'
import GalleryPage from './pages/GalleryPage'
import DocumentsPage from './pages/DocumentsPage'
import GlossaryPage from './pages/GlossaryPage'
import ContactPage from './pages/ContactPage'
import SearchPage from './pages/SearchPage'
import SupportPage from './pages/SupportPage'
import SafetyConsentPage from './pages/SafetyConsentPage'
import { siteContent } from './siteContent'

// Language now lives in the URL (/ka/... or /en/...), passed in as a prop
// by the entry (client: parsed from location; prerender: passed explicitly).
export default function App({ language = 'ka' }) {
  const location = useLocation()
  const copy = siteContent[language] ?? siteContent.ka

  // Switching language = full navigation to the same path under the other
  // prefix, so crawlers and users share identical URLs per language.
  const switchLanguage = (next) => {
    if (next === language) return
    try {
      window.localStorage.setItem('gdsff-language', next)
    } catch {
      // Ignore storage failures.
    }
    window.location.assign(`/${next}${location.pathname}${location.search}${location.hash}`)
  }

  return (
    <SiteLayout copy={copy} language={language} setLanguage={switchLanguage}>
      <Routes>
        <Route path="/" element={<HomePage copy={copy} />} />
        <Route path="/about" element={<AboutPage copy={copy} />} />
        <Route path="/sports" element={<SportsPage copy={copy} />} />
        <Route path="/leadership" element={<LeadershipPage copy={copy} />} />
        <Route path="/membership" element={<MembershipPage copy={copy} language={language} setLanguage={switchLanguage} />} />
        <Route path="/membership-admin" element={<MembershipAdminPage copy={copy} />} />
        <Route path="/events" element={<EventsPage copy={copy} />} />
        <Route path="/partners" element={<PartnersPage copy={copy} />} />
        <Route path="/support" element={<SupportPage copy={copy} />} />
        <Route path="/gallery" element={<GalleryPage copy={copy} />} />
        <Route path="/documents" element={<DocumentsPage copy={copy} />} />
        <Route path="/glossary" element={<GlossaryPage copy={copy} />} />
        <Route path="/safety-consent" element={<SafetyConsentPage copy={copy} />} />
        <Route path="/contact" element={<ContactPage copy={copy} />} />
        <Route path="/search" element={<SearchPage copy={copy} />} />
      </Routes>
    </SiteLayout>
  )
}
