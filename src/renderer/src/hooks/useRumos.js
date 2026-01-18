import { useState, useEffect, useCallback, useMemo } from 'react'

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]

const getStartOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfDay = (date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

const getStartOfWeek = (date) => {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  d.setDate(d.getDate() - dayOfWeek)
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfWeek = (date) => {
  const d = getStartOfWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

const getStartOfMonth = (date) => {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfMonth = (date) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

const getStartOfYear = (date) => {
  const d = new Date(date)
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const getEndOfYear = (date) => {
  const d = new Date(date)
  d.setMonth(11, 31)
  d.setHours(23, 59, 59, 999)
  return d
}

const getDateRange = (date, period) => {
  const rangeMap = {
    D: { start: getStartOfDay, end: getEndOfDay },
    S: { start: getStartOfWeek, end: getEndOfWeek },
    M: { start: getStartOfMonth, end: getEndOfMonth },
    A: { start: getStartOfYear, end: getEndOfYear }
  }

  const range = rangeMap[period]
  return {
    start: range.start(date),
    end: range.end(date)
  }
}

const getDaysInMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const groupByDay = (rumos, periodStart) => {
  const daysInMonth = getDaysInMonth(periodStart)
  const groups = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1),
    count: 0
  }))

  rumos.forEach((rumo) => {
    const date = new Date(rumo.timestamp)
    const day = date.getDate() - 1
    if (day >= 0 && day < groups.length) {
      groups[day].count += 1
    }
  })

  return groups
}

const groupByWeekDay = (rumos) => {
  const days = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const groups = days.map((label) => ({ label, count: 0 }))

  rumos.forEach((rumo) => {
    const date = new Date(rumo.timestamp)
    const dayOfWeek = date.getDay()
    groups[dayOfWeek].count += 1
  })

  return groups
}

const groupByHour = (rumos) => {
  const groups = Array.from({ length: 24 }, (_, i) => ({
    label: String(i),
    count: 0
  }))

  rumos.forEach((rumo) => {
    const date = new Date(rumo.timestamp)
    const hour = date.getHours()
    groups[hour].count += 1
  })

  return groups
}

const groupByMonth = (rumos) => {
  const shortMonths = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
  const groups = shortMonths.map((label) => ({ label, count: 0 }))

  rumos.forEach((rumo) => {
    const date = new Date(rumo.timestamp)
    const month = date.getMonth()
    groups[month].count += 1
  })

  return groups
}

const aggregateRumosByPeriod = (rumos, period, currentDate) => {
  const { start, end } = getDateRange(currentDate, period)

  const filtered = rumos.filter(
    (rumo) => rumo.timestamp >= start.getTime() && rumo.timestamp <= end.getTime()
  )

  const aggregatorMap = {
    D: groupByHour,
    S: groupByWeekDay,
    M: groupByDay,
    A: groupByMonth
  }

  const aggregator = aggregatorMap[period]
  return aggregator(filtered, start)
}

const formatPeriodLabel = (date, period) => {
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()

  const formatMap = {
    D: `${day} ${month} ${year}`,
    S: `semana de ${day} ${month}`,
    M: `${month} ${year}`,
    A: `${year}`
  }

  return formatMap[period]
}

const useRumos = () => {
  const [rumos, setRumos] = useState([])
  const [period, setPeriod] = useState('M')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadRumos = async () => {
      if (window.api?.getRumos) {
        const savedRumos = await window.api.getRumos()
        setRumos(savedRumos ?? [])
      }
      setIsLoaded(true)
    }
    loadRumos()
  }, [])

  const saveRumo = useCallback(() => {
    const newRumo = {
      id: crypto.randomUUID(),
      timestamp: Date.now()
    }
    setRumos((prev) => [...prev, newRumo])
    window.api?.saveRumo(newRumo)
  }, [])

  const navigatePeriod = useCallback(
    (direction) => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        const navigationMap = {
          D: () => newDate.setDate(prev.getDate() + direction),
          S: () => newDate.setDate(prev.getDate() + direction * 7),
          M: () => newDate.setMonth(prev.getMonth() + direction),
          A: () => newDate.setFullYear(prev.getFullYear() + direction)
        }
        navigationMap[period]()
        return newDate
      })
    },
    [period]
  )

  const filteredRumos = useMemo(
    () => aggregateRumosByPeriod(rumos, period, currentDate),
    [rumos, period, currentDate]
  )

  const periodLabel = useMemo(() => formatPeriodLabel(currentDate, period), [currentDate, period])

  const totalCount = useMemo(() => {
    const { start, end } = getDateRange(currentDate, period)
    return rumos.filter(
      (rumo) => rumo.timestamp >= start.getTime() && rumo.timestamp <= end.getTime()
    ).length
  }, [rumos, period, currentDate])

  return {
    rumos,
    filteredRumos,
    period,
    setPeriod,
    currentDate,
    navigatePeriod,
    periodLabel,
    totalCount,
    saveRumo,
    isLoaded
  }
}

export default useRumos
