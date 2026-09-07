import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { allRoutes, getRouteMetadata, indexableRoutes, LANGS, OG_IMAGE } from '../src/seo/routesMeta.js'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const { render } = await import(pathToFileURL(join(root, 'dist-ssr/prerender-entry.js')))
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function head(meta) {
  const tags = [`<title>${esc(meta.title)}</title>`, `<meta name="description" content="${esc(meta.description)}" />`, `<link rel="canonical" href="${meta.url}" />`, ...meta.alternates.map((a) => `<link rel="alternate" hreflang="${a.language}" href="${a.url}" />`), `<meta property="og:title" content="${esc(meta.title)}" />`, `<meta property="og:description" content="${esc(meta.description)}" />`, `<meta property="og:url" content="${meta.url}" />`, `<meta property="og:image" content="${OG_IMAGE}" />`, `<meta property="og:locale" content="${meta.locale}" />`, `<meta property="og:locale:alternate" content="${meta.alternateLocale}" />`, `<meta name="twitter:title" content="${esc(meta.title)}" />`, `<meta name="twitter:description" content="${esc(meta.description)}" />`, `<meta name="twitter:image" content="${OG_IMAGE}" />`]
  if (meta.noindex) tags.push('<meta name="robots" content="noindex" />')
  return tags.join('\n    ')
}
for (const language of LANGS) for (const route of allRoutes) {
  const meta = getRouteMetadata(route, language)
  const cleanTemplate = template
    .replace(/\s*<link rel="canonical"[^>]*>/, '')
    .replace(/\s*<meta name="description"[\s\S]*?\/>/, '')
    .replace(/\s*<meta (?:property="og:(?:title|description|url|image|locale)"|name="twitter:(?:title|description|image)")[\s\S]*?\/>/g, '')
  const html = cleanTemplate.replace('<html lang="en">', `<html lang="${language}">`).replace(/<title>[\s\S]*?<\/title>/, head(meta)).replace('<div id="root"></div>', `<div id="root">${render(route, language)}</div>`)
  const dir = join(dist, language, route === '/' ? '' : route.slice(1)); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'index.html'), html)
}
const urls = LANGS.flatMap((language) => indexableRoutes.map((route) => `  <url><loc>${getRouteMetadata(route, language).url}</loc></url>`)).join('\n')
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
writeFileSync(join(dist, '404.html'), template.replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found | GDSFF</title>\n    <meta name="robots" content="noindex" />'))
if (existsSync(join(root, 'public'))) cpSync(join(root, 'public'), dist, { recursive: true, force: false })
