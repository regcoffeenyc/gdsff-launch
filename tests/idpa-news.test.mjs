import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import { idpaAnnouncement } from '../src/content/idpaAnnouncement.js'
import { safetyTeamMembers, getSafetyTeamName } from '../src/content/safetyTeamContent.js'

for (const language of ['en', 'ka']) {
  test(`${language}: news publishes the approved five-person SO story and retains iF3`, () => {
    const document = new JSDOM(readFileSync(`dist/${language}/gallery/index.html`, 'utf8')).window.document
    const article = document.querySelector('#news-updates')
    assert.equal(article.querySelector('h2').textContent, idpaAnnouncement[language].title)
    assert.equal(article.querySelector('time').dateTime, '2026-10-04')
    assert.match(article.textContent, /CL100829/)
    assert.match(article.textContent, /Federico Iannelli/)
    assert.match(article.textContent, /IT1349/)
    assert.deepEqual([...article.querySelectorAll('li')].map(el => el.textContent.trim()), safetyTeamMembers.map(member => getSafetyTeamName(member, language)))
    for (const member of safetyTeamMembers) {
      assert.ok(article.querySelector(`a[href="/${language}/leadership#safety-team-${member.id}"]`))
    }
    assert.ok(article.querySelector('a[href="https://www.idpa.com/clubs/gdsff/"]'))
    assert.doesNotMatch(article.textContent, /Goderdzi|Metreveli|გოდერძი|მეტრეველი|IDPA.certified instructor|Safety Officer Instructor/i)
    assert.ok(document.querySelector('#if3-membership a[href="/downloads/gdsff-if3-certificate.pdf"]'))
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id)
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(article.compareDocumentPosition(document.querySelector('#if3-membership')) & 4)
  })
  test(`${language}: homepage teaser links to the new announcement and retains iF3 link`, () => {
    const document = new JSDOM(readFileSync(`dist/${language}/index.html`, 'utf8')).window.document
    assert.ok(document.querySelector(`#latest-idpa-news a[href="/${language}/gallery#news-updates"]`))
    assert.ok(document.querySelector(`#latest-news a[href="/${language}/gallery#if3-membership"]`))
    assert.equal(document.querySelector('#latest-idpa-news time').dateTime, '2026-10-04')
    const ids = [...document.querySelectorAll('[id]')].map(el => el.id)
    assert.equal(new Set(ids).size, ids.length)
  })
}
