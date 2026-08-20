# GDSFF Phase 1+2 deployment — 11 changed files

## What changed
- index.html          — short KA title/description, lang="ka", absolute og:image (logo unchanged)
- src/main.jsx        — language read from URL prefix (/ka, /en)
- src/App.jsx         — language via URL, switcher navigates between /ka and /en
- src/prerender-entry.jsx  (new) — build-time server renderer
- src/seo/routesMeta.js    (new) — unique title+description per route, both languages
- scripts/prerender.mjs    (new) — writes 30 static HTML pages at build time
- package.json        — build now runs client build + SSR build + prerender
- vercel.json         — 15 permanent redirects (old URLs -> /ka/...), cache headers, no more SPA catch-all
- public/sitemap.xml  — 26 URLs with hreflang annotations
- public/robots.txt   — blocks /ka|en/membership-admin and search pages
- public/404.html     (new) — real 404 page

## Deploy (from your local clone of gdsff-launch)
    git pull
    # copy the 11 files from this zip over the repo, keeping paths
    git add -A
    git commit -m "SEO: prerender all routes, ka/en URLs, hreflang, sitemap, real 404s"
    git push

Vercel builds and deploys automatically on push. Build takes ~1 minute.

## Verify after deploy
    curl -I https://www.gdsff.com/                     # 308 -> /ka/
    curl -I https://www.gdsff.com/about                # 308 -> /ka/about
    curl -s https://www.gdsff.com/ka/about | grep title   # "ჩვენ შესახებ | GDSFF"
    curl -s https://www.gdsff.com/en/membership | grep title  # "Become a Member | GDSFF"
    curl -I https://www.gdsff.com/no-such-page         # 404

Then: Google Search Console -> Sitemaps -> submit sitemap.xml
