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
  const touchStartXRef = useRef(null)
  const touchStartYRef = useRef(null)
  const hasMultipleItems = items.length > 1

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

      if (!hasMultipleItems) {
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
  }, [activeIndex, hasMultipleItems, items.length, onClose, onNavigate])

  if (activeIndex === null) {
    return null
  }

  const item = items[activeIndex]
  const isVideo = item.mediaType === 'video'
  const previousIndex = (activeIndex - 1 + items.length) % items.length
  const nextIndex = (activeIndex + 1) % items.length
  const slideLabel = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0]
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartXRef.current
    const deltaY = touch.clientY - touchStartYRef.current

    touchStartXRef.current = null
    touchStartYRef.current = null

    if (Math.abs(deltaX) < 48 || Math.abs(deltaY) > Math.abs(deltaX)) {
      return
    }

    onNavigate(deltaX > 0 ? previousIndex : nextIndex)
  }

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
          {hasMultipleItems ? (
            <button
              type="button"
              className="gallery-lightbox-nav gallery-lightbox-nav-prev"
              onClick={() => onNavigate(previousIndex)}
              aria-label={labels.previous}
            >
              <ChevronLeftIcon className="gallery-lightbox-icon" />
            </button>
          ) : null}

          <figure className="gallery-lightbox-figure">
            <div className="gallery-lightbox-frame" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              {isVideo ? (
                <video
                  src={item.src}
                  poster={item.posterSrc}
                  className="gallery-lightbox-video"
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={item.src} alt={item.alt} className="gallery-lightbox-image" />
              )}
            </div>
            <figcaption className="gallery-lightbox-caption">
              <div className="gallery-lightbox-caption-row">
                <span className="overlay-kicker">{item.eyebrow}</span>
                {hasMultipleItems ? <span className="gallery-lightbox-count">{slideLabel}</span> : null}
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </figcaption>
          </figure>

          {hasMultipleItems ? (
            <>
              <button
                type="button"
                className="gallery-lightbox-nav gallery-lightbox-nav-next"
                onClick={() => onNavigate(nextIndex)}
                aria-label={labels.next}
              >
                <ChevronRightIcon className="gallery-lightbox-icon" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
