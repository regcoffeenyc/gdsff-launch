import { buildFederationNav } from '../components/FederationNavigation'
import { officialLaunchContent } from '../content/officialLaunchContent'

const sportsAnchorIds = ['dynamic-shooting', 'functional-fitness', 'tactical-performance']
const hiddenDocumentIds = new Set(['content-pack', 'upload-checklist'])

const searchUiCopy = {
  en: {
    navLabel: 'Search',
    eyebrow: 'Website Search',
    title: 'Find pages, documents, and official downloads.',
    text: 'Search across the GDSFF website for federation pages, anchored sections, public files, and contact details.',
    highlights: ['Pages and sections', 'Official downloads', 'Public contact details'],
    searchLabel: 'Search the website',
    placeholder: 'Search for charter, logo, membership, safety...',
    searchButton: 'Search',
    clearButton: 'Clear',
    emptyTitle: 'Start with a page, file, or keyword.',
    emptyText: 'Try charter, calendar, logo, membership, president, partner, or contact.',
    noResultsTitle: 'No matching results yet.',
    noResultsText: 'Try a broader phrase or search for a page title, section name, or document keyword.',
    shortcutsTitle: 'Popular shortcuts',
    resultsFor: 'Results for',
    resultLabelSingular: 'result',
    resultLabelPlural: 'results',
    resultKinds: {
      page: 'Page',
      section: 'Section',
      download: 'Download',
      contact: 'Contact',
    },
    openAction: 'Open',
    downloadAction: 'Download',
    visitAction: 'Visit',
    shortcuts: [
      { label: 'Document library', to: '/documents#downloads' },
      { label: 'Online membership application', to: '/membership#online-application' },
      { label: 'Safety consent', to: '/safety-consent' },
      { label: 'Contact directory', to: '/contact#contact-directory' },
    ],
  },
  ka: {
    navLabel: 'ძიება',
    eyebrow: 'საიტის ძიება',
    title: 'იპოვეთ გვერდები, დოკუმენტები და ოფიციალური ჩამოტვირთვები.',
    text: 'მოძებნეთ GDSFF-ის ვებსაიტზე ფედერაციის გვერდები, სექციები, საჯარო ფაილები და საკონტაქტო ინფორმაცია.',
    highlights: ['გვერდები და სექციები', 'ოფიციალური ფაილები', 'საჯარო კონტაქტები'],
    searchLabel: 'საიტის ძიება',
    placeholder: 'მოძებნეთ წესდება, ლოგო, წევრობა, უსაფრთხოება...',
    searchButton: 'ძებნა',
    clearButton: 'გასუფთავება',
    emptyTitle: 'დაიწყეთ გვერდით, ფაილით ან საკვანძო სიტყვით.',
    emptyText: 'სცადეთ: წესდება, კალენდარი, ლოგო, წევრობა, პრეზიდენტი, პარტნიორი ან კონტაქტი.',
    noResultsTitle: 'შესაბამისი შედეგი ჯერ არ მოიძებნა.',
    noResultsText: 'სცადეთ უფრო ფართო ფრაზა ან მოძებნეთ გვერდის, სექციის ან დოკუმენტის სახელით.',
    shortcutsTitle: 'პოპულარული მალსახმობები',
    resultsFor: 'შედეგები მოთხოვნისთვის',
    resultLabelSingular: 'შედეგი',
    resultLabelPlural: 'შედეგი',
    resultKinds: {
      page: 'გვერდი',
      section: 'სექცია',
      download: 'ჩამოტვირთვა',
      contact: 'კონტაქტი',
    },
    openAction: 'გახსნა',
    downloadAction: 'ჩამოტვირთვა',
    visitAction: 'გადასვლა',
    shortcuts: [
      { label: 'დოკუმენტების ბიბლიოთეკა', to: '/documents#downloads' },
      { label: 'ონლაინ წევრობის განაცხადი', to: '/membership#online-application' },
      { label: 'უსაფრთხოების თანხმობა', to: '/safety-consent' },
      { label: 'კონტაქტების ბლოკი', to: '/contact#contact-directory' },
    ],
  },
}

