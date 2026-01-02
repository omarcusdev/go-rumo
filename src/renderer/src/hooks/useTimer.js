import { useState, useEffect, useCallback, useRef } from 'react'

const MODES = {
  focus: { duration: 25 * 60, label: 'Foco', color: '#e74c3c' },
  shortBreak: { duration: 5 * 60, label: 'Pausa curta', color: '#27ae60' },
  longBreak: { duration: 15 * 60, label: 'Pausa longa', color: '#3498db' }
}

const CYCLES_BEFORE_LONG_BREAK = 4

const useTimer = () => {
  const [mode, setMode] = useState('focus')
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration)
  const [isRunning, setIsRunning] = useState(false)
  const [completedCycles, setCompletedCycles] = useState(0)
  const intervalRef = useRef(null)
  const hasCompletedRef = useRef(false)

  const currentMode = MODES[mode]
  const progress = 1 - timeLeft / currentMode.duration

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const showNotification = useCallback((title, body) => {
    if (window.api?.showNotification) {
      window.api.showNotification(title, body)
    }
  }, [])

  const playSound = useCallback(() => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    gainNode.gain.value = 0.3

    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    oscillator.stop(audioContext.currentTime + 0.5)

    setTimeout(() => audioContext.close(), 600)
  }, [])

  const handleTimerComplete = useCallback(() => {
    if (hasCompletedRef.current) return
    hasCompletedRef.current = true

    playSound()
    setIsRunning(false)

    if (mode === 'focus') {
      const newCycles = completedCycles + 1
      setCompletedCycles(newCycles)

      if (newCycles % CYCLES_BEFORE_LONG_BREAK === 0) {
        setMode('longBreak')
        setTimeLeft(MODES.longBreak.duration)
        showNotification('Pomodoro', 'Hora da pausa longa! Você completou 4 ciclos.')
      } else {
        setMode('shortBreak')
        setTimeLeft(MODES.shortBreak.duration)
        showNotification('Pomodoro', 'Hora da pausa curta!')
      }
    } else {
      setMode('focus')
      setTimeLeft(MODES.focus.duration)
      showNotification('Pomodoro', 'Hora de focar!')
    }

    hasCompletedRef.current = false
  }, [mode, completedCycles, playSound, showNotification])

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (timeLeft === 0 && !hasCompletedRef.current) {
      handleTimerComplete()
    }
  }, [timeLeft, handleTimerComplete])

  useEffect(() => {
    window.api?.updateTrayTitle(formatTime(timeLeft))
  }, [timeLeft, formatTime])

  const toggle = useCallback(() => {
    setIsRunning((prev) => !prev)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(currentMode.duration)
  }, [currentMode.duration])

  const switchMode = useCallback((newMode) => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(MODES[newMode].duration)
  }, [])

  const skipToNext = useCallback(() => {
    setTimeLeft(0)
  }, [])

  return {
    mode,
    timeLeft,
    isRunning,
    completedCycles,
    currentMode,
    progress,
    formattedTime: formatTime(timeLeft),
    toggle,
    reset,
    switchMode,
    skipToNext,
    cyclesInCurrentSet: completedCycles % CYCLES_BEFORE_LONG_BREAK
  }
}

export default useTimer
