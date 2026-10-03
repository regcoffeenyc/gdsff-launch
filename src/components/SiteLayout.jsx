import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logoSrc } from '../siteAssets'
import BrandLockup from './BrandLockup'
import { buildSiteMenu, SiteMenuNavigation } from './FederationNavigation'
import { ChevronDownIcon, CloseIcon, SearchIcon } from './SiteIcons'
import { EmailLink, LocationLink, PhoneLink, SocialLinks } from './SiteMetaLinks'
import { getSearchUiCopy } from '../utils/siteSearch'
import RouteMetadata from '../seo/RouteMetadata'

function SearchForm({ className, copy, idPrefix, value, onChange, onSubmit }) {
  const inputId = `${idPrefix}-site-search`

  return (
    <form className={className} role="search" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        {copy.searchLabel}
      </label>

      <div className="site-search-field">
        <SearchIcon className="site-search-field-icon" />
        <input
          id={inputId}
          type="search"
          className="site-search-input"
          value={value}
          onChange={onChange}
          placeholder={copy.placeholder}
          autoComplete="off"
        />
        <button type="submit" className="site-search-submit" aria-label={copy.searchButton}>
          <SearchIcon className="site-search-submit-icon" />
        </button>
      </div>
    </form>
  )
}

export default function SiteLayout({ children, copy, language, setLanguage }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openSection, setOpenSection] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const menuButtonRef = useRef(null)
  const menuPanelRef = useRef(null)
  const menuCloseRef = useRef(null)
  const restoreMenuFocusRef = useRef(false)
  const location = useLocation()
  const navigate = useNavigate()
  const previousLocationKeyRef = useRef(location.key)
  const menuPages = useMemo(() => buildSiteMenu(copy), [copy])
  const searchCopy = useMemo(() => getSearchUiCopy(copy.locale), [copy.locale])
  const isGeorgian = copy.locale === 'ka-GE'
  const menuLabel = isGeorgian ? 'მენიუ' : 'Menu'
  const showLocation = copy.meta.showLocation !== false

  function closeMenu() {
    setMenuOpen(false)
    setOpenSection(null)
    restoreMenuFocusRef.current = true
  }

  useEffect(() => {
    setMenuOpen(false)
    setOpenSection(null)
    const isNavigation = previousLocationKeyRef.current !== location.key
    previousLocationKeyRef.current = location.key
    const hashId = location.hash.replace(/^#/, '')
    const frame = window.requestAnimationFrame(() => {
      const target = hashId ? document.getElementById(hashId) : null
      if (target) {
        // Put keyboard/screen-reader users at the selected section as well.
        target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
      } else {
        if (isNavigation) document.getElementById('main-content')?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'auto' })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [location.key, location.pathname, location.hash, location.search, language])

  useEffect(() => {
    if (location.pathname === '/search') {
      setSearchValue(new URLSearchParams(location.search).get('q') ?? '')
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!menuOpen) {
      // Wait until React has removed inert from the page before restoring focus.
      if (restoreMenuFocusRef.current) menuButtonRef.current?.focus({ preventScroll: true })
      restoreMenuFocusRef.current = false
      return
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    menuCloseRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
      }
      if (event.key !== 'Tab') return
      const controls = [...menuPanelRef.current.querySelectorAll('a[href], button, input, [tabindex="0"]')]
        .filter((element) => !element.disabled && !element.closest('[hidden]') && element.tabIndex >= 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || !menuPanelRef.current.contains(document.activeElement))) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !menuPanelRef.current.contains(document.activeElement))) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function handleSearchSubmit(event) {
    event.preventDefault()
    const query = searchValue.trim()
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
    closeMenu()
  }

  function languageButtons(className) {
    return (
      <div className={`language-toggle ${className}`} aria-label={copy.header.languageLabel}>
        {['en', 'ka'].map((next) => (
          <button key={next} type="button"
            className={language === next ? 'language-button active' : 'language-button'}
            aria-pressed={language === next}
            onClick={() => { closeMenu(); setLanguage(next) }}>
            {next.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="site-shell">
      <RouteMetadata language={language} />
      <div inert={menuOpen ? '' : undefined} aria-hidden={menuOpen || undefined}>
        <a href="#main-content" className="skip-link">{copy.header.skipLink}</a>
        <header className="site-header site-header-with-menu">
          <div className="site-topbar">
            <div className="container site-topbar-inner">
              <div className="topbar-contacts">
                <EmailLink email={copy.meta.email} className="topbar-contact-link" />
                <PhoneLink phone={copy.meta.phone} className="topbar-contact-link" />
                {showLocation ? <LocationLink href={copy.meta.locationHref} label={copy.meta.locationLabel} className="topbar-contact-link topbar-location-link" /> : null}
              </div>
              <div className="topbar-actions"><SocialLinks items={copy.meta.socials} className="topbar-socials" /></div>
            </div>
          </div>
          <div className="container header-main-row">
            <BrandLockup copy={copy} />
            <div className="header-actions">
              <SearchForm className="site-search-form desktop-search-form" copy={searchCopy}
                idPrefix="desktop" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} onSubmit={handleSearchSubmit} />
              {languageButtons('desktop-language-toggle')}
              <button ref={menuButtonRef} type="button" className="site-menu-toggle"
                aria-expanded={menuOpen} aria-controls="site-navigation" aria-haspopup="dialog"
                onClick={() => setMenuOpen((value) => !value)}>
                <span>{menuLabel}</span><ChevronDownIcon />
              </button>
            </div>
          </div>
        </header>
        <main id="main-content" tabIndex="-1">{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img src={logoSrc} alt="GDSFF logo" className="footer-logo" />
            <div>
              <h3>{copy.brand.fullName}</h3>
              <p className="footer-slogan">{copy.brand.slogan}</p>
              <p>{copy.footer.summary}</p>
              <p className="footer-note">{copy.footer.note}</p>
            </div>
          </div>

          <div>
            <h4>{copy.footer.focusTitle}</h4>
            <ul className="footer-list">
              {copy.footer.focusItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{copy.footer.contactTitle}</h4>
            <div className="footer-contact-links">
              <EmailLink email={copy.meta.email} className="footer-info-link" />
              <PhoneLink phone={copy.meta.phone} className="footer-info-link" />
              {showLocation ? (
                <LocationLink href={copy.meta.locationHref} label={copy.meta.locationLabel} className="footer-info-link" />
              ) : null}
            </div>
            <ul className="footer-list footer-support-list">
              {copy.footer.contactItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="footer-meta">
            <h4>{copy.footer.followTitle}</h4>
            {copy.footer.followText ? <p className="footer-follow-text">{copy.footer.followText}</p> : null}
            <SocialLinks items={copy.meta.socials} className="footer-socials" />
          </div>
        </div>
      </footer>
      </div>
      <div className="site-menu-overlay" hidden={!menuOpen}>
          <button type="button" className="site-menu-backdrop" tabIndex="-1" aria-label={copy.header.menuClose} onClick={closeMenu} />
          <div ref={menuPanelRef} id="site-navigation" className="site-menu-panel" role="dialog" aria-modal="true" aria-labelledby="site-menu-title">
            <div className="site-menu-header">
              <h2 id="site-menu-title">{menuLabel}</h2>
              {languageButtons('site-menu-language mobile-language-toggle')}
              <button ref={menuCloseRef} type="button" className="site-menu-close" aria-label={copy.header.menuClose} onClick={closeMenu}><CloseIcon /></button>
            </div>
            <div className="site-menu-scroll">
              <p className="site-menu-hint">{isGeorgian ? 'აირჩიეთ გვერდი ან გახსენით მისი განყოფილებები.' : 'Choose a page, or expand it to see its sections.'}</p>
              <SiteMenuNavigation pages={menuPages} location={location} openKey={openSection} setOpenKey={setOpenSection} closeMenu={closeMenu} ariaLabel={copy.header.mainNavigation} />
              <SearchForm className="site-search-form site-menu-search" copy={searchCopy}
                idPrefix="menu" value={searchValue} onChange={(event) => setSearchValue(event.target.value)} onSubmit={handleSearchSubmit} />
            </div>
          </div>
        </div>
    </div>
  )
}
