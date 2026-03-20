import { socialHubLaunchPack } from '../../src/content/socialHubLaunchPack.js'

const blockedKeywords = [
  'for sale',
  'buy now',
  'purchase weapon',
  'weapon price',
  'gun price',
  'ammo price',
  'sell firearm',
  'sell gun',
  'sell rifle',
  'order ammo',
  'private transfer',
]

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeChatContent(content) {
  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (item?.type === 'text') {
          return item.text
        }

        return ''
      })
      .join('\n')
      .trim()
  }

  return ''
}

function detectRestrictedContent(input) {
  const haystack = JSON.stringify(input).toLowerCase()
  const keyword = blockedKeywords.find((item) => haystack.includes(item))

  if (!keyword) {
    return null
  }

  return {
    status: 'blocked',
    reason:
      'This request looks like commercial or transactional weapon-related content. Keep the assistant focused on federation announcements, events, documents, safety, governance, training, and partnerships.',
    keyword,
  }
}

function findPresetFromInput(input) {
  const combined = `${input.platform || ''} ${input.objective || ''} ${input.prompt || ''}`.toLowerCase()
  const isInstagram = combined.includes('instagram')
  const presetSource = isInstagram ? socialHubLaunchPack.instagram.posts : socialHubLaunchPack.facebook.posts
  const presetMatchers = [
    { id: 'launch', keywords: ['launch', 'official opening', 'გახსნა'] },
    { id: 'membership', keywords: ['membership', 'join', 'გაწევრიანება'] },
    { id: 'documents', keywords: ['documents', 'docs', 'დოკუმენტები'] },
    { id: 'leadership', keywords: ['leadership', 'president', 'director', 'ხელმძღვანელობა'] },
    { id: 'contact', keywords: ['contact', 'partnership', 'კონტაქტი', 'თანამშრომლობა'] },
    { id: 'overview', keywords: ['overview', 'who are we', 'ვინ ვართ'] },
    { id: 'mission', keywords: ['mission', 'მისია'] },
    { id: 'vision', keywords: ['vision', 'ხედვა'] },
    { id: 'safety', keywords: ['safety', 'უსაფრთხოება'] },
  ]

  const match = presetMatchers.find((item) => item.keywords.some((keyword) => combined.includes(keyword)))
  if (!match) {
    return null
  }

  return presetSource.find((item) => item.id === match.id) || null
}

async function callOpenAI({ messages, responseFormat }) {
  if (!hasValue(process.env.OPENAI_API_KEY)) {
    return null
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      temperature: 0.3,
      messages,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const errorMessage = data?.error?.message || 'OpenAI request failed.'
    throw new Error(errorMessage)
  }

  const message = data.choices?.[0]?.message
  return {
    content: normalizeChatContent(message?.content),
    refusal: message?.refusal || '',
    raw: data,
  }
}

function buildDraftFallback(input) {
  const isGeorgian = input.locale === 'ka-GE'
  const preset = findPresetFromInput(input)
  const title = preset?.title || input.objective?.trim() || (isGeorgian ? 'ოფიციალური განახლება' : 'Official Update')
  const prompt = input.prompt?.trim() || ''
  const audience = input.audience?.trim() || (isGeorgian ? 'ფედერაციის აუდიტორია' : 'federation audience')

  return {
    title,
    caption: preset?.body || (
      isGeorgian
        ? `GDSFF-ის ოფიციალური განახლება ${audience}-ისთვის.\n\n${prompt || 'გამოაქვეყნეთ დისციპლინირებული, მოკლე და ინსტიტუციური შეტყობინება, რომელიც ასახავს ოფიციალურ ინფორმაციას, შემდეგ ნაბიჯს და საკონტაქტო არხს.'}\n\nვებსაიტი: https://gdsff.org\nელფოსტა: office@gdsff.org`
        : `Official GDSFF update for ${audience}.\n\n${prompt || 'Publish a disciplined, concise, institutional update that communicates the official point, the next action, and the contact path.'}\n\nWebsite: https://gdsff.org\nEmail: office@gdsff.org`
    ),
    englishSupport:
      input.includeEnglish === false
        ? ''
        : 'English support: Official GDSFF update prepared for cross-platform publication.',
    hashtags: ['#GDSFF', '#DynamicShooting', '#FunctionalFitness'],
    moderation: {
      status: 'review',
      reason: 'Generated with local fallback because OPENAI_API_KEY is not configured.',
    },
    publishChecklist: [
      'Confirm the event, date, or document reference before publishing.',
      'Keep the approved GDSFF logo and visual system in place.',
      'Use Georgian first and English support only where needed.',
    ],
    recommendedPlatforms:
      input.platform === 'all'
        ? ['facebook', 'instagram']
        : [input.platform === 'instagram' ? 'instagram' : 'facebook'],
  }
}

function buildReplyFallback(input) {
  const isGeorgian = input.locale === 'ka-GE'
  const reply = isGeorgian
    ? 'გმადლობთ შეტყობინებისთვის. ოფიციალური დაზუსტებისთვის მოგვწერეთ office@gdsff.org-ზე ან დაელოდეთ ფედერაციის ოფიციალურ განცხადებას შესაბამის არხზე.'
    : 'Thank you for your message. For official confirmation, please contact office@gdsff.org or follow the next federation update on the relevant official channel.'

  return {
    response: reply,
    englishSupport: isGeorgian ? 'English support: Thank you for your message. Please contact office@gdsff.org for official confirmation.' : '',
    escalation: /partner|media|sponsor|urgent|complaint/i.test(input.incomingMessage || ''),
    escalationReason: /partner|media|sponsor|urgent|complaint/i.test(input.incomingMessage || '')
      ? 'This message should be reviewed by a human operator because it may involve partnership, media, urgency, or complaint handling.'
      : '',
    confidence: 'medium',
  }
}

