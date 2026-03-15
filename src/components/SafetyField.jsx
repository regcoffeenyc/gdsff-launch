export default function SafetyField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  options = [],
  rows = 3,
  required = true,
  autoComplete,
  placeholder,
}) {
  const baseProps = {
    id: name,
    name,
    value,
    required,
    autoComplete,
    placeholder,
    onChange: (event) => onChange(name, event.target.value),
  }

  return (
    <label className="safety-field">
      <span className="safety-field-label">
        {label}
        {required ? <strong>*</strong> : null}
      </span>

      {type === 'textarea' ? (
        <textarea className="safety-input safety-textarea" rows={rows} {...baseProps} />
      ) : null}

      {type === 'select' ? (
        <select className="safety-input safety-select" {...baseProps}>
          <option value="">{placeholder ?? '...'}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {type !== 'textarea' && type !== 'select' ? <input className="safety-input" type={type} {...baseProps} /> : null}
    </label>
  )
}
