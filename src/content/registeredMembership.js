// Federation-confirmed total supplied on 3 October 2026. This is a manually
// maintained public snapshot, not the number of website application records.
// Change it only when the federation confirms a new registered-member total.
export const registeredMembership = Object.freeze({
  total: 101,
  confirmedOn: '2026-10-03',
  source: 'Federation confirmation',
})

export const registeredMembershipCopy = {
  en: { label: 'Registered members', note: 'Federation-confirmed total as of', updateNote: 'Updated on federation confirmation.' },
  ka: { label: 'რეგისტრირებული წევრები', note: 'ფედერაციის მიერ დადასტურებული რაოდენობა', updateNote: 'განახლდება ფედერაციის დადასტურებით.' },
}
