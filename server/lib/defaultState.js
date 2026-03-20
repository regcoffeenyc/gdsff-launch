import { randomUUID } from 'node:crypto'
import { socialHubLaunchPack } from '../../src/content/socialHubLaunchPack.js'
import { classificationRules, getDefaultEmailTemplates } from './emailWorkflow.js'

function isoOffsetDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

function isoOffsetHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

function buildCaptionVariants(title, body) {
  const compactBody = body.trim()
  const firstParagraph = compactBody.split('\n\n')[0] || compactBody
  const short = `${title}\n\n${firstParagraph}`.trim()
  const medium = compactBody
  const long = `${compactBody}\n\n${socialHubLaunchPack.brand.website}\n${socialHubLaunchPack.brand.email}\n${socialHubLaunchPack.brand.phone}`.trim()

  return { short, medium, long }
}

function buildSocialPost({ id, title, body, category, platforms, status, scheduledFor, assetId }) {
  return {
    id,
    title,
    category,
    platforms,
    status,
    captions: buildCaptionVariants(title, body),
    englishCaption: '',
    hashtags: socialHubLaunchPack.hashtags.slice(0, 5),
    imagePlaceholder: assetId ? `/media/${assetId}` : '',
    mediaAssetIds: assetId ? [assetId] : [],
    link: socialHubLaunchPack.brand.website,
    approval: {
      approvedBy: status === 'approved' || status === 'scheduled' ? 'admin' : '',
      approvedAt: status === 'approved' || status === 'scheduled' ? isoOffsetDays(-1) : '',
    },
    notes: '',
    scheduledFor: scheduledFor || '',
    createdAt: isoOffsetDays(-3),
    updatedAt: isoOffsetDays(-1),
  }
}

function buildMediaAssets() {
  return [
    {
      id: 'logo-approved',
      title: 'Approved Federation Logo',
      kind: 'logo',
      source: '/gdsff-logo-approved.png',
      tags: ['brand', 'official', 'logo'],
      alt: 'Approved GDSFF emblem',
      createdAt: isoOffsetDays(-10),
    },
    {
      id: 'range-hero',
      title: 'Range Hero',
      kind: 'cover',
      source: '/range-hero.png',
      tags: ['range', 'cover', 'facebook'],
      alt: 'Official range visual',
      createdAt: isoOffsetDays(-10),
    },
    {
      id: 'tactical-line',
      title: 'Dynamic Shooting Line',
      kind: 'photo',
      source: '/gallery/tactical-rifle-line.jpg',
      tags: ['dynamic shooting', 'action', 'instagram'],
      alt: 'Dynamic shooting action image',
      createdAt: isoOffsetDays(-9),
    },
    {
      id: 'weighted-carry',
      title: 'Functional Fitness Carry',
      kind: 'photo',
      source: '/gallery/weighted-carry-lane.jpg',
      tags: ['functional fitness', 'event', 'strength'],
      alt: 'Functional fitness weighted carry lane',
      createdAt: isoOffsetDays(-9),
    },
    {
      id: 'rope-course',
      title: 'Functional Fitness Course',
      kind: 'photo',
      source: '/gallery/rope-climb-course.jpg',
      tags: ['functional fitness', 'course', 'gallery'],
      alt: 'Functional fitness obstacle course',
      createdAt: isoOffsetDays(-8),
    },
  ]
}

function buildSocialTemplates() {
  const categoryMap = {
    launch: 'announcement',
    membership: 'membership',
    leadership: 'leadership',
    documents: 'documents',
    contact: 'partnership',
    overview: 'announcement',
    mission: 'announcement',
    vision: 'announcement',
    safety: 'safety',
  }

  const facebookTemplates = socialHubLaunchPack.facebook.posts.map((item) => ({
    id: `social-template-facebook-${item.id}`,
    type: 'social',
    title: item.title,
    platform: 'facebook',
    category: categoryMap[item.id] || 'announcement',
    body: item.body,
  }))

  const instagramTemplates = socialHubLaunchPack.instagram.posts.map((item) => ({
    id: `social-template-instagram-${item.id}`,
    type: 'social',
    title: item.title,
    platform: 'instagram',
    category: categoryMap[item.id] || 'announcement',
    body: item.body,
  }))

  return [
    ...facebookTemplates,
    ...instagramTemplates,
    {
      id: 'social-template-event',
      type: 'social',
      title: 'Event Announcement',
      platform: 'both',
      category: 'event',
      body:
        'GDSFF აცხადებს: [ღონისძიების დასახელება]\n\nთარიღი: [თარიღი]\nლოკაცია: [ადგილი]\nფორმატი: [ფორმატი]\nრეგისტრაციისა და დამატებითი დეტალების შესახებ ოფიციალური ინფორმაცია გამოქვეყნდება ფედერაციის არხებზე.',
    },
    {
      id: 'social-template-gallery',
      type: 'social',
      title: 'Gallery / Media Post',
      platform: 'instagram',
      category: 'gallery',
      body:
        'GDSFF-ის მედია განახლებაში წარმოგიდგენთ ოფიციალურ ვიზუალურ მასალას ფედერაციის ღონისძიებებიდან, სპორტული გარემოდან და სამუშაო პროცესიდან.',
    },
  ]
}

