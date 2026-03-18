import { Link } from 'react-router-dom'
import { ChevronDownIcon } from './SiteIcons'

function getTargetPath(to) {
  return to.split('#')[0]
}

function getTargetHash(to) {
  const [, hash = ''] = to.split('#')
  return hash ? `#${hash}` : ''
}

function isItemActive(item, location) {
  if (item.external) {
    return false
  }

  const targetPath = getTargetPath(item.to)
  const targetHash = getTargetHash(item.to)

  if (location.pathname !== targetPath) {
    return false
  }

  return targetHash ? location.hash === targetHash : true
}

export function isGroupActive(group, location) {
  if (group.matchPaths.includes(location.pathname)) {
    return true
  }

  return group.items.some((item) => !item.external && getTargetPath(item.to) === location.pathname)
}

function getGroupTarget(group) {
  const firstInternalItem = group.items.find((item) => !item.external && item.to)
  return firstInternalItem ? getTargetPath(firstInternalItem.to) : group.matchPaths[0] ?? '/'
}

function attachGroupTargets(groups) {
  return groups.map((group) => ({
    ...group,
    to: group.to ?? getGroupTarget(group),
  }))
}

export function buildFederationNav(copy) {
  const isGeorgian = copy.locale === 'ka-GE'

  const labels = isGeorgian
    ? {
        about: 'ფედერაციის შესახებ',
        leadership: 'ხელმძღვანელობა',
        membership: 'გაწევრიანება',
        safetyConsent: 'უსაფრთხოების თანხმობა',
        events: 'ღონისძიებები',
        media: 'მედია',
        documents: 'დოკუმენტები',
        contact: 'კონტაქტი',
        aboutOverline: 'ოფიციალური პროფილი',
        leadershipOverline: 'ოფიციალური ხელმძღვანელობა',
        membershipOverline: 'წევრობა და საორგანიზაციო ფორმები',
        eventsOverline: 'კალენდარი და პროგრამები',
        mediaOverline: 'გალერეა და განახლებები',
        documentsOverline: 'ოფიციალური ფაილები',
        contactOverline: 'კომუნიკაცია',
      }
    : {
        about: 'About',
        leadership: 'Leadership',
        membership: 'Membership',
        safetyConsent: 'Safety Consent',
        events: 'Events',
        media: 'Media',
        documents: 'Documents',
        contact: 'Contact',
        aboutOverline: 'Federation Profile',
        leadershipOverline: 'Official Leadership',
        membershipOverline: 'Membership and Operational Forms',
        eventsOverline: 'Calendar and Programs',
        mediaOverline: 'Gallery and Updates',
        documentsOverline: 'Official Files',
        contactOverline: 'Communication',
      }

  const groups = [
    {
      key: 'about',
      label: labels.about,
      panelAlign: 'start',
      overline: labels.aboutOverline,
      description: isGeorgian
        ? 'ფედერაციის ოფიციალური მიმოხილვა, მისია, ხედვა და წესდების საფუძველი.'
        : 'Official federation overview, mission, vision, and charter basis.',
      matchPaths: ['/about'],
      items: [
        {
          label: isGeorgian ? 'ფედერაციის მიმოხილვა' : 'Federation Overview',
          description: isGeorgian
            ? 'ოფიციალური პროფილი და ინსტიტუციური სტატუსი.'
            : 'Official federation profile and institutional overview.',
          to: '/about#federation-overview',
        },
        {
          label: isGeorgian ? 'მისია და ხედვა' : 'Mission & Vision',
          description: isGeorgian ? 'მისია, ხედვა და სტრატეგიული მიმართულება.' : 'Mission, vision, and strategic direction.',
          to: '/about#mission-vision',
        },
        {
          label: isGeorgian ? 'წესდება' : 'Charter',
          description: isGeorgian ? 'ფედერაციის ძირითადი შიდა მარეგულირებელი დოკუმენტი.' : 'Core internal charter and governance framework.',
          to: '/about#charter',
        },
      ],
    },
    {
      key: 'leadership',
      label: labels.leadership,
      panelAlign: 'center',
      overline: labels.leadershipOverline,
      description: isGeorgian
        ? 'პრეზიდენტისა და დირექტორის ოფიციალური პროფილები.'
        : 'Official profiles for the federation president and director.',
      matchPaths: ['/leadership'],
      items: [
        {
          label: isGeorgian ? 'პრეზიდენტი' : 'President',
          description: isGeorgian ? 'გიორგი გაგნიძის ოფიციალური პროფილი.' : 'Official profile for Giorgi Gagnidze.',
          to: '/leadership#president',
        },
        {
          label: isGeorgian ? 'დირექტორი' : 'Director',
          description: isGeorgian ? 'ანა ფაბჩულიძის ოფიციალური პროფილი.' : 'Official profile for Ana Fabchulidze.',
          to: '/leadership#director',
        },
      ],
    },
    {
      key: 'membership',
      label: labels.membership,
      panelAlign: 'center',
      overline: labels.membershipOverline,
      description: isGeorgian
        ? 'გაწევრიანების პროცესი, განაცხადის ფორმა და უსაფრთხოების თანხმობის ელექტრონული workflow.'
        : 'Membership process, application form, and online safety consent workflow.',
      matchPaths: ['/membership', '/safety-consent'],
      items: [
        {
          label: isGeorgian ? 'ფედერაციაში გაწევრიანება' : 'Join the Federation',
          description: isGeorgian
            ? 'წევრობის საფუძვლები პირებისთვის, სპორტსმენებისთვის და კლუბებისთვის.'
            : 'Membership basis for individuals, athletes, coaches, and clubs.',
          to: '/membership#join-federation',
        },
        {
          label: isGeorgian ? 'განაცხადის ფორმა' : 'Application Form',
          description: isGeorgian
            ? 'ოფიციალური წევრობის განაცხადის ჩამოტვირთვა.'
            : 'Official membership application download.',
          to: '/membership#application-form',
        },
        {
          label: labels.safetyConsent,
          description: isGeorgian
            ? 'უსაფრთხოების წესები, ინფორმირებული თანხმობა და ონლაინ ხელმოწერა.'
            : 'Safety rules, informed consent, and online signature workflow.',
          to: '/safety-consent',
        },
      ],
    },
    {
      key: 'events',
      label: labels.events,
      panelAlign: 'center',
      overline: labels.eventsOverline,
      description: isGeorgian
        ? 'ოფიციალური კალენდარი, ჩემპიონატები, ბანაკები და საერთაშორისო ღონისძიებები.'
        : 'Official calendar, championships, camps, and international events.',
      matchPaths: ['/events'],
      items: [
        {
          label: isGeorgian ? '2026 კალენდარი' : '2026 Calendar',
          description: isGeorgian ? 'ოფიციალური სეზონის კალენდარი.' : 'Official federation season calendar.',
          to: '/events#calendar-2026',
        },
        {
          label: isGeorgian ? 'ჩემპიონატები' : 'Championships',
          description: isGeorgian ? 'ეროვნული საკონკურსო ღონისძიებები.' : 'National-level championship and ranking events.',
          to: '/events#national-championships',
        },
        {
          label: isGeorgian ? 'საწვრთნელი ბანაკები' : 'Training Camps',
          description: isGeorgian ? 'განვითარების და მომზადების ფორმატები.' : 'Camps and athlete development formats.',
          to: '/events#training-camps',
        },
        {
          label: isGeorgian ? 'საერთაშორისო ღონისძიებები' : 'International Events',
          description: isGeorgian ? 'რეგიონული და საერთაშორისო წარმოდგენა.' : 'Regional and international showcase events.',
          to: '/events#international-events',
        },
      ],
    },
    {
      key: 'media',
      label: labels.media,
      panelAlign: 'center',
      overline: labels.mediaOverline,
      description: isGeorgian
        ? 'ფოტო გალერეა, სიახლეები და ლოკაციის პრეზენტაცია.'
        : 'Photo gallery, updates, and venue presentation.',
      matchPaths: ['/gallery'],
      items: [
        {
          label: isGeorgian ? 'გალერეა' : 'Gallery',
          description: isGeorgian ? 'ოფიციალური ფოტო გალერეა.' : 'Official competition and federation gallery.',
          to: '/gallery#photo-gallery',
        },
        {
          label: isGeorgian ? 'სიახლეები' : 'News',
          description: isGeorgian ? 'ოფიციალური განახლებები.' : 'Official updates and media notes.',
          to: '/gallery#news-updates',
        },
        {
          label: isGeorgian ? 'ლოკაციის პრეზენტაცია' : 'Venue Presentation',
          description: isGeorgian ? 'რენჯისა და სივრცის წარმოდგენა.' : 'Range and venue presentation materials.',
          to: '/gallery#venue-presentation',
        },
      ],
    },
    {
      key: 'documents',
      label: labels.documents,
      panelAlign: 'end',
      overline: labels.documentsOverline,
      description: isGeorgian
        ? 'ოფიციალური დოკუმენტები, ფორმები და ჩამოსატვირთი ფაილები.'
        : 'Official documents, forms, and direct download files.',
      matchPaths: ['/documents'],
      items: [
        {
          label: isGeorgian ? 'ოფიციალური დოკუმენტები' : 'Official Documents',
          description: isGeorgian ? 'დოკუმენტების ოფიციალური მიმოხილვა.' : 'Official document overview.',
          to: '/documents#official-documents',
        },
        {
          label: isGeorgian ? 'ჩამოტვირთვები' : 'Downloads',
          description: isGeorgian ? 'სრული ჩამოსატვირთი პაკეტი.' : 'Direct access to the launch document library.',
          to: '/documents#downloads',
        },
      ],
    },
    {
      key: 'contact',
      label: labels.contact,
      panelAlign: 'end',
      overline: labels.contactOverline,
      description: isGeorgian
        ? 'საკონტაქტო გვერდი, ლოკაცია და ოფიციალური სოციალური არხები.'
        : 'Contact page, location, and official social channels.',
      matchPaths: ['/contact'],
      items: [
        {
          label: isGeorgian ? 'საკონტაქტო გვერდი' : 'Contact Page',
          description: isGeorgian ? 'ოფიციალური საკონტაქტო ინფორმაცია.' : 'Official federation contact directory.',
          to: '/contact#contact-directory',
        },
        {
          label: isGeorgian ? 'ლოკაცია' : 'Location',
          description: copy.meta.locationLabel,
          href: copy.meta.locationHref,
          external: true,
        },
        {
          label: 'Facebook',
          description: copy.meta.facebookPageName,
          href:
            copy.meta.socials.find((item) => item.id === 'facebook')?.href ??
            'https://www.facebook.com/profile.php?id=61578666412435',
          external: true,
        },
        {
          label: 'Instagram',
          description: copy.meta.instagramHandle,
          href:
            copy.meta.socials.find((item) => item.id === 'instagram')?.href ??
            'https://www.instagram.com/gdsffofficial/?hl=en',
          external: true,
        },
      ],
    },
  ]

  return attachGroupTargets(groups)
}