function isGeorgianLocale(locale) {
  return locale === 'ka-GE'
}

function flattenKeywords(values) {
  return values.flatMap((value) => {
    if (Array.isArray(value)) {
      return flattenKeywords(value)
    }

    if (typeof value === 'string' && value.trim()) {
      return [value.trim()]
    }

    return []
  })
}

function normalizeSearchValue(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function buildSafetyDownloadEntry(localeKey) {
  return localeKey === 'ka'
    ? {
        kind: 'download',
        title: 'უსაფრთხოების წესები და ინფორმირებული თანხმობა',
        description: 'უსაფრთხოების წესებისა და ინფორმირებული თანხმობის ოფლაინ და დასაბეჭდი ვერსია.',
        href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
        download: true,
        section: 'დოკუმენტები',
        meta: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
        keywords: ['უსაფრთხოება', 'თანხმობა', 'უსაფრთხოების ფორმა', 'HTML'],
      }
    : {
        kind: 'download',
        title: 'Safety Rules & Informed Consent',
        description: 'Offline printable version of the federation safety rules and informed consent file.',
        href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
        download: true,
        section: 'Documents',
        meta: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
        keywords: ['safety', 'consent', 'informed consent', 'HTML'],
      }
}

function buildContactEntries(copy, localeKey) {
  const section = localeKey === 'ka' ? 'კონტაქტი' : 'Contact'

  return [
    {
      kind: 'contact',
      title: copy.meta.email,
      description:
        localeKey === 'ka' ? 'ფედერაციის ოფიციალური ელფოსტის მისამართი.' : 'Official federation email address.',
      href: `mailto:${copy.meta.email}`,
      external: true,
      section,
      meta: 'Email',
      keywords: ['email', 'contact', 'info', copy.meta.email],
    },
    {
      kind: 'contact',
      title: copy.meta.phone,
      description: localeKey === 'ka' ? 'ფედერაციის ოფიციალური სატელეფონო ხაზი.' : 'Official federation phone line.',
      href: `tel:${copy.meta.phone.replace(/\s+/g, '')}`,
      external: true,
      section,
      meta: 'Phone',
      keywords: ['phone', 'call', 'contact', copy.meta.phone],
    },
    {
      kind: 'contact',
      title: copy.meta.locationLabel,
      description:
        localeKey === 'ka'
          ? 'ოფიციალური ლოკაცია Google Maps-ის ბმულით.'
          : 'Official federation location with Google Maps link.',
      href: copy.meta.locationHref,
      external: true,
      section,
      meta: 'Maps',
      keywords: ['location', 'map', 'coordinates', copy.meta.locationLabel],
    },
  ]
}

function buildPageEntries(copy, localeKey) {
  const launch = officialLaunchContent[localeKey]
  const aboutSection = copy.nav.about
  const sportsSection = copy.nav.sports
  const leadershipSection = copy.nav.leadership
  const membershipSection = copy.nav.membership
  const eventsSection = copy.nav.events
  const partnersSection = copy.nav.partners
  const gallerySection = copy.nav.gallery
  const documentsSection = copy.nav.documents
  const contactSection = copy.nav.contact

  return [
    {
      kind: 'page',
      title: copy.brand.fullName,
      description: copy.footer.summary,
      to: '/',
      section: copy.nav.home ?? copy.brand.shortName,
      meta: '/',
      keywords: [copy.brand.shortName, copy.brand.fullName, copy.brand.slogan, 'official federation'],
    },
    {
      kind: 'page',
      title: launch.about.title,
      description: launch.about.text,
      to: '/about',
      section: aboutSection,
      meta: '/about',
      keywords: [launch.about.eyebrow, launch.about.highlights],
    },
    {
      kind: 'page',
      title: copy.sports?.title ?? sportsSection,
      description: copy.sports?.text ?? '',
      to: '/sports',
      section: sportsSection,
      meta: '/sports',
      keywords: [copy.sports?.eyebrow, copy.sports?.highlights],
    },
    {
      kind: 'page',
      title: launch.leadership.title,
      description: launch.leadership.text,
      to: '/leadership',
      section: leadershipSection,
      meta: '/leadership',
      keywords: [launch.leadership.eyebrow, launch.leadership.highlights],
    },
    {
      kind: 'page',
      title: launch.membership.title,
      description: launch.membership.text,
      to: '/membership',
      section: membershipSection,
      meta: '/membership',
      keywords: [launch.membership.eyebrow, launch.membership.highlights],
    },
    {
      kind: 'page',
      title: copy.events?.title ?? eventsSection,
      description: copy.events?.text ?? '',
      to: '/events',
      section: eventsSection,
      meta: '/events',
      keywords: [copy.events?.eyebrow, copy.events?.highlights],
    },
    {
      kind: 'page',
      title: copy.partners?.title ?? partnersSection,
      description: copy.partners?.text ?? '',
      to: '/partners',
      section: partnersSection,
      meta: '/partners',
      keywords: [copy.partners?.eyebrow, copy.partners?.highlights],
    },
    {
      kind: 'page',
      title: copy.gallery?.title ?? gallerySection,
      description: copy.gallery?.text ?? '',
      to: '/gallery',
      section: gallerySection,
      meta: '/gallery',
      keywords: [copy.gallery?.eyebrow, copy.gallery?.highlights],
    },
    {
      kind: 'page',
      title: launch.documents.title,
      description: launch.documents.text,
      to: '/documents',
      section: documentsSection,
      meta: '/documents',
      keywords: [launch.documents.eyebrow, launch.documents.highlights],
    },
    {
      kind: 'page',
      title: copy.contact?.title ?? contactSection,
      description: copy.contact?.text ?? copy.footer.summary,
      to: '/contact',
      section: contactSection,
      meta: '/contact',
      keywords: [copy.contact?.eyebrow, copy.contact?.highlights],
    },
  ]
}

function buildSportsEntries(copy) {
  const section = copy.nav.sports
  const disciplineEntries = (copy.sports?.disciplines ?? []).map((discipline, index) => ({
    kind: 'section',
    title: discipline.title,
    description: discipline.text,
    to: `/sports#${sportsAnchorIds[index] ?? 'athlete-development'}`,
    section,
    meta: `/sports#${sportsAnchorIds[index] ?? 'athlete-development'}`,
    keywords: [copy.sports?.title, copy.sports?.eyebrow],
  }))

  const pathwayEntry = copy.sports?.pathwayTitle
    ? [
        {
          kind: 'section',
          title: copy.sports.pathwayTitle,
          description: (copy.sports.pathway ?? []).slice(0, 2).join(' '),
          to: '/sports#competition-pathway',
          section,
          meta: '/sports#competition-pathway',
          keywords: [copy.sports.title, 'athlete development', copy.sports.pathway],
        },
      ]
    : []

  return [...disciplineEntries, ...pathwayEntry]
}

function buildPartnerEntries(copy) {
  const section = copy.nav.partners

  return [
    {
      kind: 'section',
      title: copy.partners?.logoWallTitle ?? section,
      description: copy.partners?.logoWallText ?? '',
      to: '/partners#partner-network',
      section,
      meta: '/partners#partner-network',
      keywords: [copy.partners?.title, copy.partners?.eyebrow],
    },
    {
      kind: 'section',
      title: copy.partners?.opportunitiesTitle ?? section,
      description: (copy.partners?.opportunities ?? []).slice(0, 2).join(' '),
      to: '/partners#sponsorship',
      section,
      meta: '/partners#sponsorship',
      keywords: [copy.partners?.title, 'sponsorship', copy.partners?.opportunities],
    },
    {
      kind: 'section',
      title: copy.partners?.promiseTitle ?? section,
      description: (copy.partners?.promise ?? []).slice(0, 2).join(' '),
      to: '/partners#institutional-cooperation',
      section,
      meta: '/partners#institutional-cooperation',
      keywords: [copy.partners?.title, 'institutional cooperation', copy.partners?.promise],
    },
  ]
}

export function getSearchUiCopy(locale) {
  return searchUiCopy[isGeorgianLocale(locale) ? 'ka' : 'en']
}

export function buildSiteSearchIndex(copy) {
  const localeKey = isGeorgianLocale(copy.locale) ? 'ka' : 'en'
  const launch = officialLaunchContent[localeKey]
  const navEntries = buildFederationNav(copy).flatMap((group) =>
    group.items.map((item) => ({
      kind: item.external ? 'contact' : 'section',
      title: item.label,
      description: item.description,
      ...(item.external ? { href: item.href, external: true } : { to: item.to }),
      section: group.label,
      meta: item.external ? item.href : item.to,
      keywords: [group.label, group.description, group.overline],
    })),
  )

  const documentEntries = [...launch.documents.items, buildSafetyDownloadEntry(localeKey)]
    .filter((item) => !hiddenDocumentIds.has(item.id))
    .map((item) => ({
      kind: 'download',
      title: item.title,
      description: item.description,
      href: item.href,
      download: true,
      section: copy.nav.documents,
      meta: item.fileName ?? item.meta,
      keywords: [item.fileName, item.actionLabel, item.format, copy.nav.documents],
    }))

  const entries = [
    ...buildPageEntries(copy, localeKey),
    ...navEntries,
    ...buildSportsEntries(copy),
    ...buildPartnerEntries(copy),
    ...documentEntries,
    ...buildContactEntries(copy, localeKey),
  ]

  const uniqueEntries = new Map()

  entries.forEach((entry) => {
    const keywords = flattenKeywords(entry.keywords ?? [])
    const key = `${entry.kind}:${entry.to ?? entry.href ?? entry.title}`

    if (!uniqueEntries.has(key)) {
      uniqueEntries.set(key, {
        ...entry,
        keywords,
      })
    }
  })

  return Array.from(uniqueEntries.values())
}

export function searchSite(copy, query) {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return []
  }

  const tokens = Array.from(new Set(normalizedQuery.split(/\s+/).filter(Boolean)))

  return buildSiteSearchIndex(copy)
    .map((entry) => {
      const title = normalizeSearchValue(entry.title)
      const description = normalizeSearchValue(entry.description)
      const section = normalizeSearchValue(entry.section)
      const meta = normalizeSearchValue(entry.meta)
      const keywords = normalizeSearchValue((entry.keywords ?? []).join(' '))
      const haystack = [title, description, section, meta, keywords].join(' ')
      let score = 0
      let matchedTokens = 0

      tokens.forEach((token) => {
        const inTitle = title.includes(token)
        const inDescription = description.includes(token)
        const inSection = section.includes(token)
        const inMeta = meta.includes(token)
        const inKeywords = keywords.includes(token)

        if (inTitle || inDescription || inSection || inMeta || inKeywords) {
          matchedTokens += 1
        }

        if (inTitle) score += 34
        if (inKeywords) score += 24
        if (inSection) score += 14
        if (inMeta) score += 14
        if (inDescription) score += 10
      })

      if (!haystack.includes(normalizedQuery) && matchedTokens === 0) {
        return null
      }

      if (haystack.includes(normalizedQuery)) score += 46
      if (title.startsWith(normalizedQuery)) score += 24
      if (keywords.includes(normalizedQuery)) score += 18
      if (section.includes(normalizedQuery)) score += 10
      if (matchedTokens === tokens.length && tokens.length > 1) score += 18
      if (entry.kind === 'download') score += 4

      return {
        ...entry,
        score,
      }
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .slice(0, 24)
}