function buildEmailMessages() {
  return [
    {
      id: randomUUID(),
      subject: 'Membership application question',
      body: 'Hello, I would like to join the federation and need the application procedure for athletes.',
      fromName: 'Nika Beridze',
      fromEmail: 'nika@example.com',
      classification: 'membership',
      status: 'new',
      priority: 'normal',
      notes: '',
      tags: ['membership', 'athlete'],
      replyDraftId: '',
      receivedAt: isoOffsetDays(-1),
      lastUpdatedAt: isoOffsetDays(-1),
      assignedTo: 'secretariat',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Inbound email received.',
          createdAt: isoOffsetDays(-1),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Partnership proposal for national events',
      body: 'We are interested in discussing sponsorship and partnership cooperation for your events.',
      fromName: 'Lela Partners',
      fromEmail: 'lela@partner.ge',
      classification: 'partnership',
      status: 'in progress',
      priority: 'high',
      notes: 'Prepare sponsorship deck and follow-up call.',
      tags: ['partner', 'sponsor'],
      replyDraftId: '',
      receivedAt: isoOffsetDays(-2),
      lastUpdatedAt: isoOffsetDays(-1),
      assignedTo: 'director',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Inbound partnership inquiry received.',
          createdAt: isoOffsetDays(-2),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Media interview request',
      body: 'We would like to request a short interview about GDSFF launch plans and 2026 activity.',
      fromName: 'Sport News Georgia',
      fromEmail: 'editor@sportnews.ge',
      classification: 'media',
      status: 'waiting',
      priority: 'urgent',
      notes: 'Need approval on spokesperson and time window.',
      tags: ['media', 'press'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-20),
      lastUpdatedAt: isoOffsetHours(-20),
      assignedTo: 'president',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Inbound media request received.',
          createdAt: isoOffsetHours(-20),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Request for charter and official documents',
      body: 'Please provide access to the official charter and federation documents.',
      fromName: 'Tamar Legal Office',
      fromEmail: 'tamar@legal.ge',
      classification: 'legal/documents',
      status: 'replied',
      priority: 'normal',
      notes: 'Documents link already sent.',
      tags: ['documents', 'legal'],
      replyDraftId: '',
      receivedAt: isoOffsetDays(-4),
      lastUpdatedAt: isoOffsetDays(-3),
      assignedTo: 'secretariat',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Document request received.',
          createdAt: isoOffsetDays(-4),
        },
        {
          id: randomUUID(),
          type: 'reply',
          summary: 'Documents reply issued.',
          createdAt: isoOffsetDays(-3),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Event participation inquiry',
      body: 'Could you advise how to participate in the next federation event and where to register?',
      fromName: 'Irakli Match',
      fromEmail: 'irakli@mail.com',
      classification: 'event participation',
      status: 'new',
      priority: 'normal',
      notes: '',
      tags: ['event', 'participation'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-10),
      lastUpdatedAt: isoOffsetHours(-10),
      assignedTo: 'events',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Participation inquiry received.',
          createdAt: isoOffsetHours(-10),
        },
      ],
    },
  ]
}

function buildContacts(messages) {
  return messages.map((message) => ({
    id: randomUUID(),
    name: message.fromName,
    email: message.fromEmail,
    phone: '',
    type:
      message.classification === 'membership'
        ? 'member'
        : message.classification === 'partnership'
          ? 'partner'
          : message.classification === 'media'
            ? 'media'
            : message.classification === 'legal/documents'
              ? 'institution'
              : 'general',
    organization: message.fromName,
    tags: [...message.tags],
    status: ['replied', 'closed'].includes(message.status) ? 'active' : 'follow-up',
    notes: message.notes,
    lastContactAt: message.lastUpdatedAt,
    createdAt: message.receivedAt,
  }))
}

