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

function buildSocialPost({ id, title, body, category, platforms, status, scheduledFor, assetId, notes = '', englishCaption = '' }) {
  return {
    id,
    title,
    category,
    platforms,
    status,
    captions: buildCaptionVariants(title, body),
    englishCaption,
    hashtags: socialHubLaunchPack.hashtags.slice(0, 6),
    imagePlaceholder: assetId ? `/media/${assetId}` : '',
    mediaAssetIds: assetId ? [assetId] : [],
    link: socialHubLaunchPack.brand.website,
    approval: {
      approvedBy: status === 'approved' || status === 'scheduled' ? 'communications.lead' : '',
      approvedAt: status === 'approved' || status === 'scheduled' ? isoOffsetDays(-1) : '',
    },
    notes,
    scheduledFor: scheduledFor || '',
    createdAt: isoOffsetDays(-5),
    updatedAt: isoOffsetDays(-1),
  }
}

function buildMediaAssets() {
  return [
    {
      id: 'brand-shield',
      title: 'GDSFF Official Shield / ოფიციალური ემბლემა',
      kind: 'logo',
      source: '/gdsff-logo-approved.png',
      tags: ['brand', 'official', 'shield'],
      alt: 'Official GDSFF emblem',
      createdAt: isoOffsetDays(-20),
    },
    {
      id: 'tactical-games-stage',
      title: 'Tactical Games Stage Briefing',
      kind: 'photo',
      source: '/gallery/tactical-rifle-line.jpg',
      tags: ['event', 'dynamic shooting', 'competition'],
      alt: 'Athletes receiving stage briefing',
      createdAt: isoOffsetDays(-7),
    },
    {
      id: 'fitness-lane',
      title: 'Functional Fitness Transition Lane',
      kind: 'photo',
      source: '/gallery/weighted-carry-lane.jpg',
      tags: ['functional fitness', 'competition', 'hybrid'],
      alt: 'Functional fitness transition lane',
      createdAt: isoOffsetDays(-7),
    },
    {
      id: 'youth-clinic',
      title: 'Youth Development Safety Clinic',
      kind: 'photo',
      source: '/gallery/rope-climb-course.jpg',
      tags: ['youth', 'development', 'education'],
      alt: 'Youth clinic and coached activity',
      createdAt: isoOffsetDays(-6),
    },
    {
      id: 'partner-briefing-room',
      title: 'International Partner Briefing Room',
      kind: 'photo',
      source: '/range-hero.png',
      tags: ['partnership', 'international', 'sports tourism'],
      alt: 'Official partner briefing setup',
      createdAt: isoOffsetDays(-5),
    },
    {
      id: 'printable-target-preview',
      title: 'GDSFF Printable Target Preview',
      kind: 'document-preview',
      source: '/downloads/gdsff-target-facebook-preview.svg',
      tags: ['documents', 'membership', 'target', 'facebook'],
      alt: 'GDSFF printable 1-inch grid target preview',
      createdAt: isoOffsetDays(-1),
    },
  ]
}

