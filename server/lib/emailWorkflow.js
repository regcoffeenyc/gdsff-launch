import { socialHubLaunchPack } from '../../src/content/socialHubLaunchPack.js'

export const messageStatusOptions = ['new', 'pending', 'in progress', 'waiting', 'replied', 'closed', 'archived']
export const messagePriorityOptions = ['low', 'normal', 'high', 'urgent']

export const classificationRules = [
  {
    id: 'membership',
    label: 'Membership',
    classification: 'membership',
    contactType: 'member',
    templateId: 'membership-response',
    priority: 'normal',
    keywords: ['membership', 'join', 'member', 'application', 'registration', 'წევრობა', 'გაწევრიანება', 'განაცხადი'],
  },
  {
    id: 'partnership',
    label: 'Partnership',
    classification: 'partnership',
    contactType: 'partner',
    templateId: 'partnership-response',
    priority: 'high',
    keywords: ['partner', 'partnership', 'sponsor', 'sponsorship', 'cooperate', 'collaboration', 'თანამშრომლობა', 'პარტნიორობა', 'სპონსორი'],
  },
  {
    id: 'media',
    label: 'Media',
    classification: 'media',
    contactType: 'media',
    templateId: 'media-response',
    priority: 'high',
    keywords: ['media', 'press', 'interview', 'journalist', 'coverage', 'publication', 'მედია', 'პრესა', 'ინტერვიუ', 'ჟურნალისტ'],
  },
  {
    id: 'event',
    label: 'Event Participation',
    classification: 'event participation',
    contactType: 'participant',
    templateId: 'request-received-confirmation',
    priority: 'normal',
    keywords: ['event', 'competition', 'participation', 'register', 'entry', 'calendar', 'ღონისძიება', 'შეჯიბრი', 'მონაწილეობა', 'რეგისტრაცია'],
  },
  {
    id: 'documents',
    label: 'Legal / Documents',
    classification: 'legal/documents',
    contactType: 'institution',
    templateId: 'documents-request-reply',
    priority: 'normal',
    keywords: ['document', 'documents', 'charter', 'statute', 'bylaw', 'legal', 'certificate', 'დოკუმენტი', 'დოკუმენტები', 'წესდება', 'იურიდიული'],
  },
]

const urgentKeywords = ['urgent', 'immediately', 'asap', 'deadline', 'today', 'tomorrow', 'სასწრაფო', 'დაუყოვნებლივ', 'ვადა']

function normalizeText(value) {
  return `${value || ''}`.toLowerCase()
}

function fillTemplate(template, variables) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '')
}

export function classifyMessage(message, customRules = classificationRules) {
  const haystack = `${message.subject || ''}\n${message.body || ''}`.toLowerCase()
  const matchedRule = customRules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase())))
  const classification = matchedRule?.classification || 'general inquiry'
  const priority =
    urgentKeywords.some((keyword) => haystack.includes(keyword))
      ? 'urgent'
      : matchedRule?.priority || 'normal'

  return {
    classification,
    priority,
    matchedRuleId: matchedRule?.id || 'general',
    templateId: matchedRule?.templateId || 'general-contact-response',
    contactType: matchedRule?.contactType || 'general',
    tags: matchedRule ? [matchedRule.classification, matchedRule.contactType] : ['general'],
  }
}

export function needsFollowUp(message, followUpDays = 3) {
  if (['replied', 'closed', 'archived'].includes(message.status)) {
    return false
  }

  const baseDate = new Date(message.lastUpdatedAt || message.receivedAt || message.createdAt || Date.now())
  if (Number.isNaN(baseDate.getTime())) {
    return false
  }

  const ageMs = Date.now() - baseDate.getTime()
  return ageMs >= followUpDays * 24 * 60 * 60 * 1000
}

