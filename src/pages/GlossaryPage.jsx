import { useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import { SearchIcon } from '../components/SiteIcons'
import { glossaryCategories as categories, glossaryTerms as terms } from '../content/glossaryContent'
import { logoSrc } from '../siteAssets'

/**
 * განმარტებითი ლექსიკონი / Explanatory Glossary
 *
 * A bilingual reference of dynamic-shooting and range terminology. Each entry
 * shows the term in the active language, its equivalent in the other language,
 * and a short explanation grounded in the GDSFF Safety Standards Rulebook.
 * A printable, fully bilingual PDF of every term can be downloaded.
 */

const pageCopy = {
  en: {
    eyebrow: 'Reference',
    title: 'Explanatory Glossary',
    text: 'A bilingual glossary of dynamic-shooting and range terminology, with short explanations drawn from the GDSFF Safety Standards Rulebook.',
    highlights: ['Bilingual terms', 'Plain explanations', 'Rulebook references'],
    introTitle: 'Terminology',
    introText:
      'Search a term or filter by category. Each entry gives the term in both languages, a short explanation, and the relevant rulebook section.',
    searchPlaceholder: 'Search a term…',
    allLabel: 'All',
    emptyText: 'No terms match your search.',
    countLabel: 'terms',
    equivalentLabel: 'Georgian',
    downloadLabel: 'Download PDF',
    downloadingLabel: 'Preparing…',
  },
  ka: {
    eyebrow: 'საცნობარო',
    title: 'განმარტებითი ლექსიკონი',
    text: 'დინამიური სროლისა და ტირის ტერმინოლოგიის ორენოვანი ლექსიკონი, მოკლე განმარტებებით GDSFF-ის უსაფრთხოების სტანდარტების რულბუქიდან.',
    highlights: ['ორენოვანი ტერმინები', 'მარტივი განმარტება', 'რულბუქზე მითითება'],
    introTitle: 'ტერმინოლოგია',
    introText:
      'მოძებნე ტერმინი ან გაფილტრე კატეგორიით. თითოეული ჩანაწერი გაძლევს ტერმინს ორივე ენაზე, მოკლე განმარტებას და რულბუქის შესაბამის მუხლს.',
    searchPlaceholder: 'ტერმინის ძებნა…',
    allLabel: 'ყველა',
    emptyText: 'ძებნას ტერმინი არ შეესაბამა.',
    countLabel: 'ტერმინი',
    equivalentLabel: 'English',
    downloadLabel: 'PDF-ის ჩამოტვირთვა',
    downloadingLabel: 'მზადდება…',
  },
}

function GlossaryEntry({ entry, localeKey, otherKey, equivalentLabel }) {
  const primary = entry[localeKey]
  const secondary = entry[otherKey]
  const showSecondary = !entry.command && secondary.term !== primary.term

  return (
    <article className="glossary-entry">
      <div className="glossary-entry-head">
        <div className="glossary-term-group">
          <h3 className="glossary-term">{primary.term}</h3>
          {showSecondary ? (
            <span className="glossary-term-alt">
              <span className="glossary-term-alt-label">{equivalentLabel}:</span> {secondary.term}
            </span>
          ) : null}
        </div>
        {entry.cite ? <span className="glossary-cite">{entry.cite}</span> : null}
      </div>
      <p className="glossary-def">{primary.def}</p>
    </article>
  )
}

export default function GlossaryPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const otherKey = localeKey === 'ka' ? 'en' : 'ka'
  const t = pageCopy[localeKey]

  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const { downloadGlossaryPdf } = await import('../utils/glossaryPdf')
      await downloadGlossaryPdf(localeKey, logoSrc)
    } catch (error) {
      console.warn('GDSFF glossary PDF download failed.', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return terms.filter((entry) => {
      const okCat = activeCat === 'all' || entry.cat === activeCat
      if (!okCat) return false
      if (!q) return true
      const haystack = `${entry.en.term} ${entry.ka.term} ${entry.en.def} ${entry.ka.def} ${entry.cite ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [query, activeCat])

  const grouped = useMemo(() => {
    return categories
      .map((category) => ({
        ...category,
        items: filtered.filter((entry) => entry.cat === category.key),
      }))
      .filter((category) => category.items.length > 0)
  }, [filtered])

  return (
    <>
      <PageHero
        eyebrow={t.eyebrow}
        title={t.title}
        text={t.text}
        highlights={t.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="glossary" className="container page-section anchor-section">
        <div className="section-intro compact-intro">
          <p className="eyebrow">{t.introTitle}</p>
          <h2>{t.title}</h2>
          <p className="section-copy">{t.introText}</p>
        </div>

        <div className="glossary-controls">
          <div className="glossary-search">
            <SearchIcon className="glossary-search-icon" />
            <input
              type="search"
              className="glossary-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
            />
          </div>

          <div className="glossary-filters" role="group" aria-label={t.introTitle}>
            <button
              type="button"
              className={activeCat === 'all' ? 'glossary-chip is-active' : 'glossary-chip'}
              aria-pressed={activeCat === 'all'}
              onClick={() => setActiveCat('all')}
            >
              {t.allLabel}
            </button>
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                className={activeCat === category.key ? 'glossary-chip is-active' : 'glossary-chip'}
                aria-pressed={activeCat === category.key}
                onClick={() => setActiveCat(category.key)}
              >
                {category[localeKey]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="glossary-download"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <DownloadGlyph />
            {isDownloading ? t.downloadingLabel : t.downloadLabel}
          </button>
        </div>

        {grouped.length === 0 ? (
          <div className="feature-card glossary-empty">
            <p>{t.emptyText}</p>
          </div>
        ) : (
          <div className="glossary-groups">
            {grouped.map((category) => (
              <section key={category.key} className="glossary-group">
                <div className="glossary-group-head">
                  <span className="card-kicker">{category[localeKey]}</span>
                  <span className="glossary-group-count">
                    {category.items.length} {t.countLabel}
                  </span>
                </div>
                <div className="glossary-entries">
                  {category.items.map((entry) => (
                    <GlossaryEntry
                      key={`${entry.cat}-${entry.en.term}`}
                      entry={entry}
                      localeKey={localeKey}
                      otherKey={otherKey}
                      equivalentLabel={t.equivalentLabel}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function DownloadGlyph() {
  return (
    <svg className="glossary-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}
