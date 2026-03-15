import PageHero from '../components/PageHero'
import { officialLaunchContent } from '../content/officialLaunchContent'

export default function DocumentsPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].documents
  const safetySourceItem =
    localeKey === 'ka'
      ? {
          fileName: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
          href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
          title: 'უსაფრთხოების წესები და ინფორმირებული თანხმობა',
          description: 'ოფლაინ შესავსები და დასაბეჭდი ვერსია უსაფრთხოების წესებისა და ინფორმირებული თანხმობისთვის.',
          actionLabel: 'უსაფრთხოების ფაილის ჩამოტვირთვა',
          format: 'HTML',
        }
      : {
          fileName: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
          href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
          title: 'Safety Rules & Informed Consent',
          description: 'Offline printable version of the federation safety rules and informed consent form.',
          actionLabel: 'Download Safety File',
          format: 'HTML',
        }
  const documentItems = [...view.items, safetySourceItem]

  return (
    <>
      <PageHero
        eyebrow={view.eyebrow}
        title={view.title}
        text={view.text}
        highlights={view.highlights}
        label={copy.header.highlightsLabel}
      />

      <section id="official-documents" className="container page-section anchor-section">
        <div className="section-intro compact-intro">
          <p className="eyebrow">{view.introTitle}</p>
          <h2>{view.title}</h2>
          <p className="section-copy">{view.introText}</p>
        </div>
      </section>

      <section id="downloads" className="container section-space anchor-section">
        <div className="document-resource-grid">
          {documentItems.map((item) => (
            <article key={item.fileName} className="feature-card document-card">
              <div className="document-card-top">
                <span className="card-kicker">{item.title}</span>
                <span className="document-format">{item.format ?? 'DOCX'}</span>
              </div>
              <p className="document-description">{item.description}</p>
              <div className="document-actions">
                <a href={item.href} className="download-action" download>
                  {item.actionLabel}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
