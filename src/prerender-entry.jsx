import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'

export function render(pathname, language) {
  return renderToString(<StaticRouter location={pathname}><App initialLanguage={language} /></StaticRouter>)
}
