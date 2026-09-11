/* Late corrections applied to launch content at render time.
   The two phone-number rewrites that used to live here are gone. They were a
   safety net for an old number that no content carries any more — so the only
   thing they still did was publish that number, in this file, in the browser
   bundle. It is the shop's number and belongs nowhere in the federation's
   code. tests/noShopNumber.test.mjs keeps it out. */
const STRING_REPLACEMENTS = [
  ['დინამიკური', 'დინამიური'],
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