function buildSocialTemplates() {
  return [
    {
      id: 'social-template-official-statement',
      type: 'social',
      title: 'Official Statement / ოფიციალური განცხადება',
      platform: 'both',
      category: 'announcement',
      body:
        'Official Statement | GDSFF\n\nThe Georgian Dynamic Shooting and Functional Fitness Federation confirms the following institutional update:\n- Decision/Update: [insert official point]\n- Effective Date: [insert date]\n- Responsible Unit: [insert department]\n\nFor official reference and documents, use only gdsff.org and office@gdsff.org.',
    },
    {
      id: 'social-template-event-announcement',
      type: 'social',
      title: 'Event Announcement / ღონისძიების ანონსი',
      platform: 'both',
      category: 'event',
      body:
        'Event Announcement\n\nCompetition: [event title]\nDate: [date]\nLocation: [venue]\nDivisions: [dynamic shooting / functional fitness / hybrid]\nRegistration: [deadline and link]\n\nAll participants must follow federation safety and eligibility rules.',
    },
    {
      id: 'social-template-registration-open',
      type: 'social',
      title: 'Registration Open / რეგისტრაცია ღიაა',
      platform: 'both',
      category: 'membership',
      body:
        'Registration Open\n\nAthlete registration is now open for [event/program].\nRequired: membership eligibility, ID verification, safety acknowledgement.\nQuestions: office@gdsff.org',
    },
    {
      id: 'social-template-partnership',
      type: 'social',
      title: 'Partnership Announcement / პარტნიორობა',
      platform: 'both',
      category: 'partnership',
      body:
        'Partnership Announcement\n\nGDSFF welcomes institutional and commercial cooperation with organizations supporting sport development, youth pathways, and international events.\nSubmit proposals to office@gdsff.org.',
    },
    {
      id: 'social-template-athlete-result',
      type: 'social',
      title: 'Athlete Achievement / სპორტსმენის შედეგი',
      platform: 'instagram',
      category: 'gallery',
      body:
        'Athlete Achievement\n\nCongratulations to [athlete name] for [result] at [competition].\nDiscipline: [dynamic shooting / functional fitness / hybrid]\nOfficial standings and verification: gdsff.org',
    },
    {
      id: 'social-template-youth-program',
      type: 'social',
      title: 'Youth Program Update / ახალგაზრდული პროგრამა',
      platform: 'both',
      category: 'announcement',
      body:
        'Youth Development Program\n\nThis week GDSFF delivered supervised youth training focused on discipline, safety culture, and functional capacity.\nNext intake and coach brief: [date/time].',
    },
    {
      id: 'social-template-sponsor-thanks',
      type: 'social',
      title: 'Sponsor Thank You / სპონსორის მადლობა',
      platform: 'both',
      category: 'partnership',
      body:
        'Sponsor Appreciation\n\nGDSFF thanks [sponsor name] for supporting federation operations and athlete development.\nPartnership visibility and compliance are managed under federation standards.',
    },
    {
      id: 'social-template-documents',
      type: 'social',
      title: 'Documents & Resources / დოკუმენტები',
      platform: 'facebook',
      category: 'documents',
      body:
        'Official Documents Update\n\nThe federation charter, membership application form, safety rules, and governance references are available on gdsff.org.\nFor institutional requests: office@gdsff.org',
    },
  ]
}

