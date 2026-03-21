import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { socialHubLaunchPack } from '../src/content/socialHubLaunchPack.js'
import { login, logout, validateSession } from './lib/adminAuth.js'
import { buildReplyDraft, classifyMessage, recommendNextAction } from './lib/emailWorkflow.js'
import { fetchImapInboxMessages, getImapRuntime } from './lib/imapEmail.js'
import { ensureEnvLoaded } from './lib/loadEnv.js'
import { fetchMicrosoftInboxMessages, getMicrosoftGraphEmailRuntime } from './lib/microsoftGraphEmail.js'
import { publishToMeta, summarizeWebhookPayload } from './lib/metaGraph.js'
import { buildMetaAuthUrl, getPlatformCatalog, getRuntimeConfig, metaOAuthScopes } from './lib/platformRegistry.js'
import { processScheduledPosts } from './lib/scheduleQueue.js'
import { generateDraft, generateReplySuggestion, runAssistantChat } from './lib/socialAi.js'
import { getClientState, logActivity, readState, updateState, writeState } from './lib/socialStore.js'
import { getSmtpRuntime, sendSmtpMail } from './lib/smtpEmail.js'

ensureEnvLoaded()

const runtime = getRuntimeConfig()
const allowedOrigins = new Set([
  runtime.clientOrigin,
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
])
const membershipTypeCatalog = new Set(['athlete', 'coach', 'club-representative', 'supporter', 'other'])
const sportInterestCatalog = new Set(['dynamic-shooting', 'functional-fitness', 'both'])
const membershipStatusCatalog = new Set(['submitted', 'under-review', 'approved', 'needs-info', 'closed'])

function createActivityEntry({ type = 'system', entityType, entityId, summary }) {
  return {
    id: randomUUID(),
    type,
    entityType,
    entityId,
    summary,
    createdAt: new Date().toISOString(),
  }
}

function sendJson(response, statusCode, payload, origin) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  response.end(`${JSON.stringify(payload, null, 2)}\n`)
}

function sendText(response, statusCode, text, contentType, origin) {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  response.end(text)
}

function sendHtml(response, statusCode, html, origin) {
  sendText(response, statusCode, html, 'text/html; charset=utf-8', origin)
}

function getOrigin(request) {
  const origin = request.headers.origin
  return origin && allowedOrigins.has(origin) ? origin : '*'
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let raw = ''

    request.on('data', (chunk) => {
      raw += chunk
    })

    request.on('end', () => resolve(raw))
    request.on('error', reject)
  })
}

