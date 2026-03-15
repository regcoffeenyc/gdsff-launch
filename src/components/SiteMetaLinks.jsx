import { FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, PhoneIcon } from './SiteIcons'

const socialIconMap = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
}

export function InfoLink({ href, label, icon: Icon, className = '', external = false }) {
  return (
    <a
      href={href}
      className={`meta-link ${className}`.trim()}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      <Icon className="meta-link-icon" />
      <span>{label}</span>
    </a>
  )
}

export function EmailLink({ email, className = '' }) {
  return <InfoLink href={`mailto:${email}`} label={email} icon={MailIcon} className={className} />
}

export function PhoneLink({ phone, className = '' }) {
  const telValue = phone.replace(/\s+/g, '')
  return <InfoLink href={`tel:${telValue}`} label={phone} icon={PhoneIcon} className={className} />
}

export function LocationLink({ href, label, className = '' }) {
  return <InfoLink href={href} label={label} icon={MapPinIcon} className={className} external />
}

export function SocialLinks({ items, className = '' }) {
  return (
    <div className={`social-links ${className}`.trim()}>
      {items.map((item) => {
        const Icon = socialIconMap[item.id]

        return (
          <a
            key={item.id}
            href={item.href}
            className="social-link"
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="social-link-icon" />
          </a>
        )
      })}
    </div>
  )
}
