// Server-side entry used only at build time by scripts/prerender.mjs.
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'

export function render(path, lang) {
  return renderToString(
    <StaticRouter location={path} basename={`/${lang}`}>
      <App language={lang} />
    </StaticRouter>,
  )
}