async function readJson(request) {
  const raw = await readBody(request)
  return raw ? JSON.parse(raw) : {}
}

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function normalizeHashtags(value) {
  return unique(
    toArray(value)
      .flatMap((item) => `${item}`.split(/\s+/))
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function normalizePlatforms(value) {
  const allowed = new Set(['facebook', 'instagram'])
  const items = unique(toArray(value).map((item) => item.toLowerCase()))
  const filtered = items.filter((item) => allowed.has(item))
  return filtered.length ? filtered : ['facebook']
}

function buildCaptionVariants(title, captions) {
  const medium = `${captions?.medium || captions?.caption || ''}`.trim()
  const short = `${captions?.short || medium.split('\n\n')[0] || title || ''}`.trim()
  const long =
    `${captions?.long || medium}`.trim() ||
    `${title}\n\n${socialHubLaunchPack.brand.website}\n${socialHubLaunchPack.brand.email}`

  return {
    short,
    medium,
    long: long.includes(socialHubLaunchPack.brand.website)
      ? long
      : `${long}\n\n${socialHubLaunchPack.brand.website}\n${socialHubLaunchPack.brand.email}`,
  }
}

function formatCsvValue(value) {
  const raw = `${value ?? ''}`
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`
  }

  return raw
}

function buildContactsCsv(contacts) {
  const header = ['name', 'email', 'phone', 'type', 'organization', 'tags', 'status', 'notes', 'lastContactAt']
  const rows = contacts.map((contact) => [
    contact.name,
    contact.email,
    contact.phone,
    contact.type,
    contact.organization,
    Array.isArray(contact.tags) ? contact.tags.join('|') : '',
    contact.status,
    contact.notes,
    contact.lastContactAt,
  ])

  return [header, ...rows].map((row) => row.map(formatCsvValue).join(',')).join('\n')
}

function normalizeMembershipValue(value) {
  return `${value ?? ''}`.trim()
}

function normalizeMembershipEmail(value) {
  return normalizeMembershipValue(value).toLowerCase()
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function buildMembershipReference() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `MEM-${dateStamp}-${randomUUID().split('-')[0].toUpperCase()}`
}

function sanitizeMembershipApplicationInput(input) {
  const applicantInput = input?.applicant && typeof input.applicant === 'object' ? input.applicant : {}
  const applicant = {
    fullName: normalizeMembershipValue(applicantInput.fullName),
    birthDate: normalizeMembershipValue(applicantInput.birthDate),
    personalId: normalizeMembershipValue(applicantInput.personalId),
    citizenship: normalizeMembershipValue(applicantInput.citizenship),
    address: normalizeMembershipValue(applicantInput.address),
    phone: normalizeMembershipValue(applicantInput.phone),
    email: normalizeMembershipEmail(applicantInput.email),
    membershipType: normalizeMembershipValue(applicantInput.membershipType),
    sportInterest: normalizeMembershipValue(applicantInput.sportInterest),
    additionalInfo: normalizeMembershipValue(applicantInput.additionalInfo),
  }

  const requiredFields = [
    'fullName',
    'birthDate',
    'personalId',
    'citizenship',
    'address',
    'phone',
    'email',
    'membershipType',
    'sportInterest',
  ]

  const missingField = requiredFields.find((fieldName) => !hasValue(applicant[fieldName]))
  if (missingField) {
    throw new Error('Please complete all required membership fields before submitting.')
  }

  if (!isValidEmail(applicant.email)) {
    throw new Error('Please enter a valid email address before submitting.')
  }

  if (!membershipTypeCatalog.has(applicant.membershipType)) {
    throw new Error('Membership type is not valid.')
  }

  if (!sportInterestCatalog.has(applicant.sportInterest)) {
    throw new Error('Sport interest is not valid.')
  }

  const confirmations = (Array.isArray(input?.confirmations) ? input.confirmations : []).slice(0, 3).map((item, index) => ({
    label: hasValue(item?.label) ? `${item.label}`.trim() : `Confirmation ${index + 1}`,
    accepted: Boolean(item?.accepted),
  }))

  if (confirmations.length < 3 || confirmations.some((item) => !item.accepted)) {
    throw new Error('All required confirmations must be accepted before submitting.')
  }

  return {
    locale: normalizeMembershipValue(input?.locale) === 'ka' ? 'ka' : 'en',
    source: normalizeMembershipValue(input?.source) || 'website',
    applicant,
    confirmations,
  }
}

function buildMembershipSummary(state) {
  const applications = [...(state.membershipApplications || [])].sort(
    (left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime(),
  )
  const statusCounts = {
    submitted: 0,
    'under-review': 0,
    approved: 0,
    'needs-info': 0,
    closed: 0,
  }

  const typeCounts = {
    athlete: 0,
    coach: 0,
    'club-representative': 0,
    supporter: 0,
    other: 0,
  }

  for (const application of applications) {
    if (statusCounts[application.status] !== undefined) {
      statusCounts[application.status] += 1
    }

    if (typeCounts[application.applicant?.membershipType] !== undefined) {
      typeCounts[application.applicant.membershipType] += 1
    }
  }

  return {
    totalApplications: applications.length,
    statusCounts,
    typeCounts,
    lastSubmittedAt: applications[0]?.submittedAt || '',
  }
}

function buildMembershipNotificationRecipients() {
  const configuredRecipients =
    process.env.EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS ||
    process.env.MEMBERSHIP_NOTIFICATION_ADDRESS ||
    runtime.membershipNotificationAddress ||
    'metreveligod@gmail.com'

  return unique(toArray(configuredRecipients))
}

function buildMembershipNotificationSubject(application) {
  return `GDSFF Membership Application ${application.reference}`
}

function humanizeMembershipValue(value) {
  return `${value || ''}`
    .split('-')
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ')
}

function buildMembershipNotificationText(application) {
  const applicant = application.applicant || {}
  const confirmations = Array.isArray(application.confirmations) ? application.confirmations : []
  const details = [
    'Georgian Dynamic Shooting & Functional Fitness Federation',
    'New membership application received from the website.',
    '',
    `Reference: ${application.reference}`,
    `Submitted At: ${application.submittedAt}`,
    `Status: ${application.status}`,
    `Locale: ${application.locale}`,
    `Source: ${application.source}`,
    '',
    'Applicant Details',
    `Full Name / სახელი და გვარი: ${applicant.fullName || ''}`,
    `Date of Birth / დაბადების თარიღი: ${applicant.birthDate || ''}`,
    `Personal ID Number / პირადი ნომერი: ${applicant.personalId || ''}`,
    `Citizenship / მოქალაქეობა: ${applicant.citizenship || ''}`,
    `Address / მისამართი: ${applicant.address || ''}`,
    `Phone Number / ტელეფონის ნომერი: ${applicant.phone || ''}`,
    `Email / ელფოსტა: ${applicant.email || ''}`,
    `Membership Type / წევრობის ტიპი: ${humanizeMembershipValue(applicant.membershipType)}`,
    `Sport Interest / სპორტული მიმართულება: ${humanizeMembershipValue(applicant.sportInterest)}`,
    `Additional Information / დამატებითი ინფორმაცია: ${applicant.additionalInfo || '-'}`,
    '',
    'Required Confirmations / სავალდებულო დადასტურებები',
    ...confirmations.map((item) => `- ${item.accepted ? 'Accepted' : 'Not accepted'}: ${item.label}`),
    '',
    'This application is already stored in the GDSFF online membership register.',
  ]

  return details.join('\n')
}

function buildMembershipNotificationRecord(notification) {
  const recipients = Array.isArray(notification.recipients) ? notification.recipients : []

  return {
    status: notification.status,
    recipients,
    recipientLabel: recipients.join(', '),
    sentAt: notification.sentAt || '',
    updatedAt: notification.updatedAt,
    message: notification.message || '',
  }
}

function membershipNotificationWasDelivered(notification) {
  return notification?.status === 'sent'
}

function buildMembershipNotificationFailureMessage(application, notification) {
  const reference = application?.reference ? `Reference ${application.reference}. ` : ''
  const baseMessage =
    notification?.status === 'not-configured'
      ? 'The application was stored, but email delivery is not configured on the server.'
      : 'The application was stored, but email delivery failed.'

  return `${baseMessage} ${reference}Please do not submit the form again. Contact the federation and mention this reference if needed.`.trim()
}

async function sendMembershipNotification(application) {
  const smtpRuntime = getSmtpRuntime()
  const recipients = buildMembershipNotificationRecipients()

  if (!recipients.length) {
    const notification = {
      status: 'not-configured',
      recipients: [],
      updatedAt: new Date().toISOString(),
      message: 'No membership notification recipient is configured for outgoing email.',
    }

    console.error('[membership-email] delivery issue', {
      reference: application?.reference || '',
      status: notification.status,
      recipients: notification.recipients,
      message: notification.message,
      smtp: smtpRuntime,
    })
    return notification
  }

  if (!smtpRuntime.configured) {
    const notification = {
      status: 'not-configured',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        'Outgoing membership email is not configured on the server yet. Set SMTP credentials to deliver each application to the federation inbox.',
    }

    console.error('[membership-email] delivery issue', {
      reference: application?.reference || '',
      status: notification.status,
      recipients: notification.recipients,
      message: notification.message,
      smtp: smtpRuntime,
    })
    return notification
  }

  try {
    await sendSmtpMail({
      to: recipients,
      replyTo: application.applicant?.email || '',
      subject: buildMembershipNotificationSubject(application),
      text: buildMembershipNotificationText(application),
      headers: {
        'X-GDSFF-Application-Reference': application.reference,
      },
    })

    return {
      status: 'sent',
      recipients,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: `Delivered to ${recipients.join(', ')}.`,
    }
  } catch (error) {
    const notification = {
      status: 'failed',
      recipients,
      updatedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? error.message
          : 'Outgoing membership email could not be delivered from the server.',
    }

    console.error('[membership-email] delivery issue', {
      reference: application?.reference || '',
      status: notification.status,
      recipients: notification.recipients,
      message: notification.message,
      smtp: smtpRuntime,
    })
    return notification
  }
}

function syncContactFromMembershipApplication(state, application) {
  const emailKey = normalizeMembershipEmail(application?.applicant?.email)
  if (!emailKey) {
    return
  }

  const existingIndex = (state.contacts || []).findIndex(
    (contact) => normalizeMembershipEmail(contact.email) === emailKey,
  )
  const current = existingIndex >= 0 ? state.contacts[existingIndex] : null
  const nextContact = {
    id: current?.id || randomUUID(),
    name: application.applicant.fullName || current?.name || application.applicant.email,
    email: application.applicant.email,
    phone: application.applicant.phone || current?.phone || '',
    type: 'member',
    organization: current?.organization || '',
    tags: unique([
      ...(current?.tags || []),
      'membership-application',
      application.applicant.membershipType,
      application.applicant.sportInterest,
    ]),
    status: application.status === 'approved' ? 'active' : 'follow-up',
    notes: current?.notes || '',
    lastContactAt: application.updatedAt || application.submittedAt,
    createdAt: current?.createdAt || application.submittedAt,
  }

  if (existingIndex >= 0) {
    state.contacts[existingIndex] = nextContact
  } else {
    state.contacts = [nextContact, ...(state.contacts || [])]
  }
}

function buildDashboardPayload(session) {
  const clientState = getClientState()
  const fullState = clientState.state
  const m365Runtime = getMicrosoftGraphEmailRuntime()
  const imapRuntime = getImapRuntime()
  const smtpRuntime = getSmtpRuntime()

  return {
    ok: true,
    runtime: {
      apiPort: runtime.apiPort,
      openAiConfigured: runtime.openAiConfigured,
      openaiModel: runtime.openaiModel,
      metaAppConfigured: runtime.metaAppIdConfigured && runtime.metaAppSecretConfigured,
      metaRedirectUri: runtime.metaRedirectUri,
      metaVerifyTokenConfigured: runtime.metaVerifyTokenConfigured,
      metaPageAccessTokenConfigured: runtime.metaPageAccessTokenConfigured,
      metaInstagramAccessTokenConfigured: runtime.metaInstagramAccessTokenConfigured || runtime.metaPageAccessTokenConfigured,
      emailProvider: runtime.emailProvider,
      emailInboxAddress: runtime.emailInboxAddress,
      emailOutboundAddress: runtime.emailOutboundAddress,
      membershipNotificationAddress: runtime.membershipNotificationAddress,
      m365Configured: m365Runtime.configured,
      m365TenantConfigured: m365Runtime.tenantConfigured,
      m365ClientConfigured: m365Runtime.clientConfigured,
      m365ClientSecretConfigured: m365Runtime.clientSecretConfigured,
      m365MailboxConfigured: m365Runtime.mailboxConfigured,
      imapConfigured: imapRuntime.configured,
      imapHost: imapRuntime.host,
      imapPort: imapRuntime.port,
      imapUsernameConfigured: imapRuntime.usernameConfigured,
      imapPasswordConfigured: imapRuntime.passwordConfigured,
      smtpConfigured: smtpRuntime.configured,
      smtpHost: smtpRuntime.host,
      smtpPort: smtpRuntime.port,
      smtpSecure: smtpRuntime.secure,
      smtpStartTls: smtpRuntime.startTls,
      smtpUsernameConfigured: smtpRuntime.usernameConfigured,
      smtpPasswordConfigured: smtpRuntime.passwordConfigured,
    },
    platforms: getPlatformCatalog(fullState),
    auth: {
      authenticated: Boolean(session?.authenticated),
      authConfigured: Boolean(session?.authConfigured),
      setupMode: Boolean(session?.setupMode),
      user: session?.user || null,
      metaAuthUrl: buildMetaAuthUrl(),
      scopes: metaOAuthScopes,
    },
    ...clientState,
  }
}

function ensureAuthorized(request, response, origin) {
  const session = validateSession(request)

  if (!session.authenticated) {
    sendJson(
      response,
      401,
      {
        ok: false,
        error: 'Authentication required.',
        auth: {
          authenticated: false,
          authConfigured: session.authConfigured,
          setupMode: session.setupMode,
        },
      },
      origin,
    )
    return null
  }

  return session
}

function syncContactFromMessage(state, message) {
  const classification = classifyMessage(message)
  const contactType = classification.contactType || 'general'
  const emailKey = `${message.fromEmail || ''}`.trim().toLowerCase()

  if (!emailKey) {
    return
  }

  const existingIndex = (state.contacts || []).findIndex((contact) => `${contact.email || ''}`.trim().toLowerCase() === emailKey)
  const current = existingIndex >= 0 ? state.contacts[existingIndex] : null

  const nextContact = {
    id: current?.id || randomUUID(),
    name: message.fromName || current?.name || message.fromEmail,
    email: message.fromEmail,
    phone: current?.phone || '',
    type: current?.type || contactType,
    organization: current?.organization || message.organization || message.fromName || '',
    tags: unique([...(current?.tags || []), ...(message.tags || []), ...classification.tags]),
    status: ['replied', 'closed', 'archived'].includes(message.status) ? 'active' : message.followUpNeeded ? 'follow-up' : 'open',
    notes: current?.notes || '',
    lastContactAt: message.lastUpdatedAt || message.receivedAt,
    createdAt: current?.createdAt || message.receivedAt || new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    state.contacts[existingIndex] = nextContact
  } else {
    state.contacts = [nextContact, ...(state.contacts || [])]
  }
}

function findMessageIndex(state, input) {
  const provider = input.external?.provider || ''
  const providerMessageId = input.external?.providerMessageId || ''
  const internetMessageId = input.external?.internetMessageId || ''

  return (state.messages || []).findIndex((message) => {
    if (hasValue(input.id) && message.id === input.id) {
      return true
    }

    if (hasValue(provider) && hasValue(providerMessageId) && message.external?.provider === provider && message.external?.providerMessageId === providerMessageId) {
      return true
    }

    if (hasValue(provider) && hasValue(internetMessageId) && message.external?.provider === provider && message.external?.internetMessageId === internetMessageId) {
      return true
    }

    return false
  })
}

function buildMessageRecord(state, input) {
  const now = new Date().toISOString()
  const existingIndex = findMessageIndex(state, input)
  const current = existingIndex >= 0 ? state.messages[existingIndex] : null
  const classified = classifyMessage({
    subject: input.subject ?? current?.subject ?? '',
    body: input.body ?? current?.body ?? '',
  })
  const historyType = input.source === 'microsoft365' ? 'synced' : current ? 'updated' : 'received'
  const historySummary =
    input.source === 'microsoft365'
      ? current
        ? 'Inbox message synced from Microsoft 365.'
        : 'Inbox message imported from Microsoft 365.'
      : current
        ? 'Message record updated.'
        : 'Message record created.'

  const nextMessage = {
    id: current?.id || randomUUID(),
    subject: input.subject ?? current?.subject ?? '',
    body: input.body ?? current?.body ?? '',
    fromName: input.fromName ?? current?.fromName ?? '',
    fromEmail: input.fromEmail ?? current?.fromEmail ?? '',
    classification: input.classification ?? current?.classification ?? classified.classification,
    status: input.status ?? current?.status ?? 'new',
    priority: input.priority ?? current?.priority ?? classified.priority,
    notes: input.notes ?? current?.notes ?? '',
    tags: unique([...(current?.tags || []), ...classified.tags, ...toArray(input.tags)]),
    replyDraftId: current?.replyDraftId || '',
    replyDraft: input.replyDraft ?? current?.replyDraft ?? null,
    receivedAt: current?.receivedAt || input.receivedAt || now,
    lastUpdatedAt: now,
    assignedTo: input.assignedTo ?? current?.assignedTo ?? '',
    history: [...(current?.history || [])],
    source: input.source ?? current?.source ?? 'manual',
    external: {
      provider: input.external?.provider ?? current?.external?.provider ?? '',
      providerMessageId: input.external?.providerMessageId ?? current?.external?.providerMessageId ?? '',
      internetMessageId: input.external?.internetMessageId ?? current?.external?.internetMessageId ?? '',
      threadId: input.external?.threadId ?? current?.external?.threadId ?? '',
      webLink: input.external?.webLink ?? current?.external?.webLink ?? '',
    },
  }

  nextMessage.history.push({
    id: randomUUID(),
    type: historyType,
    summary: historySummary,
    createdAt: now,
  })

  if (existingIndex >= 0) {
    state.messages[existingIndex] = nextMessage
  } else {
    state.messages = [nextMessage, ...(state.messages || [])]
  }

  syncContactFromMessage(state, nextMessage)
  return nextMessage
}

function upsertSocialPost(state, input) {
  const now = new Date().toISOString()
  const existingIndex = (state.socialPosts || []).findIndex((post) => post.id === input.id)
  const current = existingIndex >= 0 ? state.socialPosts[existingIndex] : null
  const captions = buildCaptionVariants(input.title ?? current?.title ?? '', input.captions || current?.captions || input)
  const status = input.status ?? current?.status ?? 'draft'
  const approved = status === 'approved' || status === 'scheduled'

  const nextPost = {
    id: current?.id || randomUUID(),
    title: input.title ?? current?.title ?? 'Untitled social post',
    category: input.category ?? current?.category ?? 'announcement',
    platforms: normalizePlatforms(input.platforms ?? current?.platforms ?? ['facebook']),
    status,
    captions,
    englishCaption: input.englishCaption ?? current?.englishCaption ?? '',
    hashtags: normalizeHashtags(input.hashtags ?? current?.hashtags ?? socialHubLaunchPack.hashtags.slice(0, 5)),
    imagePlaceholder: input.imagePlaceholder ?? current?.imagePlaceholder ?? '',
    mediaAssetIds: unique(toArray(input.mediaAssetIds ?? current?.mediaAssetIds ?? [])),
    link: input.link ?? current?.link ?? socialHubLaunchPack.brand.website,
    approval: {
      approvedBy: approved ? input.approvedBy || current?.approval?.approvedBy || 'admin' : '',
      approvedAt: approved ? input.approvedAt || current?.approval?.approvedAt || now : '',
    },
    notes: input.notes ?? current?.notes ?? '',
    scheduledFor: input.scheduledFor ?? current?.scheduledFor ?? '',
    createdAt: current?.createdAt || now,
    updatedAt: now,
    publishedAt: input.publishedAt ?? current?.publishedAt ?? '',
  }

  if (existingIndex >= 0) {
    state.socialPosts[existingIndex] = nextPost
  } else {
    state.socialPosts = [nextPost, ...(state.socialPosts || [])]
  }

  return nextPost
}

function schedulePostInQueue(state, postId, platforms, scheduledFor, dryRun = true, imageUrl = '') {
  const post = (state.socialPosts || []).find((item) => item.id === postId)
  if (!post) {
    throw new Error('Social post not found.')
  }

  const queuePlatforms = normalizePlatforms(platforms?.length ? platforms : post.platforms)
  const now = new Date().toISOString()

  post.status = 'scheduled'
  post.scheduledFor = scheduledFor
  post.updatedAt = now

  for (const platform of queuePlatforms) {
    const currentIndex = (state.scheduledPosts || []).findIndex((item) => item.postId === postId && item.platform === platform)
    const queueItem = {
      id: currentIndex >= 0 ? state.scheduledPosts[currentIndex].id : randomUUID(),
      postId,
      title: post.title,
      platform,
      scheduledFor,
      status: 'scheduled',
      dryRun: dryRun !== false,
      imageUrl: imageUrl || post.imagePlaceholder || '',
      lastProcessedAt: '',
      lastResult: null,
      createdAt: currentIndex >= 0 ? state.scheduledPosts[currentIndex].createdAt : now,
    }

    if (currentIndex >= 0) {
      state.scheduledPosts[currentIndex] = queueItem
    } else {
      state.scheduledPosts = [queueItem, ...(state.scheduledPosts || [])]
    }
  }

  return post
}

function saveMediaAsset(state, asset) {
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

function saveTemplate(state, scope, template) {
  if (!['email', 'social'].includes(scope)) {
    throw new Error('Template scope must be "email" or "social".')
  }

  const collection = Array.isArray(state.templates?.[scope]) ? state.templates[scope] : []
  const existingIndex = collection.findIndex((item) => item.id === template.id)
  const nextTemplate = {
    ...collection[existingIndex],
    ...template,
    id: template.id || randomUUID(),
  }

  if (!state.templates) {
    state.templates = { email: [], social: [] }
  }

  if (existingIndex >= 0) {
    state.templates[scope][existingIndex] = nextTemplate
  } else {
    state.templates[scope] = [nextTemplate, ...collection]
  }

  return nextTemplate
}

function applySettingsUpdate(state, body) {
  if (body.meta) {
    state.settings.meta = {
      ...state.settings.meta,
      ...body.meta,
    }
  }

  if (body.email) {
    state.settings.email = {
      ...state.settings.email,
      ...body.email,
    }
  }

  if (body.automation) {
    state.settings.automation = {
      ...state.settings.automation,
      ...body.automation,
    }
  }

  return state.settings
}

const server = createServer(async (request, response) => {
  const origin = getOrigin(request)

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, { ok: true }, origin)
    return
  }

  const url = new URL(request.url || '/', `http://${request.headers.host}`)

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, service: 'gdsff-media-communications-bot', port: runtime.apiPort }, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      const session = validateSession(request)
      sendJson(
        response,
        200,
        {
          ok: true,
          auth: {
            authenticated: session.authenticated,
            authConfigured: session.authConfigured,
            setupMode: session.setupMode,
            user: session.user,
          },
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readJson(request)
      const result = login(body.username, body.password)

      updateState((state) => {
        state.auth.lastLoginAt = new Date().toISOString()
        return state
      })

      logActivity(
        createActivityEntry({
          type: 'auth',
          entityType: 'session',
          entityId: result.user.username,
          summary: `Admin session opened for ${result.user.username}.`,
        }),
      )

      sendJson(response, 200, { ok: true, ...result }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const session = validateSession(request)
      const result = logout(request)

      if (session.authenticated) {
        logActivity(
          createActivityEntry({
            type: 'auth',
            entityType: 'session',
            entityId: session.user?.username || 'admin',
            summary: `Admin session closed for ${session.user?.username || 'admin'}.`,
          }),
        )
      }

      sendJson(response, 200, result, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/meta/webhook') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      if (mode === 'subscribe' && challenge && token && process.env.META_VERIFY_TOKEN && token === process.env.META_VERIFY_TOKEN) {
        sendText(response, 200, challenge, 'text/plain; charset=utf-8', origin)
        return
      }

      sendJson(response, 403, { ok: false, error: 'Webhook verification failed.' }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/meta/webhook') {
      const body = await readJson(request)
      const summary = summarizeWebhookPayload(body)

      updateState((state) => {
        const entries = Array.isArray(state.webhooks) ? state.webhooks : []
        state.webhooks = [{ id: randomUUID(), ...summary }, ...entries].slice(0, 20)
        return state
      })

      logActivity(
        createActivityEntry({
          type: 'webhook',
          entityType: 'meta',
          entityId: summary.object,
          summary: summary.summary,
        }),
      )

      sendJson(response, 200, { ok: true, received: true }, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/membership/summary') {
      const state = readState()
      sendJson(response, 200, { ok: true, summary: buildMembershipSummary(state) }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/membership/applications') {
      const body = await readJson(request)
      const sanitized = sanitizeMembershipApplicationInput(body)
      let savedApplication = null

      updateState((state) => {
        const now = new Date().toISOString()
        savedApplication = {
          id: randomUUID(),
          reference: buildMembershipReference(),
          locale: sanitized.locale,
          source: sanitized.source,
          status: 'submitted',
          submittedAt: now,
          updatedAt: now,
          applicant: sanitized.applicant,
          confirmations: sanitized.confirmations,
          reviewNote: '',
          notification: {
            status: 'pending',
            recipients: buildMembershipNotificationRecipients(),
            recipientLabel: buildMembershipNotificationRecipients().join(', '),
            sentAt: '',
            updatedAt: now,
            message: 'Membership application saved. Waiting for email delivery.',
          },
          history: [
            {
              id: randomUUID(),
              type: 'submitted',
              summary: 'Membership application submitted through the website registration form.',
              createdAt: now,
            },
          ],
        }

        state.membershipApplications = [savedApplication, ...(state.membershipApplications || [])]
        syncContactFromMembershipApplication(state, savedApplication)
        state.activityLog = [
          createActivityEntry({
            type: 'membership',
            entityType: 'membership-application',
            entityId: savedApplication.id,
            summary: `Membership application ${savedApplication.reference} was received from ${savedApplication.applicant.fullName}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      const notification = await sendMembershipNotification(savedApplication)
      const notificationRecord = buildMembershipNotificationRecord(notification)
      const nextState = updateState((state) => {
        const applications = Array.isArray(state.membershipApplications) ? state.membershipApplications : []
        const targetApplication = applications.find((item) => item.id === savedApplication.id)
        const historyList = Array.isArray(targetApplication?.history) ? targetApplication.history : []
        const historyEntry = {
          id: randomUUID(),
          type: notification.status === 'sent' ? 'notification-sent' : 'notification-warning',
          summary:
            notification.status === 'sent'
              ? `Application notification emailed to ${notificationRecord.recipientLabel}.`
              : `Application stored, but email delivery was not confirmed. ${notificationRecord.message}`,
          createdAt: notificationRecord.updatedAt,
        }

        if (targetApplication) {
          targetApplication.notification = notificationRecord
          targetApplication.updatedAt = notificationRecord.updatedAt
          targetApplication.history = [historyEntry, ...historyList].slice(0, 12)
          savedApplication = structuredClone(targetApplication)
        } else {
          savedApplication = {
            ...savedApplication,
            notification: notificationRecord,
            updatedAt: notificationRecord.updatedAt,
            history: [historyEntry, ...(savedApplication.history || [])].slice(0, 12),
          }
        }

        state.activityLog = [
          createActivityEntry({
            type: notification.status === 'sent' ? 'membership-email' : 'membership-warning',
            entityType: 'membership-application',
            entityId: savedApplication.id,
            summary:
              notification.status === 'sent'
                ? `Membership application ${savedApplication.reference} was emailed to ${notificationRecord.recipientLabel}.`
                : `Membership application ${savedApplication.reference} was stored, but email delivery was not confirmed.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      const summary = buildMembershipSummary(nextState)

      if (!membershipNotificationWasDelivered(notificationRecord)) {
        sendJson(
          response,
          502,
          {
            ok: false,
            error: buildMembershipNotificationFailureMessage(savedApplication, notificationRecord),
            stored: true,
            application: savedApplication,
            summary,
            notification: notificationRecord,
          },
          origin,
        )
        return
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          application: savedApplication,
          summary,
          notification: notificationRecord,
        },
        origin,
      )
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/meta/auth/callback') {
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error_message')

      updateState((state) => {
        state.auth.lastCallbackAt = new Date().toISOString()
        state.auth.lastCallbackCode = code || ''
        return state
      })

      const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GDSFF Media & Communications Bot Callback</title>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; background: #0d0f12; color: #f5f0e7; padding: 40px; }
      .panel { max-width: 760px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 24px; background: rgba(255,255,255,0.04); }
      code { color: #f2ddb0; }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>GDSFF Media & Communications Bot</h1>
      <p>The OAuth callback was received. Token exchange and secure storage still need to be implemented before production publishing is enabled.</p>
      <p><strong>Code received:</strong> ${code ? 'yes' : 'no'}</p>
      ${error ? `<p><strong>Error:</strong> ${error}</p>` : ''}
      <p>Configure <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, and a secure token store before enabling live account control.</p>
    </div>
  </body>
</html>`

      sendHtml(response, 200, html, origin)
      return
    }

    const session = ensureAuthorized(request, response, origin)
    if (!session) {
      return
    }

    if (request.method === 'GET' && (url.pathname === '/api/social/state' || url.pathname === '/api/admin/state' || url.pathname === '/api/platforms')) {
      sendJson(response, 200, buildDashboardPayload(session), origin)
      return
    }

    if (request.method === 'POST' && (url.pathname === '/api/social/settings' || url.pathname === '/api/admin/settings')) {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        applySettingsUpdate(state, body)
        return state
      })

      logActivity(
        createActivityEntry({
          type: 'settings',
          entityType: 'settings',
          entityId: 'workspace',
          summary: 'Communications settings were updated.',
        }),
      )

      sendJson(response, 200, { ok: true, settings: nextState.settings }, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/membership/applications') {
      const state = readState()
      const applications = [...(state.membershipApplications || [])].sort(
        (left, right) => new Date(right.submittedAt || 0).getTime() - new Date(left.submittedAt || 0).getTime(),
      )

      sendJson(
        response,
        200,
        {
          ok: true,
          applications,
          summary: buildMembershipSummary(state),
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/membership/applications/status') {
      const body = await readJson(request)
      const nextStatus = normalizeMembershipValue(body.status)
      const targetId = normalizeMembershipValue(body.id)
      const reviewNote = normalizeMembershipValue(body.reviewNote || body.note)

      if (!hasValue(targetId)) {
        throw new Error('Membership application id is required.')
      }

      if (!membershipStatusCatalog.has(nextStatus)) {
        throw new Error('Membership application status is not valid.')
      }

      let updatedApplication = null
      const nextState = updateState((state) => {
        updatedApplication = (state.membershipApplications || []).find(
          (item) => item.id === targetId || item.reference === targetId,
        )

        if (!updatedApplication) {
          throw new Error('Membership application not found.')
        }

        const now = new Date().toISOString()
        updatedApplication.status = nextStatus
        updatedApplication.updatedAt = now
        updatedApplication.reviewNote = reviewNote
        updatedApplication.reviewedBy = session.user?.username || 'admin'
        updatedApplication.history = [
          ...(updatedApplication.history || []),
          {
            id: randomUUID(),
            type: 'status',
            summary: reviewNote
              ? `Application moved to ${nextStatus}. Note: ${reviewNote}`
              : `Application moved to ${nextStatus}.`,
            createdAt: now,
          },
        ]

        syncContactFromMembershipApplication(state, updatedApplication)
        state.activityLog = [
          createActivityEntry({
            type: 'membership',
            entityType: 'membership-application',
            entityId: updatedApplication.id,
            summary: `Membership application ${updatedApplication.reference} moved to ${nextStatus}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(
        response,
        200,
        {
          ok: true,
          application: updatedApplication,
          summary: buildMembershipSummary(nextState),
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/assistant') {
      const body = await readJson(request)
      const assistantResult = await runAssistantChat(body)

      updateState((state) => {
        const items = Array.isArray(state.assistantSessions) ? state.assistantSessions : []
        state.assistantSessions = [
          {
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            prompt: body.messages?.[body.messages.length - 1]?.content || '',
            reply: assistantResult.message,
          },
          ...items,
        ].slice(0, 10)
        return state
      })

      sendJson(
        response,
        200,
        {
          ok: true,
          reply: assistantResult.message,
          model: runtime.openAiConfigured ? runtime.openaiModel : 'fallback-assistant',
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/draft') {
      const body = await readJson(request)
      const draft = await generateDraft(body)

      updateState((state) => {
        const items = Array.isArray(state.drafts) ? state.drafts : []
        state.drafts = [
          {
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            platform: body.platform || 'facebook',
            objective: body.objective || '',
            draft,
          },
          ...items,
        ].slice(0, 12)
        return state
      })

      sendJson(
        response,
        200,
        {
          ok: true,
          draft,
          model: runtime.openAiConfigured ? runtime.openaiModel : 'fallback-draft',
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/reply') {
      const body = await readJson(request)
      const suggestion = await generateReplySuggestion(body)

      updateState((state) => {
        const items = Array.isArray(state.replies) ? state.replies : []
        state.replies = [
          {
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            platform: body.platform || 'facebook',
            incomingMessage: body.incomingMessage || '',
            suggestion,
          },
          ...items,
        ].slice(0, 12)
        return state
      })

      sendJson(
        response,
        200,
        {
          ok: true,
          suggestion,
          model: runtime.openAiConfigured ? runtime.openaiModel : 'fallback-reply',
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/social/posts/save') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const post = upsertSocialPost(state, body.post || {})

        state.activityLog = [
          createActivityEntry({
            type: 'social',
            entityType: 'social-post',
            entityId: post.id,
            summary: `Social post "${post.title}" was saved with status ${post.status}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, socialPosts: nextState.socialPosts }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/social/posts/status') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const post = (state.socialPosts || []).find((item) => item.id === body.id)
        if (!post) {
          throw new Error('Social post not found.')
        }

        post.status = body.status || post.status
        post.updatedAt = new Date().toISOString()

        if (post.status === 'approved' || post.status === 'scheduled') {
          post.approval = {
            approvedBy: body.approvedBy || post.approval?.approvedBy || session.user?.username || 'admin',
            approvedAt: post.approval?.approvedAt || new Date().toISOString(),
          }
        }

        state.activityLog = [
          createActivityEntry({
            type: 'social',
            entityType: 'social-post',
            entityId: post.id,
            summary: `Social post "${post.title}" moved to ${post.status}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, socialPosts: nextState.socialPosts }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/social/queue/schedule') {
      const body = await readJson(request)
      if (!hasValue(body.postId) || !hasValue(body.scheduledFor)) {
        throw new Error('postId and scheduledFor are required.')
      }

      const nextState = updateState((state) => {
        const post = schedulePostInQueue(
          state,
          body.postId,
          body.platforms || body.platform,
          body.scheduledFor,
          body.dryRun,
          body.imageUrl,
        )

        state.activityLog = [
          createActivityEntry({
            type: 'queue',
            entityType: 'scheduled-post',
            entityId: post.id,
            summary: `Scheduled "${post.title}" for ${body.scheduledFor}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, scheduledPosts: nextState.scheduledPosts }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/social/queue/process') {
      const body = await readJson(request)
      const draft = readState()
      const results = await processScheduledPosts({
        state: draft,
        publishFn: publishToMeta,
        dryRunOverride: body.dryRun,
      })

      for (const item of results) {
        draft.publishHistory = [
          {
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            platform: item.platform || 'unknown',
            dryRun: item.dryRun !== false,
            message: '',
            imageUrl: '',
            result: item,
          },
          ...(draft.publishHistory || []),
        ].slice(0, 20)

        draft.activityLog = [
          createActivityEntry({
            type: 'queue',
            entityType: 'scheduled-post',
            entityId: item.id,
            summary: item.status === 'error' ? `Queue processing failed: ${item.error}` : `Queue item processed for ${item.platform}.`,
          }),
          ...(draft.activityLog || []),
        ].slice(0, 80)
      }

      writeState(draft)

      sendJson(response, 200, { ok: true, results }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/social/assets/save') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const asset = saveMediaAsset(state, body.asset || {})

        state.activityLog = [
          createActivityEntry({
            type: 'media',
            entityType: 'media-asset',
            entityId: asset.id,
            summary: `Media asset "${asset.title}" was saved to the library.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, mediaAssets: nextState.mediaAssets }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/email/messages/save') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const message = buildMessageRecord(state, body.message || {})

        state.activityLog = [
          createActivityEntry({
            type: 'email',
            entityType: 'message',
            entityId: message.id,
            summary: `Inbox message "${message.subject}" was saved with status ${message.status}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, messages: nextState.messages, contacts: nextState.contacts }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/email/sync') {
      const body = await readJson(request)
      const currentState = readState()
      const configuredProvider = (currentState.settings?.email?.provider || runtime.emailProvider || 'manual').toLowerCase()
      const provider = `${body.provider || configuredProvider}`.toLowerCase()
      const limit = Math.max(1, Math.min(Number(body.limit) || 25, 100))
      const pageUrl = body.pageUrl || currentState.settings?.email?.nextSyncCursor || ''
      const mailboxAddress = body.mailboxAddress || currentState.settings?.email?.inboxAddress || runtime.emailInboxAddress

      if (!['microsoft365', 'titan', 'imap'].includes(provider)) {
        throw new Error('Email sync provider is not supported. Use microsoft365, titan, or imap.')
      }

      let syncResult
      try {
        if (provider === 'microsoft365') {
          syncResult = await fetchMicrosoftInboxMessages({
            mailboxAddress,
            limit,
            pageUrl,
          })
        } else {
          syncResult = await fetchImapInboxMessages({
            provider,
            limit,
          })
        }
      } catch (syncError) {
        updateState((state) => {
          state.settings.email = {
            ...state.settings.email,
            provider,
            providerStatus: 'error',
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'error',
            lastSyncCount: 0,
            lastSyncError: syncError instanceof Error ? syncError.message : 'Inbox sync failed.',
            lastSyncProvider: provider,
          }
          return state
        })

        throw syncError
      }

      let createdCount = 0
      let updatedCount = 0

      const nextState = updateState((state) => {
        for (const incoming of syncResult.messages) {
          const existingIndex = findMessageIndex(state, incoming)
          buildMessageRecord(state, incoming)
          if (existingIndex >= 0) {
            updatedCount += 1
          } else {
            createdCount += 1
          }
        }

        state.settings.email = {
          ...state.settings.email,
          inboxAddress: syncResult.mailboxAddress,
          provider,
          providerStatus: 'connected',
          lastSyncAt: syncResult.syncedAt,
          lastSyncStatus: 'success',
          lastSyncCount: syncResult.fetchedCount,
          lastSyncError: '',
          lastSyncProvider: provider,
          nextSyncCursor: syncResult.nextPageUrl || '',
        }

        state.activityLog = [
          createActivityEntry({
            type: 'email-sync',
            entityType: 'inbox',
            entityId: syncResult.mailboxAddress,
            summary: `${provider.toUpperCase()} inbox sync completed: ${syncResult.fetchedCount} fetched, ${createdCount} new, ${updatedCount} updated.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(
        response,
        200,
        {
          ok: true,
          provider,
          mailboxAddress: syncResult.mailboxAddress,
          fetchedCount: syncResult.fetchedCount,
          createdCount,
          updatedCount,
          nextPageUrl: syncResult.nextPageUrl,
          settings: nextState.settings.email,
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/email/messages/classify') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const message = (state.messages || []).find((item) => item.id === body.id)
        if (!message) {
          throw new Error('Message not found.')
        }

        const classification = classifyMessage(message)
        message.classification = classification.classification
        message.priority = classification.priority
        message.tags = unique([...(message.tags || []), ...classification.tags])
        message.lastUpdatedAt = new Date().toISOString()
        message.history = [
          ...(message.history || []),
          {
            id: randomUUID(),
            type: 'classified',
            summary: `Message classified as ${classification.classification}.`,
            createdAt: new Date().toISOString(),
          },
        ]

        syncContactFromMessage(state, message)
        return state
      })

      sendJson(response, 200, { ok: true, messages: nextState.messages }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/email/messages/reply-draft') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const message = (state.messages || []).find((item) => item.id === body.id)
        if (!message) {
          throw new Error('Message not found.')
        }

        const replyDraft = buildReplyDraft(message, state.templates?.email || [])
        message.replyDraft = {
          ...replyDraft,
          nextAction: recommendNextAction(message),
          createdAt: new Date().toISOString(),
        }
        message.lastUpdatedAt = new Date().toISOString()
        message.history = [
          ...(message.history || []),
          {
            id: randomUUID(),
            type: 'reply-draft',
            summary: 'Reply draft generated and saved.',
            createdAt: new Date().toISOString(),
          },
        ]

        return state
      })

      const savedMessage = nextState.messages.find((item) => item.id === body.id)
      sendJson(response, 200, { ok: true, draft: savedMessage?.replyDraft || null }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/contacts/save') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const contact = body.contact || {}
        const existingIndex = (state.contacts || []).findIndex((item) => item.id === contact.id || item.email === contact.email)
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

        state.activityLog = [
          createActivityEntry({
            type: 'contact',
            entityType: 'contact',
            entityId: nextContact.id,
            summary: `Contact "${nextContact.name || nextContact.email}" was saved.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, contacts: nextState.contacts }, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/contacts/export') {
      const format = `${url.searchParams.get('format') || 'json'}`.toLowerCase()
      const contacts = readState().contacts || []

      if (format === 'csv') {
        response.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="gdsff-contacts.csv"',
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        })
        response.end(buildContactsCsv(contacts))
        return
      }

      sendJson(response, 200, { ok: true, contacts }, origin)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/templates/save') {
      const body = await readJson(request)
      const nextState = updateState((state) => {
        const template = saveTemplate(state, body.scope, body.template || {})

        state.activityLog = [
          createActivityEntry({
            type: 'template',
            entityType: 'template',
            entityId: template.id,
            summary: `Template "${template.title}" was saved in ${body.scope}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, templates: nextState.templates }, origin)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/meta/auth/url') {
      sendJson(
        response,
        200,
        {
          ok: true,
          url: buildMetaAuthUrl(),
          scopes: metaOAuthScopes,
          redirectUri: runtime.metaRedirectUri,
        },
        origin,
      )
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/meta/publish') {
      const body = await readJson(request)
      const settings = readState().settings?.meta ?? {}
      const result = await publishToMeta({
        platform: body.platform,
        message: body.message,
        imageUrl: body.imageUrl,
        link: body.link,
        dryRun: body.dryRun !== false,
        facebookPageId: body.facebookPageId || settings.facebookPageId,
        instagramBusinessId: body.instagramBusinessId || settings.instagramBusinessId,
      })

      updateState((state) => {
        state.publishHistory = [
          {
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            platform: body.platform,
            dryRun: body.dryRun !== false,
            message: body.message,
            imageUrl: body.imageUrl || '',
            result,
          },
          ...(state.publishHistory || []),
        ].slice(0, 20)

        state.activityLog = [
          createActivityEntry({
            type: 'publish',
            entityType: 'meta',
            entityId: body.platform,
            summary: body.dryRun !== false ? `Dry run publish executed for ${body.platform}.` : `Live publish executed for ${body.platform}.`,
          }),
          ...(state.activityLog || []),
        ].slice(0, 80)

        return state
      })

      sendJson(response, 200, { ok: true, result }, origin)
      return
    }

    sendJson(response, 404, { ok: false, error: 'Route not found.' }, origin)
  } catch (error) {
    sendJson(
      response,
      500,
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unexpected server error.',
      },
      origin,
    )
  }
})

server.listen(runtime.apiPort, () => {
  console.log(`GDSFF Media & Communications Bot API running on http://127.0.0.1:${runtime.apiPort}`)
})
