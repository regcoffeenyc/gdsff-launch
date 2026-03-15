import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

function drawStrokes(canvas, strokes) {
  if (!canvas) {
    return
  }

  const context = canvas.getContext('2d')
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const ratio = Math.max(window.devicePixelRatio || 1, 1)

  canvas.width = Math.max(Math.floor(width * ratio), 1)
  canvas.height = Math.max(Math.floor(height * ratio), 1)

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)
  context.lineWidth = 2.2
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.strokeStyle = '#151617'

  strokes.forEach((stroke) => {
    if (!stroke.length) {
      return
    }

    context.beginPath()
    context.moveTo(stroke[0].x * width, stroke[0].y * height)

    if (stroke.length === 1) {
      context.lineTo(stroke[0].x * width + 0.01, stroke[0].y * height + 0.01)
    } else {
      stroke.slice(1).forEach((point) => {
        context.lineTo(point.x * width, point.y * height)
      })
    }

    context.stroke()
  })
}

const SignaturePadField = forwardRef(function SignaturePadField(
  { label, note, clearLabel, error, onChange, isRequired = true, signedLabel = 'Signed', pendingLabel = 'Awaiting signature' },
  ref,
) {
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const currentStrokeRef = useRef([])
  const [hasSignature, setHasSignature] = useState(false)

  function syncValue() {
    const canvas = canvasRef.current

    if (!canvas || !strokesRef.current.length) {
      onChange('')
      return
    }

    onChange(canvas.toDataURL('image/png'))
  }

  function redraw() {
    drawStrokes(canvasRef.current, strokesRef.current)
  }

  function clearSignature() {
    strokesRef.current = []
    currentStrokeRef.current = []
    setHasSignature(false)
    redraw()
    onChange('')
  }

  function getPoint(event) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = event.touches?.[0]?.clientX ?? event.clientX
    const clientY = event.touches?.[0]?.clientY ?? event.clientY

    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }

  function beginStroke(event) {
    event.preventDefault()
    const point = getPoint(event)
    currentStrokeRef.current = [point]
    strokesRef.current = [...strokesRef.current, currentStrokeRef.current]
    setHasSignature(true)
    redraw()
  }

  function continueStroke(event) {
    if (!currentStrokeRef.current.length) {
      return
    }

    event.preventDefault()
    currentStrokeRef.current.push(getPoint(event))
    redraw()
  }

  function endStroke(event) {
    if (!currentStrokeRef.current.length) {
      return
    }

    if (event) {
      event.preventDefault()
    }

    currentStrokeRef.current = []
    redraw()
    syncValue()
  }

  useImperativeHandle(ref, () => ({
    clear: clearSignature,
    isEmpty: () => !strokesRef.current.length,
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? '',
  }))

  useEffect(() => {
    redraw()

    const handleResize = () => redraw()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="signature-field">
      <div className="signature-field-head">
        <div>
          <span className="card-kicker">{label}</span>
          {note ? <p className="signature-note">{note}</p> : null}
        </div>

        <button type="button" className="signature-clear-button" onClick={clearSignature}>
          {clearLabel}
        </button>
      </div>

      <div className={error ? 'signature-surface has-error' : 'signature-surface'}>
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          role="img"
          aria-label={label}
          aria-required={isRequired}
          onMouseDown={beginStroke}
          onMouseMove={continueStroke}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={beginStroke}
          onTouchMove={continueStroke}
          onTouchEnd={endStroke}
        />
      </div>

      <div className="signature-meta-row">
        <span className={hasSignature ? 'signature-state is-signed' : 'signature-state'}>
          {hasSignature ? signedLabel : pendingLabel}
        </span>
        {error ? <p className="field-error">{error}</p> : null}
      </div>
    </div>
  )
})

export default SignaturePadField
