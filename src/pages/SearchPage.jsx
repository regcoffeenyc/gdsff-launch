import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { getSearchUiCopy, searchSite } from '../utils/siteSearch'

function SearchResultCard({ item, ui }) {
  const kicker = item.section ? `${ui.resultKinds[item.kind]} • ${item.section}` : ui.resultKinds[item.kind]
  const actionLabel = item.kind === 'download' ? ui.downloadAction : item.external ? ui.visitAction : ui.openAction

  const content = (
    <article className="search-result-card">
      <span className="card-kicker">{kicker}</span>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <div className="search-result-meta">
        <span className="search-result-path">{item.meta}</span>
        <span className="search-result-action">{actionLabel}</span>
      </div>
    </article>
  )

  if (item.download) {
    return (
      <a href={item.href} className="search-result-link" download>
        {content}
      </a>
    )
  }

  if (item.external) {
    return (
      <a href={item.href} className="search-result-link" target="_blank" rel="noreferrer">
        {content}
      </a>
    )
  }

  return (
    <Link to={item.to} className="search-result-link">
      {content}
    </Link>
  )
}

export default function SearchPage({ copy }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const ui = getSearchUiCopy(copy.locale)
  const [inputValue, setInputValue] = useState(query)

  useEffect(() => {
    setInputValue(query)
  }, [query, copy.locale])

  const results = useMemo(() => searchSite(copy, query), [copy, query])
  const resultCountLabel = results.length === 1 ? ui.resultLabelSingular : ui.resultLabelPlural

  function handleSubmit(event) {
    event.preventDefault()

    const nextQuery = inputValue.trim()
    navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/search')
  }

  function handleClear() {
    setInputValue('')
    navigate('/search')
  }

  return (
    <>
      <PageHero
        eyebrow={ui.eyebrow}
        title={ui.title}
        text={ui.text}
        highlights={ui.highlights}
        label={copy.header.highlightsLabel}
      />

      <section className="container page-section">
        <div className="feature-card search-shell">
          <form className="search-page-form" role="search" onSubmit={handleSubmit}>
            <label className="search-page-label" htmlFor="search-page-input">
              {ui.searchLabel}
            </label>
            <div className="search-page-field">
              <input
                id="search-page-input"
                type="search"
                className="search-page-input"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={ui.placeholder}
                autoComplete="off"
              />
              <button type="submit" className="primary-button search-page-submit">
                {ui.searchButton}
              </button>
            </div>
          </form>

          {query ? (
            <div className="search-results-header">
              <div className="search-results-copy">
                <span className="card-kicker">{ui.resultsFor}</span>
                <h2>{query}</h2>
                <p>
                  {results.length} {resultCountLabel}
                </p>
              </div>

              <button type="button" className="secondary-button inline-button" onClick={handleClear}>
                {ui.clearButton}
              </button>
            </div>
          ) : (
            <div className="search-empty-state">
              <span className="card-kicker">{ui.searchLabel}</span>
              <h2>{ui.emptyTitle}</h2>
              <p>{ui.emptyText}</p>
            </div>
          )}

          {query ? (
            results.length ? (
              <div className="search-results-grid">
                {results.map((item) => (
                  <SearchResultCard key={`${item.kind}-${item.to ?? item.href ?? item.title}`} item={item} ui={ui} />
                ))}
              </div>
            ) : (
              <div className="search-empty-panel">
                <span className="card-kicker">{ui.resultsFor}</span>
                <h3>{ui.noResultsTitle}</h3>
                <p>{ui.noResultsText}</p>
              </div>
            )
          ) : null}

          <div className="search-shortcuts">
            <div className="search-shortcuts-copy">
              <span className="card-kicker">{ui.shortcutsTitle}</span>
            </div>
            <div className="search-shortcut-links">
              {ui.shortcuts.map((item) => (
                <Link key={item.to} to={item.to} className="download-action search-shortcut-link">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
