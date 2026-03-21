import { ensureEnvLoaded } from './loadEnv.js'

const plannedPlatforms = [
  {
    id: 'threads',
    name: 'Threads',
    phase: 'planned',
    capabilities: ['Content drafting', 'Future publish adapter'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    phase: 'planned',
    capabilities: ['Content drafting', 'Future publish adapter'],
  },
  {
    id: 'x',
    name: 'X',
    phase: 'planned',
    capabilities: ['Content drafting', 'Future publish adapter'],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    phase: 'planned',
    capabilities: ['Content drafting', 'Future publish adapter'],
  },
]

export const metaOAuthScopes = [
  'pages_show_list',
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_messages',
]

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function parseBooleanFlag(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  return `${value}`.trim().toLowerCase() !== 'false'
}

function getDefaultSmtpHost(emailProvider) {
  if (emailProvider === 'titan') {
    return 'smtp.titan.email'
  }

  if (emailProvider === 'gmail') {
    return 'smtp.gmail.com'
  }

  return ''
}

function getDefaultSmtpPort(emailProvider) {
  if (emailProvider === 'titan' || emailProvider === 'gmail') {
    return 465
  }

  return 0
}

export function getRuntimeConfig() {
  ensureEnvLoaded()

  const emailProvider = (process.env.EMAIL_PROVIDER || 'manual').toLowerCase()
  const imapHost = process.env.TITAN_IMAP_HOST || process.env.EMAIL_IMAP_HOST || 'imap.titan.email'
  const imapPort = Number(process.env.TITAN_IMAP_PORT || process.env.EMAIL_IMAP_PORT || 993)
  const imapUsername =
    process.env.TITAN_IMAP_USERNAME ||
    process.env.EMAIL_IMAP_USERNAME ||
    process.env.TITAN_MAILBOX_ADDRESS ||
    process.env.EMAIL_INBOX_ADDRESS ||
    'office@gdsff.org'
  const imapPassword = process.env.TITAN_IMAP_PASSWORD || process.env.EMAIL_IMAP_PASSWORD || ''
  const imapTls = parseBooleanFlag(process.env.TITAN_IMAP_TLS || process.env.EMAIL_IMAP_TLS, true)
  const smtpHost = process.env.TITAN_SMTP_HOST || process.env.EMAIL_SMTP_HOST || getDefaultSmtpHost(emailProvider)
  const smtpPort = Number(
    process.env.TITAN_SMTP_PORT || process.env.EMAIL_SMTP_PORT || getDefaultSmtpPort(emailProvider),
  )
  const smtpUsername = process.env.TITAN_SMTP_USERNAME || process.env.EMAIL_SMTP_USERNAME || ''
  const smtpPassword = process.env.TITAN_SMTP_PASSWORD || process.env.EMAIL_SMTP_PASSWORD || ''
  const smtpSecure = parseBooleanFlag(
    process.env.TITAN_SMTP_SECURE || process.env.EMAIL_SMTP_SECURE,
    smtpPort === 465,
  )
  const smtpStartTls = parseBooleanFlag(
    process.env.TITAN_SMTP_STARTTLS || process.env.EMAIL_SMTP_STARTTLS,
    !smtpSecure && smtpPort === 587,
  )
  const smtpTlsRejectUnauthorized = parseBooleanFlag(
    process.env.TITAN_SMTP_TLS_REJECT_UNAUTHORIZED || process.env.EMAIL_SMTP_TLS_REJECT_UNAUTHORIZED,
    true,
  )
  const emailOutboundAddress =
    process.env.TITAN_OUTBOUND_ADDRESS ||
    process.env.EMAIL_OUTBOUND_ADDRESS ||
    process.env.EMAIL_INBOX_ADDRESS ||
    imapUsername ||
    'office@gdsff.org'
  const membershipNotificationAddress =
    process.env.EMAIL_MEMBERSHIP_NOTIFICATION_ADDRESS ||
    process.env.MEMBERSHIP_NOTIFICATION_ADDRESS ||
    process.env.EMAIL_INBOX_ADDRESS ||
    'office@gdsff.org'
  const m365TenantIdConfigured = hasValue(process.env.M365_TENANT_ID)
  const m365ClientIdConfigured = hasValue(process.env.M365_CLIENT_ID)
  const m365ClientSecretConfigured = hasValue(process.env.M365_CLIENT_SECRET)
  const m365MailboxAddressConfigured = hasValue(process.env.M365_MAILBOX_ADDRESS)

  return {
    apiPort: Number(process.env.SOCIAL_HUB_PORT || 8787),
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-5',
    metaGraphVersion: process.env.META_GRAPH_VERSION || 'v23.0',
    metaAppIdConfigured: hasValue(process.env.META_APP_ID),
    metaAppSecretConfigured: hasValue(process.env.META_APP_SECRET),
    metaPageAccessTokenConfigured: hasValue(process.env.META_PAGE_ACCESS_TOKEN),
    metaInstagramAccessTokenConfigured: hasValue(process.env.META_INSTAGRAM_ACCESS_TOKEN),
    metaRedirectUri: process.env.META_REDIRECT_URI || 'http://127.0.0.1:8787/api/meta/auth/callback',
    metaVerifyTokenConfigured: hasValue(process.env.META_VERIFY_TOKEN),
    openAiConfigured: hasValue(process.env.OPENAI_API_KEY),
    emailProvider,
    emailInboxAddress: process.env.EMAIL_INBOX_ADDRESS || 'office@gdsff.org',
    emailOutboundAddress,
    membershipNotificationAddress,
    m365GraphBaseUrl: process.env.M365_GRAPH_BASE_URL || 'https://graph.microsoft.com/v1.0',
    m365TenantIdConfigured,
    m365ClientIdConfigured,
    m365ClientSecretConfigured,
    m365MailboxAddressConfigured,
    m365Configured:
      emailProvider === 'microsoft365' &&
      m365TenantIdConfigured &&
      m365ClientIdConfigured &&
      m365ClientSecretConfigured &&
      m365MailboxAddressConfigured,
    imapHost,
    imapPort,
    imapUsernameConfigured: hasValue(imapUsername),
    imapPasswordConfigured: hasValue(imapPassword),
    imapTls,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpStartTls,
    smtpTlsRejectUnauthorized,
    smtpUsernameConfigured: hasValue(smtpUsername),
    smtpPasswordConfigured: hasValue(smtpPassword),
    smtpConfigured:
      hasValue(smtpHost) &&
      Number.isFinite(smtpPort) &&
      smtpPort > 0 &&
      hasValue(smtpUsername) &&
      hasValue(smtpPassword),
    titanConfigured:
      (emailProvider === 'titan' || emailProvider === 'imap') &&
      hasValue(imapHost) &&
      hasValue(imapUsername) &&
      hasValue(imapPassword),
  }
}

export function buildMetaAuthUrl() {
  const runtime = getRuntimeConfig()

  if (!runtime.metaAppIdConfigured) {
    return null
  }

  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: runtime.metaRedirectUri,
    response_type: 'code',
    scope: metaOAuthScopes.join(','),
    state: 'gdsff-social-hub',
  })

  return `https://www.facebook.com/${runtime.metaGraphVersion}/dialog/oauth?${params.toString()}`
}

