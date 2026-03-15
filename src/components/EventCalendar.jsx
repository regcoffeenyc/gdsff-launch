function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildEventMap(events) {
  const eventMap = new Map()

  events.forEach((event) => {
    const start = new Date(`${event.date}T00:00:00`)
    const end = new Date(`${event.endDate ?? event.date}T00:00:00`)

    for (
      let current = new Date(start);
      current <= end;
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
    ) {
      const key = toDateKey(current)
      const entries = eventMap.get(key) ?? []
      entries.push(event)
      eventMap.set(key, entries)
    }
  })

  return eventMap
}

function formatDateRange(event, locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const start = new Date(`${event.date}T00:00:00`)
  const end = new Date(`${event.endDate ?? event.date}T00:00:00`)

  if (event.endDate && event.endDate !== event.date) {
    return `${formatter.format(start)} - ${formatter.format(end)}`
  }

  return formatter.format(start)
}

export default function EventCalendar({ calendar, locale, eyebrow = 'Calendar', eventAnchors = {} }) {
  const [yearText, monthText] = calendar.month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const firstDay = new Date(year, monthIndex, 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const monthDays = getDaysInMonth(year, monthIndex)
  const previousMonthDays = getDaysInMonth(year, monthIndex === 0 ? 11 : monthIndex - 1)
  const totalCells = Math.ceil((firstWeekday + monthDays) / 7) * 7
  const eventMap = buildEventMap(calendar.events)
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(firstDay)

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const dayOffset = index - firstWeekday + 1

    if (dayOffset <= 0) {
      const date = previousMonthDays + dayOffset
      return {
        key: `prev-${date}`,
        label: date,
        outside: true,
      }
    }

    if (dayOffset > monthDays) {
      return {
        key: `next-${dayOffset - monthDays}`,
        label: dayOffset - monthDays,
        outside: true,
      }
    }

    const isoDate = `${calendar.month}-${String(dayOffset).padStart(2, '0')}`
    const dayEvents = eventMap.get(isoDate) ?? []

    return {
      key: isoDate,
      label: dayOffset,
      outside: false,
      eventCount: dayEvents.length,
      hasEvent: dayEvents.length > 0,
      primaryStatus: dayEvents[0]?.status ?? null,
    }
  })

  return (
    <section className="calendar-shell">
      <div className="calendar-topline">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{calendar.title}</h2>
        </div>
        <p className="section-copy calendar-copy">{calendar.text}</p>
      </div>

      <div className="calendar-layout">
        <article className="calendar-panel">
          <div className="calendar-panel-header">
            <div className="calendar-panel-kicker">{monthLabel}</div>
            <div className="calendar-panel-count">
              {calendar.events.length} {calendar.entryLabel}
            </div>
          </div>

          <div className="calendar-weekdays">
            {calendar.days.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid-cells">
            {cells.map((cell) => (
              <div
                key={cell.key}
                className={
                  cell.hasEvent
                    ? 'calendar-cell is-active'
                    : cell.outside
                      ? 'calendar-cell is-outside'
                      : 'calendar-cell'
                }
              >
                <span className="calendar-date">{cell.label}</span>
                {cell.hasEvent ? (
                  <div className="calendar-event-meta">
                    <span className="calendar-event-dot" />
                    <span>{cell.eventCount}</span>
                  </div>
                ) : null}
                {cell.primaryStatus ? <div className="calendar-status-label">{cell.primaryStatus}</div> : null}
              </div>
            ))}
          </div>
        </article>

        <div className="calendar-event-list">
          <article className="calendar-note-card">
            <span className="card-kicker">{calendar.noticeTitle}</span>
            <p>{calendar.noticeText}</p>
          </article>

          {calendar.events.map((event) => (
            <article
              key={`${event.date}-${event.title}`}
              id={eventAnchors[event.title]}
              className={eventAnchors[event.title] ? 'event-card anchor-section' : 'event-card'}
            >
              <div className="event-card-top">
                <span className="card-kicker">{event.type}</span>
                <span className="event-status">{event.status}</span>
              </div>
              <h3>{event.title}</h3>
              <p className="event-date">{formatDateRange(event, locale)}</p>
              <p className="event-location">{event.location}</p>
              <p>{event.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="calendar-legend">
        {calendar.legend.map((item) => (
          <span key={item} className="legend-chip">
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