export function getDefaultEmailTemplates() {
  return [
    {
      id: 'membership-response',
      kind: 'email',
      title: 'Membership Response',
      subject: 'GDSFF Membership Inquiry',
      body:
        'Dear {{name}},\n\nThank you for your interest in membership with the Georgian Dynamic Shooting & Functional Fitness Federation.\n\nMembership procedures, eligibility, and the official application form are available on {{website}}. You may also request additional guidance through {{email}}.\n\nKind regards,\nGDSFF Secretariat\n{{email}}\n{{phone}}',
    },
    {
      id: 'partnership-response',
      kind: 'email',
      title: 'Partnership Response',
      subject: 'GDSFF Partnership Inquiry',
      body:
        'Dear {{name}},\n\nThank you for contacting GDSFF regarding partnership and cooperation opportunities.\n\nWe welcome institutional, event, and strategic partnership discussions. Please share your organization profile, proposed scope of cooperation, and any relevant materials so the federation can review them formally.\n\nKind regards,\nGDSFF Secretariat\n{{email}}\n{{phone}}',
    },
    {
      id: 'media-response',
      kind: 'email',
      title: 'Media Response',
      subject: 'GDSFF Media Inquiry',
      body:
        'Dear {{name}},\n\nThank you for your media inquiry.\n\nPlease send the publication name, requested interview or coverage scope, deadline, and preferred format. The federation will review the request and respond through the official communication channel.\n\nKind regards,\nGDSFF Secretariat\n{{email}}\n{{phone}}',
    },
    {
      id: 'thank-you-response',
      kind: 'email',
      title: 'Thank You Response',
      subject: 'Thank You for Contacting GDSFF',
      body:
        'Dear {{name}},\n\nThank you for contacting the Georgian Dynamic Shooting & Functional Fitness Federation.\n\nYour message has been received. We appreciate your interest and will revert through the official channel if further information is required.\n\nKind regards,\nGDSFF Secretariat',
    },
    {
      id: 'request-received-confirmation',
      kind: 'email',
      title: 'Request Received Confirmation',
      subject: 'Your Request Has Been Received',
      body:
        'Dear {{name}},\n\nThis is to confirm that your request has been received by GDSFF.\n\nIt has been registered and will be reviewed by the relevant federation representative. Follow-up communication will be issued through {{email}}.\n\nKind regards,\nGDSFF Secretariat',
    },
    {
      id: 'documents-request-reply',
      kind: 'email',
      title: 'Documents Request Reply',
      subject: 'Requested GDSFF Documents',
      body:
        'Dear {{name}},\n\nThank you for your request regarding official federation documents.\n\nThe main public documents, forms, and reference materials are available through {{website}}. If you require a specific official file or clarification, please specify the document title in your reply.\n\nKind regards,\nGDSFF Secretariat\n{{email}}',
    },
    {
      id: 'general-contact-response',
      kind: 'email',
      title: 'General Contact Response',
      subject: 'GDSFF Response',
      body:
        'Dear {{name}},\n\nThank you for contacting the Georgian Dynamic Shooting & Functional Fitness Federation.\n\nYour message has been received and registered. A relevant response will follow through the official channel as needed.\n\nKind regards,\nGDSFF Secretariat\n{{email}}\n{{phone}}',
    },
  ]
}

export function buildReplyDraft(message, templates = getDefaultEmailTemplates()) {
  const classification = classifyMessage(message)
  const template = templates.find((item) => item.id === classification.templateId) || templates.find((item) => item.id === 'general-contact-response')
  const name = message.fromName || 'Sir/Madam'
  const variables = {
    name,
    website: socialHubLaunchPack.brand.website,
    email: socialHubLaunchPack.brand.email,
    phone: socialHubLaunchPack.brand.phone,
  }

  return {
    templateId: template.id,
    subject: fillTemplate(template.subject, variables),
    body: fillTemplate(template.body, variables),
    classification: classification.classification,
  }
}

export function recommendNextAction(message) {
  switch (message.classification) {
    case 'membership':
      return 'Send membership procedure, application form guidance, and membership contact path.'
    case 'partnership':
      return 'Escalate to leadership for sponsorship or cooperation review and request organization materials.'
    case 'media':
      return 'Confirm spokesperson approval, requested format, and response deadline before replying.'
    case 'legal/documents':
      return 'Share the public document link or request the exact file title needed.'
    case 'event participation':
      return 'Reply with event registration timing, eligibility, and the current official information source.'
    default:
      return 'Acknowledge receipt, register the inquiry, and route it to the relevant federation representative if needed.'
  }
}
