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
