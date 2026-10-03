// Public roster and IDPA Safety Officer certificates only. Private membership
// records remain outside the website. Keep Latin names as issued; use Georgian
// names only where verified in existing federation records.
export const safetyTeamMembers = [
  {
    id: 'giorgi-gagnidze', name: 'Giorgi Gagnidze', nameKa: 'გიორგი გაგნიძე',
    certificateHref: '/documents/safety-officers/giorgi-gagnidze-idpa-so-2026.pdf',
    certificatePreviewSrc: '/images/safety-officers/giorgi-gagnidze-idpa-so-2026.png',
  },
  {
    id: 'ana-panchulidze', name: 'Ana Panchulidze', nameKa: 'ანა ფანჩულიძე',
    certificateHref: '/documents/safety-officers/ana-panchulidze-idpa-so-2026.pdf',
    certificatePreviewSrc: '/images/safety-officers/ana-panchulidze-idpa-so-2026.png',
  },
  {
    id: 'davit-kavtaradze', name: 'Davit Kavtaradze',
    certificateHref: '/documents/safety-officers/davit-kavtaradze-idpa-so-2026.pdf',
    certificatePreviewSrc: '/images/safety-officers/davit-kavtaradze-idpa-so-2026.png',
  },
  {
    id: 'natia-chikhladze', name: 'Natia Chikhladze', nameKa: 'ნათია ჩიხლაძე',
    certificateHref: '/documents/safety-officers/natia-chikhladze-idpa-so-2026.pdf',
    certificatePreviewSrc: '/images/safety-officers/natia-chikhladze-idpa-so-2026.png',
  },
  {
    id: 'luka-bekauri', name: 'Luka Bekauri',
    certificateHref: '/documents/safety-officers/luka-bekauri-idpa-so-2026.pdf',
    certificatePreviewSrc: '/images/safety-officers/luka-bekauri-idpa-so-2026.png',
  },
]

export const safetyTeamContent = {
  en: {
    title: 'Safety Officers & Instructors',
    text: 'Meet the federation’s IDPA Safety Officers and GDSFF instructors.',
    safetyOfficerRole: 'IDPA Safety Officer',
    instructorRole: 'GDSFF Instructor',
    certificateLabel: 'View certificate (PDF)',
    certificatePreviewLabel: 'IDPA Safety Officer certificate',
    certificateNewTab: 'opens in a new tab',
  },
  ka: {
    title: 'უსაფრთხოების ოფიცრები და ინსტრუქტორები',
    text: 'ფედერაციის IDPA უსაფრთხოების ოფიცრები და GDSFF-ის ინსტრუქტორები.',
    safetyOfficerRole: 'IDPA უსაფრთხოების ოფიცერი',
    instructorRole: 'GDSFF-ის ინსტრუქტორი',
    certificateLabel: 'სერტიფიკატის ნახვა (PDF)',
    certificatePreviewLabel: 'IDPA უსაფრთხოების ოფიცრის სერტიფიკატი',
    certificateNewTab: 'იხსნება ახალ ჩანართში',
  },
}

export function getSafetyTeamName(member, localeKey) {
  return localeKey === 'ka' ? member.nameKa ?? member.name : member.name
}
