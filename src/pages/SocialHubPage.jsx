import { useEffect, useMemo, useState } from 'react'
import PageHero from '../components/PageHero'
import { socialHubLaunchPack } from '../content/socialHubLaunchPack'
import {
  askSocialAssistant,
  classifyEmailMessage,
  exportContacts,
  generateEmailReplyDraft,
  generateReplySuggestion,
  generateSocialDraft,
  getAdminSession,
  getAdminState,
  loginAdmin,
  logoutAdmin,
  processSocialQueue,
  publishMetaContent,
  saveAdminSettings,
  saveContact,
  saveEmailMessage,
  saveMediaAsset,
  saveSocialPost,
  saveTemplate,
  scheduleSocialPost,
  syncEmailInbox,
  updateSocialPostStatus,
} from '../utils/socialHubApi'

const sectionTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'social', label: 'Social Content' },
  { id: 'email', label: 'Email Inbox' },
  { id: 'contacts', label: 'Contacts / Leads' },
  { id: 'templates', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
]

const socialStatuses = ['draft', 'approved', 'scheduled', 'published']
const socialCategories = ['announcement', 'membership', 'leadership', 'event', 'gallery', 'documents', 'partnership', 'safety']
const messageStatuses = ['new', 'pending', 'in progress', 'waiting', 'replied', 'closed', 'archived']
const messagePriorities = ['low', 'normal', 'high', 'urgent']
const messageClassifications = ['membership', 'partnership', 'media', 'general inquiry', 'legal/documents', 'event participation']
const contactTypes = ['general', 'member', 'partner', 'media', 'institution', 'participant']
const templateScopes = ['social', 'email']

function formatTimestamp(value) {
  if (!value) {
    return 'Not set'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function toDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (item) => `${item}`.padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromDateTimeLocal(value) {
  return value ? new Date(value).toISOString() : ''
}

function createEmptySocialEditor() {
  return {
    id: '',
    title: '',
    category: 'announcement',
    platforms: ['facebook'],
    status: 'draft',
    captions: { short: '', medium: '', long: '' },
    englishCaption: '',
    hashtagsText: socialHubLaunchPack.hashtags.slice(0, 4).join(' '),
    imagePlaceholder: '',
    mediaAssetIds: [],
    link: socialHubLaunchPack.brand.website,
    notes: '',
    scheduledForValue: '',
  }
}

function createEmptyMessageEditor() {
  return {
    id: '',
    fromName: '',
    fromEmail: '',
    subject: '',
    body: '',
    classification: 'general inquiry',
    status: 'new',
    priority: 'normal',
    assignedTo: '',
    notes: '',
    tagsText: '',
    replyDraft: null,
    history: [],
  }
}

function createEmptyContactEditor() {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
    type: 'general',
    organization: '',
    tagsText: '',
    status: 'open',
    notes: '',
    lastContactAt: '',
  }
}

function createEmptyTemplate(scope = 'social') {
  return scope === 'email'
    ? { id: '', title: '', subject: '', body: '' }
    : { id: '', title: '', platform: 'both', category: 'announcement', body: '' }
}

function mapPostToEditor(post) {
  return {
    id: post.id,
    title: post.title,
    category: post.category,
    platforms: [...(post.platforms || [])],
    status: post.status,
    captions: {
      short: post.captions?.short || '',
      medium: post.captions?.medium || '',
      long: post.captions?.long || '',
    },
    englishCaption: post.englishCaption || '',
    hashtagsText: (post.hashtags || []).join(' '),
    imagePlaceholder: post.imagePlaceholder || '',
    mediaAssetIds: [...(post.mediaAssetIds || [])],
    link: post.link || socialHubLaunchPack.brand.website,
    notes: post.notes || '',
    scheduledForValue: toDateTimeLocal(post.scheduledFor),
  }
}

function mapMessageToEditor(message) {
  return {
    id: message.id,
    fromName: message.fromName || '',
    fromEmail: message.fromEmail || '',
    subject: message.subject || '',
    body: message.body || '',
    classification: message.classification || 'general inquiry',
    status: message.status || 'new',
    priority: message.priority || 'normal',
    assignedTo: message.assignedTo || '',
    notes: message.notes || '',
    tagsText: (message.tags || []).join(', '),
    replyDraft: message.replyDraft || null,
    history: message.history || [],
  }
}

function mapContactToEditor(contact) {
  return {
    id: contact.id,
    name: contact.name || '',
    email: contact.email || '',
    phone: contact.phone || '',
    type: contact.type || 'general',
    organization: contact.organization || '',
    tagsText: (contact.tags || []).join(', '),
    status: contact.status || 'open',
    notes: contact.notes || '',
    lastContactAt: contact.lastContactAt || '',
  }
}

function mapTemplateToEditor(template, scope) {
  return scope === 'email'
    ? { id: template.id, title: template.title || '', subject: template.subject || '', body: template.body || '' }
    : { id: template.id, title: template.title || '', platform: template.platform || 'both', category: template.category || 'announcement', body: template.body || '' }
}

function parseList(value, separatorRegex = /[\n,]/) {
  return `${value || ''}`
    .split(separatorRegex)
    .map((item) => item.trim())
    .filter(Boolean)
}

function downloadBlob(blob, filename) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(blobUrl)
}

function buildCalendarDays(items) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const label = date.toISOString().slice(0, 10)
    return {
      label,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === today.getMonth(),
      items: items.filter((item) => item.scheduledFor?.slice(0, 10) === label),
    }
  })
}