function buildAssistantFallback(input) {
  const lastUserMessage = [...(input.messages || [])].reverse().find((item) => item.role === 'user')?.content || ''

  return {
    message:
      `Social hub assistant fallback mode is active because OPENAI_API_KEY is not configured.\n\n` +
      `I can still help you structure the next step. Your latest request was:\n` +
      `"${lastUserMessage}"\n\n` +
      `Recommended next actions:\n` +
      `1. Use Draft Studio for platform-ready captions based on the saved GDSFF launch pack.\n` +
      `2. Use Reply Assistant for comment or DM responses.\n` +
      `3. Use Meta Publish to dry-run or publish once tokens are configured.`,
  }
}

export async function generateDraft(input) {
  const restricted = detectRestrictedContent(input)
  if (restricted) {
    return {
      title: 'Restricted Request',
      caption: '',
      englishSupport: '',
      hashtags: [],
      moderation: restricted,
      publishChecklist: ['Replace commercial weapon language with sport, safety, governance, or event language.'],
      recommendedPlatforms: [],
    }
  }

  const responseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'social_draft',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          caption: { type: 'string' },
          englishSupport: { type: 'string' },
          hashtags: {
            type: 'array',
            items: { type: 'string' },
          },
          moderation: {
            type: 'object',
            additionalProperties: false,
            properties: {
              status: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['status', 'reason'],
          },
          publishChecklist: {
            type: 'array',
            items: { type: 'string' },
          },
          recommendedPlatforms: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['title', 'caption', 'englishSupport', 'hashtags', 'moderation', 'publishChecklist', 'recommendedPlatforms'],
      },
    },
  }

  const systemPrompt =
    'You are the official social media drafting assistant for the Georgian Dynamic Shooting & Functional Fitness Federation (GDSFF). ' +
    'Write in an institutional, premium, concise federation voice. Georgian is primary when locale is ka-GE. ' +
    'Use English support only if requested. No emojis. No cheap marketing language. ' +
    'Do not generate weapon sales, procurement, pricing, private transfer, or ammunition commerce language. ' +
    'Keep the content focused on federation announcements, membership, events, documents, training, governance, safety, and partnerships. ' +
    `Use this official GDSFF knowledge pack as source material: ${JSON.stringify(socialHubLaunchPack)}`

  try {
    const result = await callOpenAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) },
      ],
      responseFormat,
    })

    if (!result || result.refusal) {
      return buildDraftFallback(input)
    }

    return JSON.parse(result.content)
  } catch {
    return buildDraftFallback(input)
  }
}

export async function generateReplySuggestion(input) {
  const restricted = detectRestrictedContent(input)
  if (restricted) {
    return {
      response: '',
      englishSupport: '',
      escalation: true,
      escalationReason: restricted.reason,
      confidence: 'low',
    }
  }

  const responseFormat = {
    type: 'json_schema',
    json_schema: {
      name: 'reply_suggestion',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          response: { type: 'string' },
          englishSupport: { type: 'string' },
          escalation: { type: 'boolean' },
          escalationReason: { type: 'string' },
          confidence: { type: 'string' },
        },
        required: ['response', 'englishSupport', 'escalation', 'escalationReason', 'confidence'],
      },
    },
  }

  const systemPrompt =
    'You are the official reply assistant for GDSFF social channels. ' +
    'Draft concise, respectful, institutional replies for Facebook and Instagram comments or messages. ' +
    'Prefer clarity over friendliness. Route sensitive, legal, safety, media, complaint, or partnership matters to human review. ' +
    'Never provide instructions for buying, selling, or privately transferring weapons or ammunition. ' +
    `Use this official GDSFF knowledge pack as source material: ${JSON.stringify(socialHubLaunchPack)}`

  try {
    const result = await callOpenAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) },
      ],
      responseFormat,
    })

    if (!result || result.refusal) {
      return buildReplyFallback(input)
    }

    return JSON.parse(result.content)
  } catch {
    return buildReplyFallback(input)
  }
}

export async function runAssistantChat(input) {
  const restricted = detectRestrictedContent(input)
  if (restricted) {
    return {
      message: restricted.reason,
    }
  }

  try {
    const result = await callOpenAI({
      messages: [
        {
          role: 'system',
          content:
            'You are the GDSFF Social Hub assistant. Help the operator manage Facebook, Instagram, and future platforms. ' +
            'Be practical. Recommend next steps, drafting guidance, workflow checks, and escalation decisions. ' +
            'Stay focused on official federation use cases. No emojis. No weapon sales or commerce assistance. ' +
            `Use this official GDSFF launch pack as your internal reference: ${JSON.stringify(socialHubLaunchPack)}`,
        },
        ...(input.messages || []),
      ],
    })

    if (!result || result.refusal) {
      return buildAssistantFallback(input)
    }

    return {
      message: result.content,
    }
  } catch {
    return buildAssistantFallback(input)
  }
}
