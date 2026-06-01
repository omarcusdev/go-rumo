import { dayKey, buildHistory } from './activeTime.js'

// Tracks active Mac usage per local day. Active = system idle time below a threshold.
// All side-effecting dependencies are injected so the core is testable without Electron.
export const createActivityTracker = ({
  onUpdate,
  getIdleSeconds,
  now = () => new Date(),
  loadDays,
  saveDays,
  idleThresholdSeconds = 300,
  tickMs = 30000,
  retentionDays = 90
}) => {
  let secondsByDay = { ...(loadDays?.() ?? {}) }
  let intervalId = null

  const prune = () => {
    const allowed = new Set(buildHistory({}, retentionDays, now()).map((entry) => entry.dayKey))
    secondsByDay = Object.fromEntries(
      Object.entries(secondsByDay).filter(([key]) => allowed.has(key))
    )
  }

  const getToday = () => secondsByDay[dayKey(now())] ?? 0
  const getHistory = (days = 7) => buildHistory(secondsByDay, days, now())

  // Adds a FIXED increment (tickMs), never a wall-clock delta. During sleep/lock the interval
  // does not fire, so missed time is simply not counted — no catch-up, no overcount on wake.
  const tick = () => {
    const key = dayKey(now())
    if (getIdleSeconds() < idleThresholdSeconds) {
      secondsByDay = { ...secondsByDay, [key]: (secondsByDay[key] ?? 0) + tickMs / 1000 }
    }
    prune()
    saveDays?.(secondsByDay)
    onUpdate?.({ today: secondsByDay[key] ?? 0, dayKey: key })
  }

  const start = () => {
    if (intervalId) return
    // Render the restored value immediately (no increment), then count on each interval.
    onUpdate?.({ today: getToday(), dayKey: dayKey(now()) })
    intervalId = setInterval(tick, tickMs)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { start, stop, getToday, getHistory }
}
