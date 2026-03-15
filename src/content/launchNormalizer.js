const STRING_REPLACEMENTS = [
  ['დინამიკური', 'დინამიური'],
  ['+995 599 663232', '+995 511 560038'],
  ['+995599663232', '+995511560038'],
]

export function normalizeLaunchValue(value) {
  if (typeof value === 'string') {
    return STRING_REPLACEMENTS.reduce(
      (result, [searchValue, replaceValue]) => result.split(searchValue).join(replaceValue),
      value,
    )
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLaunchValue(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeLaunchValue(nestedValue)]),
    )
  }

  return value
}
