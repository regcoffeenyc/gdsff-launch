import { useMemo, useState } from 'react'
import { ChevronDownIcon } from '../components/SiteIcons'
import PageHero from '../components/PageHero'
import { officialLaunchContent } from '../content/officialLaunchContent'

const libraryCopy = {
  en: {
    libraryTitle: 'Official Document Library',
    libraryText:
      'All core federation files are grouped in one controlled download center to keep the page clear, structured, and launch-ready.',
    categories: [
      {
        key: 'governance',
        kicker: 'Governance Documents',
        title: 'Charter and institutional framework',
        text: 'Core governance files that define the federation structure and official foundation.',
        itemIds: ['charter'],
      },
      {
        key: 'leadership',
        kicker: 'Leadership Documents',
        title: 'President and director biographies',
        text: 'Official profile files for the federation leadership team.',
        itemIds: ['giorgi-bio', 'ana-bio'],
      },
      {
        key: 'membership',
        kicker: 'Membership Documents',
        title: 'Application and entry forms',
        text: 'Primary forms required for federation entry and applicant processing.',
        itemIds: ['membership-form'],
      },
      {
        key: 'safety',
        kicker: 'Safety Documents',
        title: 'Safety rules and informed consent',
        text: 'Participant safety and consent material prepared for federation operations.',
        itemIds: ['safety-consent'],
      },
      {
        key: 'resources',
        kicker: 'Resources and Downloads',
        title: 'Launch resources and operational files',
        text: 'Supporting website and deployment resources prepared for official rollout.',
        itemIds: ['content-pack', 'upload-checklist'],
      },
    ],
  },
  ka: {
    libraryTitle: 'ოფიციალური დოკუმენტების ბიბლიოთეკა',
    libraryText:
      'ფედერაციის ძირითადი ფაილები გაერთიანებულია ერთ მოწესრიგებულ ჩამოსატვირთ ცენტრში, რათა გვერდი დარჩეს სუფთა, სტრუქტურირებული და ოფიციალური.',
    categories: [
      {
        key: 'governance',
        kicker: 'მმართველობითი დოკუმენტები',
        title: 'წესდება და ინსტიტუციური ჩარჩო',
        text: 'ფედერაციის ძირითად სამართლებრივ და ორგანიზაციულ საფუძვლებთან დაკავშირებული ოფიციალური ფაილები.',
        itemIds: ['charter'],
      },
      {
        key: 'leadership',
        kicker: 'ხელმძღვანელობის დოკუმენტები',
        title: 'პრეზიდენტისა და დირექტორის ბიოგრაფიები',
        text: 'ფედერაციის ხელმძღვანელობის ოფიციალური პროფილები ერთ სტრუქტურირებულ განყოფილებაში.',
        itemIds: ['giorgi-bio', 'ana-bio'],
      },
      {
        key: 'membership',
        kicker: 'წევრობის დოკუმენტები',
        title: 'განაცხადი და გაწევრიანების ფორმები',
        text: 'ფედერაციაში გაწევრიანებისა და განაცხადის დამუშავებისთვის საჭირო ძირითადი ფორმები.',
        itemIds: ['membership-form'],
      },
      {
        key: 'safety',
        kicker: 'უსაფრთხოების დოკუმენტები',
        title: 'უსაფრთხოების წესები და ინფორმირებული თანხმობა',
        text: 'მონაწილეთა უსაფრთხოებასა და თანხმობასთან დაკავშირებული დოკუმენტები ფედერაციის პრაქტიკული გამოყენებისთვის.',
        itemIds: ['safety-consent'],
      },
      {
        key: 'resources',
        kicker: 'რესურსები და ჩამოტვირთვები',
        title: 'გაშვების რესურსები და საოპერაციო ფაილები',
        text: 'საიტისა და ოფიციალური გაშვების მხარდამჭერი დამატებითი მასალები.',
        itemIds: ['content-pack', 'upload-checklist'],
      },
    ],
  },
}

