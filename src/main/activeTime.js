const pad2 = (n) => String(n).padStart(2, '0')

// Compact label for the macOS menu bar: "3h04m" / "24m" / "0m".
export const formatActive = (seconds) => {
  const total = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  return hours > 0 ? `${hours}h${pad2(mins)}m` : `${mins}m`
}

// Menu bar title: active time is always shown; the countdown is appended only while running.
export const composeTrayTitle = (activeSeconds, timerString) => {
  const active = formatActive(activeSeconds)
  return timerString ? `${active} · ${timerString}` : active
}

// Local calendar day key 'YYYY-MM-DD' (matches the day boundary used by the stats view).
export const dayKey = (date) => {
  const year = date.getFullYear()
  const month = pad2(date.getMonth() + 1)
  const day = pad2(date.getDate())
  return `${year}-${month}-${day}`
}

// Source-of-truth series: oldest → newest, `days` entries ending at `today`,
// missing days filled with `seconds: 0`. secondsByDay is a { 'YYYY-MM-DD': number } map.
export const buildHistory = (secondsByDay, days, today) => {
  const series = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - offset)
    const key = dayKey(date)
    series.push({ dayKey: key, seconds: secondsByDay[key] ?? 0 })
  }
  return series
}
