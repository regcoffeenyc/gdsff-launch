import { readFileSync, writeFileSync } from 'node:fs'

const statePath = new URL('../server/data/social-state.local.json', import.meta.url)
const state = JSON.parse(readFileSync(statePath, 'utf8'))
const now = new Date().toISOString()

function upsertById(collectionName, item) {
  const collection = Array.isArray(state[collectionName]) ? state[collectionName] : []
  const index = collection.findIndex((entry) => entry.id === item.id)
  if (index >= 0) {
    collection[index] = { ...collection[index], ...item, updatedAt: now }
  } else {
    collection.unshift(item)
  }
  state[collectionName] = collection
}

upsertById('mediaAssets', {
  id: 'printable-target-preview',
  title: 'GDSFF Printable Target Preview',
  kind: 'document-preview',
  source: '/downloads/gdsff-target-facebook-preview.svg',
  tags: ['documents', 'membership', 'target', 'facebook'],
  alt: 'GDSFF printable 1-inch grid target preview',
  createdAt: now,
})

upsertById('socialPosts', {
  id: 'printable-target-download',
  title: 'Printable Target Download and Membership Links',
  category: 'documents',
  platforms: ['facebook'],
  status: 'approved',
  captions: {
    short:
      'Printable Target Download and Membership Links\n\nGDSFF has added an official printable 1-inch grid training target to the documents page.',
    medium:
      'GDSFF has added an official printable 1-inch grid training target to the documents page.\n\nDownload target PDF: https://gdsff.org/downloads/gdsff-printable-target-1in-grid.pdf\nMembership application: https://gdsff.org/membership#online-application\nSafety consent and signature workflow: https://gdsff.org/safety-consent',
    long:
      'GDSFF has added an official printable 1-inch grid training target to the documents page.\n\nDownload target PDF: https://gdsff.org/downloads/gdsff-printable-target-1in-grid.pdf\nMembership application: https://gdsff.org/membership#online-application\nSafety consent and signature workflow: https://gdsff.org/safety-consent\n\nUse only official website links for applications, downloads, and signed consent.\n\nhttps://gdsff.org\noffice@gdsff.org\n+995 511 560038',
  },
  englishCaption: 'GDSFF printable target and membership links are ready for Facebook.',
  hashtags: ['#GDSFF', '#DynamicShooting', '#FunctionalFitness', '#GeorgiaSports', '#ShootingSport', '#FitnessSport'],
  imagePlaceholder: '/media/printable-target-preview',
  mediaAssetIds: ['printable-target-preview'],
  link: 'https://gdsff.org/documents#printable-target',
  approval: {
    approvedBy: 'communications.lead',
    approvedAt: now,
  },
  notes: 'Facebook pinned-post candidate. Publish only from the official Page after owner approval.',
  scheduledFor: '',
  createdAt: now,
  updatedAt: now,
})

state.updatedAt = now
state.activityLog = [
  {
    id: `target-pack-${Date.now()}`,
    type: 'content-update',
    entityType: 'social-post',
    entityId: 'printable-target-download',
    summary: 'Printable target Facebook handoff post added to approved queue.',
    createdAt: now,
  },
  ...(Array.isArray(state.activityLog) ? state.activityLog : []),
].slice(0, 80)

writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
console.log('Upserted printable target social pack into local Social Hub state.')
