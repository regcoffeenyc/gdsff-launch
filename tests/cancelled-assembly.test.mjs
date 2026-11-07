import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { enContent } from '../src/content/enContent.js'
import { kaContent } from '../src/content/kaContent.js'

const cancelledDate = '2026-11-14'
const cancelledTitles = ['Annual Assembly and Awards', 'წლიური ასამბლეა და დაჯილდოება']

for (const [lang, content] of [['en', enContent], ['ka', kaContent]]) {
  test(`${lang}: cancelled November assembly is absent while historical events remain`, () => {
    const events = content.events.calendar.events
    assert.equal(events.some((event) => event.date === cancelledDate), false)
    assert.equal(events.some((event) => !event.past), false)
    assert.deepEqual(events.map((event) => event.date), [
      '2026-04-18', '2026-05-16', '2026-06-06', '2026-07-11', '2026-09-05',
    ])
  })
  for (const route of ['', '/events']) {
    test(`${lang}${route}: built page and structured data omit cancelled assembly`, () => {
      const html = readFileSync(new URL(`../dist/${lang}${route}/index.html`, import.meta.url), 'utf8')
      assert.ok(!html.includes(cancelledDate))
      assert.ok(html.includes(content.events.calendar.emptyState))
      for (const title of cancelledTitles) assert.ok(!html.includes(title))
    })
  }
}