function buildEmailMessages() {
  return [
    {
      id: randomUUID(),
      subject: 'Athlete registration for Batumi Tactical Games',
      body:
        'Hello GDSFF team, I am an athlete from Kutaisi and want to register for Batumi Tactical Games 2026. Please confirm eligibility and payment details.',
      fromName: 'Levan Chikhradze',
      fromEmail: 'levan.chikhradze@gmail.com',
      classification: 'membership',
      status: 'new',
      priority: 'normal',
      notes: 'Needs registration checklist and payment timeline.',
      tags: ['athlete', 'registration', 'batumi'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-9),
      lastUpdatedAt: isoOffsetHours(-9),
      assignedTo: 'membership.desk',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Athlete registration inquiry received from website contact channel.',
          createdAt: isoOffsetHours(-9),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Sponsorship package request - performance equipment',
      body:
        'We represent a sports equipment brand and would like to review sponsorship tiers for your 2026 event calendar, including youth and elite divisions.',
      fromName: 'GeoDefense Equipment',
      fromEmail: 'partnerships@geodefense.ge',
      classification: 'partnership',
      status: 'in progress',
      priority: 'high',
      notes: 'Classify as sponsor pipeline. Share sponsor deck v1 and legal terms.',
      tags: ['sponsor', 'partnership', 'commercial'],
      replyDraftId: '',
      receivedAt: isoOffsetDays(-1),
      lastUpdatedAt: isoOffsetHours(-12),
      assignedTo: 'commercial.office',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Sponsorship inquiry received.',
          createdAt: isoOffsetDays(-1),
        },
        {
          id: randomUUID(),
          type: 'classification',
          summary: 'Classified as high-priority partnership lead.',
          createdAt: isoOffsetHours(-12),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Sports tourism cooperation - mountain venue showcase',
      body:
        'Our tourism board is planning a regional sports week and requests cooperation with GDSFF for tactical-style competition hosting and media promotion.',
      fromName: 'Adjara Sports Tourism Office',
      fromEmail: 'international@adjara-tourism.ge',
      classification: 'partnership',
      status: 'pending',
      priority: 'high',
      notes: 'Escalate to director and international relations unit.',
      tags: ['sports-tourism', 'international', 'hosting'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-28),
      lastUpdatedAt: isoOffsetHours(-20),
      assignedTo: 'director.office',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Institutional cooperation request received.',
          createdAt: isoOffsetHours(-28),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Media request: interview on safety standards',
      body:
        'This is Rustavi Sport TV. We request an interview with GDSFF leadership regarding safety protocols and youth development pathways before your upcoming event.',
      fromName: 'Rustavi Sport TV',
      fromEmail: 'newsdesk@rustavisport.tv',
      classification: 'media',
      status: 'waiting',
      priority: 'urgent',
      notes: 'Security-sensitive messaging. Await spokesperson confirmation.',
      tags: ['media', 'interview', 'safety'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-6),
      lastUpdatedAt: isoOffsetHours(-5),
      assignedTo: 'media.office',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Urgent media request logged.',
          createdAt: isoOffsetHours(-6),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Official charter and board resolution copy request',
      body:
        'Please provide charter pages and governance extracts for federation due-diligence review. Certified scans are preferred.',
      fromName: 'Caucasus Legal Advisory',
      fromEmail: 'compliance@caucasuslegal.ge',
      classification: 'legal/documents',
      status: 'new',
      priority: 'high',
      notes: 'Legal review required before sharing any restricted documents.',
      tags: ['legal', 'documents', 'compliance'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-16),
      lastUpdatedAt: isoOffsetHours(-16),
      assignedTo: 'legal.office',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Legal/document request captured.',
          createdAt: isoOffsetHours(-16),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: '[Instagram Comment] Registration age for youth category?',
      body:
        'Follower question copied from Instagram: What is the minimum age for the youth hybrid division and where can parents read safety requirements?',
      fromName: 'Maka G.',
      fromEmail: 'social+comment@maka.mail',
      classification: 'general inquiry',
      status: 'new',
      priority: 'normal',
      notes: 'Respond publicly with youth policy link and safety consent route.',
      tags: ['instagram', 'comment', 'youth'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-4),
      lastUpdatedAt: isoOffsetHours(-4),
      assignedTo: 'social.operator',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Follower comment escalated to inbox for response quality control.',
          createdAt: isoOffsetHours(-4),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: '[Facebook Comment] Click this link to win rifles',
      body:
        'Spam comment detected on event post with suspicious external links and fake prize claims. Please remove and block account.',
      fromName: 'Unknown Promo Account',
      fromEmail: 'noreply@unknown-promo.example',
      classification: 'general inquiry',
      status: 'in progress',
      priority: 'urgent',
      notes: 'Moderate as spam/scam. Block account and record incident.',
      tags: ['spam', 'moderation', 'security'],
      replyDraftId: '',
      receivedAt: isoOffsetHours(-3),
      lastUpdatedAt: isoOffsetHours(-2),
      assignedTo: 'moderation.desk',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Spam/scam report imported from Facebook comments.',
          createdAt: isoOffsetHours(-3),
        },
        {
          id: randomUUID(),
          type: 'action',
          summary: 'Comment hidden pending final moderation confirmation.',
          createdAt: isoOffsetHours(-2),
        },
      ],
    },
    {
      id: randomUUID(),
      subject: 'Volunteer request for regional qualifier',
      body:
        'I am a certified coach and would like to volunteer for the next regional qualifier as an event marshal. Please advise next steps.',
      fromName: 'Dato Khvedelidze',
      fromEmail: 'dato.khvedelidze@coachmail.ge',
      classification: 'event participation',
      status: 'replied',
      priority: 'normal',
      notes: 'Volunteer onboarding document sent.',
      tags: ['event', 'volunteer', 'coach'],
      replyDraftId: '',
      receivedAt: isoOffsetDays(-3),
      lastUpdatedAt: isoOffsetDays(-2),
      assignedTo: 'events.desk',
      history: [
        {
          id: randomUUID(),
          type: 'received',
          summary: 'Volunteer request received.',
          createdAt: isoOffsetDays(-3),
        },
        {
          id: randomUUID(),
          type: 'reply',
          summary: 'Onboarding instructions and checklist sent.',
          createdAt: isoOffsetDays(-2),
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
              : message.classification === 'event participation'
                ? 'participant'
                : 'general',
    organization: message.fromName,
    tags: [...message.tags],
    status: ['replied', 'closed', 'archived'].includes(message.status) ? 'active' : 'follow-up',
    notes: message.notes,
    lastContactAt: message.lastUpdatedAt,
    createdAt: message.receivedAt,
  }))
}

