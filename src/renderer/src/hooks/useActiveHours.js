import { useState, useEffect } from 'react'
import { weekdayLabel } from '../lib/activeTime'

const withLabels = (series) =>
  series.map((entry) => ({ ...entry, label: weekdayLabel(entry.dayKey) }))

const useActiveHours = () => {
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [history, setHistory] = useState([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const today = (await window.api?.getActiveToday?.()) ?? 0
      const series = (await window.api?.getActiveHistory?.(7)) ?? []
      if (!active) return
      setTodaySeconds(today)
      setHistory(withLabels(series))
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Subscribe to live updates from the main process; the unsubscribe fn
  // returned by onActiveUpdate is used directly as the effect cleanup.
  useEffect(() => {
    const unsubscribe = window.api?.onActiveUpdate?.((payload) => {
      setTodaySeconds(payload.today)
      setHistory((prev) =>
        prev.map((entry) =>
          entry.dayKey === payload.dayKey ? { ...entry, seconds: payload.today } : entry
        )
      )
    })
    return unsubscribe
  }, [])

  return { todaySeconds, history }
}

export default useActiveHours
