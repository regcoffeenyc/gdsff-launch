import PageHero from '../components/PageHero'
import { normalizeLaunchValue } from '../content/launchNormalizer'
import { EmailLink, LocationLink, PhoneLink } from '../components/SiteMetaLinks'
import { FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, PhoneIcon } from '../components/SiteIcons'

const contactCopy = {
  en: {
    directoryTitle: 'Federation Contact Directory',
    directoryText:
      'Use the official federation contact channels for general inquiries, event coordination, media communication, and partnership outreach.',
    cards: [
      {
        title: 'Email',
        value: 'office@gdsff.org',
        text: 'Primary federation inbox for official correspondence, institutional inquiries, and member communication.',
        href: 'mailto:office@gdsff.org',
        icon: MailIcon,
        actionLabel: 'Send Email',
      },
      {
        title: 'Phone',
        value: '+995 511 560038',
        text: 'Direct federation contact for event operations, coordination, and urgent follow-up.',
        href: 'tel:+995511560038',
        icon: PhoneIcon,
        actionLabel: 'Call Federation',
      },
      {
        title: 'Facebook',
        value: 'GDSFF | Georgian Dynamic Shooting & Functional Fitness Federation',
        text: 'Official public page for announcements, community updates, and federation bulletins.',
        href: 'https://facebook.com/GDSFFGeorgia',
        icon: FacebookIcon,
        actionLabel: 'Open Facebook',
        external: true,
      },
      {
        title: 'Instagram',
        value: '@gdsff.ge',
        text: 'Official visual channel for federation media, event highlights, and season coverage.',
        href: 'https://instagram.com/gdsff.ge',
        icon: InstagramIcon,
        actionLabel: 'Open Instagram',
        external: true,
      },
      {
        title: 'Location',
        value: `41\u00B035'22.30"N 45\u00B016'56.28"E`,
        text: 'Google Maps reference point for official federation location and route access.',
        href: 'https://maps.google.com/?q=41.589528,45.282300',
        icon: MapPinIcon,
        actionLabel: 'Open Google Maps',
        external: true,
      },
    ],
  },
  ka: {
    directoryTitle: 'ფედერაციის საკონტაქტო ინფორმაცია',
    directoryText:
      'გამოიყენეთ ფედერაციის ოფიციალური საკონტაქტო არხები ზოგადი კითხვებისთვის, ღონისძიებების კოორდინაციისთვის, მედიისთვის და პარტნიორული კომუნიკაციისთვის.',
    cards: [
      {
        title: 'ელფოსტა',
        value: 'office@gdsff.org',
        text: 'ფედერაციის მთავარი ელფოსტა ოფიციალური მიმოწერისთვის, ინსტიტუციური კითხვებისთვის და წევრებთან კომუნიკაციისთვის.',
        href: 'mailto:office@gdsff.org',
        icon: MailIcon,
        actionLabel: 'ელფოსტის გაგზავნა',
      },
      {
        title: 'ტელეფონი',
        value: '+995 511 560038',
        text: 'ფედერაციის პირდაპირი საკონტაქტო ნომერი ღონისძიებების ოპერაციებისთვის, კოორდინაციისთვის და სწრაფი რეაგირებისთვის.',
        href: 'tel:+995511560038',
        icon: PhoneIcon,
        actionLabel: 'დარეკვა',
      },
      {
        title: 'Facebook',
        value: 'GDSFF | Georgian Dynamic Shooting & Functional Fitness Federation',
        text: 'ფედერაციის ოფიციალური გვერდი განცხადებებისთვის, სიახლეებისთვის და საჯარო განახლებებისთვის.',
        href: 'https://facebook.com/GDSFFGeorgia',
        icon: FacebookIcon,
        actionLabel: 'Facebook-ის გახსნა',
        external: true,
      },
      {
        title: 'Instagram',
        value: '@gdsff.ge',
        text: 'ფედერაციის ოფიციალური Instagram არხი მედიისთვის, ღონისძიებების ვიზუალებისთვის და სეზონის გაშუქებისთვის.',
        href: 'https://instagram.com/gdsff.ge',
        icon: InstagramIcon,
        actionLabel: 'Instagram-ის გახსნა',
        external: true,
      },
      {
        title: 'ლოკაცია',
        value: `41\u00B035'22.30"N 45\u00B016'56.28"E`,
        text: 'Google Maps-ის მითითებული წერტილი ფედერაციის ოფიციალური მდებარეობისა და მისასვლელი გზისთვის.',
        href: 'https://maps.google.com/?q=41.589528,45.282300',
        icon: MapPinIcon,
        actionLabel: 'Google Maps-ის გახსნა',
        external: true,
      },
    ],
  },
}