function buildSocialPosts() {
  return [
    buildSocialPost({
      id: 'official-statement-governance',
      title: 'Official Federation Statement: 2026 Competition Governance',
      body:
        'GDSFF confirms the 2026 governance protocol for dynamic shooting and functional fitness competitions. All regional events will apply standardized safety briefings, judge procedures, and athlete verification.\n\nFor official documents and compliance references, use gdsff.org.',
      category: 'announcement',
      platforms: ['facebook', 'instagram'],
      status: 'approved',
      assetId: 'brand-shield',
      notes: 'Ready for president-level sign-off publish window.',
      englishCaption:
        'GDSFF confirms the 2026 governance protocol. Standardized safety and athlete verification will apply at all regional events.',
    }),
    buildSocialPost({
      id: 'event-batumi-tactical-games',
      title: 'Batumi Tactical Games 2026 - Event Promotion Queue',
      body:
        'Event promotion is open for Batumi Tactical Games 2026.\n\nDate: 24 May 2026\nVenue: Batumi Coastal Sports Range\nFormat: Dynamic Shooting + Functional Fitness Hybrid Stages\nRegistration route: office@gdsff.org',
      category: 'event',
      platforms: ['facebook', 'instagram'],
      status: 'scheduled',
      scheduledFor: isoOffsetDays(2),
      assetId: 'tactical-games-stage',
      notes: 'Queue for 10:00 local publication after approval confirmation.',
      englishCaption: 'Batumi Tactical Games 2026 promotion post queued for approved release.',
    }),
    buildSocialPost({
      id: 'registration-open-athletes',
      title: 'Athlete Registration Open - Regional Qualifier',
      body:
        'Registration is open for athletes joining the regional qualifier cycle.\n\nRequired: membership eligibility, valid ID, and safety acknowledgement.\n\nContact: office@gdsff.org',
      category: 'membership',
      platforms: ['facebook'],
      status: 'draft',
      assetId: 'fitness-lane',
      notes: 'Awaiting final fee confirmation from finance office.',
      englishCaption: 'Registration opens for the regional qualifier cycle.',
    }),
    buildSocialPost({
      id: 'partnership-sports-tourism',
      title: 'Institutional Partnership Track - Sports Tourism',
      body:
        'GDSFF opens an institutional partnership track for sports tourism and international cooperation projects that support safe, high-standard tactical-style competition hosting in Georgia.',
      category: 'partnership',
      platforms: ['facebook', 'instagram'],
      status: 'approved',
      assetId: 'partner-briefing-room',
      notes: 'Prepared for partner outreach campaign.',
      englishCaption: 'Institutional sports tourism partnership track is active.',
    }),
    buildSocialPost({
      id: 'athlete-result-highlight',
      title: 'Athlete Achievement: Elite Hybrid Stage Result',
      body:
        'Congratulations to Mariam Tsereteli for securing a top finish in the elite hybrid stage block.\n\nOfficial ranking and timing verification will be published in the event bulletin.',
      category: 'gallery',
      platforms: ['instagram'],
      status: 'draft',
      assetId: 'fitness-lane',
      notes: 'Waiting for signed photo release from athlete manager.',
      englishCaption: 'Elite hybrid stage achievement highlight ready for media approval.',
    }),
    buildSocialPost({
      id: 'youth-development-week',
      title: 'Youth Development Week - Safety and Discipline Module',
      body:
        'GDSFF youth development week includes coach-supervised safety drills, discipline routines, and age-appropriate functional conditioning.\n\nParent information and safety standards are available at gdsff.org.',
      category: 'announcement',
      platforms: ['facebook', 'instagram'],
      status: 'scheduled',
      scheduledFor: isoOffsetDays(4),
      assetId: 'youth-clinic',
      notes: 'Queue alongside youth registration reminder story set.',
      englishCaption: 'Youth safety and discipline module scheduled for publication.',
    }),
    buildSocialPost({
      id: 'sponsor-thank-you-post',
      title: 'Sponsor Appreciation - Equipment and Recovery Support',
      body:
        'GDSFF thanks partner organizations supporting athlete preparation, safety operations, and event logistics.\n\nSponsor visibility is managed under official federation communication standards.',
      category: 'partnership',
      platforms: ['facebook', 'instagram'],
      status: 'published',
      assetId: 'partner-briefing-room',
      notes: 'Published after sponsor legal sign-off.',
      englishCaption: 'Sponsor appreciation post published with compliance sign-off.',
    }),
    buildSocialPost({
      id: 'printable-target-download',
      title: 'Printable Target Download and Membership Links',
      body:
        'GDSFF has added an official printable 1-inch grid training target to the documents page.\n\nDownload target PDF: https://gdsff.org/downloads/gdsff-printable-target-1in-grid.pdf\nMembership application: https://gdsff.org/membership#online-application\nSafety consent and signature workflow: https://gdsff.org/safety-consent\n\nUse only official website links for applications, downloads, and signed consent.',
      category: 'documents',
      platforms: ['facebook'],
      status: 'approved',
      assetId: 'printable-target-preview',
      notes: 'Facebook pinned-post candidate. Publish only from the official Page after owner approval.',
      englishCaption: 'GDSFF printable target and membership links are ready for Facebook.',
    }),
    buildSocialPost({
      id: 'documents-and-rules-update',
      title: 'Documents and Safety Rules Update',
      body:
        'The federation has updated the documents and resources page with the charter, membership forms, and safety acknowledgement package.\n\nUse only official materials from gdsff.org.',
      category: 'documents',
      platforms: ['facebook'],
      status: 'draft',
      assetId: 'brand-shield',
      notes: 'Pending legal review note before approval.',
      englishCaption: 'Documents and safety resources update prepared as a draft.',
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

function buildActivityLog() {
  return [
    {
      id: randomUUID(),
      type: 'approval',
      entityType: 'social-post',
      entityId: 'official-statement-governance',
      summary: 'Official governance statement moved to approved queue.',
      createdAt: isoOffsetHours(-10),
    },
    {
      id: randomUUID(),
      type: 'classification',
      entityType: 'email-message',
      entityId: 'sponsorship-lead',
      summary: 'Sponsorship message classified as partnership and escalated to commercial office.',
      createdAt: isoOffsetHours(-9),
    },
    {
      id: randomUUID(),
      type: 'reply',
      entityType: 'email-message',
      entityId: 'athlete-registration',
      summary: 'Athlete registration inquiry answered with official checklist template.',
      createdAt: isoOffsetHours(-8),
    },
    {
      id: randomUUID(),
      type: 'queue',
      entityType: 'social-post',
      entityId: 'event-batumi-tactical-games',
      summary: 'Event promotion post queued for dry-run publication review.',
      createdAt: isoOffsetHours(-7),
    },
    {
      id: randomUUID(),
      type: 'moderation',
      entityType: 'comment',
      entityId: 'facebook-spam-1',
      summary: 'Spam/scam follower comment flagged for moderation and security log.',
      createdAt: isoOffsetHours(-6),
    },
    {
      id: randomUUID(),
      type: 'escalation',
      entityType: 'email-message',
      entityId: 'media-interview-request',
      summary: 'Media interview request escalated to leadership and legal review lane.',
      createdAt: isoOffsetHours(-5),
    },
  ]
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
      notes: 'Demo mode keeps approval-first workflow. Configure ADMIN_USERNAME and ADMIN_PASSWORD for protected mode.',
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
    activityLog: buildActivityLog(),
    drafts: [],
    assistantSessions: [],
    replies: [],
    webhooks: [],
    publishHistory: [],
    inboxTriage: [],
  }
}
