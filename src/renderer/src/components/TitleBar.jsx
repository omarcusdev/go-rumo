import { useState, useEffect } from 'react'

const TitleBar = () => {
  const [isPinned, setIsPinned] = useState(true)

  useEffect(() => {
    const loadPinState = async () => {
      if (window.api?.getAlwaysOnTop) {
        const pinned = await window.api.getAlwaysOnTop()
        setIsPinned(pinned)
      }
    }
    loadPinState()
  }, [])

  const handleTogglePin = () => {
    const newState = !isPinned
    setIsPinned(newState)
    window.api?.setAlwaysOnTop(newState)
  }

  return (
    <div className="title-bar">
      <div className="native-traffic-light-spacer" />
      <button
        className={`pin-button ${isPinned ? 'pinned' : ''}`}
        onClick={handleTogglePin}
        title={isPinned ? 'Desafixar' : 'Fixar'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          {isPinned ? (
            <path
              d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"
              fill="currentColor"
            />
          ) : (
            <path
              d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </button>
    </div>
  )
}

export default TitleBar