export default function SocialHubPage({ copy }) {
  const isGeorgian = copy.locale === 'ka-GE'
  const [authState, setAuthState] = useState({ checked: false, authenticated: false, authConfigured: false, setupMode: false, user: null })
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [socialView, setSocialView] = useState('list')
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin' })
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantMessages, setAssistantMessages] = useState([])
  const [selectedPostId, setSelectedPostId] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [templateScope, setTemplateScope] = useState('social')
  const [socialEditor, setSocialEditor] = useState(createEmptySocialEditor())
  const [messageEditor, setMessageEditor] = useState(createEmptyMessageEditor())
  const [contactEditor, setContactEditor] = useState(createEmptyContactEditor())
  const [templateEditor, setTemplateEditor] = useState(createEmptyTemplate('social'))
  const [draftStudio, setDraftStudio] = useState({ platform: 'facebook', objective: '', audience: '', prompt: '', includeEnglish: true })
  const [socialDraftResult, setSocialDraftResult] = useState(null)
  const [socialReplyForm, setSocialReplyForm] = useState({ platform: 'facebook', goal: '', incomingMessage: '' })
  const [socialReplyResult, setSocialReplyResult] = useState(null)
  const [publishForm, setPublishForm] = useState({ platform: 'facebook', message: '', imageUrl: '', link: socialHubLaunchPack.brand.website, dryRun: true })
  const [publishResult, setPublishResult] = useState(null)
  const [settingsForm, setSettingsForm] = useState({
    facebookPageId: '',
    instagramBusinessId: '',
    facebookPageName: socialHubLaunchPack.facebook.pageName,
    instagramHandle: socialHubLaunchPack.instagram.recommendedUsername,
    inboxAddress: socialHubLaunchPack.brand.email,
    emailProvider: 'manual',
    followUpDays: 3,
  })
  const [socialSearch, setSocialSearch] = useState('')
  const [emailSearch, setEmailSearch] = useState('')
  const [emailStatusFilter, setEmailStatusFilter] = useState('all')
  const [emailTypeFilter, setEmailTypeFilter] = useState('all')
  const [emailSyncLimit, setEmailSyncLimit] = useState(25)
  const [contactSearch, setContactSearch] = useState('')
  const [contactTypeFilter, setContactTypeFilter] = useState('all')

  const hero = isGeorgian
    ? {
        eyebrow: 'მედიისა და კომუნიკაციების შიდა სისტემა',
        title: 'GDSFF Media & Communications Bot',
        body: 'ფედერაციის შიდა ადმინისტრაციული პლატფორმა Facebook-ის, Instagram-ისა და ოფიციალური ელფოსტის სამართავად.',
        highlights: ['Internal admin workspace', 'Social + email workflows', 'Integration-ready architecture'],
      }
    : {
        eyebrow: 'Internal Communications Workspace',
        title: 'GDSFF Media & Communications Bot',
        body: 'An internal operations workspace for Facebook, Instagram, and official email management.',
        highlights: ['Internal admin workspace', 'Social + email workflows', 'Integration-ready architecture'],
      }

  const filteredPosts = useMemo(() => {
    const items = workspace?.state?.socialPosts || []
    const query = socialSearch.trim().toLowerCase()
    if (!query) {
      return items
    }

    return items.filter((item) => `${item.title} ${item.category} ${(item.platforms || []).join(' ')} ${item.captions?.medium || ''}`.toLowerCase().includes(query))
  }, [socialSearch, workspace])

  const filteredMessages = useMemo(() => {
    const items = workspace?.state?.messages || []
    const query = emailSearch.trim().toLowerCase()

    return items.filter((item) => {
      const matchesQuery = !query || `${item.fromName} ${item.fromEmail} ${item.subject} ${item.body}`.toLowerCase().includes(query)
      const matchesStatus = emailStatusFilter === 'all' || item.status === emailStatusFilter
      const matchesType = emailTypeFilter === 'all' || item.classification === emailTypeFilter
      return matchesQuery && matchesStatus && matchesType
    })
  }, [emailSearch, emailStatusFilter, emailTypeFilter, workspace])

  const filteredContacts = useMemo(() => {
    const items = workspace?.state?.contacts || []
    const query = contactSearch.trim().toLowerCase()

    return items.filter((item) => {
      const matchesQuery = !query || `${item.name} ${item.email} ${item.organization} ${item.notes}`.toLowerCase().includes(query)
      const matchesType = contactTypeFilter === 'all' || item.type === contactTypeFilter
      return matchesQuery && matchesType
    })
  }, [contactSearch, contactTypeFilter, workspace])

  const currentTemplates = useMemo(() => workspace?.state?.templates?.[templateScope] || [], [templateScope, workspace])
  const selectedPost = useMemo(() => workspace?.state?.socialPosts?.find((item) => item.id === selectedPostId) || null, [selectedPostId, workspace])
  const selectedMessage = useMemo(() => workspace?.state?.messages?.find((item) => item.id === selectedMessageId) || null, [selectedMessageId, workspace])
  const selectedContact = useMemo(() => workspace?.state?.contacts?.find((item) => item.id === selectedContactId) || null, [selectedContactId, workspace])
  const selectedTemplate = useMemo(() => currentTemplates.find((item) => item.id === selectedTemplateId) || null, [currentTemplates, selectedTemplateId])
  const mediaAssets = workspace?.state?.mediaAssets || []
  const selectedAsset = useMemo(() => {
    const assetId = socialEditor.mediaAssetIds?.[0]
    return mediaAssets.find((item) => item.id === assetId) || null
  }, [mediaAssets, socialEditor.mediaAssetIds])
  const calendarDays = useMemo(() => buildCalendarDays(workspace?.state?.scheduledPosts || []), [workspace])

  async function loadWorkspace() {
    const data = await getAdminState()
    setWorkspace(data)
    setAuthState((current) => ({
      ...current,
      checked: true,
      authenticated: data.auth.authenticated,
      authConfigured: data.auth.authConfigured,
      setupMode: data.auth.setupMode,
      user: data.auth.user,
    }))
    setSettingsForm({
      facebookPageId: data.state.settings?.meta?.facebookPageId || '',
      instagramBusinessId: data.state.settings?.meta?.instagramBusinessId || '',
      facebookPageName: data.state.settings?.meta?.facebookPageName || socialHubLaunchPack.facebook.pageName,
      instagramHandle: data.state.settings?.meta?.instagramHandle || socialHubLaunchPack.instagram.recommendedUsername,
      inboxAddress: data.state.settings?.email?.inboxAddress || socialHubLaunchPack.brand.email,
      emailProvider: data.state.settings?.email?.provider || 'manual',
      followUpDays: data.state.settings?.automation?.followUpDays || 3,
    })
  }

  async function bootstrap() {
    setLoading(true)
    setError('')

    try {
      const session = await getAdminSession()
      setAuthState({
        checked: true,
        authenticated: session.auth.authenticated,
        authConfigured: session.auth.authConfigured,
        setupMode: session.auth.setupMode,
        user: session.auth.user,
      })

      if (session.auth.authenticated) {
        await loadWorkspace()
      }
    } catch (sessionError) {
      setError(sessionError.message)
      setAuthState((current) => ({ ...current, checked: true }))
    } finally {
      setLoading(false)
    }
  }

  async function runAction(action, successMessage = '') {
    setBusy(true)
    setError('')
    setNotice('')

    try {
      const result = await action()
      if (successMessage) {
        setNotice(successMessage)
      }
      return result
    } catch (actionError) {
      setError(actionError.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    bootstrap()
  }, [])

  useEffect(() => {
    if (!workspace) {
      return
    }

    if (selectedPostId === '' && workspace.state.socialPosts?.length) {
      setSelectedPostId(workspace.state.socialPosts[0].id)
    }

    if (selectedMessageId === '' && workspace.state.messages?.length) {
      setSelectedMessageId(workspace.state.messages[0].id)
    }

    if (selectedContactId === '' && workspace.state.contacts?.length) {
      setSelectedContactId(workspace.state.contacts[0].id)
    }
  }, [selectedContactId, selectedMessageId, selectedPostId, workspace])

  useEffect(() => {
    if (selectedPost) {
      setSocialEditor(mapPostToEditor(selectedPost))
      setPublishForm((current) => ({
        ...current,
        platform: selectedPost.platforms?.[0] || current.platform,
        message: selectedPost.captions?.medium || '',
        imageUrl: selectedPost.imagePlaceholder || '',
        link: selectedPost.link || socialHubLaunchPack.brand.website,
      }))
    } else {
      setSocialEditor(createEmptySocialEditor())
    }
  }, [selectedPost])

  useEffect(() => {
    if (selectedMessage) {
      setMessageEditor(mapMessageToEditor(selectedMessage))
    } else {
      setMessageEditor(createEmptyMessageEditor())
    }
  }, [selectedMessage])

  useEffect(() => {
    if (selectedContact) {
      setContactEditor(mapContactToEditor(selectedContact))
    } else {
      setContactEditor(createEmptyContactEditor())
    }
  }, [selectedContact])

  useEffect(() => {
    if (selectedTemplateId !== 'new' && currentTemplates.length && !currentTemplates.find((item) => item.id === selectedTemplateId)) {
      setSelectedTemplateId(currentTemplates[0].id)
      return
    }

    if (!currentTemplates.length) {
      setSelectedTemplateId('')
      setTemplateEditor(createEmptyTemplate(templateScope))
    }
  }, [currentTemplates, selectedTemplateId, templateScope])

  useEffect(() => {
    if (selectedTemplate) {
      setTemplateEditor(mapTemplateToEditor(selectedTemplate, templateScope))
    }
  }, [selectedTemplate, templateScope])

  useEffect(() => {
    if (!assistantMessages.length) {
      setAssistantMessages([
        {
          role: 'assistant',
          content: 'GDSFF Media & Communications Bot is ready. Use this assistant for drafting, routing, and operational next-step recommendations.',
        },
      ])
    }
  }, [assistantMessages.length])

  async function handleLogin(event) {
    event.preventDefault()
    const result = await runAction(() => loginAdmin(loginForm.username, loginForm.password), 'Admin session started.')
    if (!result) {
      return
    }

    setAuthState({
      checked: true,
      authenticated: true,
      authConfigured: result.authConfigured,
      setupMode: result.setupMode,
      user: result.user,
    })
    await loadWorkspace()
  }

  async function handleLogout() {
    const result = await runAction(() => logoutAdmin(), 'Admin session closed.')
    if (!result) {
      return
    }

    setWorkspace(null)
    setAuthState((current) => ({ ...current, authenticated: false, user: null }))
  }

  async function handleSaveSettings(event) {
    event.preventDefault()
    const result = await runAction(
      () =>
        saveAdminSettings({
          meta: {
            facebookPageId: settingsForm.facebookPageId,
            instagramBusinessId: settingsForm.instagramBusinessId,
            facebookPageName: settingsForm.facebookPageName,
            instagramHandle: settingsForm.instagramHandle,
          },
          email: {
            inboxAddress: settingsForm.inboxAddress,
            provider: settingsForm.emailProvider,
          },
          automation: {
            followUpDays: Number(settingsForm.followUpDays) || 3,
          },
        }),
      'Settings saved.',
    )
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleAssistant(event) {
    event.preventDefault()
    if (!assistantInput.trim()) {
      return
    }

    const nextMessages = [...assistantMessages, { role: 'user', content: assistantInput.trim() }]
    setAssistantMessages(nextMessages)
    setAssistantInput('')

    const result = await runAction(() => askSocialAssistant(nextMessages))
    if (result?.reply) {
      setAssistantMessages((current) => [...current, { role: 'assistant', content: result.reply }])
      await loadWorkspace()
    }
  }

  async function handleGenerateSocialDraft(event) {
    event.preventDefault()
    const result = await runAction(() => generateSocialDraft({ ...draftStudio, locale: copy.locale }), 'Draft suggestion generated.')

    if (!result?.draft) {
      return
    }

    setSocialDraftResult(result.draft)
    setSocialEditor((current) => ({
      ...current,
      title: result.draft.title || current.title,
      platforms: result.draft.recommendedPlatforms?.length ? result.draft.recommendedPlatforms : current.platforms,
      captions: {
        short: result.draft.caption || current.captions.short,
        medium: result.draft.caption || current.captions.medium,
        long: result.draft.caption || current.captions.long,
      },
      englishCaption: result.draft.englishSupport || current.englishCaption,
      hashtagsText: (result.draft.hashtags || []).join(' '),
    }))
    setPublishForm((current) => ({
      ...current,
      platform: result.draft.recommendedPlatforms?.[0] || current.platform,
      message: result.draft.caption || current.message,
    }))
    await loadWorkspace()
  }

  async function handleSaveSocialPost(event) {
    event.preventDefault()
    const payload = {
      ...socialEditor,
      hashtags: parseList(socialEditor.hashtagsText, /[\s,]+/),
      scheduledFor: fromDateTimeLocal(socialEditor.scheduledForValue),
    }
    const result = await runAction(() => saveSocialPost(payload), 'Social post saved.')
    if (result?.socialPosts?.length) {
      setSelectedPostId(socialEditor.id || result.socialPosts[0].id)
      await loadWorkspace()
    }
  }

  async function handleApprovePost() {
    const result = socialEditor.id
      ? await runAction(() => updateSocialPostStatus(socialEditor.id, 'approved'), 'Post marked as approved.')
      : await runAction(() => saveSocialPost({ ...socialEditor, status: 'approved', hashtags: parseList(socialEditor.hashtagsText, /[\s,]+/) }), 'Post approved.')
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleSchedulePost() {
    if (!socialEditor.scheduledForValue) {
      setError('Choose a schedule date and time first.')
      return
    }

    let postId = socialEditor.id
    if (!postId) {
      const saveResult = await runAction(
        () => saveSocialPost({ ...socialEditor, hashtags: parseList(socialEditor.hashtagsText, /[\s,]+/), status: 'approved' }),
        'Post saved before scheduling.',
      )
      if (!saveResult?.socialPosts?.length) {
        return
      }
      postId = saveResult.socialPosts[0].id
      setSelectedPostId(postId)
    }

    const result = await runAction(
      () =>
        scheduleSocialPost({
          postId,
          platforms: socialEditor.platforms,
          scheduledFor: fromDateTimeLocal(socialEditor.scheduledForValue),
          dryRun: true,
          imageUrl: socialEditor.imagePlaceholder,
        }),
      'Post added to the scheduled queue.',
    )
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleProcessQueue() {
    const result = await runAction(() => processSocialQueue({ dryRun: true }), 'Queue processed.')
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleGenerateSocialReply(event) {
    event.preventDefault()
    const result = await runAction(() => generateReplySuggestion({ ...socialReplyForm, locale: copy.locale }), 'Reply suggestion prepared.')
    if (result?.suggestion) {
      setSocialReplyResult(result.suggestion)
      await loadWorkspace()
    }
  }

  async function handlePublish(event) {
    event.preventDefault()
    const result = await runAction(
      () =>
        publishMetaContent({
          ...publishForm,
          facebookPageId: settingsForm.facebookPageId,
          instagramBusinessId: settingsForm.instagramBusinessId,
        }),
      publishForm.dryRun ? 'Dry run completed.' : 'Publish request submitted.',
    )
    if (result?.result) {
      setPublishResult(result.result)
      await loadWorkspace()
    }
  }

  async function handleSaveMessage(event) {
    event.preventDefault()
    const result = await runAction(() => saveEmailMessage({ ...messageEditor, tags: parseList(messageEditor.tagsText) }), 'Inbox record saved.')
    if (result?.messages?.length) {
      setSelectedMessageId(messageEditor.id || result.messages[0].id)
      await loadWorkspace()
    }
  }

  async function handleClassifyMessage() {
    if (!messageEditor.id) {
      setError('Save the message first to classify it.')
      return
    }

    const result = await runAction(() => classifyEmailMessage(messageEditor.id), 'Message reclassified.')
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleGenerateEmailDraft() {
    if (!messageEditor.id) {
      setError('Save the message first to generate a reply draft.')
      return
    }

    const result = await runAction(() => generateEmailReplyDraft(messageEditor.id), 'Reply draft saved.')
    if (result) {
      await loadWorkspace()
    }
  }

  async function handleSyncEmailInbox() {
    const provider = (settingsForm.emailProvider || 'manual').toLowerCase()
    const limit = Math.max(1, Math.min(Number(emailSyncLimit) || 25, 100))

    const result = await runAction(
      () =>
        syncEmailInbox({
          provider,
          mailboxAddress: settingsForm.inboxAddress,
          limit,
        }),
      'Inbox sync completed.',
    )

    if (result) {
      await loadWorkspace()
    }
  }

  function getEmailSyncButtonLabel() {
    const provider = (settingsForm.emailProvider || 'manual').toLowerCase()
    if (provider === 'microsoft365') {
      return 'Sync Microsoft 365 Inbox'
    }
    if (provider === 'titan') {
      return 'Sync Titan Inbox'
    }
    if (provider === 'imap') {
      return 'Sync IMAP Inbox'
    }
    return 'Sync Inbox'
  }

  async function handleSaveContact(event) {
    event.preventDefault()
    const result = await runAction(() => saveContact({ ...contactEditor, tags: parseList(contactEditor.tagsText) }), 'Contact saved.')
    if (result?.contacts?.length) {
      setSelectedContactId(contactEditor.id || result.contacts[0].id)
      await loadWorkspace()
    }
  }

  async function handleExportContacts(format) {
    const blob = await runAction(() => exportContacts(format), `Contacts exported as ${format.toUpperCase()}.`)
    if (blob) {
      downloadBlob(blob, format === 'csv' ? 'gdsff-contacts.csv' : 'gdsff-contacts.json')
    }
  }

  async function handleSaveTemplate(event) {
    event.preventDefault()
    const result = await runAction(() => saveTemplate(templateScope, templateEditor), 'Template saved.')
    if (result?.templates?.[templateScope]?.length) {
      setSelectedTemplateId(templateEditor.id || result.templates[templateScope][0].id)
      await loadWorkspace()
    }
  }

  async function handleSaveAsset(asset) {
    const result = await runAction(() => saveMediaAsset(asset), 'Media asset saved.')
    if (result) {
      await loadWorkspace()
    }
  }

  function renderDashboardSection() {
    return (
      <div className="social-grid-2">
        <article className="feature-card social-panel-card">
          <span className="card-kicker">Readiness</span>
          <h3>Runtime & Integrations</h3>
          <div className="social-runtime-grid">
            <RuntimeTile title="OpenAI" status={workspace.runtime.openAiConfigured ? 'ready' : 'placeholder'} text={workspace.runtime.openAiConfigured ? workspace.runtime.openaiModel : 'Fallback drafting is active until OPENAI_API_KEY is configured.'} />
            <RuntimeTile title="Meta App" status={workspace.runtime.metaAppConfigured ? 'ready' : 'setup required'} text={workspace.runtime.metaAppConfigured ? 'OAuth and webhook prerequisites are configured.' : 'App credentials are still required for live account control.'} />
            <RuntimeTile
              title="Email Provider"
              status={
                settingsForm.emailProvider === 'microsoft365'
                  ? workspace.runtime.m365Configured
                    ? 'ready'
                    : 'setup required'
                  : settingsForm.emailProvider === 'titan' || settingsForm.emailProvider === 'imap'
                    ? workspace.runtime.imapConfigured
                      ? 'ready'
                      : 'setup required'
                    : 'manual'
              }
              text={
                settingsForm.emailProvider === 'microsoft365'
                  ? workspace.runtime.m365Configured
                    ? `Microsoft 365 is configured for ${workspace.runtime.emailInboxAddress}.`
                    : 'Microsoft 365 selected but credentials are missing in environment variables.'
                  : settingsForm.emailProvider === 'titan'
                    ? workspace.runtime.imapConfigured
                      ? `Titan IMAP is configured for ${workspace.runtime.emailInboxAddress}.`
                      : 'Titan selected but IMAP credentials are missing in environment variables.'
                    : settingsForm.emailProvider === 'imap'
                      ? workspace.runtime.imapConfigured
                        ? `IMAP is configured for ${workspace.runtime.emailInboxAddress}.`
                        : 'IMAP selected but credentials are missing in environment variables.'
                      : 'Manual inbox workflow is active.'
              }
            />
          </div>
          <div className="social-platform-list">
            {workspace.platforms.map((platform) => (
              <div key={platform.id} className="social-platform-row">
                <div>
                  <strong>{platform.name}</strong>
                  <p>{platform.capabilities.join(' • ')}</p>
                </div>
                <StatusChip value={platform.status || platform.phase} />
              </div>
            ))}
          </div>
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Assistant</span>
          <h3>Operational Assistant</h3>
          <div className="social-chat-log social-chat-log-large">
            {assistantMessages.map((item, index) => (
              <div key={`${item.role}-${index}`} className={item.role === 'user' ? 'social-chat-message is-user' : 'social-chat-message'}>
                <div className="social-chat-role">{item.role}</div>
                <p>{item.content}</p>
              </div>
            ))}
          </div>
          <form className="social-form-grid" onSubmit={handleAssistant}>
            <textarea className="safety-input safety-textarea" value={assistantInput} onChange={(event) => setAssistantInput(event.target.value)} placeholder="Ask for next actions, drafts, triage advice, or communication workflow help." />
            <button type="submit" className="primary-button" disabled={busy}>
              Send to Assistant
            </button>
          </form>
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Urgent Inbox</span>
          <h3>Priority Requests</h3>
          {workspace.summary.urgentMessages.length ? (
            <div className="social-activity-list">
              {workspace.summary.urgentMessages.map((item) => (
                <button key={item.id} type="button" className="social-activity-item social-activity-button" onClick={() => { setActiveSection('email'); setSelectedMessageId(item.id) }}>
                  <strong>{item.subject}</strong>
                  <span>{item.fromName || item.fromEmail}</span>
                  <small>{item.priority} • {item.classification}</small>
                </button>
              ))}
            </div>
          ) : (
            <p>No urgent requests right now.</p>
          )}
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Schedule</span>
          <h3>Next Scheduled Posts</h3>
          {workspace.summary.nextScheduledPosts.length ? (
            <div className="social-activity-list">
              {workspace.summary.nextScheduledPosts.map((item) => (
                <button key={item.id} type="button" className="social-activity-item social-activity-button" onClick={() => { setActiveSection('social'); setSelectedPostId(item.postId) }}>
                  <strong>{item.title}</strong>
                  <span>{item.platform}</span>
                  <small>{formatTimestamp(item.scheduledFor)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p>No scheduled posts are queued yet.</p>
          )}
        </article>

        <article className="feature-card social-panel-card social-panel-span-2">
          <span className="card-kicker">Recent Activity</span>
          <h3>Activity Log</h3>
          {workspace.summary.recentActivity.length ? (
            <div className="social-activity-list social-activity-list-wide">
              {workspace.summary.recentActivity.map((item) => (
                <div key={item.id} className="social-activity-item">
                  <strong>{item.summary}</strong>
                  <span>{item.type} • {item.entityType}</span>
                  <small>{formatTimestamp(item.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent activity yet.</p>
          )}
        </article>
      </div>
    )
  }

  function renderSocialSection() {
    return (
      <div className="social-section-stack">
        <div className="social-grid-2">
          <article className="feature-card social-panel-card">
            <div className="social-panel-head">
              <div>
                <span className="card-kicker">Content Plan</span>
                <h3>Social Library</h3>
              </div>
              <div className="social-inline-fields">
                <button type="button" className={socialView === 'list' ? 'header-utility-link social-tab-button is-active' : 'header-utility-link social-tab-button'} onClick={() => setSocialView('list')}>
                  List
                </button>
                <button type="button" className={socialView === 'calendar' ? 'header-utility-link social-tab-button is-active' : 'header-utility-link social-tab-button'} onClick={() => setSocialView('calendar')}>
                  Calendar
                </button>
              </div>
            </div>
            <div className="social-inline-fields">
              <input className="safety-input" value={socialSearch} onChange={(event) => setSocialSearch(event.target.value)} placeholder="Search posts" />
              <button type="button" className="secondary-button" onClick={() => { setSelectedPostId('new'); setSocialEditor(createEmptySocialEditor()) }}>
                New Draft
              </button>
            </div>
            {socialView === 'list' ? (
              <div className="social-record-list">
                {filteredPosts.map((item) => (
                  <button key={item.id} type="button" className={selectedPostId === item.id ? 'social-record-card is-active' : 'social-record-card'} onClick={() => setSelectedPostId(item.id)}>
                    <div className="social-record-card-head">
                      <strong>{item.title}</strong>
                      <StatusChip value={item.status} />
                    </div>
                    <span>{item.category}</span>
                    <small>{(item.platforms || []).join(' • ')}</small>
                  </button>
                ))}
              </div>
            ) : (
              <div className="social-calendar-board">
                {calendarDays.map((day) => (
                  <div key={day.label} className={day.inCurrentMonth ? 'social-calendar-cell' : 'social-calendar-cell is-muted'}>
                    <div className="social-calendar-date">{day.day}</div>
                    <div className="social-calendar-items">
                      {day.items.map((item) => (
                        <button key={item.id} type="button" className="social-calendar-item" onClick={() => { setSelectedPostId(item.postId); setSocialView('list') }}>
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="feature-card social-panel-card">
            <span className="card-kicker">Editor</span>
            <h3>Social Draft Editor</h3>
            <form className="social-form-grid" onSubmit={handleSaveSocialPost}>
              <div className="social-inline-fields">
                <input className="safety-input" value={socialEditor.title} onChange={(event) => setSocialEditor((current) => ({ ...current, title: event.target.value }))} placeholder="Post title" />
                <select className="safety-input" value={socialEditor.category} onChange={(event) => setSocialEditor((current) => ({ ...current, category: event.target.value }))}>
                  {socialCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="social-inline-fields">
                {['facebook', 'instagram'].map((platform) => (
                  <label key={platform} className="minor-toggle social-check-toggle">
                    <input
                      type="checkbox"
                      checked={socialEditor.platforms.includes(platform)}
                      onChange={() =>
                        setSocialEditor((current) => ({
                          ...current,
                          platforms: current.platforms.includes(platform) ? current.platforms.filter((item) => item !== platform) : [...current.platforms, platform],
                        }))
                      }
                    />
                    <span className="minor-toggle-mark" />
                    <span>{platform}</span>
                  </label>
                ))}
              </div>
              <div className="social-inline-fields">
                <select className="safety-input" value={socialEditor.status} onChange={(event) => setSocialEditor((current) => ({ ...current, status: event.target.value }))}>
                  {socialStatuses.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <input className="safety-input" type="datetime-local" value={socialEditor.scheduledForValue} onChange={(event) => setSocialEditor((current) => ({ ...current, scheduledForValue: event.target.value }))} />
              </div>
              <textarea className="safety-input safety-textarea" value={socialEditor.captions.short} onChange={(event) => setSocialEditor((current) => ({ ...current, captions: { ...current.captions, short: event.target.value } }))} placeholder="Short caption" />
              <textarea className="safety-input safety-textarea" value={socialEditor.captions.medium} onChange={(event) => setSocialEditor((current) => ({ ...current, captions: { ...current.captions, medium: event.target.value } }))} placeholder="Medium caption" />
              <textarea className="safety-input safety-textarea" value={socialEditor.captions.long} onChange={(event) => setSocialEditor((current) => ({ ...current, captions: { ...current.captions, long: event.target.value } }))} placeholder="Long caption" />
              <textarea className="safety-input safety-textarea" value={socialEditor.englishCaption} onChange={(event) => setSocialEditor((current) => ({ ...current, englishCaption: event.target.value }))} placeholder="English support caption" />
              <div className="social-inline-fields">
                <input className="safety-input" value={socialEditor.hashtagsText} onChange={(event) => setSocialEditor((current) => ({ ...current, hashtagsText: event.target.value }))} placeholder="#GDSFF #DynamicShooting" />
                <input className="safety-input" value={socialEditor.link} onChange={(event) => setSocialEditor((current) => ({ ...current, link: event.target.value }))} placeholder="Link" />
              </div>
              <div className="social-inline-fields">
                <select className="safety-input" value={socialEditor.mediaAssetIds[0] || ''} onChange={(event) => {
                  const asset = mediaAssets.find((item) => item.id === event.target.value)
                  setSocialEditor((current) => ({
                    ...current,
                    mediaAssetIds: event.target.value ? [event.target.value] : [],
                    imagePlaceholder: asset?.source || current.imagePlaceholder,
                  }))
                }}>
                  <option value="">Select media asset</option>
                  {mediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>{asset.title}</option>
                  ))}
                </select>
                <input className="safety-input" value={socialEditor.imagePlaceholder} onChange={(event) => setSocialEditor((current) => ({ ...current, imagePlaceholder: event.target.value }))} placeholder="Image URL / placeholder" />
              </div>
              <textarea className="safety-input safety-textarea" value={socialEditor.notes} onChange={(event) => setSocialEditor((current) => ({ ...current, notes: event.target.value }))} placeholder="Internal notes" />
              <div className="social-action-row">
                <button type="submit" className="primary-button" disabled={busy}>Save Draft</button>
                <button type="button" className="secondary-button" onClick={handleApprovePost} disabled={busy}>Approve</button>
                <button type="button" className="secondary-button" onClick={handleSchedulePost} disabled={busy}>Schedule</button>
              </div>
            </form>
          </article>
        </div>

        <div className="social-grid-3">
          <article className="feature-card social-panel-card">
            <span className="card-kicker">Preview</span>
            <h3>Post Preview</h3>
            <div className="social-preview-card">
              <div className="social-preview-head">
                <strong>{socialEditor.title || 'Untitled draft'}</strong>
                <StatusChip value={socialEditor.status} />
              </div>
              <div className="social-chip-list">
                {socialEditor.platforms.map((item) => (
                  <span key={item} className="social-status-chip">{item}</span>
                ))}
              </div>
              <p>{socialEditor.captions.medium || 'Caption preview will appear here.'}</p>
              <small>{socialEditor.hashtagsText}</small>
              <div className="social-preview-media">{selectedAsset ? selectedAsset.title : socialEditor.imagePlaceholder || 'No asset selected'}</div>
            </div>
          </article>

          <article className="feature-card social-panel-card">
            <span className="card-kicker">Draft Studio</span>
            <h3>AI Draft Generation</h3>
            <form className="social-form-grid" onSubmit={handleGenerateSocialDraft}>
              <div className="social-inline-fields">
                <select className="safety-input" value={draftStudio.platform} onChange={(event) => setDraftStudio((current) => ({ ...current, platform: event.target.value }))}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="all">Facebook + Instagram</option>
                </select>
                <input className="safety-input" value={draftStudio.objective} onChange={(event) => setDraftStudio((current) => ({ ...current, objective: event.target.value }))} placeholder="Objective" />
              </div>
              <input className="safety-input" value={draftStudio.audience} onChange={(event) => setDraftStudio((current) => ({ ...current, audience: event.target.value }))} placeholder="Audience" />
              <textarea className="safety-input safety-textarea" value={draftStudio.prompt} onChange={(event) => setDraftStudio((current) => ({ ...current, prompt: event.target.value }))} placeholder="Prompt / key facts" />
              <label className="minor-toggle social-check-toggle">
                <input type="checkbox" checked={draftStudio.includeEnglish} onChange={(event) => setDraftStudio((current) => ({ ...current, includeEnglish: event.target.checked }))} />
                <span className="minor-toggle-mark" />
                <span>Include English support</span>
              </label>
              <button type="submit" className="primary-button" disabled={busy}>Generate Draft</button>
            </form>
            {socialDraftResult ? (
              <div className="social-output-stack">
                <Output title="Title" value={socialDraftResult.title} />
                <Output title="Hashtags" value={(socialDraftResult.hashtags || []).join(' ')} />
                <Output title="Moderation" value={`${socialDraftResult.moderation?.status || 'review'} • ${socialDraftResult.moderation?.reason || ''}`} />
              </div>
            ) : null}
          </article>

          <article className="feature-card social-panel-card">
            <span className="card-kicker">Queue & Publish</span>
            <h3>Publishing Workflow</h3>
            <div className="social-activity-list">
              {(workspace.state.scheduledPosts || []).slice(0, 5).map((item) => (
                <div key={item.id} className="social-activity-item">
                  <strong>{item.title}</strong>
                  <span>{item.platform}</span>
                  <small>{formatTimestamp(item.scheduledFor)}</small>
                </div>
              ))}
            </div>
            <button type="button" className="secondary-button social-button-full" onClick={handleProcessQueue} disabled={busy}>
              Process Due Queue
            </button>
            <form className="social-form-grid" onSubmit={handlePublish}>
              <div className="social-inline-fields">
                <select className="safety-input" value={publishForm.platform} onChange={(event) => setPublishForm((current) => ({ ...current, platform: event.target.value }))}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
                <label className="minor-toggle social-check-toggle">
                  <input type="checkbox" checked={publishForm.dryRun} onChange={(event) => setPublishForm((current) => ({ ...current, dryRun: event.target.checked }))} />
                  <span className="minor-toggle-mark" />
                  <span>Dry run</span>
                </label>
              </div>
              <textarea className="safety-input safety-textarea" value={publishForm.message} onChange={(event) => setPublishForm((current) => ({ ...current, message: event.target.value }))} placeholder="Publish message" />
              <div className="social-inline-fields">
                <input className="safety-input" value={publishForm.imageUrl} onChange={(event) => setPublishForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="Image URL" />
                <input className="safety-input" value={publishForm.link} onChange={(event) => setPublishForm((current) => ({ ...current, link: event.target.value }))} placeholder="Link" />
              </div>
              <button type="submit" className="primary-button" disabled={busy}>Run Publish</button>
            </form>
            {publishResult ? <Output title="Latest Result" value={JSON.stringify(publishResult, null, 2)} preformatted /> : null}
          </article>
        </div>

        <div className="social-grid-2">
          <article className="feature-card social-panel-card">
            <span className="card-kicker">Media Library</span>
            <h3>Available Assets</h3>
            <div className="social-record-list social-record-list-compact">
              {mediaAssets.map((asset) => (
                <button key={asset.id} type="button" className="social-record-card" onClick={() => setSocialEditor((current) => ({ ...current, mediaAssetIds: [asset.id], imagePlaceholder: asset.source || current.imagePlaceholder }))}>
                  <div className="social-record-card-head">
                    <strong>{asset.title}</strong>
                    <StatusChip value={asset.kind} />
                  </div>
                  <span>{asset.source}</span>
                  <small>{(asset.tags || []).join(' • ')}</small>
                </button>
              ))}
            </div>
            <div className="social-inline-fields">
              <button type="button" className="secondary-button" onClick={() => handleSaveAsset({ title: 'New Placeholder Asset', kind: 'photo', source: '/media/placeholder.jpg', tags: ['placeholder', 'library'], alt: 'Placeholder asset' })}>
                Add Placeholder Asset
              </button>
            </div>
          </article>

          <article className="feature-card social-panel-card">
            <span className="card-kicker">Reply Assistant</span>
            <h3>Comment / DM Suggestions</h3>
            <form className="social-form-grid" onSubmit={handleGenerateSocialReply}>
              <div className="social-inline-fields">
                <select className="safety-input" value={socialReplyForm.platform} onChange={(event) => setSocialReplyForm((current) => ({ ...current, platform: event.target.value }))}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                </select>
                <input className="safety-input" value={socialReplyForm.goal} onChange={(event) => setSocialReplyForm((current) => ({ ...current, goal: event.target.value }))} placeholder="Goal" />
              </div>
              <textarea className="safety-input safety-textarea" value={socialReplyForm.incomingMessage} onChange={(event) => setSocialReplyForm((current) => ({ ...current, incomingMessage: event.target.value }))} placeholder="Incoming comment or DM" />
              <button type="submit" className="primary-button" disabled={busy}>Suggest Reply</button>
            </form>
            {socialReplyResult ? (
              <div className="social-output-stack">
                <Output title="Suggested Reply" value={socialReplyResult.response} />
                <Output title="Escalation" value={socialReplyResult.escalation ? socialReplyResult.escalationReason || 'Escalate to a human operator.' : 'No escalation required.'} />
              </div>
            ) : null}
          </article>
        </div>
      </div>
    )
  }

  function renderEmailSection() {
    return (
      <div className="social-grid-2 social-master-detail">
        <article className="feature-card social-panel-card">
          <span className="card-kicker">Inbox Overview</span>
          <h3>Email Inbox</h3>
          <div className="social-inline-fields">
            <input
              className="safety-input"
              type="number"
              min="1"
              max="100"
              value={emailSyncLimit}
              onChange={(event) => setEmailSyncLimit(event.target.value)}
              placeholder="Sync limit"
            />
            <button
              type="button"
              className="secondary-button"
              onClick={handleSyncEmailInbox}
              disabled={busy || (settingsForm.emailProvider || 'manual').toLowerCase() === 'manual'}
            >
              {getEmailSyncButtonLabel()}
            </button>
          </div>
          <p className="section-copy">
            Provider: {(workspace.state.settings?.email?.provider || 'manual').toUpperCase()} | Last sync:{' '}
            {workspace.state.settings?.email?.lastSyncAt ? formatTimestamp(workspace.state.settings.email.lastSyncAt) : 'Never'}
          </p>
          {workspace.state.settings?.email?.lastSyncError ? (
            <p className="social-inline-note is-error">{workspace.state.settings.email.lastSyncError}</p>
          ) : null}
          <div className="social-filter-grid">
            <input className="safety-input" value={emailSearch} onChange={(event) => setEmailSearch(event.target.value)} placeholder="Search inbox" />
            <select className="safety-input" value={emailStatusFilter} onChange={(event) => setEmailStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {messageStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select className="safety-input" value={emailTypeFilter} onChange={(event) => setEmailTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {messageClassifications.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="social-record-list">
            {filteredMessages.map((item) => (
              <button key={item.id} type="button" className={selectedMessageId === item.id ? 'social-record-card is-active' : 'social-record-card'} onClick={() => setSelectedMessageId(item.id)}>
                <div className="social-record-card-head">
                  <strong>{item.subject}</strong>
                  <StatusChip value={item.priority} />
                </div>
                <span>{item.fromName || item.fromEmail}</span>
                <small>{item.classification} • {item.status}{item.followUpNeeded ? ' • follow-up needed' : ''}</small>
              </button>
            ))}
          </div>
          <button type="button" className="secondary-button social-button-full" onClick={() => { setSelectedMessageId('new'); setMessageEditor(createEmptyMessageEditor()) }}>
            New Manual Message
          </button>
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Message Detail</span>
          <h3>Email Record</h3>
          {selectedMessage?.external?.provider ? (
            <p className="section-copy">
              Source: {selectedMessage.external.provider}
              {selectedMessage.external.webLink ? ` | Outlook link available` : ''}
            </p>
          ) : null}
          <form className="social-form-grid" onSubmit={handleSaveMessage}>
            <div className="social-inline-fields">
              <input className="safety-input" value={messageEditor.fromName} onChange={(event) => setMessageEditor((current) => ({ ...current, fromName: event.target.value }))} placeholder="Sender name" />
              <input className="safety-input" value={messageEditor.fromEmail} onChange={(event) => setMessageEditor((current) => ({ ...current, fromEmail: event.target.value }))} placeholder="Sender email" />
            </div>
            <input className="safety-input" value={messageEditor.subject} onChange={(event) => setMessageEditor((current) => ({ ...current, subject: event.target.value }))} placeholder="Subject" />
            <textarea className="safety-input safety-textarea" value={messageEditor.body} onChange={(event) => setMessageEditor((current) => ({ ...current, body: event.target.value }))} placeholder="Message body" />
            <div className="social-inline-fields">
              <select className="safety-input" value={messageEditor.classification} onChange={(event) => setMessageEditor((current) => ({ ...current, classification: event.target.value }))}>
                {messageClassifications.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select className="safety-input" value={messageEditor.status} onChange={(event) => setMessageEditor((current) => ({ ...current, status: event.target.value }))}>
                {messageStatuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="social-inline-fields">
              <select className="safety-input" value={messageEditor.priority} onChange={(event) => setMessageEditor((current) => ({ ...current, priority: event.target.value }))}>
                {messagePriorities.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <input className="safety-input" value={messageEditor.assignedTo} onChange={(event) => setMessageEditor((current) => ({ ...current, assignedTo: event.target.value }))} placeholder="Assigned to" />
            </div>
            <input className="safety-input" value={messageEditor.tagsText} onChange={(event) => setMessageEditor((current) => ({ ...current, tagsText: event.target.value }))} placeholder="Tags" />
            <textarea className="safety-input safety-textarea" value={messageEditor.notes} onChange={(event) => setMessageEditor((current) => ({ ...current, notes: event.target.value }))} placeholder="Internal notes" />
            <div className="social-action-row">
              <button type="submit" className="primary-button" disabled={busy}>Save Message</button>
              <button type="button" className="secondary-button" onClick={handleClassifyMessage} disabled={busy}>Classify</button>
              <button type="button" className="secondary-button" onClick={handleGenerateEmailDraft} disabled={busy}>Generate Reply Draft</button>
            </div>
          </form>
          {messageEditor.replyDraft ? (
            <div className="social-output-stack">
              <Output title="Reply Subject" value={messageEditor.replyDraft.subject} />
              <Output title="Reply Body" value={messageEditor.replyDraft.body} />
              <Output title="Next Action" value={messageEditor.replyDraft.nextAction || 'No action note available.'} />
            </div>
          ) : null}
          {messageEditor.history?.length ? (
            <div className="social-history-list">
              {messageEditor.history.slice().reverse().map((item) => (
                <div key={item.id} className="social-activity-item">
                  <strong>{item.summary}</strong>
                  <small>{formatTimestamp(item.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : null}
        </article>
      </div>
    )
  }

  function renderContactsSection() {
    return (
      <div className="social-grid-2 social-master-detail">
        <article className="feature-card social-panel-card">
          <span className="card-kicker">Lead Registry</span>
          <h3>Contacts & Leads</h3>
          <div className="social-filter-grid">
            <input className="safety-input" value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} placeholder="Search contacts" />
            <select className="safety-input" value={contactTypeFilter} onChange={(event) => setContactTypeFilter(event.target.value)}>
              <option value="all">All types</option>
              {contactTypes.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="social-record-list">
            {filteredContacts.map((item) => (
              <button key={item.id} type="button" className={selectedContactId === item.id ? 'social-record-card is-active' : 'social-record-card'} onClick={() => setSelectedContactId(item.id)}>
                <div className="social-record-card-head">
                  <strong>{item.name || item.email}</strong>
                  <StatusChip value={item.type} />
                </div>
                <span>{item.email}</span>
                <small>{item.organization || 'No organization'} • {item.status}</small>
              </button>
            ))}
          </div>
          <div className="social-action-row">
            <button type="button" className="secondary-button" onClick={() => handleExportContacts('json')}>Export JSON</button>
            <button type="button" className="secondary-button" onClick={() => handleExportContacts('csv')}>Export CSV</button>
          </div>
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Contact Detail</span>
          <h3>Contact Record</h3>
          <form className="social-form-grid" onSubmit={handleSaveContact}>
            <div className="social-inline-fields">
              <input className="safety-input" value={contactEditor.name} onChange={(event) => setContactEditor((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
              <input className="safety-input" value={contactEditor.email} onChange={(event) => setContactEditor((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
            </div>
            <div className="social-inline-fields">
              <input className="safety-input" value={contactEditor.phone} onChange={(event) => setContactEditor((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
              <input className="safety-input" value={contactEditor.organization} onChange={(event) => setContactEditor((current) => ({ ...current, organization: event.target.value }))} placeholder="Organization" />
            </div>
            <div className="social-inline-fields">
              <select className="safety-input" value={contactEditor.type} onChange={(event) => setContactEditor((current) => ({ ...current, type: event.target.value }))}>
                {contactTypes.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <input className="safety-input" value={contactEditor.status} onChange={(event) => setContactEditor((current) => ({ ...current, status: event.target.value }))} placeholder="Status" />
            </div>
            <input className="safety-input" value={contactEditor.tagsText} onChange={(event) => setContactEditor((current) => ({ ...current, tagsText: event.target.value }))} placeholder="Tags" />
            <textarea className="safety-input safety-textarea" value={contactEditor.notes} onChange={(event) => setContactEditor((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" />
            <button type="submit" className="primary-button" disabled={busy}>Save Contact</button>
          </form>
        </article>
      </div>
    )
  }

  function renderTemplatesSection() {
    return (
      <div className="social-grid-2 social-master-detail">
        <article className="feature-card social-panel-card">
          <div className="social-panel-head">
            <div>
              <span className="card-kicker">Template Library</span>
              <h3>Built-In Templates</h3>
            </div>
            <div className="social-inline-fields">
              {templateScopes.map((scope) => (
                <button key={scope} type="button" className={templateScope === scope ? 'header-utility-link social-tab-button is-active' : 'header-utility-link social-tab-button'} onClick={() => { setTemplateScope(scope); setSelectedTemplateId('') }}>
                  {scope}
                </button>
              ))}
            </div>
          </div>
          <div className="social-record-list">
            {currentTemplates.map((item) => (
              <button key={item.id} type="button" className={selectedTemplateId === item.id ? 'social-record-card is-active' : 'social-record-card'} onClick={() => setSelectedTemplateId(item.id)}>
                <div className="social-record-card-head">
                  <strong>{item.title}</strong>
                  <StatusChip value={templateScope} />
                </div>
                <small>{templateScope === 'email' ? item.subject : `${item.platform} • ${item.category}`}</small>
              </button>
            ))}
          </div>
          <button type="button" className="secondary-button social-button-full" onClick={() => { setSelectedTemplateId('new'); setTemplateEditor(createEmptyTemplate(templateScope)) }}>
            New Template
          </button>
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Template Editor</span>
          <h3>{templateScope === 'email' ? 'Email Template' : 'Social Template'}</h3>
          <form className="social-form-grid" onSubmit={handleSaveTemplate}>
            <input className="safety-input" value={templateEditor.title} onChange={(event) => setTemplateEditor((current) => ({ ...current, title: event.target.value }))} placeholder="Template title" />
            {templateScope === 'email' ? (
              <input className="safety-input" value={templateEditor.subject} onChange={(event) => setTemplateEditor((current) => ({ ...current, subject: event.target.value }))} placeholder="Email subject" />
            ) : (
              <div className="social-inline-fields">
                <select className="safety-input" value={templateEditor.platform} onChange={(event) => setTemplateEditor((current) => ({ ...current, platform: event.target.value }))}>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="both">Both</option>
                </select>
                <select className="safety-input" value={templateEditor.category} onChange={(event) => setTemplateEditor((current) => ({ ...current, category: event.target.value }))}>
                  {socialCategories.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            )}
            <textarea className="safety-input safety-textarea" value={templateEditor.body} onChange={(event) => setTemplateEditor((current) => ({ ...current, body: event.target.value }))} placeholder="Template body" />
            <button type="submit" className="primary-button" disabled={busy}>Save Template</button>
          </form>
        </article>
      </div>
    )
  }

  function renderSettingsSection() {
    return (
      <div className="social-grid-2">
        <article className="feature-card social-panel-card">
          <span className="card-kicker">Workspace Settings</span>
          <h3>Integration Settings</h3>
          <form className="social-form-grid" onSubmit={handleSaveSettings}>
            <div className="social-inline-fields">
              <input className="safety-input" value={settingsForm.facebookPageId} onChange={(event) => setSettingsForm((current) => ({ ...current, facebookPageId: event.target.value }))} placeholder="Facebook Page ID" />
              <input className="safety-input" value={settingsForm.instagramBusinessId} onChange={(event) => setSettingsForm((current) => ({ ...current, instagramBusinessId: event.target.value }))} placeholder="Instagram Business ID" />
            </div>
            <div className="social-inline-fields">
              <input className="safety-input" value={settingsForm.facebookPageName} onChange={(event) => setSettingsForm((current) => ({ ...current, facebookPageName: event.target.value }))} placeholder="Facebook page name" />
              <input className="safety-input" value={settingsForm.instagramHandle} onChange={(event) => setSettingsForm((current) => ({ ...current, instagramHandle: event.target.value }))} placeholder="Instagram handle" />
            </div>
            <div className="social-inline-fields">
              <input className="safety-input" value={settingsForm.inboxAddress} onChange={(event) => setSettingsForm((current) => ({ ...current, inboxAddress: event.target.value }))} placeholder="Official inbox address" />
              <select className="safety-input" value={settingsForm.emailProvider} onChange={(event) => setSettingsForm((current) => ({ ...current, emailProvider: event.target.value }))}>
                <option value="manual">manual</option>
                <option value="titan">titan</option>
                <option value="imap">imap</option>
                <option value="gmail">gmail</option>
                <option value="microsoft365">microsoft365</option>
              </select>
            </div>
            <input className="safety-input" type="number" min="1" max="30" value={settingsForm.followUpDays} onChange={(event) => setSettingsForm((current) => ({ ...current, followUpDays: event.target.value }))} placeholder="Follow-up days" />
            <button type="submit" className="primary-button" disabled={busy}>Save Settings</button>
          </form>
          {settingsForm.emailProvider === 'microsoft365' ? (
            <p className="section-copy">
              Required env vars: `M365_TENANT_ID`, `M365_CLIENT_ID`, `M365_CLIENT_SECRET`, `M365_MAILBOX_ADDRESS`, and `EMAIL_PROVIDER=microsoft365`.
            </p>
          ) : null}
          {settingsForm.emailProvider === 'gmail' ? (
            <p className="section-copy">
              Required env vars: `EMAIL_PROVIDER=gmail`, `EMAIL_INBOX_ADDRESS`, `EMAIL_SMTP_USERNAME`, `EMAIL_SMTP_PASSWORD`, optional `EMAIL_SMTP_HOST=smtp.gmail.com`, `EMAIL_SMTP_PORT=465`, and use a Gmail app password for delivery.
            </p>
          ) : null}
          {settingsForm.emailProvider === 'titan' ? (
            <p className="section-copy">
              Required env vars: `EMAIL_PROVIDER=titan`, `EMAIL_INBOX_ADDRESS`, `EMAIL_SMTP_USERNAME` (or `TITAN_SMTP_USERNAME`), `EMAIL_SMTP_PASSWORD` (or `TITAN_SMTP_PASSWORD`) for delivery, plus `EMAIL_IMAP_HOST`, `EMAIL_IMAP_USERNAME`, and `EMAIL_IMAP_PASSWORD` if you also want Titan inbox sync.
            </p>
          ) : null}
          {settingsForm.emailProvider === 'imap' ? (
            <p className="section-copy">
              Required env vars: `EMAIL_PROVIDER=imap`, `EMAIL_INBOX_ADDRESS`, `EMAIL_IMAP_HOST`, `EMAIL_IMAP_USERNAME`, `EMAIL_IMAP_PASSWORD`, optional `EMAIL_IMAP_PORT`. IMAP-only mode does not send outgoing membership emails without separate SMTP credentials.
            </p>
          ) : null}
        </article>

        <article className="feature-card social-panel-card">
          <span className="card-kicker">Implementation Notes</span>
          <h3>What Works Now</h3>
          <div className="detail-list">
            <div className="detail-list-item"><span className="dot" /><p>Protected admin workspace with session placeholder auth.</p></div>
            <div className="detail-list-item"><span className="dot" /><p>Local social drafts, approval flow, queue structure, preview, and dry-run publishing.</p></div>
            <div className="detail-list-item"><span className="dot" /><p>Inbox triage, classification rules, reply-draft generation, contact sync, and export.</p></div>
            <div className="detail-list-item"><span className="dot" /><p>Templates, activity log, media library, and integration-ready settings.</p></div>
            <div className="detail-list-item"><span className="dot" /><p>Live API account control remains disabled until credentials and token exchange are fully configured.</p></div>
          </div>
        </article>
      </div>
    )
  }
  const sectionContent = workspace
    ? activeSection === 'dashboard'
      ? renderDashboardSection()
      : activeSection === 'social'
        ? renderSocialSection()
        : activeSection === 'email'
          ? renderEmailSection()
          : activeSection === 'contacts'
            ? renderContactsSection()
            : activeSection === 'templates'
              ? renderTemplatesSection()
              : renderSettingsSection()
    : null

  if (loading) {
    return (
      <>
        <PageHero eyebrow={hero.eyebrow} title={hero.title} text={hero.body} highlights={hero.highlights} label={copy.header.highlightsLabel} />
        <section className="container page-section social-hub-shell social-admin-shell">
          <article className="feature-card social-panel-card">
            <span className="card-kicker">Loading</span>
            <h3>Preparing workspace</h3>
            <p>Checking session and loading the internal communications environment.</p>
          </article>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHero eyebrow={hero.eyebrow} title={hero.title} text={hero.body} highlights={hero.highlights} label={copy.header.highlightsLabel} />
      <section className="container page-section social-hub-shell social-admin-shell">
        {!authState.authenticated ? (
          <article className="feature-card social-panel-card social-login-card">
            <span className="card-kicker">Protected Access</span>
            <h3>Admin Sign-In</h3>
            <p>Use admin credentials to open the GDSFF internal media and communications workspace.</p>
            {authState.setupMode ? (
              <p className="social-inline-note">Setup mode is active. Any non-empty username and password will work until `ADMIN_USERNAME` and `ADMIN_PASSWORD` are configured.</p>
            ) : null}
            {error ? <p className="social-inline-note is-error">{error}</p> : null}
            <form className="social-form-grid" onSubmit={handleLogin}>
              <input className="safety-input" value={loginForm.username} onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))} placeholder="Admin username" />
              <input className="safety-input" type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} placeholder="Admin password" />
              <button type="submit" className="primary-button">Sign In</button>
            </form>
          </article>
        ) : workspace ? (
          <>
            <div className="social-admin-topbar">
              <div>
                <span className="card-kicker">Internal Operations</span>
                <h2>GDSFF Media & Communications Bot</h2>
                <p className="section-copy">
                  Signed in as {workspace.auth.user?.username || authState.user?.username}. Updated {formatTimestamp(workspace.updatedAt)}.
                </p>
              </div>
              <div className="social-admin-actions">
                <button type="button" className="secondary-button" onClick={() => runAction(loadWorkspace, 'Workspace refreshed.')}>Refresh</button>
                <button type="button" className="secondary-button" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>

            {notice ? <p className="social-inline-note is-success">{notice}</p> : null}
            {error ? <p className="social-inline-note is-error">{error}</p> : null}

            <div className="social-grid-5 social-summary-grid">
              <SummaryCard title="Pending Emails" value={workspace.summary.pendingEmails} note="Inbox items awaiting action" />
              <SummaryCard title="Urgent Requests" value={workspace.summary.urgentRequests} note="Urgent or overdue communication items" />
              <SummaryCard title="Follow-Ups" value={workspace.summary.followUpsNeeded} note="Messages beyond the configured follow-up window" />
              <SummaryCard title="Pending Drafts" value={workspace.summary.pendingSocialDrafts} note="Social drafts awaiting approval or schedule" />
              <SummaryCard title="Published Posts" value={workspace.summary.publishedSocialPosts} note="Social items marked published" />
            </div>

            <div className="social-section-tabs">
              {sectionTabs.map((tab) => (
                <button key={tab.id} type="button" className={activeSection === tab.id ? 'header-utility-link social-tab-button is-active' : 'header-utility-link social-tab-button'} onClick={() => setActiveSection(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>

            {sectionContent}
          </>
        ) : (
          <article className="feature-card social-panel-card">
            <span className="card-kicker">Unavailable</span>
            <h3>Workspace data is not loaded yet</h3>
            <p>Refresh the page or check the local API service.</p>
          </article>
        )}
      </section>
    </>
  )
}

function SummaryCard({ title, value, note }) {
  return (
    <article className="feature-card social-status-card social-summary-card">
      <span className="card-kicker">{title}</span>
      <h3>{value}</h3>
      <p>{note}</p>
    </article>
  )
}

function RuntimeTile({ title, status, text }) {
  return (
    <div className="social-runtime-tile">
      <div className="social-record-card-head">
        <strong>{title}</strong>
        <StatusChip value={status} />
      </div>
      <p>{text}</p>
    </div>
  )
}

function StatusChip({ value }) {
  const normalized = `${value || ''}`.toLowerCase()
  const tone = normalized.includes('urgent') || normalized === 'error' ? 'is-alert' : normalized.includes('ready') || normalized === 'published' || normalized === 'approved' ? 'is-ready' : normalized.includes('scheduled') || normalized.includes('planned') || normalized.includes('high') ? 'is-planned' : ''
  return <span className={`social-status-chip ${tone}`.trim()}>{value}</span>
}

function Output({ title, value, preformatted = false }) {
  return (
    <div className="social-output-block">
      <div className="social-output-title">{title}</div>
      <div className="social-output-copy">{preformatted ? <pre>{value}</pre> : <p>{value}</p>}</div>
    </div>
  )
}
