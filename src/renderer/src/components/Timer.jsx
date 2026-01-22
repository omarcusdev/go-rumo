import { useEffect } from 'react'
import useMouseGlow from '../hooks/useMouseGlow'

const MODE_COLORS = {
  focus: { color: '#10b981', rgb: '16, 185, 129' },
  shortBreak: { color: '#51cf66', rgb: '81, 207, 102' },
  longBreak: { color: '#339af0', rgb: '51, 154, 240' }
}

const CycleDots = ({ completed, total = 4 }) => {
  return (
    <div className="cycle-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`cycle-dot ${i < completed ? 'filled' : ''}`} />
      ))}
    </div>
  )
}

const Timer = ({
  mode,
  currentMode,
  formattedTime,
  isRunning,
  progress,
  toggle,
  reset,
  switchMode,
  cyclesInCurrentSet
}) => {
  const glowRef = useMouseGlow()
  const isBreak = mode === 'shortBreak' || mode === 'longBreak'
  const showSkip = isBreak || (import.meta.env.DEV && mode === 'focus')

  useEffect(() => {
    const modeColor = MODE_COLORS[mode] || MODE_COLORS.focus
    document.documentElement.style.setProperty('--mode-color', modeColor.color)
    document.documentElement.style.setProperty('--mode-color-rgb', modeColor.rgb)
  }, [mode])

  return (
    <div className="timer-section" ref={glowRef}>
      <div className="section-glow" />
      <div className="mode-badge">
        {currentMode.label}
      </div>

      <div className="timer-display">
        {formattedTime}
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="timer-controls">
        <button className="control-btn" onClick={reset} title="Reset">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C14.5 4 16.7 5.1 18.1 6.9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M20 4V9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className={`control-btn play-btn ${isRunning ? 'running' : ''}`} onClick={toggle}>
          {isRunning ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
            </svg>
          )}
        </button>
        {showSkip && (
          <button className="control-btn" onClick={() => switchMode(isBreak ? 'focus' : 'shortBreak')} title="Pular">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 4L15 12L5 20V4Z" fill="currentColor" />
              <rect x="17" y="4" width="3" height="16" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      <CycleDots completed={cyclesInCurrentSet} />
    </div>
  )
}

export default Timer