function ContactActionLink({ card }) {
  return (
    <a
      href={card.href}
      className="contact-value-link"
      {...(card.external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {card.actionLabel}
    </a>
  )
}

function ContactValueLink({ card }) {
  return (
    <a
      href={card.href}
      className="contact-card-value-link"
      {...(card.external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {card.value}
    </a>
  )
}

export default function ContactPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const directory = normalizeLaunchValue(contactCopy[localeKey])
  const facebookLink = copy.meta.socials.find((item) => item.id === 'facebook')?.href ?? 'https://facebook.com/GDSFFGeorgia'
  const instagramLink = copy.meta.socials.find((item) => item.id === 'instagram')?.href ?? 'https://instagram.com/gdsff.ge'
  const cards = [
    {
      ...directory.cards[0],
      value: copy.meta.email,
      href: `mailto:${copy.meta.email}`,
    },
    {
      ...directory.cards[1],
      value: copy.meta.phone,
      href: `tel:${copy.meta.phone.replace(/\s+/g, '')}`,
    },
    {
      ...directory.cards[2],
      value: copy.meta.facebookPageName,
      href: facebookLink,
    },
    {
      ...directory.cards[3],
      value: copy.meta.instagramHandle,
      href: instagramLink,
    },
    {
      ...directory.cards[4],
      value: copy.meta.locationLabel,
      href: copy.meta.locationHref,
    },
  ]

  return (
    <>
      <PageHero
        eyebrow={copy.contact.eyebrow}
        title={copy.contact.title}
        text={copy.contact.text}
        highlights={copy.contact.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="contact-directory" className="container page-section anchor-section">
        <div className="contact-shell">
          <article className="feature-card contact-primary-card">
            <span className="card-kicker">{copy.contact.directoryTitle ?? directory.directoryTitle}</span>
            <h3>{copy.brand.fullName}</h3>
            <p>{copy.contact.directoryText ?? directory.directoryText}</p>

            <div className="contact-link-stack">
              <EmailLink email={copy.meta.email} className="contact-directory-link" />
              <PhoneLink phone={copy.meta.phone} className="contact-directory-link" />
              <LocationLink
                href={copy.meta.locationHref}
                label={copy.meta.locationLabel}
                className="contact-directory-link"
              />
            </div>
          </article>

          <div className="contact-card-grid">
            {cards.map((card) => {
              const Icon = card.icon

              return (
                <article key={card.title} className="feature-card contact-channel-card">
                  <div className="contact-card-header">
                    <div className="contact-card-icon-shell">
                      <Icon className="contact-card-icon" />
                    </div>
                    <span className="card-kicker">{card.title}</span>
                  </div>
                  <h3 className="contact-card-value">
                    <ContactValueLink card={card} />
                  </h3>
                  <p>{card.text}</p>
                  <ContactActionLink card={card} />
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container section-space">
        <div className="feature-card contact-support-card">
          <span className="card-kicker">{copy.contact.supportTitle}</span>
          <div className="detail-list">
            {copy.contact.support.map((item) => (
              <div key={item} className="detail-list-item">
                <span className="dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
