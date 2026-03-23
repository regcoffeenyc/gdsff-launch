import { enContent } from './content/enContent'
import { kaContent } from './content/kaContent'
import { normalizeLaunchValue } from './content/launchNormalizer'

function applyLaunchOverrides(rawContent, locale) {
  const normalized = normalizeLaunchValue(rawContent)
  const isGeorgian = locale === 'ka'

  return {
    ...normalized,
    meta: {
      ...normalized.meta,
      email: 'office@gdsff.org',
      phone: '+995 511 560038',
      showLocation: false,
      locationLabel: `41\u00B035'22.30"N 45\u00B016'56.28"E`,
      locationHref: 'https://maps.google.com/?q=41.589528,45.282300',
      facebookPageName: 'GDSFF | Georgian Dynamic Shooting & Functional Fitness Federation',
      instagramHandle: '@gdsffofficial',
      socials: [
        {
          id: 'facebook',
          label: 'Facebook: GDSFF | Georgian Dynamic Shooting & Functional Fitness Federation',
          href: 'https://www.facebook.com/profile.php?id=61578666412435',
        },
        {
          id: 'instagram',
          label: 'Instagram: @gdsffofficial',
          href: 'https://www.instagram.com/gdsffofficial/?hl=en',
        },
      ],
    },
    nav: {
      ...normalized.nav,
      events: isGeorgian ? 'ღონისძიებები' : 'Events',
      gallery: isGeorgian ? 'მედია' : 'Media',
      membership: isGeorgian ? 'გაწევრიანება' : 'Membership',
      documents: isGeorgian ? 'დოკუმენტები' : 'Documents',
      safetyConsent: isGeorgian ? 'უსაფრთხოების თანხმობა' : 'Safety Consent',
    },
    brand: {
      ...normalized.brand,
      shortName: 'GDSFF',
      slogan: 'Precision. Strength. Discipline.',
      subtitle: 'Precision. Strength. Discipline.',
      fullName: isGeorgian
        ? 'საქართველოს დინამიური სროლისა და ფუნქციური ფიტნესის ფედერაცია'
        : 'Georgian Dynamic Shooting & Functional Fitness Federation',
    },
  }
}

export const siteContent = {
  en: applyLaunchOverrides(enContent, 'en'),
  ka: applyLaunchOverrides(kaContent, 'ka'),
}