export function getPlatformCatalog(state) {
  const runtime = getRuntimeConfig()
  const metaSettings = state.settings?.meta ?? {}
  const facebookReady = hasValue(metaSettings.facebookPageId) && runtime.metaPageAccessTokenConfigured
  const instagramReady = hasValue(metaSettings.instagramBusinessId) && (runtime.metaInstagramAccessTokenConfigured || runtime.metaPageAccessTokenConfigured)

  return [
    {
      id: 'facebook',
      name: 'Facebook Pages',
      phase: 'active',
      status: facebookReady ? 'ready' : 'needs setup',
      capabilities: ['AI drafting', 'Page post publishing', 'Webhook inbox capture', 'Reply suggestions'],
      connection: {
        pageIdConfigured: hasValue(metaSettings.facebookPageId),
        accessTokenConfigured: runtime.metaPageAccessTokenConfigured,
        appConfigured: runtime.metaAppIdConfigured && runtime.metaAppSecretConfigured,
      },
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      phase: 'active',
      status: instagramReady ? 'ready' : 'needs setup',
      capabilities: ['AI drafting', 'Feed publishing with image URL', 'Webhook inbox capture', 'Reply suggestions'],
      connection: {
        instagramBusinessIdConfigured: hasValue(metaSettings.instagramBusinessId),
        accessTokenConfigured: runtime.metaInstagramAccessTokenConfigured || runtime.metaPageAccessTokenConfigured,
        appConfigured: runtime.metaAppIdConfigured && runtime.metaAppSecretConfigured,
      },
    },
    ...plannedPlatforms,
  ]
}
