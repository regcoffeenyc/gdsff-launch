import { getRuntimeConfig } from './platformRegistry.js'

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function htmlToText(value) {
  return `${value || ''}`
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeBody(message) {
  const body = message?.body || {}
  const content = body.content || message?.bodyPreview || ''

  if (`${body.contentType || ''}`.toLowerCase() === 'html') {
    return htmlToText(content)
  }

  return `${content}`.trim()
}

function mapFromAddress(from) {
  const address = from?.emailAddress || {}
  return {
    fromName: address.name || '',
    fromEmail: address.address || '',
  }
}

function mapGraphMessage(message) {
  const from = mapFromAddress(message.from)
  const bodyText = normalizeBody(message)

  return {
    subject: message.subject || '(No subject)',
    body: bodyText || message.bodyPreview || '',
    fromName: from.fromName,
    fromEmail: from.fromEmail,
    receivedAt: message.receivedDateTime || new Date().toISOString(),
    external: {
      provider: 'microsoft365',
      providerMessageId: message.id || '',
      internetMessageId: message.internetMessageId || '',
      threadId: message.conversationId || '',
      webLink: message.webLink || '',
    },
    source: 'microsoft365',
  }
}

async function graphRequest(url, accessToken) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  const data = await response.json()
  if (!response.ok) {
    const errorMessage = data?.error?.message || 'Microsoft Graph inbox request failed.'
    throw new Error(errorMessage)
  }

  return data
}

async function getAppAccessToken(runtime) {
  const tenantId = process.env.M365_TENANT_ID || ''
  const clientId = process.env.M365_CLIENT_ID || ''
  const clientSecret = process.env.M365_CLIENT_SECRET || ''
  const scope = process.env.M365_SCOPE || 'https://graph.microsoft.com/.default'

  if (!hasValue(tenantId) || !hasValue(clientId) || !hasValue(clientSecret)) {
    throw new Error('Microsoft 365 credentials are not fully configured.')
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope,
    grant_type: 'client_credentials',
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await response.json()
  if (!response.ok) {
    const errorMessage = data?.error_description || data?.error || 'Failed to acquire Microsoft 365 access token.'
    throw new Error(errorMessage)
  }

  return data.access_token
}

export function getMicrosoftGraphEmailRuntime() {
  const runtime = getRuntimeConfig()

  return {
    provider: runtime.emailProvider,
    graphBaseUrl: runtime.m365GraphBaseUrl,
    configured: runtime.m365Configured,
    tenantConfigured: runtime.m365TenantIdConfigured,
    clientConfigured: runtime.m365ClientIdConfigured,
    clientSecretConfigured: runtime.m365ClientSecretConfigured,
    mailboxConfigured: runtime.m365MailboxAddressConfigured,
    mailboxAddress: process.env.M365_MAILBOX_ADDRESS || runtime.emailInboxAddress || 'office@gdsff.org',
  }
}

export async function fetchMicrosoftInboxMessages({ mailboxAddress, limit = 25, pageUrl = '' } = {}) {
  const runtime = getRuntimeConfig()
  const mailbox = mailboxAddress || process.env.M365_MAILBOX_ADDRESS || runtime.emailInboxAddress || 'office@gdsff.org'
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100))

  if (!runtime.m365Configured) {
    throw new Error(
      'Microsoft 365 inbox sync is not configured. Required env vars: M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET, M365_MAILBOX_ADDRESS with EMAIL_PROVIDER=microsoft365.',
    )
  }

  const accessToken = await getAppAccessToken(runtime)
  const queryUrl = pageUrl
    ? pageUrl
    : `${runtime.m365GraphBaseUrl}/users/${encodeURIComponent(mailbox)}/mailFolders/Inbox/messages` +
      `?$top=${safeLimit}` +
      `&$orderby=receivedDateTime desc` +
      `&$select=id,internetMessageId,conversationId,subject,from,receivedDateTime,lastModifiedDateTime,bodyPreview,body,importance,isRead,webLink`

  const data = await graphRequest(queryUrl, accessToken)
  const values = Array.isArray(data.value) ? data.value : []

  return {
    provider: 'microsoft365',
    mailboxAddress: mailbox,
    syncedAt: new Date().toISOString(),
    messages: values.map(mapGraphMessage),
    fetchedCount: values.length,
    nextPageUrl: data['@odata.nextLink'] || '',
  }
}
