import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logoSrc } from '../siteAssets'
import BrandLockup from './BrandLockup'
import { buildFederationNav, DesktopFederationNav, isGroupActive, MobileFederationNav } from './FederationNavigation'
import { CloseIcon, SearchIcon } from './SiteIcons'
import { EmailLink, LocationLink, PhoneLink, SocialLinks } from './SiteMetaLinks'
import { getSearchUiCopy } from '../utils/siteSearch'

const pageLabelKeys = {
  '/about': 'about',
  '/sports': 'sports',
  '/leadership': 'leadership',
  '/membership': 'membership',
  '/events': 'events',
  '/partners': 'partners',
  '/support': 'support',
  '/gallery': 'gallery',
  '/documents': 'documents',
  '/safety-consent': 'safetyConsent',
  '/contact': 'contact',
  '/social-hub': 'socialHub',
  '/media-bot': 'socialHub',
  '/search': 'search',
}

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
  const [openDesktopMenu, setOpenDesktopMenu] = useState(null)
  const [openMobileSection, setOpenMobileSection] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const headerRef = useRef(null)
  const desktopCloseTimerRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const navGroups = useMemo(() => buildFederationNav(copy), [copy])
  const searchCopy = useMemo(() => getSearchUiCopy(copy.locale), [copy.locale])
  const socialHubLabel = copy.locale === 'ka-GE' ? 'სოციალური მართვის ცენტრი' : 'Social Hub'
  const showLocation = copy.meta.showLocation !== false

  const clearDesktopCloseTimer = () => {
    if (desktopCloseTimerRef.current) {
      window.clearTimeout(desktopCloseTimerRef.current)
      desktopCloseTimerRef.current = null
    }
  }

  const openDesktopMenuNow = (key) => {
    clearDesktopCloseTimer()
    setOpenDesktopMenu(key)
  }

  const queueDesktopMenuClose = (key, delay = 180) => {
    clearDesktopCloseTimer()
    desktopCloseTimerRef.current = window.setTimeout(() => {
      setOpenDesktopMenu((current) => (current === key ? null : current))
      desktopCloseTimerRef.current = null
    }, delay)
  }

  const closeDesktopMenuNow = () => {
    clearDesktopCloseTimer()
    setOpenDesktopMenu(null)
  }

  const closeMobileMenu = () => {
    setMenuOpen(false)
    setOpenMobileSection(null)
  }

  useEffect(() => {
    closeMobileMenu()
    closeDesktopMenuNow()

    const hashId = location.hash.replace(/^#/, '')
    const scrollFrame = window.requestAnimationFrame(() => {
      if (hashId) {
        const target = document.getElementById(hashId)

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return
        }
      }

      window.scrollTo({ top: 0, behavior: 'auto' })
    })

    return () => {
      window.cancelAnimationFrame(scrollFrame)
    }
  }, [location.hash, location.pathname])

  useEffect(() => {
    closeDesktopMenuNow()
    closeMobileMenu()
  }, [language])

  useEffect(() => {
    if (location.pathname !== '/search') {
      return
    }

    const params = new URLSearchParams(location.search)
    setSearchValue(params.get('q') ?? '')
  }, [location.pathname, location.search])

  useEffect(() => {
    document.documentElement.lang = language === 'ka' ? 'ka' : 'en'

    const routeLabelKey = pageLabelKeys[location.pathname]
    const routeLabel =
      routeLabelKey === 'socialHub'
        ? socialHubLabel
        : routeLabelKey === 'search'
        ? searchCopy.navLabel
        : routeLabelKey
          ? copy.nav[routeLabelKey]
          : copy.brand.shortName
    const title =
      location.pathname === '/'
        ? `${copy.brand.shortName} | ${copy.brand.fullName}`
        : `${routeLabel} | ${copy.brand.shortName}`

    document.title = title

    const descriptionTag = document.querySelector('meta[name="description"]')
    if (descriptionTag) {
      descriptionTag.setAttribute('content', copy.footer.summary)
    }

    const themeTag = document.querySelector('meta[name="theme-color"]')
    if (themeTag) {
      themeTag.setAttribute('content', '#0d0f12')
    }
  }, [copy, language, location.pathname, searchCopy.navLabel, socialHubLabel])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    document.body.classList.toggle('mobile-menu-active', menuOpen)

    return () => {
      document.body.style.overflow = ''
      document.body.classList.remove('mobile-menu-active')
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen || openMobileSection) {
      return
    }

    const activeGroup = navGroups.find((group) => isGroupActive(group, location))
    setOpenMobileSection(activeGroup?.key ?? navGroups[0]?.key ?? null)
  }, [location, menuOpen, navGroups, openMobileSection])

  useEffect(() => {
    return () => {
      clearDesktopCloseTimer()
    }
  }, [])

  useEffect(() => {
    if (!openDesktopMenu) {
      return
    }

    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) {
        closeDesktopMenuNow()
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        closeDesktopMenuNow()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openDesktopMenu])

  function handleSearchSubmit(event, onComplete) {
    event.preventDefault()

    const nextQuery = searchValue.trim()
    navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/search')
    onComplete?.()
  }

  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">
        {copy.header.skipLink}
      </a>

      <header ref={headerRef} className={menuOpen ? 'site-header is-mobile-menu-open' : 'site-header'}>
        <div className="site-topbar">
          <div className="container site-topbar-inner">
            <div className="topbar-contacts">
              <EmailLink email={copy.meta.email} className="topbar-contact-link" />
              <PhoneLink phone={copy.meta.phone} className="topbar-contact-link" />
              {showLocation ? (
                <LocationLink
                  href={copy.meta.locationHref}
                  label={copy.meta.locationLabel}
                  className="topbar-contact-link topbar-location-link"
                />
              ) : null}
            </div>

            <div className="topbar-actions">
              <SocialLinks items={copy.meta.socials} className="topbar-socials" />
            </div>
          </div>
        </div>

        <div className="container header-main-row">
          <BrandLockup copy={copy} />

          <div className="header-actions">
            <SearchForm
              className="site-search-form desktop-search-form"
              copy={searchCopy}
              idPrefix="desktop"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onSubmit={(event) => handleSearchSubmit(event)}
            />

            <Link className="header-utility-link desktop-utility header-calendar-link" to="/events#calendar-2026">
              {copy.header.quickAction}
            </Link>

            <div className="language-toggle desktop-language-toggle" aria-label={copy.header.languageLabel}>
              <button
                type="button"
                className={language === 'en' ? 'language-button active' : 'language-button'}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={language === 'ka' ? 'language-button active' : 'language-button'}
                onClick={() => setLanguage('ka')}
              >
                KA
              </button>
            </div>

            <button
              type="button"
              className={menuOpen ? 'nav-toggle is-open' : 'nav-toggle'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? copy.header.menuClose : copy.header.menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? (
                <CloseIcon className="nav-toggle-icon" />
              ) : (
                <>
                  <span />
                  <span />
                  <span />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="header-nav-row">
          <div className="container header-nav-shell">
            <DesktopFederationNav
              groups={navGroups}
              location={location}
              openKey={openDesktopMenu}
              openMenu={openDesktopMenuNow}
              queueCloseMenu={queueDesktopMenuClose}
              closeMenu={closeDesktopMenuNow}
              ariaLabel={copy.header.mainNavigation}
            />
          </div>
        </div>

        <div
          id="mobile-navigation"
          className={menuOpen ? 'mobile-drawer is-open' : 'mobile-drawer'}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label={copy.header.menuClose}
            onClick={closeMobileMenu}
          />

          <div className="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label={copy.header.mobileNavigation}>
            <div className="mobile-drawer-header">
              <div>
                <div className="season-badge">{copy.header.seasonBadge}</div>
                <div className="mobile-drawer-kicker">{copy.brand.shortName}</div>
                <div className="mobile-drawer-title">{copy.brand.fullName}</div>
              </div>

              <button
                type="button"
                className="mobile-drawer-close"
                aria-label={copy.header.menuClose}
                onClick={closeMobileMenu}
              >
                <CloseIcon className="nav-toggle-icon" />
              </button>
            </div>

            <MobileFederationNav
              groups={navGroups}
              location={location}
              openKey={openMobileSection}
              setOpenKey={setOpenMobileSection}
              closeMenu={closeMobileMenu}
              ariaLabel={copy.header.mobileNavigation}
            />

            <div className="mobile-drawer-tools">
              <SearchForm
                className="site-search-form mobile-search-form"
                copy={searchCopy}
                idPrefix="mobile"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onSubmit={(event) => handleSearchSubmit(event, closeMobileMenu)}
              />

              <div className="mobile-contact-links">
                <EmailLink email={copy.meta.email} className="mobile-meta-link" />
                <PhoneLink phone={copy.meta.phone} className="mobile-meta-link" />
                {showLocation ? (
                  <LocationLink
                    href={copy.meta.locationHref}
                    label={copy.meta.locationLabel}
                    className="mobile-meta-link mobile-location"
                  />
                ) : null}
              </div>

              <SocialLinks items={copy.meta.socials} className="mobile-socials" />

              <div className="language-toggle mobile-language-toggle" aria-label={copy.header.languageLabel}>
                <button
                  type="button"
                  className={language === 'en' ? 'language-button active' : 'language-button'}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={language === 'ka' ? 'language-button active' : 'language-button'}
                  onClick={() => setLanguage('ka')}
                >
                  KA
                </button>
              </div>
            </div>

            <Link className="header-utility-link mobile-calendar-link" to="/events#calendar-2026" onClick={closeMobileMenu}>
              {copy.header.quickAction}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

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
  )
}
