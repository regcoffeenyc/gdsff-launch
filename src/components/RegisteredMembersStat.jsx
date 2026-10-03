import { registeredMembership, registeredMembershipCopy } from '../content/registeredMembership'

export default function RegisteredMembersStat({ locale = 'en-US' }) {
  const view = registeredMembershipCopy[locale === 'ka-GE' ? 'ka' : 'en']
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${registeredMembership.confirmedOn}T12:00:00Z`))
  return (
    <div className="registered-members-stat">
      <div className="registered-members-total"><span>{view.label}</span><strong>{registeredMembership.total}</strong></div>
      <p className="registered-members-note">{view.note} <time dateTime={registeredMembership.confirmedOn}>{date}</time>. {view.updateNote}</p>
    </div>
  )
}
