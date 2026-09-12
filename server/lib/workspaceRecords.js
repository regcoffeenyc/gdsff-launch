/* Record writers shared by the two runtimes.
 *
 * These lived inside server/index.js, which is not deployed, so the endpoints
 * that use them existed only on a laptop: /api/social/assets/save,
 * /api/templates/save and /api/contacts/save were 404 on gdsff.com and the
 * matching buttons in the workspace failed. Extracted here so the serverless
 * functions and the local server share one implementation, the way
 * socialPosts.js already is.
 */
import { randomUUID } from 'node:crypto'
import { toArray, unique } from './socialPosts.js'

export function saveMediaAsset(state, asset) {
  const now = new Date().toISOString()
  const existingIndex = (state.mediaAssets || []).findIndex((item) => item.id === asset.id)
  const current = existingIndex >= 0 ? state.mediaAssets[existingIndex] : null

  const nextAsset = {
    id: current?.id || asset.id || randomUUID(),
    title: asset.title ?? current?.title ?? 'Untitled asset',
    kind: asset.kind ?? current?.kind ?? 'photo',
    source: asset.source ?? current?.source ?? '',
    tags: unique([...(current?.tags || []), ...toArray(asset.tags)]),
    alt: asset.alt ?? current?.alt ?? '',
    createdAt: current?.createdAt || now,
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    state.mediaAssets[existingIndex] = nextAsset
  } else {
    state.mediaAssets = [nextAsset, ...(state.mediaAssets || [])]
  }

  return nextAsset
}

export function saveTemplate(state, scope, template) {
  if (!['email', 'social'].includes(scope)) {
    throw new Error('Template scope must be "email" or "social".')
  }

  if (!state.templates) {
    state.templates = { email: [], social: [] }
  }

  const collection = Array.isArray(state.templates[scope]) ? state.templates[scope] : []
  const existingIndex = collection.findIndex((item) => item.id === template.id)
  const nextTemplate = {
    ...collection[existingIndex],
    ...template,
    id: template.id || randomUUID(),
  }

  if (existingIndex >= 0) {
    state.templates[scope][existingIndex] = nextTemplate
  } else {
    state.templates[scope] = [nextTemplate, ...collection]
  }

  return nextTemplate
}

/* Matched on id or email, so saving the same person twice does not create a
   second row — the contact list is small and hand-maintained. */
export function saveContact(state, contact) {
  const existingIndex = (state.contacts || []).findIndex(
    (item) => (contact.id && item.id === contact.id) || (contact.email && item.email === contact.email),
  )
  const current = existingIndex >= 0 ? state.contacts[existingIndex] : null

  const nextContact = {
    id: current?.id || contact.id || randomUUID(),
    name: contact.name ?? current?.name ?? '',
    email: contact.email ?? current?.email ?? '',
    phone: contact.phone ?? current?.phone ?? '',
    type: contact.type ?? current?.type ?? 'general',
    organization: contact.organization ?? current?.organization ?? '',
    tags: unique([...(current?.tags || []), ...toArray(contact.tags)]),
    status: contact.status ?? current?.status ?? 'open',
    notes: contact.notes ?? current?.notes ?? '',
    lastContactAt: contact.lastContactAt ?? current?.lastContactAt ?? '',
    createdAt: current?.createdAt || new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    state.contacts[existingIndex] = nextContact
  } else {
    state.contacts = [nextContact, ...(state.contacts || [])]
  }

  return nextContact
}
