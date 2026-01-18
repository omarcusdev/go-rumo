import { useState, useEffect } from 'react'

const DEFAULT_OPACITY = 0.12

const applyBackgroundOpacity = (value) => {
  document.documentElement.style.setProperty('--bg-opacity', value)
}

const OPACITY_OPTIONS = [
  { label: 'Transparente', value: 0.12 },
  { label: 'Suave', value: 0.3 },
  { label: 'Médio', value: 0.5 },
  { label: 'Sólido', value: 0.85 }
]

const Settings = ({ isOpen, onClose }) => {
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY)

  useEffect(() => {
    const loadOpacity = async () => {
      if (window.api?.getWindowOpacity) {
        const savedOpacity = await window.api.getWindowOpacity()
        setOpacity(savedOpacity)
        applyBackgroundOpacity(savedOpacity)
      }
    }
    loadOpacity()
  }, [])

  const handleOpacityChange = (newOpacity) => {
    setOpacity(newOpacity)
    applyBackgroundOpacity(newOpacity)
    window.api?.setWindowOpacity(newOpacity)
  }

  if (!isOpen) return null

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <span className="settings-title">Configurações</span>
          <button className="settings-close" onClick={onClose}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-item">
            <div className="settings-item-header">
              <span className="settings-label">Opacidade</span>
              <select
                className="opacity-select"
                value={opacity}
                onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
              >
                {OPACITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="settings-footer">
          <a
            href="https://github.com/omarcusdev/go-rumo"
            target="_blank"
            rel="noopener noreferrer"
            className="settings-link"
          >
            v1.0.0
          </a>
        </div>
      </div>
    </div>
  )
}

export default Settings
