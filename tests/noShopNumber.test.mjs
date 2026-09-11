/* The shop's phone number must not appear anywhere in the federation.
 *
 * Owner, 11 September 2026: "never put my nimber in gdsff files 599663232 its
 * only for geotactical market".
 *
 * It had survived in src/content/launchNormalizer.js as half of a
 * find-and-replace pair — a safety net for an old number that no content
 * carries any more. The net did nothing except ship the number to every
 * visitor's browser in the public bundle, where it was live on www.gdsff.com.
 *
 * The federation's number is +995 511 560038. Nothing else.
 *
 *   node --test tests/noShopNumber.test.mjs
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SHOP_NUMBER = /599\s?663\s?232/
const SKIP = new Set(['node_modules', '.git', 'dist', 'dist-ssr', 'tests'])

function walk(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      walk(full, hits)
      continue
    }
    if (!/\.(js|jsx|ts|tsx|json|md|html|css|txt|xml)$/.test(name)) continue
    const text = readFileSync(full, 'utf8')
    text.split('\n').forEach((line, i) => {
      if (SHOP_NUMBER.test(line)) hits.push(`${relative(ROOT, full)}:${i + 1}`)
    })
  }
  return hits
}

test('the shop number appears in no source file', () => {
  assert.deepEqual(walk(ROOT), [])
})

test('the federation number is the one the site publishes', () => {
  const contact = readFileSync(join(ROOT, 'src/siteContent.js'), 'utf8')
  assert.ok(/511\s?560\s?038/.test(contact), 'expected +995 511 560038 in siteContent.js')
})