function DocumentDownloadRow({ item }) {
  return (
    <article className="document-item-row">
      <div className="document-item-copy">
        <div className="document-card-top">
          <span className="card-kicker">{item.title}</span>
          <span className="document-format">{item.format ?? 'DOCX'}</span>
        </div>
        <p className="document-description">{item.description}</p>
      </div>

      <div className="document-actions">
        <a href={item.href} className="download-action" download>
          {item.actionLabel}
        </a>
      </div>
    </article>
  )
}

export default function DocumentsPage({ copy }) {
  const localeKey = copy.locale === 'ka-GE' ? 'ka' : 'en'
  const view = officialLaunchContent[localeKey].documents
  const library = libraryCopy[localeKey]
  const [openKey, setOpenKey] = useState('governance')

  const safetySourceItem =
    localeKey === 'ka'
      ? {
          id: 'safety-consent',
          fileName: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
          href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
          title: 'უსაფრთხოების წესები და ინფორმირებული თანხმობა',
          description: 'ოფლაინ შესავსები და დასაბეჭდი ვერსია უსაფრთხოების წესებისა და ინფორმირებული თანხმობისთვის.',
          actionLabel: 'უსაფრთხოების ფაილის ჩამოტვირთვა',
          format: 'HTML',
        }
      : {
          id: 'safety-consent',
          fileName: '07_GDSFF_Safety_Rules_And_Informed_Consent.html',
          href: `${import.meta.env.BASE_URL}downloads/07_GDSFF_Safety_Rules_And_Informed_Consent.html`,
          title: 'Safety Rules & Informed Consent',
          description: 'Offline printable version of the federation safety rules and informed consent form.',
          actionLabel: 'Download Safety File',
          format: 'HTML',
        }

  const documentItems = useMemo(() => {
    const baseUrl = import.meta.env.BASE_URL
    return [...view.items, safetySourceItem].map((item) => ({
      ...item,
      href:
        item.href.startsWith('http') || item.href.startsWith(baseUrl)
          ? item.href
          : `${baseUrl}${item.href.replace(/^\//, '')}`,
    }))
  }, [view.items, safetySourceItem])

  const groupedDocuments = library.categories.map((category) => ({
    ...category,
    items: category.itemIds
      .map((itemId) => documentItems.find((item) => item.id === itemId))
      .filter(Boolean),
  }))

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
        <div className="feature-card document-library-shell">
          <div className="document-library-intro">
            <span className="card-kicker">{library.libraryTitle}</span>
            <p className="section-copy">{library.libraryText}</p>
          </div>

          <div className="document-library-groups">
            {groupedDocuments.map((category) => {
              const isOpen = openKey === category.key

              return (
                <section
                  key={category.key}
                  className={isOpen ? 'document-library-group is-open' : 'document-library-group'}
                >
                  <button
                    type="button"
                    className="document-library-toggle"
                    aria-expanded={isOpen}
                    aria-controls={`${category.key}-documents-panel`}
                    onClick={() => setOpenKey((current) => (current === category.key ? null : category.key))}
                  >
                    <div className="document-library-toggle-copy">
                      <span className="card-kicker">{category.kicker}</span>
                      <h3>{category.title}</h3>
                      <p>{category.text}</p>
                    </div>

                    <div className="document-library-toggle-meta">
                      <span className="document-library-count">
                        {String(category.items.length).padStart(2, '0')}
                      </span>
                      <ChevronDownIcon className="document-library-toggle-icon" />
                    </div>
                  </button>

                  <div
                    id={`${category.key}-documents-panel`}
                    className="document-library-panel"
                    aria-hidden={!isOpen}
                  >
                    <div className="document-library-panel-inner">
                      {category.items.map((item) => (
                        <DocumentDownloadRow key={item.fileName} item={item} />
                      ))}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