function buildSocialPosts() {
  return [
    buildSocialPost({
      id: 'fb-launch',
      title: socialHubLaunchPack.facebook.posts[0].title,
      body: socialHubLaunchPack.facebook.posts[0].body,
      category: 'announcement',
      platforms: ['facebook'],
      status: 'approved',
      assetId: 'logo-approved',
    }),
    buildSocialPost({
      id: 'fb-membership',
      title: socialHubLaunchPack.facebook.posts[1].title,
      body: socialHubLaunchPack.facebook.posts[1].body,
      category: 'membership',
      platforms: ['facebook'],
      status: 'draft',
      assetId: 'range-hero',
    }),
    buildSocialPost({
      id: 'fb-leadership',
      title: socialHubLaunchPack.facebook.posts[3].title,
      body: socialHubLaunchPack.facebook.posts[3].body,
      category: 'leadership',
      platforms: ['facebook'],
      status: 'scheduled',
      scheduledFor: isoOffsetDays(1),
      assetId: 'logo-approved',
    }),
    buildSocialPost({
      id: 'ig-launch',
      title: socialHubLaunchPack.instagram.posts[0].title,
      body: socialHubLaunchPack.instagram.posts[0].body,
      category: 'announcement',
      platforms: ['instagram'],
      status: 'published',
      assetId: 'logo-approved',
    }),
    buildSocialPost({
      id: 'ig-safety',
      title: socialHubLaunchPack.instagram.posts[7].title,
      body: socialHubLaunchPack.instagram.posts[7].body,
      category: 'safety',
      platforms: ['instagram'],
      status: 'draft',
      assetId: 'tactical-line',
    }),
    buildSocialPost({
      id: 'both-partnership',
      title: socialHubLaunchPack.facebook.posts[4].title,
      body: socialHubLaunchPack.facebook.posts[4].body,
      category: 'partnership',
      platforms: ['facebook', 'instagram'],
      status: 'scheduled',
      scheduledFor: isoOffsetDays(2),
      assetId: 'weighted-carry',
    }),
  ]
}

function buildScheduledPosts(socialPosts) {
  return socialPosts
    .filter((item) => item.status === 'scheduled' && item.scheduledFor)
    .map((item) => ({
      id: randomUUID(),
      postId: item.id,
      title: item.title,
      platform: item.platforms[0],
      scheduledFor: item.scheduledFor,
      status: 'scheduled',
      dryRun: true,
      imageUrl: '',
      lastProcessedAt: '',
      lastResult: null,
      createdAt: isoOffsetDays(-1),
    }))
}

export function createDefaultState() {
  const messages = buildEmailMessages()
  const socialPosts = buildSocialPosts()
  const emailTemplates = getDefaultEmailTemplates()
  const socialTemplates = buildSocialTemplates()

  return {
    updatedAt: null,
    settings: {
      meta: {
        facebookPageId: '',
        instagramBusinessId: '',
        facebookPageName: socialHubLaunchPack.facebook.pageName,
        instagramHandle: socialHubLaunchPack.instagram.recommendedUsername,
      },
      email: {
        inboxAddress: socialHubLaunchPack.brand.email,
        provider: 'manual',
        providerStatus: 'placeholder',
        lastSyncAt: '',
        lastSyncStatus: 'never',
        lastSyncCount: 0,
        lastSyncError: '',
        lastSyncProvider: '',
        nextSyncCursor: '',
      },
      automation: {
        followUpDays: 3,
      },
    },
    auth: {
      lastLoginAt: '',
      lastCallbackAt: '',
      lastCallbackCode: '',
      notes: 'Configure ADMIN_USERNAME and ADMIN_PASSWORD for protected mode.',
    },
    socialPosts,
    mediaAssets: buildMediaAssets(),
    messages,
    contacts: buildContacts(messages),
    membershipApplications: [],
    templates: {
      social: socialTemplates,
      email: emailTemplates,
    },
    replyRules: classificationRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      classification: rule.classification,
      templateId: rule.templateId,
      priority: rule.priority,
      keywords: [...rule.keywords],
      isEnabled: true,
    })),
    scheduledPosts: buildScheduledPosts(socialPosts),
    activityLog: [
      {
        id: randomUUID(),
        type: 'system',
        entityType: 'bot',
        entityId: 'gdsff-media-bot',
        summary: 'Initial communications workspace seeded with sample data.',
        createdAt: isoOffsetDays(-1),
      },
    ],
    drafts: [],
    assistantSessions: [],
    replies: [],
    webhooks: [],
    publishHistory: [],
    inboxTriage: [],
  }
}
