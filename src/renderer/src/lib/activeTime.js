const pad2 = (n) => String(n).padStart(2, '0')

// Readable label for the UI: "3h 24m" / "24m" / "0m".
export const formatActiveShort = (seconds) => {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  return hours > 0 ? `${hours}h ${pad2(mins)}m` : `${mins}m`
}

const WEEKDAY_INITIALS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Parses 'YYYY-MM-DD' as a LOCAL date (avoids the UTC shift of new Date('YYYY-MM-DD')).
export const weekdayLabel = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return WEEKDAY_INITIALS[new Date(year, month - 1, day).getDay()]
}
