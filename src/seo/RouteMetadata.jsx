import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMetadata, OG_IMAGE } from './routesMeta'

function setTag(selector, tagName, attributes) {
  const [existing, ...duplicates] = document.head.querySelectorAll(selector)
  duplicates.forEach((tag) => tag.remove())
  const tag = existing ?? document.createElement(tagName)
  Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value))
  if (!existing) document.head.appendChild(tag)
}
const removeTags = (selector) => document.head.querySelectorAll(selector).forEach((tag) => tag.remove())

export default function RouteMetadata({ language }) {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = getRouteMetadata(pathname, language)
    document.documentElement.lang = language
    if (!meta) {
      removeTags('link[rel="canonical"], link[rel="alternate"][hreflang]')
      setTag('meta[name="robots"]', 'meta', { name: 'robots', content: 'noindex' })
      return
    }
    document.title = meta.title
    for (const [name, content] of Object.entries({ description: meta.description, 'twitter:title': meta.title, 'twitter:description': meta.description, 'twitter:image': OG_IMAGE })) {
      setTag(`meta[name="${name}"]`, 'meta', { name, content })
    }
    for (const [property, content] of Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:url': meta.url, 'og:image': OG_IMAGE, 'og:locale': meta.locale, 'og:locale:alternate': meta.alternateLocale })) {
      setTag(`meta[property="${property}"]`, 'meta', { property, content })
    }
    setTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: meta.url })
    for (const alternate of meta.alternates) setTag(`link[rel="alternate"][hreflang="${alternate.language}"]`, 'link', { rel: 'alternate', hreflang: alternate.language, href: alternate.url })
    if (meta.noindex) setTag('meta[name="robots"]', 'meta', { name: 'robots', content: 'noindex' })
    else removeTags('meta[name="robots"]')
  }, [language, pathname])
  return null
}