function NavigationLink({ item, location, className, onActivate }) {
  const linkClassName = isItemActive(item, location) ? `${className} is-active` : className

  if (item.external) {
    return (
      <a href={item.href} className={linkClassName} target="_blank" rel="noreferrer" onClick={onActivate}>
        <span className="nav-entry-title">{item.label}</span>
        <span className="nav-entry-copy">{item.description}</span>
      </a>
    )
  }

  return (
    <Link to={item.to} className={linkClassName} onClick={onActivate}>
      <span className="nav-entry-title">{item.label}</span>
      <span className="nav-entry-copy">{item.description}</span>
    </Link>
  )
}

export function DesktopFederationNav({ groups, location, openKey, openMenu, queueCloseMenu, closeMenu, ariaLabel }) {
  return (
    <nav className="federation-nav desktop-nav" aria-label={ariaLabel}>
      {groups.map((group) => {
        const isOpen = openKey === group.key
        const active = isGroupActive(group, location)
        const panelId = `${group.key}-dropdown-panel`

        return (
          <div
            key={group.key}
            className={isOpen ? 'nav-dropdown is-open' : active ? 'nav-dropdown is-active' : 'nav-dropdown'}
            onMouseEnter={() => openMenu(group.key)}
            onMouseLeave={() => queueCloseMenu(group.key)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                queueCloseMenu(group.key, 120)
              }
            }}
          >
            <div className="nav-trigger-shell">
              <Link
                to={group.to}
                className={active ? 'nav-group-link is-active' : 'nav-group-link'}
                onFocus={() => openMenu(group.key)}
                onMouseEnter={() => openMenu(group.key)}
                onClick={closeMenu}
              >
                <span>{group.label}</span>
              </Link>

              <button
                type="button"
                className={isOpen ? 'nav-group-toggle is-open' : active ? 'nav-group-toggle is-active' : 'nav-group-toggle'}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-haspopup="true"
                aria-label={`${group.label} menu`}
                onClick={() => (isOpen ? closeMenu() : openMenu(group.key))}
                onFocus={() => openMenu(group.key)}
              >
                <ChevronDownIcon className="nav-trigger-icon" />
              </button>
            </div>

            <div
              id={panelId}
              className={`dropdown-panel align-${group.panelAlign ?? 'center'}`}
              role="group"
              aria-label={group.label}
              onMouseEnter={() => openMenu(group.key)}
              onMouseLeave={() => queueCloseMenu(group.key)}
            >
              <div className="dropdown-panel-inner">
                <div className="dropdown-panel-copy">
                  <span className="dropdown-panel-kicker">{group.overline}</span>
                  <h3>{group.label}</h3>
                  <p>{group.description}</p>
                </div>

                <div className="dropdown-panel-links">
                  {group.items.map((item) => (
                    <NavigationLink
                      key={item.label}
                      item={item}
                      location={location}
                      className="dropdown-link"
                      onActivate={closeMenu}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

export function MobileFederationNav({ groups, location, openKey, setOpenKey, closeMenu, ariaLabel }) {
  return (
    <nav className="mobile-accordion-nav" aria-label={ariaLabel}>
      {groups.map((group) => {
        const active = isGroupActive(group, location)
        const isOpen = openKey === group.key
        const panelId = `${group.key}-mobile-panel`

        return (
          <div key={group.key} className={isOpen ? 'mobile-accordion-group is-open' : 'mobile-accordion-group'}>
            <div className="mobile-accordion-head">
              <Link to={group.to} className={active ? 'mobile-accordion-link is-active' : 'mobile-accordion-link'} onClick={closeMenu}>
                <span>{group.label}</span>
              </Link>

              <button
                type="button"
                className={isOpen ? 'mobile-accordion-toggle is-open' : active ? 'mobile-accordion-toggle is-active' : 'mobile-accordion-toggle'}
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={`${group.label} menu`}
                onClick={() => setOpenKey((current) => (current === group.key ? null : group.key))}
              >
                <ChevronDownIcon className="mobile-accordion-icon" />
              </button>
            </div>

            <div id={panelId} className="mobile-accordion-panel">
              <div className="mobile-accordion-panel-inner">
                <p className="mobile-accordion-copy">{group.description}</p>
                <div className="mobile-accordion-links">
                  {group.items.map((item) => (
                    <NavigationLink
                      key={item.label}
                      item={item}
                      location={location}
                      className="mobile-subnav-link"
                      onActivate={closeMenu}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
