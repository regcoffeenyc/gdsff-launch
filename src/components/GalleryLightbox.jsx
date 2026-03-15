import { useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from './SiteIcons'

export default function GalleryLightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
  labels,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (activeIndex === null) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    const activeDialog = dialogRef.current

    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      activeDialog?.focus()
    })

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onNavigate((activeIndex - 1 + items.length) % items.length)
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNavigate((activeIndex + 1) % items.length)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.cancelAnimationFrame(focusFrame)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeIndex, items.length, onClose, onNavigate])

  if (activeIndex === null) {
    return null
  }

  const item = items[activeIndex]
  const previousIndex = (activeIndex - 1 + items.length) % items.length
  const nextIndex = (activeIndex + 1) % items.length
  const slideLabel = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`

  return (
    <div className="gallery-lightbox" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="gallery-lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="gallery-lightbox-close"
          onClick={onClose}
          aria-label={labels.close}
        >
          <CloseIcon className="gallery-lightbox-icon" />
        </button>

        <div className="gallery-lightbox-stage">
          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-nav-prev"
            onClick={() => onNavigate(previousIndex)}
            aria-label={labels.previous}
          >
            <ChevronLeftIcon className="gallery-lightbox-icon" />
          </button>

          <figure className="gallery-lightbox-figure">
            <div className="gallery-lightbox-frame">
              <img src={item.src} alt={item.alt} className="gallery-lightbox-image" />
            </div>
            <figcaption className="gallery-lightbox-caption">
              <div className="gallery-lightbox-caption-row">
                <span className="overlay-kicker">{item.eyebrow}</span>
                <span className="gallery-lightbox-count">{slideLabel}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </figcaption>
          </figure>

          <button
            type="button"
            className="gallery-lightbox-nav gallery-lightbox-nav-next"
            onClick={() => onNavigate(nextIndex)}
            aria-label={labels.next}
          >
            <ChevronRightIcon className="gallery-lightbox-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}
