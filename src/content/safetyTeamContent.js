// Public roster: names and federation roles only. Certificates and personal
// records remain outside the website. Keep Latin names as issued; use Georgian
// names only where verified in existing federation records.
export const safetyTeamMembers = [
  { id: 'giorgi-gagnidze', name: 'Giorgi Gagnidze', nameKa: 'გიორგი გაგნიძე' },
  { id: 'ana-panchulidze', name: 'Ana Panchulidze', nameKa: 'ანა ფანჩულიძე' },
  { id: 'davit-kavtaradze', name: 'Davit Kavtaradze' },
  { id: 'natia-chikhladze', name: 'Natia Chikhladze', nameKa: 'ნათია ჩიხლაძე' },
  { id: 'luka-bekauri', name: 'Luka Bekauri' },
]

export const safetyTeamContent = {
  en: {
    title: 'Safety Officers & Instructors',
    text: 'Meet the federation’s IDPA Safety Officers and GDSFF instructors.',
    safetyOfficerRole: 'IDPA Safety Officer',
    instructorRole: 'GDSFF Instructor',
  },
  ka: {
    title: 'უსაფრთხოების ოფიცრები და ინსტრუქტორები',
    text: 'ფედერაციის IDPA უსაფრთხოების ოფიცრები და GDSFF-ის ინსტრუქტორები.',
    safetyOfficerRole: 'IDPA უსაფრთხოების ოფიცერი',
    instructorRole: 'GDSFF-ის ინსტრუქტორი',
  },
}

export function getSafetyTeamName(member, localeKey) {
  return localeKey === 'ka' ? member.nameKa ?? member.name : member.name
}
